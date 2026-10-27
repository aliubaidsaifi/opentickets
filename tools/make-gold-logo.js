// DEV ONLY (not delivered) - recolours the white logo to the gold token.
// Reads --otr-gold from assets/css/variables.css, keeps the exact shape (alpha channel untouched)
// and writes assets/images/logo/logo-gold.png. Re-run after changing the gold token.
// Needs the dev-only package "pngjs":  npm i pngjs   (or set NODE_PATH to a folder that has it)
// Usage: node tools/make-gold-logo.js
const fs = require('fs'), path = require('path');
const { PNG } = require('pngjs');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/css/variables.css'), 'utf8');
const hex = /--otr-gold:\s*#([0-9a-fA-F]{6})/.exec(css);
if (!hex) throw new Error('--otr-gold not found in variables.css');
const [r, g, b] = [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16));

const src = PNG.sync.read(fs.readFileSync(path.join(root, 'assets/images/logo/logo-icon.png')));
for (let i = 0; i < src.data.length; i += 4) {   // keep alpha, replace colour; anti-aliased edges stay smooth
  src.data[i] = r; src.data[i + 1] = g; src.data[i + 2] = b;
}
fs.writeFileSync(path.join(root, 'assets/images/logo/logo-gold.png'), PNG.sync.write(src));
console.log('logo-gold.png written in #' + hex[1] + ' (' + src.width + 'x' + src.height + ')');
