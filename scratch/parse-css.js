import fs from 'fs';
import path from 'path';

const cssPath = 'C:/Users/rithw/.gemini/antigravity/scratch/promptforge-ai/src/index.css';
const css = fs.readFileSync(cssPath, 'utf8');

const regex = /([^{]+)\{[^}]*\}/g;
let match;
console.log('--- CSS Sizing rules check ---');
while ((match = regex.exec(css)) !== null) {
  const selector = match[1].trim();
  const rule = match[0];
  if (selector.includes('root') || selector.includes('body') || selector.includes('html') || rule.includes('max-width') || rule.includes('width:')) {
    console.log(rule.slice(0, 150) + (rule.length > 150 ? '...' : ''));
  }
}
