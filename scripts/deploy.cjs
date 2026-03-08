#!/usr/bin/env node
/**
 * Omote Deploy Helper
 * 
 * Usage:
 *   node scripts/deploy.js stage "mk7.10 — feature description"   → push to dev branch (staging)
 *   node scripts/deploy.js promote                                 → merge dev into main (production)
 *   node scripts/deploy.js hotfix "mk7.10 — critical fix"          → push directly to main
 *   node scripts/deploy.js status                                  → show current state
 */

const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
const runLoud = (cmd) => execSync(cmd, { stdio: 'inherit' });

const [,, command, ...msgParts] = process.argv;
const msg = msgParts.join(' ');

console.log('\n  Omote Deploy\n  ────────────\n');

try {
  switch (command) {
    case 'stage': {
      if (!msg) { console.log('  Usage: deploy.js stage "commit message"'); process.exit(1); }
      // Ensure dev branch exists
      try { run('git rev-parse --verify dev'); } catch { run('git checkout -b dev'); }
      run('git checkout dev');
      run('git merge main --no-edit');
      runLoud('git add -A');
      runLoud(`git commit -m "${msg}"`);
      runLoud('git push origin dev');
      console.log('\n  ✓ Pushed to dev → staging preview deploying');
      console.log('  ↳ Check Vercel for preview URL\n');
      break;
    }

    case 'promote': {
      const current = run('git branch --show-current');
      if (current !== 'main') run('git checkout main');
      runLoud('git merge dev --no-edit');
      runLoud('git push origin main');
      console.log('\n  ✓ Promoted dev → main → production deploying\n');
      break;
    }

    case 'hotfix': {
      if (!msg) { console.log('  Usage: deploy.js hotfix "commit message"'); process.exit(1); }
      const current = run('git branch --show-current');
      if (current !== 'main') run('git checkout main');
      runLoud('git add -A');
      runLoud(`git commit -m "${msg}"`);
      runLoud('git push origin main');
      console.log('\n  ✓ Hotfix pushed directly to main → production\n');
      break;
    }

    case 'status': {
      const branch = run('git branch --show-current');
      const mainHash = run('git rev-parse --short main');
      let devHash;
      try { devHash = run('git rev-parse --short dev'); } catch { devHash = '(no dev branch)'; }
      const lastMsg = run('git log -1 --pretty=%s');
      const version = (() => {
        try {
          const src = fs.readFileSync('src/App.jsx', 'utf8');
          const m = src.match(/mk(\d+\.\d+)/);
          return m ? 'mk' + m[1] : 'unknown';
        } catch { return 'unknown'; }
      })();

      console.log(`  Branch:     ${branch}`);
      console.log(`  Version:    ${version}`);
      console.log(`  main:       ${mainHash}`);
      console.log(`  dev:        ${devHash}`);
      console.log(`  Last commit: ${lastMsg}\n`);
      break;
    }

    default:
      console.log('  Commands:');
      console.log('    stage "msg"   Push to dev (staging preview)');
      console.log('    promote       Merge dev → main (production)');
      console.log('    hotfix "msg"  Push directly to main');
      console.log('    status        Show current state\n');
  }
} catch (e) {
  console.error(`\n  ✗ ${e.message}\n`);
  process.exit(1);
}
