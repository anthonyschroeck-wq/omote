# Claude Operating Protocol — Omote

## Before Every Push

1. **Read STATE.md** if starting a new session
2. **Build** — `npm run build` via demo-dojo (has node_modules)
3. **Smoke test** — verify build succeeded, no export errors
4. **Version bump** — update mk version string in App.jsx
5. **Update CHANGELOG.md** — append entry with version, date, one-line summary
6. **Update STATE.md** — if architecture, data model, or pending items changed

## Deployment Flow

### Standard (feature work):
```
1. Make changes in omote-push/src/
2. Copy to demo-dojo/src/ → npm run build
3. Push to `dev` branch → Vercel preview deploys
4. Tell Tony to verify staging URL
5. On approval → merge dev to main → production
```

### Hotfix (broken production):
```
1. Fix in omote-push/src/
2. Build verify
3. Push directly to `main`
4. Note in CHANGELOG as hotfix
```

## File Sync Pattern

```bash
# 1. Edit in omote-push (the git repo)
# 2. Copy changed files to demo-dojo (has node_modules)
cp /home/claude/omote-push/src/App.jsx /home/claude/demo-dojo/src/App.jsx
cp /home/claude/omote-push/src/db.js /home/claude/demo-dojo/src/db.js
# 3. Build
cd /home/claude/demo-dojo && npm run build
# 4. Push from omote-push
cd /home/claude/omote-push && git add -A && git commit -m "msg" && git push
```

## Commit Message Format

```
Omote mk{X.Y} — {One-line description}
```

Examples:
- `Omote mk7.9 — Fix performance new-tab crash: move detection to main.jsx`
- `Omote mk8.0 — Pipeline: staging branch, CI, smoke tests, STATE.md`

## Security Checklist (before pushing)

- [ ] No `allow-same-origin` + `allow-scripts` on any iframe
- [ ] `bannerToHtml` escapes all user text via `escHtml()`
- [ ] `db.updateProfile` only allows whitelisted fields
- [ ] `db.signUp` hardcodes role to 'user'
- [ ] No raw user input in `dangerouslySetInnerHTML`
- [ ] postMessage handlers check `e.source`

## Known Constraints

- Can't visually verify renders (no browser in container)
- Can't schedule tasks or self-activate
- api.github.com not available; use git push via github.com
- Container filesystem resets between sessions
- Must re-clone repo each session
