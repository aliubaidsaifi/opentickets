#!/usr/bin/env node
/* ==========================================================================
   check-isotope-markup.js — DEV ONLY (not delivered)
   --------------------------------------------------------------------------
   Verifies that our pages keep the live site's Alpine / Isotope contract
   byte-for-byte. Compares RAW attribute text, not parsed meaning.

   Usage
     node tools/check-isotope-markup.js                 # every built page vs its reference
     node tools/check-isotope-markup.js <ours> <ref>    # one explicit pair

   Page -> reference map (pages not built yet are SKIPPED, not failed):
     index.html  -> reference/current-home.html
     search.html -> reference/current-search.html

   Checks
     1. Hero wrapper + inner drag block: every x-* / @ / : attribute identical
     2. #events-grid: every attribute (id, x-data, x-init) identical
     3. Search: #nav-search-input is an <input name="q"> inside a GET form
        whose action ends in /search
     4. Cards: same number of .grid-item as the reference, same set of
        data-name / data-venue, both lowercase, .e-card + .m-card-cover present
     5. Theme hooks kept: .osahan-slider, .osahan-slider-item
     6. CSS: no gap / grid / flex / transform on #events-grid or .grid-item
   Exit code 0 = all pass, 1 = any failure.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* ---------- quote-aware tag reading (attribute values may contain ">" e.g. "=>") ---------- */
function readTag(html, start) {
  let q = null, i = start;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '>') break;
  }
  return html.slice(start, i + 1);
}
function parseAttrs(tag) {            // -> [{name, raw}] where raw is the exact `name="value"` text
  const out = [], re = /([^\s"'<>\/=]+)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  let m; while ((m = re.exec(body))) out.push({ name: m[1], raw: m[0] });
  return out;
}
function tagAround(html, needle) {    // the opening tag that contains `needle`
  const at = html.indexOf(needle);
  if (at < 0) return null;
  const start = html.lastIndexOf('<', at);
  return readTag(html, start);
}
const isAlpine = n => /^(x-|@|:)/.test(n);

/* ---------- reporting ---------- */
let failures = 0;
const pass = m => console.log('  ✓ ' + m);
const fail = m => { failures++; console.log('  ✗ ' + m); };
const check = (ok, m) => (ok ? pass(m) : fail(m));

function compareAttrs(label, oursTag, refTag, filter) {
  if (!refTag) return fail(label + ': not found in REFERENCE (check tool anchors)');
  if (!oursTag) return fail(label + ': not found in OUR page');
  const ref = parseAttrs(refTag).filter(a => filter(a.name));
  const ours = parseAttrs(oursTag).filter(a => filter(a.name));
  check(ref.length > 0, label + ': reference has ' + ref.length + ' attribute(s) to protect');
  ref.forEach(r => {
    const o = ours.find(a => a.name === r.name);
    if (!o) return fail(label + ': missing attribute ' + r.name);
    check(o.raw === r.raw, label + ': ' + r.name + ' is byte-identical');
  });
  const order = a => a.map(x => x.name).join(' ');
  check(order(ours) === order(ref), label + ': attribute order unchanged');
}

/* ---------- card extraction ---------- */
function gridItems(html) {
  const items = [], re = /<div\b[^>]*\bclass="[^"]*\bgrid-item\b[^"]*"[^>]*>/g;
  let m; while ((m = re.exec(html))) {
    const t = m[0];
    items.push({
      tag: t,
      name: (/data-name="([^"]*)"/.exec(t) || [])[1],
      venue: (/data-venue="([^"]*)"/.exec(t) || [])[1],
    });
  }
  return items;
}

/* ---------- CSS scan ---------- */
function scanCss() {
  const dir = path.join(ROOT, 'assets/css');
  if (!fs.existsSync(dir)) return;
  const banned = /(^|;|\s)(gap|row-gap|column-gap|display\s*:\s*(inline-)?(grid|flex)|transform|grid-template[\w-]*)\s*[:;]?/i;
  let bad = 0;
  fs.readdirSync(dir).filter(f => f.endsWith('.css')).forEach(f => {
    const css = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const re = /([^{}]+)\{([^{}]*)\}/g; let m;
    while ((m = re.exec(css))) {
      m[1].split(',').map(s => s.trim()).forEach(s => {
        // only rules that target the grid or the item ITSELF (not descendants like ".grid-item .otr-card")
        if (/(#events-grid|\.grid-item)(:[\w-]+)*$/.test(s) && banned.test(m[2])) {
          bad++; fail('CSS ' + f + ': "' + s + '" sets a forbidden property');
        }
      });
    }
  });
  if (!bad) pass('CSS: no gap/grid/flex/transform on #events-grid or .grid-item');
}

/* ---------- one page ---------- */
function checkPage(oursPath, refPath) {
  console.log('\n' + path.relative(ROOT, oursPath) + '  vs  ' + path.relative(ROOT, refPath));
  const ours = fs.readFileSync(oursPath, 'utf8');
  const ref = fs.readFileSync(refPath, 'utf8');

  // 1. hero (only if the reference page has one)
  const heroAnchor = 'x-on:filter-grid.window';
  if (ref.includes(heroAnchor)) {
    compareAttrs('hero wrapper', tagAround(ours, heroAnchor), tagAround(ref, heroAnchor), isAlpine);
    const dragAnchor = 'x-on:pointerdown';
    compareAttrs('hero drag block', tagAround(ours, dragAnchor), tagAround(ref, dragAnchor), isAlpine);
    check(/class="[^"]*\bosahan-slider\b/.test(ours), 'class osahan-slider present');
    check(/class="[^"]*\bosahan-slider-item\b/.test(ours), 'class osahan-slider-item present');
  }

  // 2. grid
  const gridAnchor = 'id="events-grid"';
  compareAttrs('#events-grid', tagAround(ours, gridAnchor), tagAround(ref, gridAnchor), () => true);

  // 3. search
  const input = tagAround(ours, 'id="nav-search-input"');
  check(!!input && /^<input\b/.test(input) && /\bname="q"/.test(input), '#nav-search-input is <input name="q">');
  const formAt = ours.lastIndexOf('<form', ours.indexOf('id="nav-search-input"'));
  const form = formAt >= 0 ? readTag(ours, formAt) : '';
  check(/action="[^"]*\/search"/.test(form) && /method="GET"/i.test(form), 'search form is GET to .../search');

  // 4. cards
  const a = gridItems(ours), b = gridItems(ref);
  check(a.length === b.length, 'grid-item count matches reference (' + a.length + ' vs ' + b.length + ')');
  check(a.every(i => i.name !== undefined && i.venue !== undefined), 'every .grid-item has data-name and data-venue');
  check(a.every(i => i.name === i.name.toLowerCase() && i.venue === i.venue.toLowerCase()), 'data-name / data-venue are lowercase');
  const key = i => i.name + '|' + i.venue;
  const missing = b.filter(r => !a.some(o => key(o) === key(r)));
  check(missing.length === 0, 'every reference event present' + (missing.length ? ' - missing: ' + missing.map(m => m.name).join('; ') : ''));
  const cards = (ours.match(/\be-card\b/g) || []).length, covers = (ours.match(/\bm-card-cover\b/g) || []).length;
  check(cards >= a.length && covers >= a.length, 'e-card (' + cards + ') and m-card-cover (' + covers + ') on every card');
}

/* ---------- main ---------- */
const args = process.argv.slice(2);
let pairs;
if (args.length === 2) pairs = [[path.resolve(args[0]), path.resolve(args[1])]];
else pairs = [['index.html', 'reference/current-home.html'], ['search.html', 'reference/current-search.html']]
  .map(([o, r]) => [path.join(ROOT, o), path.join(ROOT, r)]);

pairs.forEach(([o, r]) => {
  if (!fs.existsSync(o)) return console.log('\nSKIP ' + path.relative(ROOT, o) + ' (not built yet)');
  checkPage(o, r);
});
console.log('\nCSS scan');
scanCss();
console.log('\n' + (failures ? 'FAILED: ' + failures + ' check(s)' : 'ALL CHECKS PASSED'));
process.exit(failures ? 1 : 0);
