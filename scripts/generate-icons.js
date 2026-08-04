// scripts/generate-icons.js (ESM — project uses "type":"module")
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { statSync } from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_SRC = join(
  'C:', 'Users', 'rithw', '.gemini', 'antigravity', 'brain',
  '2716a676-92d2-4e6e-b1f8-3abc472df0c0',
  'prompter_ai_icon_master_1785823612513.jpg'
);

const ICONS_DIR = join(__dirname, '..', 'extension', 'icons');
const SIZES = [16, 32, 48, 128];

console.log('🎨 Generating extension icons...\n');
console.log('  Source:', MASTER_SRC);
console.log('  Output:', ICONS_DIR, '\n');

for (const size of SIZES) {
  const outPath = join(ICONS_DIR, `icon${size}.png`);
  await sharp(MASTER_SRC)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const bytes = statSync(outPath).size;
  console.log(`  ✅ icon${size}.png  →  ${size}×${size}px  (${bytes} bytes)`);
}

console.log('\n🚀 All icons generated successfully!');
