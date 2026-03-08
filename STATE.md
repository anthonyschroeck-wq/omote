# Omote — Project State

> Last updated: mk7.9 · March 7, 2026

## Quick Reference

| Key | Value |
|-----|-------|
| Version | mk7.9 |
| Repo | anthonyschroeck-wq/omote |
| Production | omote-one.vercel.app (auto-deploys from `main`) |
| Staging | omote-one-dev.vercel.app (auto-deploys from `dev`) |
| Supabase | pmgnlaoagckyctakkoio.supabase.co |
| Stack | React 18 + Vite + Supabase + Vercel |

## Architecture

**Single-file React app** (`src/App.jsx`, ~2800 lines) with supporting modules:
- `src/db.js` — all Supabase operations (auth, CRUD, activity log)
- `src/supabase.js` — client initialization
- `src/main.jsx` — entry point, performance new-tab routing
- `src/sample-aura.jsx` / `src/sample-aura-roadmap.jsx` — tutorial sample data
- `public/omote-runtime.js` — blessed library runtime for iframe sandboxes

**Key patterns:**
- JSX runtime: Sucrase transpile → postMessage to sandboxed iframe
- Theme: React Context (`ThemeContext`), light/dark via `c()` helper
- Fonts: Instrument Serif (display), Source Sans 3 (UI), IBM Plex Mono (mono)
- Colors: CREAM `#F5F0E8`, NAVY `#6B7B8D`, WARM `#8B8880`

## Data Model

- **Stage** → has many **Cues** (each cue = independent demo variant)
- **Cue** → has banner (rich object), notes (speaker notes array), content (shellHtml or jsxCode)
- **Profile** → has role (user/admin/super-admin), flags (jsonb: ai_builder, prefs)
- **Stage Assignments** → many-to-many between stages and users

## Roles

| Role | Access |
|------|--------|
| user | View/perform assigned stages only |
| admin | Full CRUD on all stages, users, analytics |
| super-admin | Admin + toggle AI Builder flag for other users |

## Pending Migrations

- `omote-migration-mk69.sql` — super-admin role, flags column (may already be run)
- `omote-migration-mk73.sql` — user self-update policy for prefs persistence

## Known Issues

- Tutorial system disabled (grayed out) — needs rearchitect to overlay on real app flow
- Analytics uses sample data — needs Supabase session tracking tables for production
- Salesforce audience selector is prototype with hardcoded accounts
- AI Builder can still produce code that fails transpile despite sanitizer

## Deployment Flow

1. Push to `dev` branch → Vercel preview deployment
2. Verify at staging URL
3. Merge `dev` → `main` → production auto-deploy
4. Direct `main` pushes for hotfixes only

## File Locations (Claude Container)

- Push repo: `/home/claude/omote-push/`
- Build repo (has node_modules): `/home/claude/demo-dojo/`
- Outputs: `/mnt/user-data/outputs/`
- Transcripts: `/mnt/transcripts/`
