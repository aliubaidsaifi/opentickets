// DEV ONLY (not delivered) - builds dist/ (what the client receives) and opentickets-redesign.zip.
// dist/ = the 4 pages + assets/ (including the clearly labelled demo/ folder) + README.md.
// Excluded: reference/, tools/, presentation/, CLAUDE.md, node_modules.
// Usage: node tools/build-dist.js
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
let zipName = 'opentickets-redesign.zip';
let zip = path.join(root, zipName);

fs.rmSync(dist, { recursive: true, force: true });
// The zip can be locked (open in an uploader / Explorer preview): never let that abort the dist build.
try { fs.rmSync(zip, { force: true }); }
catch (e) { zipName = 'opentickets-redesign-' + Date.now() + '.zip'; zip = path.join(root, zipName); console.warn('WARNING: old zip is locked; writing ' + zipName + ' instead'); }
fs.mkdirSync(dist);
for (const f of ['index.html', 'event.html', 'faqs.html', 'search.html', 'README.md']) fs.copyFileSync(path.join(root, f), path.join(dist, f));
fs.cpSync(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });

// zip the CONTENTS of dist/ (index.html sits at the zip root). bsdtar (bundled with Windows 10+) writes
// standard forward-slash entries; PowerShell 5 Compress-Archive writes backslashes, which break on Mac/Linux.
// Absolute path to Windows' own bsdtar: Git Bash ships a GNU tar that cannot write zips (and treats "G:" as a host).
const bsdtar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
cp.execFileSync(bsdtar, ['-a', '-c', '-f', zipName, '-C', 'dist', '.'], { cwd: root, stdio: 'inherit' });

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(dist).map(f => ({ rel: path.relative(dist, f).split(path.sep).join('/'), size: fs.statSync(f).size }));
fs.writeFileSync(path.join(__dirname, 'dist-files.json'), JSON.stringify(files, null, 1));
console.log('dist/: ' + files.length + ' files, ' + (files.reduce((a, f) => a + f.size, 0) / 1048576).toFixed(2) + ' MB');
console.log('zip: ' + (fs.statSync(zip).size / 1048576).toFixed(2) + ' MB');
