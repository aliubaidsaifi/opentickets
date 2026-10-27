// DEV ONLY - downloads the images referenced by reference/current-home.html into assets/images/
// with clean slug names, and writes tools/image-map.json (new path -> original live URL).
// The map feeds tools/build-pages.js and the README mapping table.
// Usage: node tools/fetch-assets.js   (not delivered to the client)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'reference/current-home.html'), 'utf8');
const split = html.indexOf('id="events-grid"');

const slugify = s => s
  .replace(/\(CKC\)/gi, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' and ').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ext = u => path.extname(new URL(u).pathname).toLowerCase();

// title for every image URL = the alt text of its card in #events-grid
const titleByUrl = {};
for (const m of html.slice(split).matchAll(/<img src="(https:\/\/d3f[^"]*)"[^>]*alt="([^"]*)"/g)) titleByUrl[m[1]] = m[2];
const slideUrls = [...new Set([...html.slice(0, split).matchAll(/src="(https:\/\/d3f[^"]*)"/g)].map(m => m[1]))];

const jobs = [];
const used = new Set();
for (const [url, title] of Object.entries(titleByUrl)) {
  const slug = slugify(title);
  if (used.has(slug)) throw new Error('duplicate slug ' + slug);
  used.add(slug);
  jobs.push({ dir: 'events', file: slug + ext(url), url, title });
  if (slideUrls.includes(url)) jobs.push({ dir: 'banners', file: slug + '-banner' + ext(url), url, title: title + ' (hero banner)' });
}
jobs.push({ dir: 'banners', file: 'faq-hero.png', url: 'https://opentickets.co.za/images/hero-faqs.png', title: 'FAQ page hero' });
jobs.push({ dir: 'logo', file: 'logo-icon.png', url: 'https://opentickets.co.za/themes/bookishow/logo-icon.png', title: 'Open Tickets logo (white, transparent)' });

(async () => {
  const map = []; let fail = 0;
  for (const j of jobs) {
    const rel = `assets/images/${j.dir}/${j.file}`;
    try {
      const r = await fetch(j.url); if (!r.ok) throw new Error(r.status);
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), Buffer.from(await r.arrayBuffer()));
      map.push({ path: rel, url: j.url, title: j.title }); console.log('ok  ', rel);
    } catch (e) { fail++; console.log('FAIL', j.url, e.message); }
  }
  fs.writeFileSync(path.join(__dirname, 'image-map.json'), JSON.stringify(map, null, 2));
  console.log(fail ? fail + ' failed' : 'all ok (' + map.length + ' files)');
})();
