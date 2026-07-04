import fs from 'fs';
import path from 'path';

const distAssetsDir = path.resolve('dist/assets');
const extAssetsDir = path.resolve('extension/assets');

if (!fs.existsSync(extAssetsDir)) {
  fs.mkdirSync(extAssetsDir, { recursive: true });
}

if (!fs.existsSync(distAssetsDir)) {
  console.error('Error: dist/assets directory does not exist. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);

let jsCopied = false;
let cssCopied = false;

for (const file of files) {
  const srcPath = path.join(distAssetsDir, file);
  
  if (file.startsWith('index-') && file.endsWith('.js')) {
    const destPath = path.join(extAssetsDir, 'index.js');
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied & renamed JS bundle: ${file} -> index.js`);
    jsCopied = true;
  } else if (file.startsWith('index-') && file.endsWith('.css')) {
    const destPath = path.join(extAssetsDir, 'index.css');
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied & renamed CSS bundle: ${file} -> index.css`);
    cssCopied = true;
  } else {
    // Copy other chunks directly
    const destPath = path.join(extAssetsDir, file);
    fs.copyFileSync(srcPath, destPath);
  }
}

if (!jsCopied) console.warn('Warning: No index-*.js bundle found to copy.');
if (!cssCopied) console.warn('Warning: No index-*.css bundle found to copy.');

console.log('Chrome extension asset synchronization completed successfully! ✅');
