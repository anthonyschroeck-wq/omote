import { supabase } from './supabase';

// ─── Auth ────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, name, role = 'user') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

// ─── Profile ─────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(userId) {
  // Admin-only: remove from profiles (cascade handles assignments)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) throw error;
}

// ─── Stages ──────────────────────────────────────────────────

export async function getStages() {
  const { data, error } = await supabase
    .from('stages')
    .select(`
      *,
      cues ( * ),
      stage_assignments ( user_id )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Transform to app format
  return (data || []).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    status: s.status,
    isTutorial: s.is_tutorial,
    csvData: s.csv_data,
    columns: s.csv_columns,
    csvFilename: s.csv_filename,
    set: s.set_data || {},
    cues: (s.cues || []).sort((a, b) => a.sort_order - b.sort_order).map(c => ({
      id: c.id,
      name: c.name,
      banner: c.banner,
      shellHtml: c.shell_html,
      jsxCode: c.jsx_code,
      method: c.method,
      notes: c.notes || [],
    })),
    assignedUsers: (s.stage_assignments || []).map(a => a.user_id),
    createdBy: s.created_by,
  }));
}

export async function createStage(stage, userId) {
  const { data, error } = await supabase
    .from('stages')
    .insert({
      name: stage.name,
      description: stage.description || '',
      icon: stage.icon || 'cube',
      status: 'draft',
      is_tutorial: stage.isTutorial || false,
      created_by: userId,
      set_data: stage.set || {},
    })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateStage(stageId, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.csvData !== undefined) dbUpdates.csv_data = updates.csvData;
  if (updates.columns !== undefined) dbUpdates.csv_columns = updates.columns;
  if (updates.csvFilename !== undefined) dbUpdates.csv_filename = updates.csvFilename;
  if (updates.set !== undefined) dbUpdates.set_data = updates.set;

  const { error } = await supabase
    .from('stages')
    .update(dbUpdates)
    .eq('id', stageId);
  if (error) throw error;
}

export async function deleteStage(stageId) {
  const { error } = await supabase
    .from('stages')
    .delete()
    .eq('id', stageId);
  if (error) throw error;
}

// ─── Cues ────────────────────────────────────────────────────

export async function saveCue(stageId, cue, sortOrder) {
  const row = {
    stage_id: stageId,
    name: cue.name,
    banner: cue.banner || '',
    shell_html: cue.shellHtml || '',
    jsx_code: cue.jsxCode || '',
    method: cue.method || null,
    notes: cue.notes || [],
    sort_order: sortOrder || 0,
  };

  if (cue.id && !cue.id.toString().match(/^\d+$/)) {
    // Existing cue (UUID) — update
    const { error } = await supabase.from('cues').update(row).eq('id', cue.id);
    if (error) throw error;
    return cue.id;
  } else {
    // New cue — insert
    const { data, error } = await supabase.from('cues').insert(row).select().single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteCue(cueId) {
  const { error } = await supabase.from('cues').delete().eq('id', cueId);
  if (error) throw error;
}

// ─── Stage Assignments ───────────────────────────────────────

export async function assignStage(stageId, userId) {
  const { error } = await supabase
    .from('stage_assignments')
    .upsert({ stage_id: stageId, user_id: userId });
  if (error) throw error;
}

export async function unassignStage(stageId, userId) {
  const { error } = await supabase
    .from('stage_assignments')
    .delete()
    .eq('stage_id', stageId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Activity Log ────────────────────────────────────────────

export async function logActivity(userId, action, metadata = {}) {
  // Fire and forget — don't block UI
  supabase.from('activity_log').insert({
    user_id: userId,
    action,
    metadata,
  }).then(() => {}).catch(() => {});
}

export async function getActivity(userId, limit = 50) {
  let query = supabase
    .from('activity_log')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
