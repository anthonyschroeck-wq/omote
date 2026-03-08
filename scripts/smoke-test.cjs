#!/usr/bin/env node
/**
 * Omote Smoke Test
 * Runs after build to validate the output is sane.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.log(`  ✗ ${name}`);
      failed++;
    }
  } catch (e) {
    console.log(`  ✗ ${name} — ${e.message}`);
    failed++;
  }
}

console.log('\n  Omote Smoke Test\n  ────────────────\n');

// 1. dist/ exists
check('dist/ directory exists', () => fs.existsSync('dist'));

// 2. index.html exists in dist
check('dist/index.html exists', () => fs.existsSync('dist/index.html'));

// 3. index.html references a JS bundle
check('index.html references JS bundle', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  return html.includes('.js') && html.includes('script');
});

// 4. index.html has favicon
check('index.html has favicon', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  return html.includes('favicon');
});

// 5. At least one JS file in dist/assets
check('JS bundle exists in dist/assets/', () => {
  const assets = fs.readdirSync('dist/assets');
  return assets.some(f => f.endsWith('.js'));
});

// 6. Assets directory has content
check('dist/assets/ has files', () => {
  const assets = fs.readdirSync('dist/assets');
  return assets.length > 0;
});

// 7. favicon.svg exists
check('favicon.svg in dist/', () => fs.existsSync('dist/favicon.svg'));

// 8. Source files valid — App.jsx has default export
check('App.jsx has default export', () => {
  const src = fs.readFileSync('src/App.jsx', 'utf8');
  return src.includes('export default function Omote');
});

// 9. App.jsx has PerformanceShell export
check('App.jsx exports PerformanceShell', () => {
  const src = fs.readFileSync('src/App.jsx', 'utf8');
  return src.includes('export function PerformanceShell');
});

// 10. main.jsx imports both components
check('main.jsx imports Omote and PerformanceShell', () => {
  const src = fs.readFileSync('src/main.jsx', 'utf8');
  return src.includes('PerformanceShell') && src.includes('Omote');
});

// 11. db.js has field whitelist on updateProfile
check('db.js updateProfile has field whitelist', () => {
  const src = fs.readFileSync('src/db.js', 'utf8');
  return src.includes('ALLOWED') && src.includes("'name'") && src.includes("'flags'");
});

// 12. No allow-same-origin + allow-scripts combo
check('No unsafe iframe sandbox (allow-same-origin + allow-scripts)', () => {
  const src = fs.readFileSync('src/App.jsx', 'utf8');
  return !src.includes('allow-scripts allow-same-origin');
});

// 13. Version string present
check('Version string present in App.jsx', () => {
  const src = fs.readFileSync('src/App.jsx', 'utf8');
  return /mk\d+\.\d+/.test(src);
});

// 14. Banner text is escaped
check('bannerToHtml uses escHtml', () => {
  const src = fs.readFileSync('src/App.jsx', 'utf8');
  return src.includes('escHtml(b.text)');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
