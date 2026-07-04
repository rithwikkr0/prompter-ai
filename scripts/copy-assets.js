/**
 * Prompter AI — Post-build asset sync
 * Copies dist/assets → extension/assets after Vite build
 * Vite is configured to output deterministic filenames (index.js, index.css)
 * so popup.html can reference them directly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const distAssetsDir = path.join(root, 'dist', 'assets');
const extAssetsDir  = path.join(root, 'extension', 'assets');

// ── Validate source ────────────────────────────────────────────────────────────
if (!fs.existsSync(distAssetsDir)) {
  console.error('❌ Error: dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

// ── Ensure destination exists ──────────────────────────────────────────────────
fs.mkdirSync(extAssetsDir, { recursive: true });

// ── Copy all built assets ──────────────────────────────────────────────────────
const files = fs.readdirSync(distAssetsDir);
let js = false;
let css = false;

for (const file of files) {
  const src  = path.join(distAssetsDir, file);
  const dest = path.join(extAssetsDir, file);

  // Handle both deterministic (index.js) and hashed (index-abc123.js) output
  if (file.endsWith('.js') && (file === 'index.js' || file.startsWith('index-'))) {
    const target = path.join(extAssetsDir, 'index.js');
    fs.copyFileSync(src, target);
    console.log(`  ✅ JS  → extension/assets/index.js  (${file})`);
    js = true;
  } else if (file.endsWith('.css') && (file === 'index.css' || file.startsWith('index-'))) {
    const target = path.join(extAssetsDir, 'index.css');
    fs.copyFileSync(src, target);
    console.log(`  ✅ CSS → extension/assets/index.css  (${file})`);
    css = true;
  } else {
    fs.copyFileSync(src, dest);
    console.log(`  📄 Copied ${file}`);
  }
}

if (!js)  console.warn('⚠️  No JS bundle found — popup.html will not load.');
if (!css) console.warn('⚠️  No CSS bundle found — popup.html will be unstyled.');

// ── Report final extension folder ──────────────────────────────────────────────
const extFiles = fs.readdirSync(path.join(root, 'extension'));
console.log('\n✨ Extension folder ready:');
extFiles.forEach(f => console.log('  ' + f));
console.log('\n🚀 Load extension/  in chrome://extensions (Developer mode → Load unpacked)\n');
