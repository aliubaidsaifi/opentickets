// DEV ONLY (not delivered) - generates index.html, event.html, search.html and faqs.html.
// Alpine / Isotope attributes are COPIED from reference/current-home.html by code, never retyped.
// Usage: node tools/build-pages.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ref = read('reference/current-home.html');
const imageMap = JSON.parse(read('tools/image-map.json'));

/* ---------- helpers: quote-aware tag reading ---------- */
function readTag(html, start) {
  let q = null, i = start;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break;
  }
  return html.slice(start, i + 1);
}
function attrsOf(tag) {                       // exact raw `name="value"` strings, in order
  const out = [], re = /([^\s"'<>\/=]+)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  let m; while ((m = re.exec(body))) out.push(m[0]);
  return out;
}
const tagAround = needle => readTag(ref, ref.lastIndexOf('<', ref.indexOf(needle)));

/* ---------- copied verbatim from the reference ---------- */
const heroWrapperTag = tagAround('x-on:filter-grid.window');          // byte-identical
const gridTag = tagAround('id="events-grid"');                         // byte-identical
// inner drag guard: keep every Alpine attribute, drop Livewire-only wire:* attributes
const dragAttrs = attrsOf(tagAround('x-on:pointerdown')).filter(a => !a.startsWith('wire:'));
const dragTag = '<div\n    ' + dragAttrs.join('\n    ') + '\n>';
const inlineStyle = /<style>\s*\.osahan-slider a,[\s\S]*?<\/style>/.exec(ref)[0];

/* ---------- data: slides + cards, in live order ---------- */
const gi = ref.indexOf('id="events-grid"');
const slideUrls = [...ref.slice(0, gi).matchAll(/<div class="osahan-slider-item">\s*<a href="([^"]+)"[^>]*>\s*<img src="([^"]+)"[^>]*alt="([^"]*)"/g)]
  .map(m => ({ href: m[1], url: m[2], alt: m[3] }));
const mapPath = (url, dir) => (imageMap.find(i => i.url === url && i.path.includes('/' + dir + '/')) || {}).path;

const itemRe = /<div class="col-xl-4 col-md-4 mb-4 grid-item"([^>]*)>([\s\S]*?)(?=<div class="col-xl-4 col-md-4 mb-4 grid-item"|<!--\[if ENDBLOCK)/g;
const cards = []; let m;
while ((m = itemRe.exec(ref.slice(gi)))) {
  const b = m[2], g = re => (re.exec(b) || [])[1];
  const c = {
    attrs: m[1], href: g(/<a href="([^"]+)"/), img: g(/<img src="([^"]+)"/), alt: g(/<img[^>]*alt="([^"]*)"/),
    day: g(/<h6[^>]*>([^<]+)<\/h6>/).trim(), month: g(/<small class="text-muted">([A-Z]{3})<\/small>/),
    venue: g(/fa-map-marker-alt[^>]*><\/i>\s*([^<]*)<\/small>/).trim(), time: g(/<small class="text-muted d-block">([^<]+)<\/small>/).trim(),
  };
  c.local = mapPath(c.img, 'events');
  if (!c.local) throw new Error('no local image for ' + c.alt);
  cards.push(c);
}
if (cards.length !== 19) throw new Error('expected 19 cards, got ' + cards.length);

// DEMO links: every slide / card goes to the one demo event page (in production the hrefs come from Blade).
const hrefFor = () => 'event.html';

// Category badge: inferred from the event name for the demo. In production use your event category field.
const categoryOf = c => {
  const t = c.alt;
  if (/\bvs\b|season ticket|\(ckc\)/i.test(t)) return 'Football';
  if (/klub 600/i.test(t)) return 'Club';
  if (/4x4|outdoor show/i.test(t)) return 'Outdoor';
  if (/\bISR\b|old boys/i.test(t)) return 'School';
  if (/fees/i.test(t)) return 'Festival';
  if (/appel|going back west/i.test(t)) return 'Music';
  return 'Show';
};
const badge = c => '<span class="otr-card__badge">' + categoryOf(c) + '</span>';

const dateBlock = c => `<div class="otr-date">
                <span class="otr-date__day">${c.day}</span>
                <span class="otr-date__rule" aria-hidden="true"></span>
                <span class="otr-date__month">${c.month}</span>
              </div>`;

const card = (c, { eager = false } = {}) => `
      <div class="col-xl-4 col-md-4 mb-4 grid-item"${c.attrs}>
        <div class="card e-card otr-card">
          <a class="otr-card__link" href="${hrefFor(c)}">
            <div class="m-card-cover otr-card__cover">
              <img class="otr-card__fill" src="${c.local}" alt="" aria-hidden="true" width="1210" height="450" loading="lazy">
              <img class="otr-card__img" src="${c.local}" alt="${c.alt}" width="1210" height="450" loading="lazy">
            </div>
            <div class="otr-card__perf" aria-hidden="true"></div>
            ${badge(c)}
            <div class="card-body otr-card__body">
              ${dateBlock(c)}
              <div class="otr-card__info">
                <h3 class="otr-card__title">${c.alt}</h3>
                <p class="otr-card__meta otr-card__venue"><i class="fas fa-map-marker-alt fa-sm" aria-hidden="true"></i>${c.venue}</p>
                <div class="otr-card__foot"><p class="otr-card__meta otr-card__time">${c.time}</p><span class="btn otr-btn otr-btn--primary otr-btn--sm otr-card__cta">Get Tickets</span></div>
              </div>
            </div>
          </a>
        </div>
      </div>`;

const moreCard = c => `
          <li>
            <div class="card e-card otr-card">
              <a class="otr-card__link" href="${hrefFor(c)}">
                <div class="m-card-cover otr-card__cover">
                  <img class="otr-card__fill" src="${c.local}" alt="" aria-hidden="true" width="1210" height="450" loading="lazy">
                  <img class="otr-card__img" src="${c.local}" alt="${c.alt}" width="1210" height="450" loading="lazy">
                </div>
                <div class="otr-card__perf" aria-hidden="true"></div>
                ${badge(c)}
                <div class="card-body otr-card__body">
                  ${dateBlock(c)}
                  <div class="otr-card__info">
                    <h3 class="otr-card__title">${c.alt}</h3>
                    <p class="otr-card__meta otr-card__venue"><i class="fas fa-map-marker-alt fa-sm" aria-hidden="true"></i>${c.venue}</p>
                    <div class="otr-card__foot"><p class="otr-card__meta otr-card__time">${c.time}</p><span class="btn otr-btn otr-btn--primary otr-btn--sm otr-card__cta">Get Tickets</span></div>
                  </div>
                </div>
              </a>
            </div>
          </li>`;

const featuredCard = c => `
          <li>
            <div class="card e-card otr-card otr-card--compact">
              <a class="otr-card__link" href="${hrefFor(c)}">
                <div class="m-card-cover otr-card__cover">
                  <img class="otr-card__fill" src="${c.local}" alt="" aria-hidden="true" width="1210" height="450">
                  <img class="otr-card__img" src="${c.local}" alt="${c.alt}" width="1210" height="450">
                </div>
                <div class="otr-card__perf" aria-hidden="true"></div>
                ${badge(c)}
                <div class="card-body otr-card__body">
                  ${dateBlock(c)}
                  <div class="otr-card__info">
                    <h3 class="otr-card__title">${c.alt}</h3>
                    <p class="otr-card__meta otr-card__venue"><i class="fas fa-map-marker-alt fa-sm" aria-hidden="true"></i>${c.venue}</p>
                  </div>
                </div>
              </a>
            </div>
          </li>`;

/* ---------- shared partials ---------- */
const LIVE = 'https://opentickets.co.za';
const langs = [['en', 'English'], ['af', 'Afrikaans'], ['zu', 'isiZulu'], ['xh', 'isiXhosa'], ['st', 'Sesotho'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português']];
const langItems = langs.map(([c, n]) => `<li><a class="dropdown-item${c === 'en' ? ' active' : ''}" href="${LIVE}/language/${c}"${c === 'en' ? ' aria-current="true"' : ''}>${n}</a></li>`).join('\n          ');
const langPills = langs.map(([c, n]) => `<li><a href="${LIVE}/language/${c}"${c === 'en' ? ' aria-current="true"' : ''}>${n}</a></li>`).join('');

const head = (title, extra = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="icon" href="assets/images/logo/logo-gold.png">
  <link rel="stylesheet" href="assets/vendor/bootstrap/css/bootstrap.min.css">
  <link rel="stylesheet" href="assets/vendor/fontawesome/css/all.min.css">
  <!-- DEMO ONLY — already provided by the live site, do not deploy -->
  <link rel="stylesheet" href="assets/js/demo/slick.css">
  <!-- Theme kit -->
  <link rel="stylesheet" href="assets/css/variables.css">
  <link rel="stylesheet" href="assets/css/base.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/pages.css">${extra}
</head>`;

const nav = (current) => `  <a class="otr-skip" href="#main">Skip to content</a>

  <!-- ====================== NAV ====================== -->
  <header class="otr-nav" id="otr-nav">
    <div class="otr-nav__inner mx-auto px-3 px-lg-4">
      <a class="otr-nav__brand" href="index.html" aria-label="Open Tickets home">
        <img class="otr-nav__logo" src="assets/images/logo/logo-gold.png" alt="Open Tickets" width="286" height="150">
      </a>

      <form id="otr-nav-search" class="otr-nav__search" action="/search" method="GET" role="search">
        <div class="otr-search">
          <input type="text" name="q" id="nav-search-input" class="otr-search__input" placeholder="Search events, teams, venues…" aria-label="Search" autocomplete="off" value="">
          <button class="otr-search__btn" type="submit" aria-label="Search"><i class="fas fa-search fa-sm" aria-hidden="true"></i></button>
        </div>
      </form>

      <nav aria-label="Primary">
        <ul class="otr-nav__links">
          <li><a class="otr-nav__link" href="index.html"${current === 'events' ? ' aria-current="page"' : ''}>Events</a></li>
          <li><a class="otr-nav__link" href="faqs.html"${current === 'faqs' ? ' aria-current="page"' : ''}>FAQs</a></li>
          <li><a class="otr-nav__link" href="${LIVE}/support">Support</a></li>
        </ul>
      </nav>

      <div class="dropdown otr-dropdown otr-nav__lang">
        <button class="otr-lang-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-globe fa-sm" aria-hidden="true"></i><span>English</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          ${langItems}
        </ul>
      </div>

      <a class="btn otr-btn otr-btn--gold otr-btn--sm otr-nav__account" href="${LIVE}/bookings"><i class="far fa-user me-2" aria-hidden="true"></i>My Account</a>

      <div class="otr-nav__actions">
        <button class="otr-nav__icon-btn" id="otr-search-toggle" type="button" aria-label="Search" aria-expanded="false" aria-controls="otr-nav-search"><i class="fas fa-search" aria-hidden="true"></i></button>
        <button class="otr-nav__icon-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#otr-offcanvas" aria-controls="otr-offcanvas" aria-label="Open menu"><i class="fas fa-bars" aria-hidden="true"></i></button>
      </div>
    </div>
  </header>

  <!-- Mobile menu -->
  <div class="offcanvas offcanvas-end otr-offcanvas" tabindex="-1" id="otr-offcanvas" aria-labelledby="otr-offcanvas-title">
    <div class="offcanvas-header">
      <img src="assets/images/logo/logo-gold.png" alt="" width="286" height="150" style="height:2.25rem;width:auto">
      <h2 class="visually-hidden" id="otr-offcanvas-title">Menu</h2>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close menu"></button>
    </div>
    <div class="offcanvas-body">
      <ul class="otr-offcanvas__list">
        <li><a class="otr-offcanvas__link" href="index.html"${current === 'events' ? ' aria-current="page"' : ''}>Events</a></li>
        <li><a class="otr-offcanvas__link" href="faqs.html"${current === 'faqs' ? ' aria-current="page"' : ''}>FAQs</a></li>
        <li><a class="otr-offcanvas__link" href="${LIVE}/support">Support</a></li>
      </ul>
      <p class="otr-offcanvas__label">Language</p>
      <ul class="otr-offcanvas__langs">${langPills}</ul>
      <a class="btn otr-btn otr-btn--gold w-100 mt-4" href="${LIVE}/bookings"><i class="far fa-user me-2" aria-hidden="true"></i>My Account</a>
    </div>
  </div>
`;

const footer = `
  <!-- ====================== FOOTER ====================== -->
  <footer class="otr-footer">
    <span class="otr-footer__wordmark" aria-hidden="true">Open Tickets</span>
    <div class="otr-footer__inner container">
      <a class="otr-footer__brand" href="index.html" aria-label="Open Tickets home"><img class="otr-footer__logo" src="assets/images/logo/logo-gold.png" alt="Open Tickets" width="286" height="150" loading="lazy"></a>
      <div class="row gx-4 gy-5">
        <div class="col-12 col-md-6 col-lg-3">
          <h2 class="otr-footer__title h4">Get In Touch</h2>
          <ul class="otr-footer__social">
            <li><a href="https://www.instagram.com/opentickets" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a></li>
            <li><a href="https://www.linkedin.com/company/opentickets" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in" aria-hidden="true"></i></a></li>
            <li><a href="https://www.facebook.com/OpenTicketsZA" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a></li>
            <li><a href="https://wa.me/27873307575" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp" aria-hidden="true"></i></a></li>
          </ul>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <h2 class="otr-footer__title h4">Support</h2>
          <ul class="otr-footer__list">
            <li><a class="otr-footer__link" href="${LIVE}/support"><i class="fas fa-life-ring" aria-hidden="true"></i>Support</a></li>
            <li><a class="otr-footer__link" href="${LIVE}/plugins"><i class="fas fa-puzzle-piece" aria-hidden="true"></i>CMS Plugins</a></li>
            <li><a class="otr-footer__link" href="faqs.html"><i class="fas fa-question-circle" aria-hidden="true"></i>FAQs</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <h2 class="otr-footer__title h4">Legal</h2>
          <ul class="otr-footer__list">
            <li><a class="otr-footer__link" href="${LIVE}/page/privacy-policy" target="_blank" rel="noopener"><i class="fas fa-angle-right" aria-hidden="true"></i>Privacy Policy</a></li>
            <li><a class="otr-footer__link" href="${LIVE}/page/terms-and-conditions" target="_blank" rel="noopener"><i class="fas fa-angle-right" aria-hidden="true"></i>Terms and Conditions</a></li>
          </ul>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <h2 class="otr-footer__title h4">Language</h2>
          <div class="dropdown dropup otr-dropdown">
            <button class="otr-lang-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><span>English</span></button>
            <ul class="dropdown-menu">
              ${langItems}
            </ul>
          </div>
        </div>
      </div>
      <p class="otr-footer__bottom mb-0"><i class="far fa-copyright me-1" aria-hidden="true"></i>2024-2026 - <a href="${LIVE}">Open Tickets</a> - All rights reserved.</p>
    </div>
  </footer>

  <!-- ====================== CHAT BUTTON ====================== -->
  <div class="otr-chat ot-chatbot ot-chatbot--floating">
    <button type="button" class="otr-chat__launcher ot-chatbot__launcher btn btn-primary rounded-circle shadow" aria-label="Open chat">
      <i class="fas fa-comments" aria-hidden="true"></i>
    </button>
  </div>
`;

const scripts = (extraDemo = '', lean = false) => lean ? `
  <!-- Production scripts -->
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>

  <!-- DEMO ONLY — already provided by the live site, do not deploy. (Search shim: Enter goes to search.html?q=...) -->
  <script src="assets/js/demo/search-shim.js" defer></script>${extraDemo}
</body>
</html>
` : `
  <!-- Production scripts -->
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>

  <!-- DEMO ONLY — already provided by the live site, do not deploy.
       ORDER MATTERS: jQuery before Isotope (the live filter callback uses \`this\`, which only works because
       jQuery's .is(fn) calls it with the element — see README "Notes for developers").
       Then Slick, search shim, Alpine collapse plugin, Alpine core. -->
  <script src="assets/js/demo/jquery.min.js" defer></script>
  <script src="assets/js/demo/isotope.pkgd.min.js" defer></script>
  <script src="assets/js/demo/slick.min.js" defer></script>
  <script src="assets/js/demo/slick-init.js" defer></script>
  <script src="assets/js/demo/search-shim.js" defer></script>
  <script src="assets/js/demo/alpine-collapse.min.js" defer></script>
  <script src="assets/js/demo/alpine.min.js" defer></script>${extraDemo}
</body>
</html>
`;

/* ======================================================================
   index.html
   ====================================================================== */
const featuredTitles = ['Appel in PE', 'Kaizer Chiefs vs TS Galaxy FC (CKC)', 'KempieFees 2026', 'Black Swan Africa Extravaganza'];
const featured = featuredTitles.map(t => cards.find(c => c.alt === t) || (() => { throw new Error('featured missing ' + t); })());

const slides = slideUrls.map(s => {
  const local = mapPath(s.url, 'banners');
  if (!local) throw new Error('no banner for ' + s.alt);
  const href = 'event.html';
  return `        <div class="osahan-slider-item">
            <a href="${href}" target="_self" draggable="false">
                <img src="${local}" draggable="false" class="otr-hero__fill" alt="" aria-hidden="true" width="1210" height="450">
                <img src="${local}" draggable="false" class="img-fluid rounded" alt="${s.alt}" width="1210" height="450">
            </a>
        </div>`;
}).join('\n');

const index = `${head('Open Tickets — Events')}
<body class="otr-has-nav">
${nav('events')}
  <main id="main" class="otr-main container pb-4">

    <!-- HERO — Alpine collapse wrapper copied character for character from reference/current-home.html -->
    ${heroWrapperTag}
        ${dragTag}
    <div class="osahan-slider otr-hero">
${slides}
    </div>
    ${inlineStyle}
</div>

        <!-- FEATURED STRIP — new child inside the collapse wrapper so it collapses while filtering -->
        <section class="otr-featured" aria-labelledby="otr-featured-title">
          <div class="otr-featured__head">
            <span class="otr-label"><i class="fas fa-star" aria-hidden="true"></i>Featured</span>
            <h2 class="otr-featured__title" id="otr-featured-title">Coming up</h2>
          </div>
          <ul class="otr-featured__list">${featured.map(featuredCard).join('')}
          </ul>
        </section>
    </div>

    <div class="otr-section-head">
      <h2 class="otr-section-title">Events</h2>
    </div>

    <!-- EVENTS GRID — Alpine/Isotope attributes copied character for character from the reference.
         Do NOT add gap/grid/flex/transform here or on .grid-item. -->
    ${gridTag}${cards.map(c => card(c)).join('')}
    </div>

    <!-- WHY OPEN TICKETS — suggested addition. Every line is taken from the live FAQs. Outside #events-grid. -->
    <section class="otr-why" aria-labelledby="otr-why-title">
      <h2 class="otr-why__title" id="otr-why-title">Why Open Tickets</h2>
      <ul class="otr-why__list">
        <li class="otr-why__item"><span class="otr-why__icon" aria-hidden="true"><i class="fas fa-envelope"></i></span><div><h3 class="otr-why__item-title">Tickets by email</h3><p class="otr-why__text">Once payment goes through, your tickets arrive at the email address you gave at checkout.</p></div></li>
        <li class="otr-why__item"><span class="otr-why__icon" aria-hidden="true"><i class="fas fa-wallet"></i></span><div><h3 class="otr-why__item-title">Phone wallet ready</h3><p class="otr-why__text">Add your tickets to Google Wallet or Apple Wallet, or download them as a PDF.</p></div></li>
        <li class="otr-why__item"><span class="otr-why__icon" aria-hidden="true"><i class="fas fa-lock"></i></span><div><h3 class="otr-why__item-title">Secure online payment</h3><p class="otr-why__text">You are taken to our secure payment page to complete your purchase.</p></div></li>
        <li class="otr-why__item"><span class="otr-why__icon" aria-hidden="true"><i class="fab fa-whatsapp"></i></span><div><h3 class="otr-why__item-title">Help when you need it</h3><p class="otr-why__text">Browse the <a href="faqs.html">FAQs</a> or <a href="https://wa.me/27873307575" target="_blank" rel="noopener">message us on WhatsApp</a>.</p></div></li>
      </ul>
    </section>
  </main>
${footer}${scripts()}`;
fs.writeFileSync(path.join(ROOT, 'index.html'), index);


/* ======================================================================
   event.html — Appel in PE. Content parsed verbatim from reference/current-event-appel.html;
   layout follows current-event.html. Information order is the live order.
   ====================================================================== */
const ev = read('reference/current-event-appel.html');
const grab = (re, what) => { const m = re.exec(ev); if (!m) throw new Error('event: missing ' + what); return m; };
const evTitle = grab(/<h5 class="card-title[^>]*>([^<]*)<\/h5>/, 'title')[1];
const evVenue = grab(/fa-map-marker-alt[^>]*><\/i>\s*([^<]*)<\/small>/, 'venue')[1].trim();
const evWhen = grab(/fa-calendar-alt[^>]*><\/i>\s*([^<]*)<\/span>/, 'datetime')[1].trim();
const evAbout = grab(/<h5 class="mb-3">(About [^<]*)<\/h5>\s*<div class="text-gray-600">\s*([\s\S]*?)\s*<\/div>/, 'about');
const evLoc = grab(/<h5 class="mb-3">Location<\/h5>\s*<p class="text-muted mb-3">\s*<strong>([^<]*)<\/strong>:\s*([^<]*?)\s*<\/p>/, 'location');
const evMap = grab(/<iframe[^>]*src="([^"]+)"/, 'map')[1].replace(/&(?!amp;)/g, '&amp;');
const evNotice = grab(/<div class="alert alert-info mb-3" role="alert">\s*([\s\S]*?)\s*<\/div>/, 'notice')[1];
const evRows = [...ev.matchAll(/<td class="font-weight-bold text-lg pl-0 align-middle">([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/g)];
if (!evRows.length) throw new Error('event: no price rows');
const appel = cards.find(c => c.alt === evTitle);
if (!appel) throw new Error('event card not found for ' + evTitle);
const more = ['Kaizer Chiefs vs TS Galaxy FC (CKC)', 'Going Back West', 'KempieFees 2026'].map(t => cards.find(c => c.alt === t));
const fromPrice = evRows[0][2].trim();
const rowsHtml = evRows.map(r => '<tr><td>' + r[1].trim() + '</td><td>' + r[2].trim() + '</td><td>' + r[3].trim() + '</td></tr>').join('\n              ');

/* ---- "Select a Section" modal: sections parsed from the live dialog (same names, same ids, same status text) ---- */
const modalSrc = ev.slice(ev.indexOf('Select a Section'));
const modalTitle = 'Select a Section';
const seatSections = [...modalSrc.matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/g)].map(g => {
  const id = (/showSection\('([^']+)'\)/.exec(g[1]) || [])[1] || null;
  const name = /([^<>]+)<\/text>/.exec(g[2])[1].trim();
  const status = (/<title>([^<]*)<\/title>/.exec(g[2]) || [])[1] || null;
  return { id, name, status };
}).sort((a, c) => a.name.localeCompare(c.name, 'en', { numeric: true }));
if (!seatSections.length) throw new Error('modal: no sections');
const cancelLabel = /btn-outline-secondary[^>]*>\s*([^<]*?)\s*<\/button>/.exec(modalSrc)[1];
const sectionItems = seatSections.map(s => s.id
  ? `<li><button type="button" class="otr-section" data-section-id="${s.id}"><span>${s.name}</span><i class="fas fa-chevron-right fa-sm" aria-hidden="true"></i></button></li>`
  : `<li><button type="button" class="otr-section" disabled title="${s.status}"><span>${s.name}<span class="otr-section__status">${s.status}</span></span></button></li>`
).join('\n            ');
const seatModal = `
  <!-- ====================== SELECT A SECTION (live seating dialog, Bootstrap 5 modal) ====================== -->
  <div class="modal fade otr-modal" id="otr-seat-modal" tabindex="-1" aria-labelledby="modal-title" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="modal-title">${modalTitle}</h2>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row g-4">
            <div class="col-lg-8">
              <!-- SEATING MAP SLOT
                   Where the live venue map (SVG, "Select a Section") sits. Reserved for the follow-up project:
                   mount the interactive seating map into #otr-seating-map. Keep it empty until then. -->
              <div id="otr-seating-map" class="otr-seatmap"></div>
            </div>
            <div class="col-lg-4">
              <!-- Sections as buttons. Blade: wire:click="showSection('{{ $section->id }}')" on each (the id is data-section-id here). -->
              <ul class="otr-sections" aria-label="Sections">
            ${sectionItems}
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn otr-btn otr-btn--secondary" data-bs-dismiss="modal">${cancelLabel}</button>
        </div>
      </div>
    </div>
  </div>
`;

const event = `${head(evTitle + ' — Open Tickets')}
<body class="otr-has-nav otr-has-buybar">
${nav('events')}
  <main id="main" class="otr-main otr-event container pb-4">

    <!-- EVENT HEADER: poster (1210:450 frame) + date + title + venue + datetime -->
    <article class="card m-card otr-event-head">
      <div class="m-card-cover otr-card__cover">
        <img class="otr-card__fill" src="${appel.local}" alt="" aria-hidden="true" width="1210" height="450">
        <img class="otr-card__img" src="${appel.local}" alt="${evTitle}" width="1210" height="450">
      </div>
      <div class="otr-event-head__body">
        ${dateBlock(appel)}
        <div class="otr-event-head__text">
          <h1 class="otr-event-head__title">${evTitle}</h1>
          <ul class="otr-event-head__meta">
            <li><i class="fas fa-map-marker-alt fa-sm" aria-hidden="true"></i>${evVenue}</li>
            <li class="otr-event-head__when"><i class="far fa-calendar-alt fa-sm" aria-hidden="true"></i>${evWhen}</li>
          </ul>
        </div>
        <!-- Compact CTA (md and up). Below md the sticky bottom bar is used. -->
        <div class="otr-event-head__cta">
          <div class="otr-event-head__from"><span class="otr-event-head__from-label">From</span><span class="otr-event-head__from-amount">${fromPrice}</span></div>
          <button type="button" class="btn otr-btn otr-btn--primary otr-btn--lg" data-bs-toggle="modal" data-bs-target="#otr-seat-modal">Book Now</button>
        </div>
      </div>
      <!-- SHARE — suggested addition. hrefs are filled in by OT.share (main.js) from the data-share templates. -->
      <div class="otr-event-head__share">
        <span class="otr-share__label">Share this event</span>
        <ul class="otr-share">
          <li><a class="otr-share__btn" href="https://wa.me/" data-share="https://wa.me/?text={title}%20{url}" target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i class="fab fa-whatsapp" aria-hidden="true"></i></a></li>
          <li><a class="otr-share__btn" href="https://www.facebook.com/" data-share="https://www.facebook.com/sharer/sharer.php?u={url}" target="_blank" rel="noopener" aria-label="Share on Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a></li>
          <li><button type="button" class="otr-share__btn" data-copy-link data-copied="Link copied" aria-label="Copy link"><i class="far fa-copy" aria-hidden="true"></i><span>Copy link</span></button></li>
        </ul>
        <span class="visually-hidden" role="status" aria-live="polite" data-share-status></span>
      </div>
    </article>

    <div class="row mt-4">
      <div class="col-lg-8">
        <section class="otr-panel" aria-labelledby="otr-about-title">
          <h2 class="otr-panel__title" id="otr-about-title">${evAbout[1]}</h2>
          <div class="otr-panel__text">
            ${evAbout[2]}
          </div>
        </section>

        <section class="otr-panel" aria-labelledby="otr-location-title">
          <h2 class="otr-panel__title" id="otr-location-title">Location</h2>
          <p class="text-body-secondary mb-3"><strong>${evLoc[1]}</strong>: ${evLoc[2]}</p>
          <div class="otr-map">
            <iframe title="Map: ${evLoc[1]}" src="${evMap}" loading="lazy" allowfullscreen></iframe>
          </div>
        </section>
      </div>

      <div class="col-lg-4">
        <aside class="otr-booking" id="otr-book" aria-labelledby="otr-book-title">
          <div class="otr-notice" role="note"><i class="fas fa-info-circle" aria-hidden="true"></i><div>${evNotice}</div></div>
          <h2 class="otr-booking__title" id="otr-book-title">Book Now</h2>
          <p class="otr-booking__label">Available Tickets:</p>
          <table class="otr-price-table">
            <thead><tr><th scope="col">Seat Category</th><th scope="col">From</th><th scope="col">To</th></tr></thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <button type="button" class="btn otr-btn otr-btn--primary otr-btn--lg w-100" data-bs-toggle="modal" data-bs-target="#otr-seat-modal">Book Now</button>
        </aside>
      </div>
    </div>

    <!-- MORE EVENTS — suggested addition (not on the live page); same card component, no Isotope -->
    <section class="otr-more" aria-labelledby="otr-more-title">
      <div class="otr-section-head otr-section-head--start">
        <h2 class="otr-section-title" id="otr-more-title">More events</h2>
      </div>
      <ul class="otr-card-list">${more.map(moreCard).join('')}
      </ul>
    </section>
  </main>

  <!-- Mobile buy bar (below lg only; on desktop the booking panel is sticky) -->
  <div class="otr-buybar">
    <div class="otr-buybar__price"><span class="otr-buybar__label">From</span><span class="otr-buybar__amount">${fromPrice}</span></div>
    <button type="button" class="btn otr-btn otr-btn--primary" data-bs-toggle="modal" data-bs-target="#otr-seat-modal">Book Now</button>
  </div>
${seatModal}
${footer}${scripts('', true)}`;
fs.writeFileSync(path.join(ROOT, 'event.html'), event);

/* ======================================================================
   search.html — follows reference/current-search.html (heading, search form, #events-grid).
   The static HTML holds the default "chiefs" result exactly like the live page; the DEMO-ONLY
   assets/js/demo/search-results-demo.js re-filters from ?q= (it stands in for the backend).
   ====================================================================== */
const refSearch = read('reference/current-search.html');
const searchGridTag = readTag(refSearch, refSearch.lastIndexOf('<', refSearch.indexOf('id="events-grid"')));
const nameOf = c => /data-name="([^"]*)"/.exec(c.attrs)[1];
const venueOf = c => /data-venue="([^"]*)"/.exec(c.attrs)[1];
const DEFAULT_Q = 'chiefs';
const defaultHits = cards.filter(c => nameOf(c).includes(DEFAULT_Q) || venueOf(c).includes(DEFAULT_Q));

// demo "database" for the search page (DEMO ONLY file)
fs.writeFileSync(path.join(ROOT, 'assets/js/demo/events-data.js'),
  '/* DEMO ONLY — already provided by the live site, do not deploy.\n * events-data.js — the 19 real events as card markup, generated by tools/build-pages.js.\n * Used by search-results-demo.js to stand in for the search backend. */\nwindow.OT_DEMO_EVENTS = ' +
  JSON.stringify(cards.map(c => ({ name: nameOf(c), venue: venueOf(c), place: c.venue, cat: categoryOf(c), date: c.time.slice(0, 10), html: card(c).trim() })), null, 1) + ';\n');

const suggested = ['Appel in PE', 'Kaizer Chiefs vs TS Galaxy FC (CKC)', 'KempieFees 2026'].map(t => cards.find(c => c.alt === t));
const hitsLabel = defaultHits.length === 1 ? 'result for' : 'results for';

const search = `${head('Search Results — Open Tickets')}
<body class="otr-has-nav">
${nav('')}
  <main id="main" class="otr-main container pb-4">

    <!-- PAGE HEAD: heading + search form (live: h2 "Search Results for", form action=/search, input name=q) -->
    <header class="otr-pagehead">
      <p class="otr-eyebrow mb-2">Search Results</p>
      <h1 class="otr-pagehead__title" id="otr-results-title" data-one="result for" data-many="results for" data-none="No results for" data-all="events found" data-all-one="event found" data-none-all="No events match these filters" aria-live="polite">${defaultHits.length} ${hitsLabel} “${DEFAULT_Q}”</h1>
      <form action="/search" method="GET" role="search" data-otr-search-form>
        <div class="otr-search otr-search--page">
          <input type="text" name="q" id="otr-search-input" class="otr-search__input" placeholder="Search..." aria-label="Search" autocomplete="off" value="${DEFAULT_Q}">
          <button type="button" class="otr-search__clear" data-otr-clear aria-label="Clear search" hidden><i class="fas fa-times" aria-hidden="true"></i></button>
          <button class="otr-search__btn" type="submit" aria-label="Search"><i class="fas fa-search fa-sm" aria-hidden="true"></i></button>
        </div>
      </form>

      <!-- FILTERS + SORT — suggested addition. Options are plain GET links (?q=&date=&venue=&category=&sort=);
           search-results-demo.js (DEMO ONLY) fills the menus from the demo data. In production render the same
           markup from the server (see README 6.10). Wording lives in these data-* attributes. -->
      <div class="otr-filters" id="otr-filters" role="group" aria-label="Filter results">
        <a class="otr-chip is-active" href="search.html" data-otr-all><i class="fas fa-check-circle" aria-hidden="true"></i>All results</a>
        <div class="dropdown otr-dropdown">
          <button class="otr-chip dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-otr-chip="date" data-label="Date"><i class="far fa-calendar-alt" aria-hidden="true"></i><span>Date</span></button>
          <ul class="dropdown-menu" data-otr-menu="date" data-any="Any date"></ul>
        </div>
        <div class="dropdown otr-dropdown">
          <button class="otr-chip dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-otr-chip="venue" data-label="Venue"><i class="fas fa-map-marker-alt" aria-hidden="true"></i><span>Venue</span></button>
          <ul class="dropdown-menu" data-otr-menu="venue" data-any="Any venue"></ul>
        </div>
        <div class="dropdown otr-dropdown">
          <button class="otr-chip dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-otr-chip="category" data-label="Category"><i class="fas fa-tag" aria-hidden="true"></i><span>Category</span></button>
          <ul class="dropdown-menu" data-otr-menu="category" data-any="Any category"></ul>
        </div>
        <div class="dropdown otr-dropdown otr-filters__sort">
          <button class="otr-chip dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-otr-chip="sort" data-label="Sort"><i class="fas fa-sort-amount-down" aria-hidden="true"></i><span>Sort: Soonest first</span></button>
          <ul class="dropdown-menu dropdown-menu-end" data-otr-menu="sort" data-options="soon:Soonest first|late:Latest first|az:Name A–Z"></ul>
        </div>
      </div>
    </header>

    <!-- RESULTS — #events-grid with the original Alpine/Isotope attributes (copied from reference/current-search.html).
         Same exact card component as the home page. No sort control (backend may not support it). -->
    <div id="otr-results">
      <h2 class="otr-results__label">Events</h2>
      ${searchGridTag}${defaultHits.map(c => card(c)).join('')}
      </div>

      <!-- PAGINATION — suggested addition. Demo: 6 per page via ?page=N (search-results-demo.js).
           Blade: {{ $events->links() }} with a Bootstrap 5 pagination view (see README). -->
      <nav class="otr-pagination-wrap" id="otr-pagination" aria-label="Search result pages" data-info="Showing {from}–{to} of {total}" data-prev="Previous page" data-next="Next page" data-page="Page" hidden>
        <p class="otr-pagination__info" data-otr-info></p>
        <ul class="pagination otr-pagination" data-otr-pages></ul>
      </nav>
    </div>

    <!-- EMPTY STATE — suggested addition (not in the live page); shown when a search has no results -->
    <section id="otr-empty" class="otr-empty" aria-labelledby="otr-empty-title" hidden>
      <span class="otr-empty__icon" aria-hidden="true"><i class="fas fa-ticket-alt"></i></span>
      <h2 class="otr-empty__title" id="otr-empty-title">We couldn’t find any events</h2>
      <p class="otr-empty__text" data-generic="Nothing matches these filters. Try removing one, or browse everything that is on.">Nothing matches “<span data-otr-query></span>”. Check the spelling, try a team or venue name, or browse everything that is on.</p>
      <a class="btn otr-btn otr-btn--primary otr-btn--lg" href="index.html">Browse all events</a>
      <div class="otr-suggest">
        <h3 class="otr-suggest__title">You might like</h3>
        <ul class="otr-card-list">${suggested.map(moreCard).join('')}
        </ul>
      </div>
    </section>
  </main>
${footer}
  <!-- Production scripts -->
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>
  <script src="assets/js/search.js" defer></script>

  <!-- DEMO ONLY — already provided by the live site, do not deploy.
       Order: jQuery before Isotope (see README). events-data + search-results-demo render the results
       BEFORE Alpine starts, so Isotope is created on the final cards. -->
  <script src="assets/js/demo/jquery.min.js" defer></script>
  <script src="assets/js/demo/isotope.pkgd.min.js" defer></script>
  <script src="assets/js/demo/events-data.js" defer></script>
  <script src="assets/js/demo/search-results-demo.js" defer></script>
  <script src="assets/js/demo/search-shim.js" defer></script>
  <script src="assets/js/demo/alpine.min.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'search.html'), search);

/* ======================================================================
   faqs.html — real content from reference/faq/*.html, word for word
   ====================================================================== */
const faqSlugs = [
  ['tickets-purchasing', 'faq-tickets.html'],
  ['ticket-delivery-downloading-tickets', 'faq-tickets-delivery.html'],
  ['account-profile', 'faq-accounts.html'],
  ['general', 'faq-general.html'],
  ['football', 'faq-football.html'],
];
const faqMain = read('reference/current-faq.html');
const faqCats = faqSlugs.map(([slug, file]) => {
  const card = new RegExp('faq/' + slug + '"[\\s\\S]*?<h5[^>]*>([^<]*)</h5>\\s*<p[^>]*>([^<]*)</p>').exec(faqMain);
  if (!card) throw new Error('faq category card missing: ' + slug);
  const page = read('reference/faq/' + file);
  const qs = [...page.matchAll(/<button class="btn btn-link text-dark[^>]*>\s*([\s\S]*?)\s*<i class="fas fa-chevron-down[^>]*><\/i>\s*<\/button>[\s\S]*?<div class="card-body text-gray-600[^>]*>\s*([\s\S]*?)\s*<\/div>\s*<\/div>\s*<\/div>/g)]
    .map(m => ({ q: m[1].trim(), a: m[2].trim() }));
  const declared = parseInt(card[2], 10);
  if (qs.length !== declared) throw new Error('faq ' + slug + ': parsed ' + qs.length + ' but the category card says ' + declared);
  return { slug, title: card[1], count: card[2].trim(), qs };
});

const pngSize = f => { const b = fs.readFileSync(path.join(ROOT, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const hero = pngSize('assets/images/banners/faq-hero.png');

const catCards = faqCats.map(c => `
        <li><a class="otr-faq-cat" href="#faq-${c.slug}" data-faq-target="faq-${c.slug}">
          <span class="otr-faq-cat__icon" aria-hidden="true"><i class="fas fa-question-circle"></i></span>
          <span><span class="otr-faq-cat__title">${c.title}</span><span class="otr-faq-cat__count">${c.count}</span></span>
        </a></li>`).join('');

const groups = faqCats.map(c => `
    <section class="otr-faq-group" id="faq-${c.slug}" aria-labelledby="faq-${c.slug}-title" data-faq-group>
      <h2 class="otr-faq-group__title" id="faq-${c.slug}-title" tabindex="-1" data-faq-title>${c.title}</h2>
      <div class="accordion otr-accordion" id="faq-acc-${c.slug}">${c.qs.map((x, i) => `
        <div class="accordion-item" data-faq-item>
          <h3 class="accordion-header" id="faq-${c.slug}-h${i}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-${c.slug}-c${i}" aria-expanded="false" aria-controls="faq-${c.slug}-c${i}">${x.q}</button>
          </h3>
          <div id="faq-${c.slug}-c${i}" class="accordion-collapse collapse" aria-labelledby="faq-${c.slug}-h${i}" data-bs-parent="#faq-acc-${c.slug}">
            <div class="accordion-body">
              ${x.a}
            </div>
          </div>
        </div>`).join('')}
      </div>
    </section>`).join('\n');

const faqs = `${head('Frequently Asked Questions — Open Tickets')}
<body class="otr-has-nav">
${nav('faqs')}
  <main id="main" class="otr-main container pb-4">

    <!-- HERO (live: hero-faqs.png above the heading) -->
    <header class="otr-faq-hero">
      <img class="otr-faq-hero__img" src="assets/images/banners/faq-hero.png" alt="" aria-hidden="true" width="${hero.w}" height="${hero.h}">
      <div class="otr-faq-hero__inner"><h1 class="otr-faq-hero__title">Frequently Asked Questions</h1></div>
    </header>

    <!-- CATEGORIES (live: five cards). Click scrolls to the group and opens its first question. -->
    <nav aria-label="FAQ categories">
      <ul class="otr-faq-cats">${catCards}
      </ul>
    </nav>

    <!-- LIVE SEARCH (vanilla JS, assets/js/faq.js) -->
    <section class="otr-faq-search" aria-label="Search the FAQs">
      <div class="otr-search otr-search--page">
        <span class="otr-search__icon" aria-hidden="true"><i class="fas fa-search fa-sm"></i></span>
        <input type="text" id="otr-faq-search" class="otr-search__input" placeholder="Search the FAQs…" aria-label="Search the FAQs" aria-controls="otr-faq-groups" autocomplete="off">
        <button type="button" class="otr-search__clear" data-faq-clear aria-label="Clear search" hidden><i class="fas fa-times" aria-hidden="true"></i></button>
      </div>
      <p class="otr-faq-search__status" id="otr-faq-status" role="status" aria-live="polite"></p>
    </section>

    <!-- NO-MATCH STATE -->
    <section class="otr-empty" id="otr-faq-empty" aria-labelledby="otr-faq-empty-title" hidden>
      <span class="otr-empty__icon" aria-hidden="true"><i class="fas fa-search"></i></span>
      <h2 class="otr-empty__title" id="otr-faq-empty-title">No matching questions</h2>
      <p class="otr-empty__text">We couldn’t find an answer for “<span data-faq-query></span>”. Try another word, or ask our support team.</p>
      <button type="button" class="btn otr-btn otr-btn--secondary" data-faq-clear>Clear search</button>
    </section>

    <!-- QUESTIONS, GROUPED BY CATEGORY (Bootstrap 5 accordion) -->
    <div id="otr-faq-groups">
${groups}
    </div>

    <!-- STILL NEED HELP? -->
    <aside class="otr-help" aria-labelledby="otr-help-title">
      <div>
        <h2 class="otr-help__title" id="otr-help-title">Still need help?</h2>
        <p class="otr-help__text">Our support team is happy to help.</p>
      </div>
      <div class="otr-help__actions">
        <a class="btn otr-btn otr-btn--primary" href="${LIVE}/support"><i class="fas fa-life-ring me-2" aria-hidden="true"></i>Contact Support</a>
        <a class="btn otr-btn otr-btn--gold" href="https://wa.me/27873307575" target="_blank" rel="noopener"><i class="fab fa-whatsapp me-2" aria-hidden="true"></i>WhatsApp</a>
      </div>
    </aside>
  </main>
${footer}
  <!-- Production scripts -->
  <script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>
  <script src="assets/js/faq.js" defer></script>

  <!-- DEMO ONLY — already provided by the live site, do not deploy. (Search shim: nav search Enter goes to search.html?q=...) -->
  <script src="assets/js/demo/search-shim.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'faqs.html'), faqs);

console.log('built index.html (' + cards.length + ' cards, ' + slideUrls.length + ' slides), event.html (' + seatSections.length + ' sections), search.html (' + defaultHits.length + ' default hit), faqs.html (' + faqCats.map(c => c.qs.length).join('+') + ' questions)');


