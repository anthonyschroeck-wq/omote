import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pmgnlaoagckyctakkoio.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZ25sYW9hZ2NreWN0YWtrb2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDAwMDgsImV4cCI6MjA4ODQ3NjAwOH0.K_8zGZNIVBl9M42WOEcmUrYef_4JwQ8hL2lOsaiTAT8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
