# Changelog

All notable changes to Omote are documented here.

## mk8.4 — 2026-03-08
- Version bump test: validate centralized PAT push from Batcave project

## mk7.9 — 2026-03-07
- Fix performance new-tab crash (React error #300): move hash detection to main.jsx entry point

## mk7.8 — 2026-03-07
- Unified stage icon system: preset Omote icons + custom upload
- StageIcon component used across Hub, sidebar, Backstage, share modal, Storyteller
- IconPicker upgraded with upload slot and clear button
- Edit icon from Backstage header dropdown

## mk7.7 — 2026-03-07
- Favicon upload in new stage creation modal

## mk7.6 — 2026-03-07
- Performance opens in new browser tab
- Obfuscated URL (#/s/<random-id>) — audience sees no "Omote" branding
- PerformanceShell component for isolated tab rendering
- Omote stage mark favicon added to index.html
- Stage-level custom favicon for performance tabs

## mk7.5 — 2026-03-07
- Fix AI Builder transpile crash: sanitizeAICode strips fences, TypeScript annotations
- System prompt reinforced: explicit no-TypeScript instruction
- Better transpile error context: shows failing line with surrounding code

## mk7.4 — 2026-03-07
- Inline stage rename from Backstage header (pencil icon)

## mk7.3 — 2026-03-07
- Security audit + hardening: XSS in bannerToHtml, script injection in HtmlFrame
- iframe sandbox fix (remove allow-same-origin)
- Role escalation prevention: whitelist updateProfile fields, hardcode signUp role
- postMessage source validation on JsxFrame
- callClaude error handling for non-200 responses
- OIcon wrapped in React.memo for performance
- RLS migration for user self-update (omote-migration-mk73.sql)

## mk7.2 — 2026-03-07
- Help page rewritten for full mk7 context (concepts, build flow, performing, admin, settings, shortcuts)

## mk7.1 — 2026-03-07
- Seller analytics: leaderboard, persona coverage heatmap, activity details
- Sample data expanded to 14 sessions across 4 sellers

## mk7.0 — 2026-03-07
- Admin → Integrations page (Salesforce placeholder, dead end)
- Admin → Analytics dashboard (sessions by account/cue, outcome correlation, recent sessions)
- Audience setup: Salesforce Account/Opportunity selector (prototype, 5 sample accounts)
- Cue preview: play button launches Performance directly from Backstage

## mk6.20 — 2026-03-07
- Cue preview button (play icon) in Backstage cue list

## mk6.19 — 2026-03-07
- Pointer config and theme mode persist to Supabase profile (flags.prefs)
- Debounced save on change, restore on login/refresh

## mk6.18 — 2026-03-07
- Sidebar nav grouped with section dividers (Stages | Tools | Utility | Admin)

## mk6.17 — 2026-03-07
- Tutorial disabled (grayed out everywhere, code retained for future)

## mk6.11–mk6.16 — 2026-03-07
- Tutorial system iterations (multiple approaches, ultimately disabled)
- Sample Aura Intelligence JSX demo app created

## mk6.10 — 2026-03-07
- AI Builder flag visible for all users in admin panel

## mk6.9 — 2026-03-07
- Pointer box tool, multi-key hotkeys, auto-fade toggle
- Super-admin role, per-user AI Builder flags
- Migration: omote-migration-mk69.sql

## mk6.1–mk6.8 — 2026-03-07
- StageBuilder (AI-first, multi-image, format-aware)
- Cue editing via canvas, clone source selector
- OmoteLoader branded animation
- Cue save ID detection fix
- Rich banner editor (presets, icons, alignment, live preview)
- Cue description field, banner serialized as JSON
