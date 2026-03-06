# Omote

Internal demo platform for configuring and delivering product demos. Built with React + Vite.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Login

| Email | Password | Role |
|---|---|---|
| admin@demodojo.io | dojo2025 | admin |

Create additional users in the admin User Management screen.

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Vite**
4. Deploy

No environment variables needed for the prototype. Add Supabase credentials when wiring persistence.

## Architecture

```
src/
  App.jsx       — Entire application (single-file for now)
  main.jsx      — React entry point
index.html      — Shell HTML
vite.config.js  — Vite configuration
```

## Roadmap

- [ ] Supabase persistence (workspaces, users, file storage)
- [ ] Okta SSO integration
- [ ] Shell runtime renderer (dynamic JSX → live components)
- [ ] Prompt-based data customization via Claude API
- [ ] Pop-out demo driver window
- [ ] Role-based access control on workspace/timeline visibility

## Stack

- **React 18** — UI framework
- **Vite 6** — Build tool
- **Papaparse** — CSV parsing
- **Vercel** — Deployment target
- **Supabase** — Database + Auth (planned)
