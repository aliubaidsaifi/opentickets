# Open Tickets — Elegant theme kit

A premium refresh of opentickets.co.za for the existing Laravel + Livewire + Alpine "bookishow" theme: four pages (Home, Event, FAQs, Search), one fixed top menu, Bootstrap 5.3, vanilla JS, and **every colour, font, size, radius and shadow in one file** (`assets/css/variables.css`).

It is a **static kit**: open `index.html` in a browser and everything works (filtering, hero, modal, FAQ search). Files under `assets/js/demo/` stand in for things the live site already provides and must not be deployed.

## Contents

1. [Folder overview](#1-folder-overview)
2. [Retheme from one file](#2-retheme-from-one-file)
3. [Porting into the bookishow Blade views](#3-porting-into-the-bookishow-blade-views)
4. [Bootstrap 4 → 5 migration table](#4-bootstrap-4--5-migration-table)
5. [Isotope / Alpine: proof it is untouched](#5-isotope--alpine-proof-it-is-untouched)
6. [Notes for developers](#6-notes-for-developers) (jQuery order, Isotope licence, Slick, hero fade)
7. [Recommended Slick options](#7-recommended-slick-options)
8. [Demo-only files](#8-demo-only-files)
9. [Navigation decision](#9-navigation-decision)
10. [Suggested additions](#10-suggested-additions-not-on-the-live-site)
11. [Seating-map slot](#11-seating-map-slot)
12. [Test results](#12-test-results)
13. [Image mapping](#13-image-mapping)

---

## 1. Folder overview

```
index.html            Home: hero, featured strip, #events-grid (Isotope), footer, chat button
event.html            Event detail (Appel in PE) + "Select a Section" modal + seating-map slot
faqs.html             FAQ: hero, category cards, live search, accordions, "Still need help?"
search.html           Search results + designed empty state
README.md
assets/
  css/
    variables.css     ALL tokens (colours, fonts, sizes, spacing, radius, shadows) + alternative palette
    base.css          @font-face, Bootstrap 5 token mapping, element defaults, focus styles
    components.css    every component, commented section by section (otr- prefix + BEM)
    pages.css         page-level layout (home heading, event page spacing, hero fade)
  js/
    main.js           nav shrink (one passive scroll listener + rAF), mobile search toggle, menu guard
    faq.js            FAQ live search + category cards (vanilla)
    search.js         clear (x) button in the search page box
    demo/             DEMO ONLY (see section 8)
  vendor/             bootstrap 5.3.3, font-awesome 5.15.4 (local, no CDN)
  fonts/              Playfair Display + Inter, self-hosted woff2 (latin + latin-ext)
  images/
    logo/             logo-icon.png (white original), logo-gold.png (gold, used everywhere)
    banners/          1210x450 hero slides + FAQ hero
    events/           event posters (cards, featured strip, event page)
```

Naming: every new class uses the `otr-` prefix with BEM (`.otr-card`, `.otr-card__date`, `.otr-nav--shrunk`). The live site already uses `ot-` (e.g. `ot-chatbot__launcher`), so we never use `ot-`. Original theme classes are kept next to ours (`.osahan-slider`, `.osahan-slider-item`, `.e-card`, `.m-card-cover`, `.grid-item`, `ot-chatbot…`).

---

## 2. Retheme from one file

All colours live in **`assets/css/variables.css`** and nowhere else. Check it yourself:

```
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\([0-9]" assets/css/base.css assets/css/components.css assets/css/pages.css *.html
```
returns nothing (rgba() is only ever used with a token channel, e.g. `rgba(var(--otr-navy-rgb), .5)`).

| Want to change | Edit this token |
|---|---|
| Nav and footer colour | `--otr-navy-900` (and `--otr-navy-rgb`) |
| Page background | `--otr-ivory` |
| Gold (CTA buttons, labels, underline, dots, logo) | `--otr-gold`, `--otr-gold-hover`, `--otr-gold-deep` (+ `--otr-gold-rgb`, `--otr-gold-deep-rgb`) |
| Crimson (dates, links, small accents) | `--otr-crimson`, `--otr-crimson-dark`, `--otr-crimson-tint` (+ `--otr-crimson-rgb`) |
| Body text / muted text | `--otr-ink`, `--otr-slate` |
| Fonts | `--otr-font-display`, `--otr-font-body` (and the `@font-face` in `base.css`) |
| Radius, shadows, spacing, type scale | `--otr-radius-*`, `--otr-shadow-*`, `--otr-space-*`, `--otr-fs-*` |

**Alternative palette (proof).** The bottom of `variables.css` holds a commented "Forest & Copper" palette. Paste its values over section 1 and reload: nav, footer, buttons, dates and backgrounds all change, with no other file touched (all pairs stay WCAG AA; navy-on-gold CTA text is 7.7:1). A screenshot of the result is in our presentation pack.

**The gold logo follows the gold token.** `assets/images/logo/logo-gold.png` is the existing white logo (`logo-icon.png`, kept) recoloured to `--otr-gold` with the identical shape and transparency. After changing the gold token, rebuild it with the dev script `tools/make-gold-logo.js` (in our source repository; it reads `--otr-gold` from `variables.css` and rewrites the PNG; needs `npm i pngjs`). Without the script: open `logo-icon.png` in any image editor, fill all non-transparent pixels with the new gold hex, and save as `logo-gold.png`.

Contrast reference: navy on gold 7.7:1 (hover 6.2:1) · crimson on white 7.7:1 · deep gold on ivory 4.1:1 (focus rings, edges) · muted text on ivory 5.9:1.

---

## 3. Porting into the bookishow Blade views

**Step 1 — assets.** Copy `assets/css/*`, `assets/fonts`, `assets/images`, `assets/js/main.js|faq.js|search.js` into the theme. Load order in the layout `<head>`: `bootstrap.min.css` (5.3) → Font Awesome 5 → `variables.css` → `base.css` → `components.css` → `pages.css`. The theme is Bootstrap 4 / SB Admin 2 today: upgrade to Bootstrap 5.3 (required by the brief) and remove the old sidebar/topbar CSS and the `sidebarToggleTop` script. Load `bootstrap.bundle.min.js` and `main.js` with `defer`. **Do not** copy `assets/js/demo/*`.

**Step 2 — component by component.**

| Component | Our markup | Blade / Livewire note |
|---|---|---|
| Layout, nav | `<header class="otr-nav" id="otr-nav">` + offcanvas `#otr-offcanvas` | Replace `layout.navigation` + `sidebar`. `main.js` toggles `.otr-nav--shrunk`. Keep `<input id="nav-search-input" name="q">` in `<form action="/search" method="GET">`; the existing keyup script that dispatches `filter-grid` keeps working. Language list: loop your `language/{code}` links. |
| Footer + chat | `<footer class="otr-footer">`, `.otr-chat` | Replace the Tailwind footer. The chat wrapper keeps the live classes (`ot-chatbot ot-chatbot--floating`, `ot-chatbot__launcher`, `wire:click="toggle"`): add your `wire:` attributes to our button. |
| Hero | Alpine wrapper → drag guard → `.osahan-slider.otr-hero` → `.osahan-slider-item` | Copy the wrapper/drag-guard attributes from your component as is. Loop slides; add the blurred-fill `<img class="otr-hero__fill" alt="" aria-hidden="true">` before each slide image. Slick init stays in `osahan.min.js` (options in section 7). |
| Featured strip | `<section class="otr-featured">` as a child **inside** the hero's collapse wrapper | Loop your featured events with the compact card (`.otr-card--compact`). It collapses with the hero. |
| Event card | `.col-xl-4.col-md-4.mb-4.grid-item` > `.card.e-card.otr-card` | Same loop as today. Keep `data-name="{{ strtolower($e->name) }}"` and `data-venue`. Date: `<span class="otr-date__day">{{ $e->starts_at->format('d') }}</span>` / `__month`. Images: one `<img class="otr-card__fill">` + one `<img class="otr-card__img">`. Add the `<div class="otr-card__perf" aria-hidden="true">` between poster and body, then the category badge `<span class="otr-card__badge">{{ $e->category->name }}</span>`. Footer row: `<div class="otr-card__foot"><p class="otr-card__time">…</p><span class="btn otr-btn otr-btn--primary otr-btn--sm otr-card__cta">Get Tickets</span></div>` (a `<span>` on purpose: the whole card is already one link, so no nested button/link). |
| Events grid | `<div class="row" id="events-grid" x-data … x-init …>` | Untouched (section 5). Gutters come from Bootstrap `.row`/column padding. |
| Event page | `.otr-event-head`, `.otr-panel`, `.otr-booking`, `.otr-buybar` | Same data as `event.show`. The notice, price table (`Seat Category / From / To`) and Book Now button map 1:1 to your existing booking component; the table markup is semantic (`<th scope="col">`). The Book Now buttons carry `data-bs-toggle="modal" data-bs-target="#otr-seat-modal"`; if your queue flow must run first, call `bootstrap.Modal.getOrCreateInstance(document.getElementById('otr-seat-modal')).show()` from the `queue-cleared` event instead of the data attributes. |
| Seat modal | `#otr-seat-modal` | Section buttons carry `data-section-id` (the live `showSection(id)` ids): put `wire:click="showSection('{{ $s->id }}')"` on them. Sections that are off sale render `disabled` with the live text. |
| FAQ | `.otr-faq-*`, one `.accordion.otr-accordion` per category | Loop categories → questions. Answers are output as HTML (they contain `<br />`). Ids: `faq-{slug}` per group, `faq-{slug}-c{n}` per answer. `faq.js` needs only the `data-faq-*` attributes. |
| Search page | `.otr-pagehead` + `#events-grid` + `#otr-empty` | Heading text `N result(s) for “q”` and the empty state are server-rendered in production (`data-one/many/none` attributes hold the wording). Keep the same event card. |

**Step 3 — remove.** Bootstrap 4 JS/CSS, SB Admin 2 sidebar/topbar markup, Tailwind-only classes in the footer and language dropdown (replaced by `.otr-footer` and a Bootstrap 5 dropdown).

---

## 4. Bootstrap 4 → 5 migration table

Counts are occurrences found in the live HTML we received (home, event, FAQ, search). Everything below was converted or replaced.

| Bootstrap 4 | Bootstrap 5 / ours | Found |
|---|---|---|
| `ml-*` / `mr-*` | `ms-*` / `me-*` | 34 / 107 |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | 61 / 7 |
| `no-gutters` | `g-0` (the card body row became `.otr-card__body`, flex) | 20 |
| `data-toggle`, `data-target`, `data-parent`, `data-dismiss` | `data-bs-toggle`, `data-bs-target`, `data-bs-parent`, `data-bs-dismiss` | FAQ, dropdowns |
| `float-right` / `float-left` | `float-end` / `float-start` (accordion chevron is now the built-in `.accordion-button` icon) | 19 |
| `text-left` / `text-right` | `text-start` / `text-end` | 29 / 12 |
| `font-weight-bold` | `fw-bold` (dates use `.otr-date__day`) | 64 |
| `btn-block` | `w-100` (BS5 has no `btn-block`) | 5 |
| `embed-responsive embed-responsive-21by9` | CSS `aspect-ratio` on `.otr-map` | 2 |
| `input-group-append` | removed; button is a direct child (`.otr-search`) | 11 |
| `form-inline` | removed; flex utilities / `.otr-search` | 10 |
| `dropdown-menu-right` | `dropdown-menu-end` | 10 |
| `.close` (modal) | `.btn-close` (`.btn-close-white` on navy) | modal |
| `.card` + `.collapse` FAQ | BS5 `.accordion` / `.accordion-item` / `.accordion-button` | FAQ |
| `.sr-only` | `.visually-hidden` | — |
| `text-muted` | `text-body-secondary` where used | 86 |
| Alpine `showModal` modal | Bootstrap 5 JS modal (`bootstrap.Modal`) | event |
| jQuery plugins (`$('#m').modal()`) | `bootstrap.Modal.getOrCreateInstance(el)` — BS5 has no jQuery dependency | — |
| SB Admin utilities (`text-gray-*`, `.sidebar`) | removed; colours come from tokens | 275 |

jQuery stays on the live site only because Slick and Isotope's filter use it (section 6).

---

## 5. Isotope / Alpine: proof it is untouched

The filter is search-driven: typing in `#nav-search-input` dispatches a window `CustomEvent("filter-grid")`; `#events-grid` filters its `.grid-item`s by lowercase `data-name` / `data-venue` (3+ characters, otherwise everything shows); the hero wrapper collapses while filtering. **None of this was edited.** Our Alpine attributes are copied from `reference/current-home.html` / `current-search.html` by script, byte for byte.

Protected selectors and attributes (compared as raw text, in the same order):

| Element | Protected |
|---|---|
| Hero wrapper (first `<div>` with `x-on:filter-grid.window`) | `x-data="{ show: true }"`, `x-on:filter-grid.window`, `x-show`, `x-collapse.duration.800ms`, `x-transition:enter` / `enter-start` / `enter-end` / `leave` / `leave-start` / `leave-end` |
| Drag guard (`<div x-on:pointerdown …>`) | `x-data` (startX, startY, dragging, onPointerDown, onPointerMove, onClick), `x-on:pointerdown`, `x-on:pointermove`, `x-on:click.capture`, `x-on:dragstart.prevent` |
| `#events-grid` | `class="row"`, `id="events-grid"`, `x-data` (`initIsotope()`, `filter(query)`, `itemSelector: '.grid-item'`, `layoutMode: 'fitRows'`), `x-init` |
| Search | `<form action="/search" method="GET">`, `<input id="nav-search-input" name="q">` |
| Cards | `.grid-item` on every column, lowercase `data-name`, `data-venue`; `.e-card`, `.m-card-cover` kept |
| Slider | `.osahan-slider`, `.osahan-slider-item` kept |

Rules we follow so Isotope's `fitRows` positioning is never disturbed: no `gap`, `grid`, `flex` or `transform` on `#events-grid` or `.grid-item`; gutters are column padding; hover effects live on the inner `.otr-card`; every card has a fixed height (fixed 1210:450 poster frame + fixed body height, titles clamp to 2 lines, venue to 1).

**How it was verified.** Our dev checker (`tools/check-isotope-markup.js`, in our source repository, run as `node tools/check-isotope-markup.js`) compares every protected attribute of `index.html` and `search.html` with the live reference files, checks the card count, data attributes, lowercase values and the form, and scans the CSS for forbidden properties on `#events-grid` / `.grid-item`. Result on this delivery: **ALL CHECKS PASSED** (hero wrapper 10/10 attributes, drag guard 5/5, `#events-grid` 4/4, 19 of 19 cards, search page 1 of 1). Manual spot check: `grep -n "x-collapse.duration.800ms" index.html` and compare with the live page.

Behaviour test at 1440 / 1280 / 1024 / 768 / 390 / 360: typing "chiefs" gives 1 card and collapses the hero + featured strip; clearing restores 19 cards and the hero; "fnb" gives 1 card.

---

## 6. Notes for developers

### 6.1 The live filter depends on jQuery being loaded BEFORE Isotope

The `#events-grid` Alpine component filters with a callback that uses `this`:

```js
this.iso.arrange({
    filter: function () {
        const el = this;            // relies on `this` being the grid item element
        ...
        el.getAttribute('data-name')
```

Isotope itself calls a function filter as `filter(item.element)` with **no** `this`. The code only works because, when jQuery is present **at the moment Isotope loads**, Isotope switches to `jQuery(item.element).is(filter)`, and jQuery's `.is(fn)` calls the function with `this` set to the element.

- **Load order must be jQuery → Isotope.** If Isotope loads without jQuery (or before it), the filter throws `el.getAttribute is not a function` and typing in the search box does nothing. We hit exactly this error while building the demo.
- The behaviour is the same in Isotope 2.2.2 and 3.0.x (checked against 2.2.2, 3.0.0, 3.0.3 and 3.0.6).
- On the live page, `jquery.min.js` is a classic script at the end of `<body>`, while the app bundle (`app-*.js`, which references `window.Isotope`) is a deferred `type="module"` script, so jQuery is available when the bundle runs. **Nothing needs to change on the live site.** Just do not reorder those scripts, and do not remove jQuery without first rewriting the filter callback to use its argument (`filter: function (el) { ... }`).
- The demo pages keep a safe order: `jquery.min.js` → `isotope.pkgd.min.js` → `slick.min.js` → `slick-init.js` → `search-shim.js` → `alpine-collapse.min.js` → `alpine.min.js`.

### 6.2 Isotope licence

Isotope is **GPLv3 for open-source use; commercial use requires a paid licence** from its author (metafizzy.co). The live site already ships Isotope, so this kit adds no new dependency, but the client should confirm the licence covering the live site is in place. The copy in `assets/js/demo/isotope.pkgd.min.js` is for the static demo only.

### 6.3 Slick is initialised by the live theme

On the live site Slick is initialised inside `osahan.min.js`. The kit restyles the existing `.osahan-slider` markup only (options in section 7). The hero collapses with `display:none` while filtering, so call `slick('setPosition')` after it re-expands (the demo does this in `slick-init.js`).

### 6.4 Bonus fix: the hero finally fades

On the live site the hero never fades: Alpine ignores `x-transition` when `x-collapse` is on the same element, so the hero only shrinks in height. `pages.css` adds the fade without touching any attribute: the wrapper's children fade in step with the inline `height: 0px` that x-collapse writes at the start of a collapse and of an expand. If a future Alpine changes that inline style, the hero still collapses; it just stops fading.

### 6.5 Demo links vs production links

In the static demo every hero slide, featured card and event card links to `event.html`, FAQ links go to `faqs.html`, and Events / the logo go to `index.html`, so a reviewer stays inside our pages. Support, My Account, CMS Plugins, Privacy and Terms keep their real live URLs. **The card and slide `href`s are demo links only. In production they come from Blade** (the real event URLs). The search form keeps `action="/search"`; `search-shim.js` (demo only) intercepts the submit and goes to `search.html?q=<query>` so Enter works locally.

### 6.6 Gold, 1210:450 frames, no sidebar

- **Gold**: logo, primary CTA buttons (navy text), nav underline, "Featured" label, hero dots and focus rings. Crimson stays on date numerals, links and small accents.
- **Event images are always 1210:450.** Every frame (cards, featured strip, hero, event poster, More events, search results) is `aspect-ratio: 1210 / 450` (`--otr-poster-ratio`), so a standard client banner fills it completely. A non-standard image (e.g. the 1210×482 Going Back West banner) is shown whole (`object-fit: contain`) over a blurred, darkened copy of itself. Nothing is ever cropped.
- **No sidebar** at any width. The Bootstrap offcanvas exists for mobile only (below `lg`); `OT.menu` in `main.js` closes it if the window is resized up to desktop.

### 6.7 Event page

- Content and order are the live Appel in PE page: poster, title, venue, date and time, About, Location (address + map), then the booking column (notice, Book Now, price table, button).
- A compact "From R 250.00" + gold Book Now sits on the right of the title row (md and up) so the call to action is above the fold at 1440×900. The booking panel is sticky on desktop; on phones a bottom buy bar replaces it.
- The About text is reproduced word for word. In the source data it is a single run-on paragraph (age policy and allowed/prohibited item lists with no line breaks), so it reads as a wall of text. Splitting it into paragraphs or lists in the admin would improve it with no theme change.
- **Seating modal** (`#otr-seat-modal`, Bootstrap 5): the live "Select a Section" dialog in our style: same title, same sections (Block 1 to 8, Boardwalk Unreserved), same section ids (`data-section-id`), same "This section is not on sale at the moment." text, same Cancel button.

### 6.8 Search and FAQ pages

- **Search**: heading, search form (`action="/search"`, `name="q"`), then `#events-grid` with the original Alpine/Isotope attributes and the exact event card. No sort control (the backend may not support it). In the demo, `search-results-demo.js` + `events-data.js` (DEMO ONLY) read `?q=` and filter the 19 real events; in production the server renders the results.
- **FAQ**: questions and answers are word for word from the five category pages we received (2 + 3 + 4 + 6 + 4 = 19, matching the counts on the live category cards; no placeholders). Repeated questions in the source data ("How to Transfer Tickets?" twice, "Which outlets do you sell at?" twice) are kept as they are; worth tidying in the admin. Clicking a category card scrolls to its group and opens its first question; `faqs.html#faq-general`-style links work too.

### 6.9 Pagination (what happens when there are more events)

- **Search page: paginate on the server.** Results are already server-rendered, so use `$events->links()` with a Bootstrap 5 pagination view. Our markup is the standard BS5 one: `<nav aria-label="…"><ul class="pagination otr-pagination"><li class="page-item active"><span class="page-link" aria-current="page">1</span></li>…`. The gold active page, round buttons, hover and focus ring come from `.otr-pagination` in `components.css` (section 14). The "Showing 1–6 of 19" line is `.otr-pagination__info`.
- **Demo:** `search-results-demo.js` shows 6 results per page (`?q=…&page=N`; an empty query lists all 19 events over 4 pages). In production use `paginate(12)` or similar.
- **Home page: keep everything on one page for now.** The Isotope filter only sees cards that are in the DOM, so paginating the home grid would silently hide events that are not on the current page from the live filter. That is why `#events-grid` is not paginated here. If the event list grows past roughly 60, add a gold "Show more events" button under the grid that appends the next batch (`iso.appended(newItems)` in the same Alpine component) and, for queries of 3+ characters that are not found in the loaded set, send the visitor to `/search?q=`. Until then, all events on one page is the safest option.

### 6.10 Search filters and sort (search page only)

Under the search box: **All results** (gold when no filter is set), **Date**, **Venue**, **Category** dropdown pills, and **Sort** on the right. Each option is a plain link with GET parameters, so the server renders it with no JavaScript:

```
search.html?q=fc&date=2026-11&venue=Klub%20600&category=Football&sort=late&page=2
```

- `q` matches event name or venue (same rule as the live filter), `date` is `YYYY-MM`, `sort` is `soon` (default), `late` or `az`.
- Blade: loop the options into `<li><a class="dropdown-item {{ $active ? 'active' : '' }}" href="…">`; give the pill `is-active` when its filter is set and put the current value in its label ("Category · Football"). The pagination links must keep the same parameters (`$events->appends(request()->query())->links()`).
- Demo only: `assets/js/demo/search-results-demo.js` builds the menus and filters the 19 events in `events-data.js`. **Category is inferred from the event name in the demo** (Football, Music, Festival…); in production use your event category field.
- **Not offered on purpose:** a Price filter (we only have a real price for Appel in PE; no invented prices). Add one when the price data is available.
- The home page keeps its search-driven Isotope filter exactly as on the live site; these chips exist on the search page only.

---

## 7. Recommended Slick options

Used by `assets/js/demo/slick-init.js` (the live init lives in `osahan.min.js`; copy these there). `centerPadding` must match `--otr-hero-pad` in `components.css` (`120px` ≥1200, `80px` 768–1199, `0px` below 768).

```js
$('.osahan-slider').slick({
  centerMode: true,          // next + previous slide peek in
  centerPadding: '120px',
  slidesToShow: 1,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 5000,
  pauseOnHover: true,
  speed: 600,
  dots: true,
  dotsClass: 'otr-hero__dots',
  customPaging: function (s, i) { return $('<button type="button"></button>').attr('aria-label', 'Go to slide ' + (i + 1)); },
  arrows: true,
  prevArrow: '<button type="button" class="otr-hero__arrow otr-hero__arrow--prev" aria-label="Previous slide"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>',
  nextArrow: '<button type="button" class="otr-hero__arrow otr-hero__arrow--next" aria-label="Next slide"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>',
  responsive: [
    { breakpoint: 1200, settings: { centerPadding: '80px' } },
    { breakpoint: 768,  settings: { centerPadding: '0px', arrows: false } }   // phones: full-width slide
  ]
});
```

---

## 8. Demo-only files

Everything in `assets/js/demo/` is **DEMO ONLY — already provided by the live site, do not deploy** (each file starts with that label). Our production files (`main.js`, `faq.js`, `search.js`, all CSS) never depend on them.

| File | Why it exists |
|---|---|
| `alpine.min.js`, `alpine-collapse.min.js` | Alpine 3 + collapse plugin (the live site gets Alpine from Livewire) |
| `isotope.pkgd.min.js` | Isotope (the live app bundle) |
| `jquery.min.js`, `slick.min.js`, `slick.css` | jQuery + Slick (the live theme) |
| `slick-init.js` | Slick init (live: `osahan.min.js`), with our recommended options |
| `search-shim.js` | Dispatches `filter-grid` from `#nav-search-input` (live: inline script, mirrors its 3-character rule); intercepts the search form submit |
| `events-data.js`, `search-results-demo.js` | Stand in for the search backend on `search.html` |

---

## 9. Navigation decision

The sidebar + top bar are replaced by **one fixed top menu**: logo · prominent search (`#nav-search-input` stays the live filter) · Events, FAQs, Support · language dropdown · My Account. It shrinks on scroll (smaller logo, lower height, backdrop blur + shadow) using one passive scroll listener throttled with `requestAnimationFrame`, and respects `prefers-reduced-motion`. On mobile it becomes logo + search toggle + hamburger opening a Bootstrap offcanvas with the same links.

Why: the client asked for a top menu; a fixed bar keeps search (the Isotope filter) one tap away on every page, frees the left 224px for content, and the shrink keeps it from eating the first screen (76px → 56px).

---

## 10. Suggested additions (not on the live site)

Everything else follows the live pages. These are our additions; each can be deleted without affecting anything else:

| Addition | Where | To remove |
|---|---|---|
| Designed empty state with "Browse all events" and 3 suggested events | `search.html` `<section id="otr-empty">` | delete the block |
| "More events" (3 cards) | `event.html` `<section class="otr-more">` | delete the block |
| "Still need help?" block (Contact Support + WhatsApp) | `faqs.html` `<aside class="otr-help">` | delete the block |
| Featured strip ("Coming up") | `index.html` inside the hero wrapper | delete the `<section class="otr-featured">` |
| Ticket-stub perforation on cards | `.otr-card__perf` | delete the div (or the CSS rule) |
| Large faint "Open Tickets" footer wordmark | `.otr-footer__wordmark` (decorative, `aria-hidden`) | delete the span |
| Poster image fade-in | `components.css` section 13 | delete the section |
| Hero fade while collapsing (bonus fix) | `pages.css` | delete the two rules |
| Mobile sticky buy bar | `event.html` `.otr-buybar` | delete the block |
| Gold "Get Tickets" button on every event card | `.otr-card__foot` / `.otr-card__cta` | delete the span (it is only a visual cue; the card is the link) |
| Category badge on the ticket-stub line | `.otr-card__badge` | delete the span. **Demo only:** the label (Football, Music, Festival …) is inferred from the event name; in production use your category field |
| "Why Open Tickets" strip (4 facts from the live FAQs: tickets by email, wallet, secure payment, WhatsApp/FAQ help) | `index.html` `<section class="otr-why">` under `#events-grid` | delete the block |
| Share row on the event page (WhatsApp, Facebook, copy link) | `event.html` `.otr-event-head__share`; links filled by `OT.share` in `main.js` from `data-share` templates | delete the block (the JS is a no-op without it) |
| Filter chips + sort on the search page (All results, Date, Venue, Category, Sort) | `search.html` `#otr-filters` | delete the `<div class="otr-filters">` block (see 6.10) |
| Pagination on the search page | `search.html` `#otr-pagination` | delete the `<nav>` (see 6.9) |

---

## 11. Seating-map slot

`event.html`: open the **"Select a Section"** modal (`#otr-seat-modal`). Inside it, `<!-- SEATING MAP SLOT -->` marks the empty `<div id="otr-seating-map" class="otr-seatmap">` (4:3, exactly where the live SVG map sits). It is intentionally empty for the follow-up project. Mount the interactive seating map there. The section buttons next to it keep the live `data-section-id` values.

---

## 12. Test results

Headless Chromium (Edge), widths 1440 / 1280 / 1024 / 768 / 390 / 360, all four pages:

- No horizontal scroll, zero console errors on every page and width.
- Home: "chiefs" → 1 card + hero and featured strip collapse; clear → 19 + restored; "fnb" → 1.
- Event: Book Now (title row, booking panel, mobile bar) opens the modal; Esc closes it.
- Search: `?q=chiefs` → 1, `?q=fnb` → 1, `?q=zzz` → empty state with 3 suggestions, `?q=` → 19 events over 4 pages with working pagination (page 4 shows 1 card); filters and sort combine with the query (e.g. `?q=fc&category=Football&sort=late` → 6 results, none → empty state).
- FAQ: search "password" → 1 question; a nonsense word → no-match state; category card scrolls to and opens its group.
- Keyboard: every interactive element reachable by Tab shows a visible gold focus ring.
- Image frames measured: all event frames are 2.689 (1210/450).

---

## 13. Image mapping

Every image was renamed to a readable slug. Each file below was downloaded from the original live URL in the last column.

- `events/` — card posters (also the event page poster).
- `banners/` — the 1210×450 hero slides. The artwork is the same as the matching event poster, kept as a separate file so the hero and the cards can change independently.

| New file (under `assets/images/`) | What it is | Original live URL |
|---|---|---|
| `events/klub-600-2026-lede-aansluiting-hernuwing.jpg` | Klub 600 2026 - Lede Aansluiting / Hernuwing | https://d3fchakcenee6k.cloudfront.net/storage/445/image-%287%29.jpg |
| `events/orlando-pirates-fc-2026-27-season-ticket.jpg` | Orlando Pirates FC 2026/27 Season Ticket | https://d3fchakcenee6k.cloudfront.net/storage/624/OPFC-TICKET-%281210x450%29.jpg |
| `events/the-sa-4x4-and-outdoor-show-weekend.jpg` | The SA 4X4 and Outdoor Show WEEKEND | https://d3fchakcenee6k.cloudfront.net/storage/285/SA_4x4_OS_WK_Weekend_1210x450px_2026_1.jpg |
| `events/the-sa-4x4-and-outdoor-show-sun.jpg` | The SA 4X4 and Outdoor Show SUN | https://d3fchakcenee6k.cloudfront.net/storage/284/SA_4x4_OS_WK_25_Okt_1210x450px_2026_1.jpg |
| `events/kruger-united-fc-vs-amazulu-fc.jpg` | Kruger United FC vs Amazulu FC (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3664/1210-X-450-Mbombela.jpg |
| `events/sekhukhune-united-fc-vs-richards-bay-fc.jpg` | Sekhukhune United FC vs Richards Bay FC (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3660/1210-X-450-New-Peter-Mokaba.jpg |
| `events/isr-massa-aflos.jpg` | ISR Massa Aflos | https://d3fchakcenee6k.cloudfront.net/storage/3588/ISR-2026-TICKET-BANNER-1210X450-MASSA-AFLOS-450.jpg |
| `events/kaizer-chiefs-vs-ts-galaxy-fc.jpg` | Kaizer Chiefs vs TS Galaxy FC (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3666/1210-X-450-FNB.jpg |
| `banners/kaizer-chiefs-vs-ts-galaxy-fc-banner.jpg` | Kaizer Chiefs vs TS Galaxy FC (CKC) (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/3666/1210-X-450-FNB.jpg |
| `events/mamelodi-sundowns-vs-marumo-gallants.jpg` | Mamelodi Sundowns vs Marumo Gallants (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3698/1210-X-450-Loftus-%28Mamelodi-vs-Marumo%29.jpg |
| `banners/mamelodi-sundowns-vs-marumo-gallants-banner.jpg` | Mamelodi Sundowns vs Marumo Gallants (CKC) (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/3698/1210-X-450-Loftus-%28Mamelodi-vs-Marumo%29.jpg |
| `events/orlando-pirates-vs-milford-fc.jpg` | Orlando Pirates vs Milford FC (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3700/1210-X-450-Orlando-Amstel-Arena.jpg |
| `banners/orlando-pirates-vs-milford-fc-banner.jpg` | Orlando Pirates vs Milford FC (CKC) (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/3700/1210-X-450-Orlando-Amstel-Arena.jpg |
| `events/durban-city-fc-vs-stellenbosch-fc.jpg` | Durban City FC vs Stellenbosch FC (CKC) | https://d3fchakcenee6k.cloudfront.net/storage/3670/1210-X-450-Chatsworth.jpg |
| `banners/durban-city-fc-vs-stellenbosch-fc-banner.jpg` | Durban City FC vs Stellenbosch FC (CKC) (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/3670/1210-X-450-Chatsworth.jpg |
| `events/isr-sewes-en-hoops.png` | ISR Sewes en Hoops | https://d3fchakcenee6k.cloudfront.net/storage/3765/ISR-2026-TICKET-BANNER-Landloop-1370-x-550.png |
| `events/kempiefees-2026.jpg` | KempieFees 2026 | https://d3fchakcenee6k.cloudfront.net/storage/301/KempieFees-Banner-2026-05-22-Factory.jpg |
| `events/mamelodi-sundowns-vs-durban-city.jpg` | Mamelodi Sundowns vs Durban City | https://d3fchakcenee6k.cloudfront.net/storage/3725/MSFC-v-DCFC-31-Oct-2026-Banner.jpg |
| `banners/mamelodi-sundowns-vs-durban-city-banner.jpg` | Mamelodi Sundowns vs Durban City (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/3725/MSFC-v-DCFC-31-Oct-2026-Banner.jpg |
| `events/appel-in-pe.png` | Appel in PE | https://d3fchakcenee6k.cloudfront.net/storage/463/AOT-OPEN-TICKETS-BANNER-%281210-x-450-px%29.png |
| `banners/appel-in-pe-banner.png` | Appel in PE (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/463/AOT-OPEN-TICKETS-BANNER-%281210-x-450-px%29.png |
| `events/going-back-west.png` | Going Back West | https://d3fchakcenee6k.cloudfront.net/storage/440/Ticket-Banner-2.png |
| `banners/going-back-west-banner.png` | Going Back West (hero banner) | https://d3fchakcenee6k.cloudfront.net/storage/440/Ticket-Banner-2.png |
| `events/black-swan-africa-extravaganza.png` | Black Swan Africa Extravaganza | https://d3fchakcenee6k.cloudfront.net/storage/825/Black-Swan-Banner-1210-x-450.png |
| `events/prg-senior-old-boys-ete-lunch-2026.png` | PRG Senior Old Boys Ete / Lunch 2026 | https://d3fchakcenee6k.cloudfront.net/storage/3759/Senior-Old-Boys-Lunch-Header.png |
| `events/help24-somer-fees.png` | Help24 Somer Fees | https://d3fchakcenee6k.cloudfront.net/storage/1078/Help24-Banner.png |
| `banners/faq-hero.png` | FAQ page hero | https://opentickets.co.za/images/hero-faqs.png |
| `logo/logo-icon.png` | Open Tickets logo (white, transparent) | https://opentickets.co.za/themes/bookishow/logo-icon.png |
