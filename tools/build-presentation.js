// DEV ONLY (not delivered) - builds the contest presentation images from dist/ into presentation/final/.
// Needs dev-only packages:  npm i puppeteer-core pngjs gifenc   (set NODE_PATH to that node_modules)
// Browser: Microsoft Edge (path below). Usage: node tools/build-presentation.js
const fs = require('fs'), path = require('path'), http = require('http');
const puppeteer = require('puppeteer-core');
const { PNG } = require('pngjs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'presentation', 'final');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = http.createServer((q, r) => {
  const f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'access-control-allow-origin': '*' }); r.end(d);
  });
}).listen(0);
const BASE = () => `http://localhost:${server.address().port}/`;

/* ---------------------------------------------------------------- captures */
let browser;
// Headed browser windows occasionally detach a frame while loading: retry the whole capture with a fresh page.
async function cap(url, opts) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await capOnce(url, opts); }
    catch (e) { lastErr = e; console.log('capture retry ' + attempt + ' for ' + url + ': ' + e.message.split('\n')[0]); await wait(2000); }
  }
  throw lastErr;
}
async function capOnce(url, { w, h, dpr = 1.5, full = false, hideChat = false, before, br, clipTo, pad = 56 }) {
  const p = await (br || browser).newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  await p.goto(BASE() + url, { waitUntil: 'networkidle0' }); await wait(1000);
  await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' + (hideChat ? '.otr-chat{display:none !important}' : '') });
  let extra = {};
  if (before) extra = (await before(p)) || {};
  else if (full) await primeLazy(p);
  await wait(900);
  let clip;
  if (clipTo) { const bottom = await p.evaluate(s => document.querySelector(s).getBoundingClientRect().bottom + scrollY, clipTo); clip = { x: 0, y: 0, width: w, height: Math.min(h, bottom + pad) }; }
  const buf = await p.screenshot(clip ? { clip } : { fullPage: full });
  await p.close();
  return { src: 'data:image/png;base64,' + buf.toString('base64'), ...extra };
}

/* Scroll the whole page so every loading="lazy" image / iframe starts loading, then wait until images are decoded. */
async function primeLazy(p) {
  await p.evaluate(async () => {
    const step = Math.max(300, innerHeight * 0.6);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
    scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 400));
  });
  await p.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), { timeout: 20000 });
  await p.evaluate(() => scrollTo(0, 0)); await wait(500);
}
/* Is a screenshot region real content, not a flat/blank fill? Returns stats; blank = few distinct colours and almost no variance. */
function regionStats(buf, crop) {
  const png = PNG.sync.read(buf); const seen = new Set(); let n = 0, sum = 0, sum2 = 0;
  const px = [];
  if (crop) { for (let y = Math.round(crop.y); y < Math.min(png.height, Math.round(crop.y + crop.height)); y += 2) for (let x = Math.round(crop.x); x < Math.min(png.width, Math.round(crop.x + crop.width)); x += 2) px.push((y * png.width + x) * 4); }
  else for (let i = 0; i < png.data.length; i += 16) px.push(i);
  for (const i of px) {
    const r = png.data[i], g = png.data[i + 1], bl = png.data[i + 2], l = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    seen.add((r >> 3) << 10 | (g >> 3) << 5 | (bl >> 3)); n++; sum += l; sum2 += l * l;
  }
  const mean = sum / n, sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  return { distinctColours: seen.size, luminanceStdDev: +sd.toFixed(1), blank: seen.size < 40 || sd < 8 };
}

/* ------------------------------------------------------------- composition */
const CSS = `
  *{box-sizing:border-box}
  body{margin:0;width:1920px;background:var(--otr-color-bg);font-family:var(--otr-font-body);color:var(--otr-color-text)}
  .pg{padding:64px 96px 88px}
  .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:48px}
  .tag{display:inline-block;padding:10px 22px;border-radius:999px;background:var(--otr-color-dark);color:var(--otr-color-on-dark);font-size:15px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
  .plate{display:inline-flex;align-items:center;padding:10px 16px;border-radius:14px;background:var(--otr-color-dark)}
  .plate img{height:44px;width:auto;display:block}
  .row{display:flex;gap:56px;align-items:flex-start;justify-content:center}
  .col{display:flex;flex-direction:column;gap:16px}
  .frame{position:relative;overflow:hidden;border-radius:20px;background:var(--otr-color-surface);box-shadow:var(--otr-shadow-lg);border:1px solid var(--otr-color-border)}
  .frame.phone{border-radius:34px}
  .frame img.shot{display:block;width:100%;height:auto}
  .cap{font-size:15px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--otr-color-muted)}
  .big{font-family:var(--otr-font-display);font-weight:600;font-size:46px;line-height:1.2;text-align:center;margin:56px 0 0;color:var(--otr-color-text)}
  .big small{display:block;margin-top:14px;font-family:var(--otr-font-body);font-weight:500;font-size:20px;letter-spacing:.04em;color:var(--otr-color-muted)}
  .callout{position:absolute;border:3px dashed var(--otr-color-accent);border-radius:12px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px}
  .callout span{background:var(--otr-color-dark);color:var(--otr-color-accent);font-size:15px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:8px 16px;border-radius:999px}
  .mono{font-family:Consolas,'Courier New',monospace}
  .card{border-radius:20px;padding:36px 40px;box-shadow:var(--otr-shadow-md)}
  .tree{background:var(--otr-color-dark);color:var(--otr-color-on-dark-muted);font-size:20px;line-height:1.7;white-space:pre}
  .tree b{color:var(--otr-color-accent);font-weight:600}
  .tree i{color:var(--otr-color-mist);font-style:normal;opacity:.7}
  .code{background:var(--otr-color-surface);border:1px solid var(--otr-color-border);font-size:19px;line-height:1.75;white-space:pre;color:var(--otr-color-text)}
  .code em{font-style:normal;color:var(--otr-color-primary)}
  .code u{text-decoration:none;display:inline-block;width:.8em;height:.8em;border-radius:50%;margin-right:.5em;vertical-align:-1px;border:1px solid var(--otr-color-border-strong)}
  .pal{display:flex;gap:24px}
  .pal .set{flex:1;background:var(--otr-color-surface);border:1px solid var(--otr-color-border)}
  .pal h3{margin:0 0 20px;font-family:var(--otr-font-body);font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:var(--otr-color-muted)}
  .sw{display:flex;gap:10px}
  .sw div{flex:1;height:84px;border-radius:12px;border:1px solid var(--otr-color-border-strong);display:flex;align-items:flex-end;padding:8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-shadow:none}
`;
function page(label, body, extra = '') {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="stylesheet" href="${BASE()}assets/css/variables.css"><link rel="stylesheet" href="${BASE()}assets/css/base.css">
  <style>${CSS}${extra}</style></head><body><div class="pg">
  <div class="top"><span class="tag">${label}</span><span class="plate"><img src="${BASE()}assets/images/logo/logo-gold.png" alt=""></span></div>
  ${body}</div></body></html>`;
}
async function render(name, html) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready); await wait(500);
  await p.screenshot({ path: path.join(OUT, name), fullPage: true });
  await p.close();
  console.log('wrote', name, (fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0) + ' KB');
}
const fr = (shot, w, cls = '', inner = '') => `<div class="frame ${cls}" style="width:${w}px"><img class="shot" src="${shot.src}" alt="">${inner}</div>`;
const colf = (cap, f) => `<div class="col">${f}<div class="cap" style="text-align:center">${cap}</div></div>`;

/* --------------------------------------------------------------- the gif */
async function makeGif() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 0.6 });
  await p.goto(BASE() + 'index.html', { waitUntil: 'networkidle0' }); await wait(1200);
  await p.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
  const frames = [];
  const snap = async () => frames.push({ t: Date.now(), buf: await p.screenshot() });
  const record = async ms => { const end = Date.now() + ms; do { await snap(); } while (Date.now() < end); };
  await record(500);
  await p.click('#nav-search-input');
  for (const ch of 'chiefs') { await p.keyboard.type(ch); await record(110); }
  await record(1500);                       // grid filters, hero + featured strip collapse
  await p.evaluate(() => { const i = document.getElementById('nav-search-input'); i.focus(); i.select(); });
  await p.keyboard.press('Backspace');
  await record(1900);                       // everything returns
  await record(300);
  const total = frames[frames.length - 1].t - frames[0].t;
  const gif = GIFEncoder();
  for (let i = 0; i < frames.length; i++) {
    const png = PNG.sync.read(frames[i].buf);
    const palette = quantize(png.data, 128);
    const index = applyPalette(png.data, palette);
    const delay = i < frames.length - 1 ? Math.max(40, Math.min(500, frames[i + 1].t - frames[i].t)) : 900;
    gif.writeFrame(index, png.width, png.height, { palette, delay });
  }
  gif.finish();
  fs.writeFileSync(path.join(OUT, '00-filter.gif'), Buffer.from(gif.bytes()));
  await p.close();
  console.log('wrote 00-filter.gif', (fs.statSync(path.join(OUT, '00-filter.gif')).size / 1048576).toFixed(2) + ' MB, ' + frames.length + ' frames, ~' + (total / 1000).toFixed(1) + 's recorded');
}

/* ------------------------------------------------------------------- main */
(async () => {
  browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  // The Google Maps iframe does not render in headless browsers, so the event page is captured with a HEADED browser.
  const headed = await puppeteer.launch({ executablePath: EDGE, headless: false, args: ['--window-size=1500,1000'] });

  const S = {};   // captured shots

  // ---- event page: desktop full page WITH the map, mobile TOP (poster, date + title + venue, sticky bottom bar)
  let mapStats, mapFinal;
  S.eventFull = await cap('event.html', { w: 1440, h: 900, hideChat: true, br: headed, before: async p => {
    // the iframe is loading="lazy": attach the load listener first, then scroll everything into view
    await p.evaluate(() => { const f = document.querySelector('.otr-map iframe'); window.__mapLoaded = false; f.addEventListener('load', () => { window.__mapLoaded = true; }); });
    await primeLazy(p);
    await p.evaluate(() => document.querySelector('.otr-map iframe').scrollIntoView({ block: 'center' }));
    // wait for the iframe's load event; if it never fires, reload the iframe once and wait again
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { await p.waitForFunction(() => window.__mapLoaded === true, { timeout: 25000 }); console.log('map iframe load event seen (attempt ' + attempt + ')'); break; }
      catch (e) {
        console.log('map iframe load event NOT seen (attempt ' + attempt + ')');
        if (attempt === 3) break;
        await p.evaluate(() => { const f = document.querySelector('.otr-map iframe'); window.__mapLoaded = false; f.addEventListener('load', () => { window.__mapLoaded = true; }); f.src = f.src; });
      }
    }
    await wait(4000);                                    // let the tiles draw
    const rect = await p.evaluate(() => { const r = document.querySelector('.otr-map iframe').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; });
    mapStats = regionStats(await p.screenshot({ clip: rect }));
    // fullPage screenshots drop cross-origin iframe content, so instead grow the viewport to the full page height
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewport({ width: 1440, height: total, deviceScaleFactor: 1.5 });
    // after the resize the tiles may need a moment (or a reload) to redraw: poll, and reload the iframe if it stays blank
    let r2;
    for (let attempt = 1; attempt <= 4; attempt++) {
      await wait(attempt === 1 ? 6000 : 4000);
      await p.evaluate(() => scrollTo(0, 0)); await wait(600);
      r2 = await p.evaluate(() => { const r = document.querySelector('.otr-map iframe').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
      mapStats = regionStats(await p.screenshot({ clip: r2 }));
      console.log('map pixels after resize, check ' + attempt + ':', JSON.stringify(mapStats));
      if (!mapStats.blank) break;
      await p.evaluate(() => { const f = document.querySelector('.otr-map iframe'); window.__mapLoaded = false; f.addEventListener('load', () => { window.__mapLoaded = true; }); f.src = f.src; });
      try { await p.waitForFunction(() => window.__mapLoaded === true, { timeout: 25000 }); } catch (e) { console.log('reload: load event not seen'); }
    }
    return { mapRect: r2 };
  } });
  // verify the map inside the FINAL captured image too
  mapFinal = regionStats(Buffer.from(S.eventFull.src.split(',')[1], 'base64'), { x: S.eventFull.mapRect.x * 1.5, y: S.eventFull.mapRect.y * 1.5, width: S.eventFull.mapRect.width * 1.5, height: S.eventFull.mapRect.height * 1.5 });
  console.log('map region in final capture:', JSON.stringify(mapFinal));
  if (mapFinal.blank) mapStats = mapFinal;
  console.log('map region check:', JSON.stringify(mapStats));
  if (mapStats.blank) { console.error('MAP IS STILL BLANK - stopping (take a manual screenshot of the map area).'); await headed.close(); await browser.close(); server.close(); process.exit(2); }
  S.event390 = await cap('event.html', { w: 390, h: 844, dpr: 2 });   // top of page: bar is fixed at the bottom of the viewport
  await headed.close();
  if (process.env.ONLY === '03') {
    await render('03-event.png', page('Event page', `<div class="row">${colf('Desktop 1440 — full page', fr(S.eventFull, 1130))}${colf('Mobile 390 — top of page + sticky bottom bar', fr(S.event390, 400, 'phone'))}</div>`));
    await browser.close(); server.close(); return;
  }
  S.home = await cap('index.html', { w: 1440, h: 900 });
  S.home390 = await cap('index.html', { w: 390, h: 844, dpr: 2 });
  S.chiefs = await cap('index.html', { w: 1440, h: 900, before: async p => { await p.type('#nav-search-input', 'chiefs'); await wait(1800); } });
  S.modal = await cap('event.html', { w: 1440, h: 900, before: async p => {
    await p.click('.otr-event-head__cta .otr-btn'); await wait(1000);
    return await p.evaluate(() => { const s = document.getElementById('otr-seating-map').getBoundingClientRect(); return { slot: [s.left / innerWidth, s.top / innerHeight, s.width / innerWidth, s.height / innerHeight] }; });
  } });
  S.modal390 = await cap('event.html', { w: 390, h: 844, dpr: 2, before: async p => { await p.click('.otr-buybar .otr-btn'); await wait(1000); } });
  S.search = await cap('search.html?q=', { w: 1440, h: 1400, clipTo: '#otr-pagination', pad: 64 });   // all events, page 1 of 4: 6 cards + pagination
  S.searchEmpty = await cap('search.html?q=zzz', { w: 1440, h: 900 });
  S.search390 = await cap('search.html?q=', { w: 390, h: 844, dpr: 2 });
  S.searchEmpty390 = await cap('search.html?q=zzz', { w: 390, h: 844, dpr: 2 });
  S.faq = await cap('faqs.html', { w: 1440, h: 1500, before: async p => { await p.evaluate(() => window.bootstrap.Collapse.getOrCreateInstance(document.getElementById('faq-tickets-purchasing-c0'), { toggle: false }).show()); } });
  S.faqLower = await cap('faqs.html', { w: 1440, h: 900, hideChat: true, before: async p => { await p.evaluate(() => document.querySelector('.otr-help').scrollIntoView({ block: 'center' })); } });
  S.faq390 = await cap('faqs.html', { w: 390, h: 844, dpr: 2 });
  S.faq390open = await cap('faqs.html', { w: 390, h: 844, dpr: 2, before: async p => { await p.evaluate(() => document.querySelector('[data-faq-target="faq-general"]').click()); await wait(900); } });

  const read = f => fs.readFileSync(path.join(DIST, f), 'utf8');

  // 01 home
  await render('01-home.png', page('Home', `<div class="row">${colf('Desktop 1440', fr(S.home, 1290))}${colf('Mobile 390', fr(S.home390, 368, 'phone'))}</div>`));

  // 02 isotope proof
  await render('02-isotope-proof.png', page('Home · Isotope filter', `
    <div class="row">${colf('Normal view', fr(S.home, 828))}${colf('Typed “chiefs” — grid filters, hero collapses', fr(S.chiefs, 828))}</div>
    <div class="big">Isotope search-filter untouched — markup byte-identical to the live site<small>Hero wrapper 10/10 attributes · drag guard 5/5 · #events-grid 4/4 · 19 of 19 cards · checker: ALL CHECKS PASSED</small></div>`));

  // 03 event
  await render('03-event.png', page('Event page', `<div class="row">${colf('Desktop 1440 — full page', fr(S.eventFull, 1130))}${colf('Mobile 390 — top of page + sticky bottom bar', fr(S.event390, 400, 'phone'))}</div>`));

  // 04 seating modal
  const sl = S.modal.slot;
  const callout = `<div class="callout" style="left:${sl[0] * 100}%;top:${sl[1] * 100}%;width:${sl[2] * 100}%;height:${sl[3] * 100}%"><span>Seating-map slot — follow-up project</span></div>`;
  await render('04-seating-modal.png', page('Seating modal · Select a Section', `<div class="row">${colf('Desktop 1440', fr(S.modal, 1200, '', callout))}${colf('Mobile 390', fr(S.modal390, 380, 'phone'))}</div>`));

  // 05 search
  await render('05-search.png', page('Search results · pagination · empty state', `
    <div class="row">${colf('All events — 6 per page, gold pagination, “Get Tickets” on every card', fr(S.search, 1500))}</div>
    <div class="row" style="margin-top:56px">${colf('Empty state — no matches', fr(S.searchEmpty, 760))}${colf('Mobile — results', fr(S.search390, 360, 'phone'))}${colf('Mobile — empty state', fr(S.searchEmpty390, 360, 'phone'))}</div>`));

  // 06 faqs
  await render('06-faqs.png', page('FAQs', `<div class="row"><div class="col" style="gap:40px">${colf('Desktop 1440 — categories, live search, accordion', fr(S.faq, 1060))}${colf('Desktop 1440 — “Still need help?” + footer', fr(S.faqLower, 1060))}</div><div class="col" style="gap:40px">${colf('Mobile 390', fr(S.faq390, 380, 'phone'))}${colf('Category card opens its group', fr(S.faq390open, 380, 'phone'))}</div></div>`));

  // 07 handover
  const files = JSON.parse(fs.readFileSync(path.join(__dirname, 'dist-files.json'), 'utf8'));
  const count = pre => files.filter(f => f.rel.startsWith(pre)).length;
  const tree = `<b>dist/</b>
├─ index.html  event.html  faqs.html  search.html
├─ README.md
└─ <b>assets/</b>
   ├─ css/      variables.css · base.css · components.css · pages.css
   ├─ js/       main.js · faq.js · search.js
   │  └─ demo/  <i>DEMO ONLY — ${count('assets/js/demo/')} files, do not deploy</i>
   ├─ vendor/   bootstrap 5.3 · font-awesome 5
   ├─ fonts/    ${count('assets/fonts/')} woff2 (Playfair Display, Inter)
   └─ images/   logo ${count('assets/images/logo/')} · banners ${count('assets/images/banners/')} · events ${count('assets/images/events/')}

${files.length} files · no CDN links · no build step`;
  const vcss = read('assets/css/variables.css');
  const getTok = (css, n) => (new RegExp('--otr-' + n + ':\\s*(#[0-9a-fA-F]{6})').exec(css) || [])[1];
  const altBlock = vcss.slice(vcss.indexOf(':root {', vcss.indexOf('ALTERNATIVE PALETTE')));
  const alt = Object.fromEntries([...altBlock.matchAll(/--otr-([a-z0-9-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  const names = ['navy-900', 'ivory', 'crimson', 'gold', 'ink', 'slate', 'mist', 'hairline'];
  const sw = (get) => `<div class="sw">${names.map(n => { const v = get(n); return `<div style="background:${v};color:${n === 'ivory' || n === 'hairline' || n === 'gold' ? '#10172a' : '#fff'}">${n}</div>`; }).join('')}</div>`;
  const excerpt = ['--otr-navy-900', '--otr-ivory', '--otr-crimson', '--otr-gold', '--otr-gold-hover', '--otr-gold-deep', '--otr-ink', '--otr-slate'].map(t => {
    const m = new RegExp('(' + t + '):\\s*(#[0-9a-fA-F]{6});').exec(vcss);
    return `<u style="background:${m[2]}"></u>${m[1]}: <em>${m[2]}</em>;`;
  }).join('\n');
  const altShot = { src: 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'presentation', 'draft', 'retheme-alt.png')).toString('base64') };
  await render('07-handover.png', page('Handover · one file retheme', `
    <div class="row" style="align-items:stretch;gap:40px">
      <div class="card tree mono" style="flex:1.15">${tree}</div>
      <div class="card code mono" style="flex:1"><span style="color:var(--otr-color-muted)">/* assets/css/variables.css */</span>
:root {
${excerpt}
  <span style="color:var(--otr-color-muted)">… radius · shadows · spacing · fonts …</span>
}</div>
    </div>
    <div class="pal" style="margin-top:40px">
      <div class="set card"><h3>Palette — as delivered</h3>${sw(n => getTok(vcss, n))}</div>
      <div class="set card"><h3>Alternative palette — same file, commented block</h3>${sw(n => alt[n] || getTok(vcss, n))}</div>
    </div>
    <div class="row" style="margin-top:40px">${colf('As delivered', fr(S.home, 828))}${colf('Alternative palette — nothing else edited', fr(altShot, 828))}</div>
    <div class="big">Retheme everything from one file<small>assets/css/variables.css</small></div>`));

  // ---- 00-overview board: the contest thumbnail (dark navy + gold, like the client-approved style)
  S.eventTop = await cap('event.html', { w: 1440, h: 900, hideChat: true });
  S.searchTop = await cap('search.html?q=', { w: 1440, h: 900, hideChat: true });
  S.faqTop = await cap('faqs.html', { w: 1440, h: 900, hideChat: true });
  S.homeClean = await cap('index.html', { w: 1440, h: 900, hideChat: true });
  S.home390b = await cap('index.html', { w: 390, h: 844, dpr: 2, hideChat: true });
  const logoGold = BASE() + 'assets/images/logo/logo-gold.png';
  const boardSw = ['--otr-navy-900', '--otr-gold', '--otr-crimson', '--otr-ivory', '--otr-slate'];
  const boardCss = `
    body{background:var(--otr-color-dark)}
    .bd{position:relative;padding:72px 96px 150px;color:var(--otr-color-on-dark-muted);background:radial-gradient(1200px 600px at 85% 0%,rgba(var(--otr-gold-rgb),.14),transparent 60%),var(--otr-color-dark)}
    .bd .top{display:flex;justify-content:space-between;align-items:flex-start;gap:48px}
    .bd .hero{position:relative;flex:0 0 960px}
    .bd .brand{flex:1;min-width:0;padding-left:24px}
    .bd .brand img{height:96px;width:auto;display:block;margin-bottom:20px}
    .bd .tag{background:none;color:var(--otr-color-on-dark);padding:0;letter-spacing:.32em;font-size:17px;border-radius:0;margin:0 0 36px}
    .bd .feat{display:grid;gap:22px;margin:0 0 36px;padding:0;list-style:none}
    .bd .feat li{display:flex;gap:18px;align-items:center}
    .bd .feat i{width:56px;height:56px;border-radius:50%;border:2px solid var(--otr-color-accent);color:var(--otr-color-accent);display:flex;align-items:center;justify-content:center;font-size:22px;font-style:normal;font-family:'Font Awesome 5 Free';font-weight:900}
    .bd .feat b{display:block;color:var(--otr-color-on-dark);font-size:21px;font-weight:600}
    .bd .feat span{font-size:16px}
    .bd h4{margin:0 0 14px;font-family:var(--otr-font-body);font-size:14px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--otr-color-accent)}
    .bd .dots{display:flex;gap:14px;margin-bottom:30px}
    .bd .dots span{width:46px;height:46px;border-radius:50%;border:2px solid rgba(var(--otr-white-rgb),.35)}
    .bd .fonts{font-size:26px;color:var(--otr-color-on-dark);line-height:1.5}
    .bd .rowsm{display:flex;gap:28px;margin-top:56px}
    .bd .rowsm .frame{flex:1;border-radius:14px}
    .bd .stamp{position:absolute;right:96px;bottom:34px;padding:12px 26px;border-radius:999px;background:var(--otr-color-accent);color:var(--otr-color-on-cta);font-weight:600;letter-spacing:.16em;text-transform:uppercase;font-size:15px}
    .bd .cap2{font-size:14px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--otr-color-on-dark-muted);margin-top:12px;text-align:center}
    .bd .frame{border:0;box-shadow:0 24px 60px rgba(0,0,0,.45)}
  `;
  const swDots = boardSw.map(t => '<span style="background:var(' + t + ')"></span>').join('');
  const boardHtml = `<!doctype html><html><head><meta charset="utf-8">
    <link rel="stylesheet" href="${BASE()}assets/css/variables.css"><link rel="stylesheet" href="${BASE()}assets/css/base.css"><link rel="stylesheet" href="${BASE()}assets/vendor/fontawesome/css/all.min.css">
    <style>${CSS}${boardCss}</style></head><body><div class="bd">
      <div class="top">
        <div class="hero">${fr(S.homeClean, 960)}
          <div style="position:absolute;right:24px;bottom:-70px;width:230px">${fr(S.home390b, 250, 'phone')}</div></div>
        <div class="brand">
          <img src="${logoGold}" alt="">
          <p class="tag">LIVE EVENTS. MADE EASY.</p>
          <ul class="feat">
            <li><i>\uf53f</i><div><b>Modern &amp; elegant design</b><span>Premium look, familiar layout</span></div></li>
            <li><i>\uf3cd</i><div><b>Fully responsive</b><span>1440 · 1280 · 1024 · 768 · 390 · 360</span></div></li>
            <li><i>\uf002</i><div><b>Isotope filter untouched</b><span>Markup byte-identical to the live site</span></div></li>
            <li><i>\uf1fc</i><div><b>Retheme from one file</b><span>variables.css · gold logo · 1210×450 banners</span></div></li>
          </ul>
          <h4>Colour palette</h4><div class="dots">${swDots}</div>
          <h4>Fonts</h4><div class="fonts"><span style="font-family:var(--otr-font-display)">Playfair Display</span><br><span style="font-family:var(--otr-font-body)">Inter</span></div>
        </div>
      </div>
      <div class="rowsm">
        <div>${fr(S.eventTop, 540)}<div class="cap2">Event + seating modal</div></div>
        <div>${fr(S.faqTop, 540)}<div class="cap2">FAQs · live search</div></div>
        <div>${fr(S.searchTop, 540)}<div class="cap2">Search · pagination · empty state</div></div>
      </div>
      <div class="stamp">Working prototype — not a mockup</div>
    </div></body></html>`;
  { const p = await browser.newPage(); await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await p.setContent(boardHtml, { waitUntil: 'load', timeout: 120000 }); await p.evaluate(() => document.fonts.ready); await wait(600);
    await p.screenshot({ path: path.join(OUT, '00-overview.png'), fullPage: true }); await p.close();
    console.log('wrote 00-overview.png', (fs.statSync(path.join(OUT, '00-overview.png')).size / 1024).toFixed(0) + ' KB'); }

  await makeGif();
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
