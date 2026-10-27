# Open Tickets — Elegant Theme Redesign (Freelancer contest entry)

## Role
You are a senior front-end engineer and UI designer with 15+ years of experience building production theme kits that other developers drop into existing CMS themes. Quality bar: an entry that wins against 500+ competitors because it is the most premium-looking AND the safest, most drop-in-ready for the client's developers.

## The client
- Site: opentickets.co.za — South African event ticketing (football / Carling Knockout Cup, school events, festivals, Afrikaans shows). Prices in Rand. Content mixes English and Afrikaans.
- Client: technical owner in Pretoria who will hand our files to his developers. He values clean, drop-in code as much as looks.
- Prize: $500 now + the same fee again for a follow-up project (extra pages + an interactive seating map for "Appel – soos net hy kan").

## The brief (client's requirements)
- Full visual refresh that feels PREMIUM and ELEGANT while long-time buyers still feel at home.
- Use the current logo, event images and banners. Keep the familiar event cards and event-detail layouts so returning users recognise them instantly.
- Screens to supply: Home, FAQs, Event detail, Search-results listing.
- Home: featured events and large hero banners must dominate above the fold. The existing Isotope filter stays exactly where and how it works today.
- Responsive HTML, CSS (Bootstrap 5) and lightweight JavaScript. Images, icons and fonts organised in clear asset folders so their devs can drop files straight into a theme.
- Top navigation fixed and shrinks on scroll, unless we present a markedly better approach that still respects usability.

## Client feedback (hard requirements)
The client left this feedback on other entries. Treat every point as a hard requirement for ours:
1. "I really like this [navy + gold design], but you have to add event page, FAQ, etc. and you must use the existing logo. Just edit the white version to the same gold as your design. Add images so they can be visible to our poll participants."
2. "You must use the existing aspect ratio for event images. Our customers always supply a 1210x450 banner image of which we make smaller versions."
3. "Design this with a top menu." (said to an entry that kept the sidebar)

What this means for us:
- Navy + gold is liked: gold is a real presence, not a whisper. Gold logo (the existing white logo recoloured to our gold token), gold primary call-to-action buttons with navy text, gold nav underline, gold focus rings, gold hero dots.
- Every event image frame is exactly 1210:450 (`aspect-ratio: 1210 / 450`) so a standard client banner fills it with no letterboxing. Blurred-fill fallback only for non-standard images; never crop.
- Top menu only. No sidebar on desktop; the offcanvas exists on mobile only.
- All pages (Home, Event, FAQs, Search) and real event images must be present in the demo.

## Acceptance criteria (every one must pass)
1. Pixel-perfect across modern desktop and mobile breakpoints (1440, 1280, 1024, 768, 390, 360 px). No horizontal scroll.
2. Isotope filtering functions untouched.
3. No external frameworks beyond vanilla JS/CSS unless pre-approved (only libraries the live site already uses are allowed — see below).
4. All text and colours easy to retheme later through variables.
5. Clean, production-ready code and assets.

## Reference files (source of truth)
/reference contains the live site's real HTML:
- reference/current-home.html
- reference/current-event.html
- reference/current-faq.html
- reference/current-search.html
Read them before building any page. Never edit anything in /reference.

Live stack: Laravel + Livewire + Alpine.js, theme "bookishow" (Osahan template, Bootstrap 4 / SB Admin 2 based), Slick slider, Font Awesome 5. Our output must be easy to port back into that theme.

## How the current Isotope filter works (preserve exactly)
- It is SEARCH-DRIVEN, not category buttons.
- Typing in the top-nav search input (id="nav-search-input", name="q", inside the form with action="/search") dispatches a window CustomEvent "filter-grid" whose detail is the query string.
- The grid container id="events-grid" has an Alpine x-data with initIsotope() and filter(query). Isotope options: itemSelector '.grid-item', layoutMode 'fitRows'.
- With a query of 3+ characters it shows only items whose data-name or data-venue (lowercase) includes the query; under 3 characters it shows everything.
- The hero slider wrapper has x-data="{ show: true }" with x-on:filter-grid.window="show = ($event.detail.length < 3)", x-show, x-collapse and x-transition — the hero collapses while the user is filtering.

### Isotope rules
- Copy the Alpine attributes on #events-grid and on the hero wrapper CHARACTER FOR CHARACTER from reference/current-home.html. Never edit them.
- Keep: id="events-grid", class "grid-item" on every card column, lowercase data-name and data-venue, id="nav-search-input", name="q", the search form action.
- Keep the original theme classes alongside ours: .osahan-slider, .osahan-slider-item, .e-card, .m-card-cover.
- Restyle with CSS only. Do NOT put gap, grid, flex, or transform on #events-grid or .grid-item (Isotope uses absolute positioning with fitRows). Use padding on columns for gutters. Hover effects go on an inner element, never on .grid-item itself.
- Test every time: typing "chiefs" or "fnb" filters the grid and collapses the hero; clearing the box restores everything.

## Dependencies
Allowed (the live site already loads them):
- Bootstrap 5.3 (upgrade from 4 — required by the brief)
- Alpine.js + @alpinejs/collapse, Isotope, jQuery + Slick, Font Awesome 5
Not allowed: React, Vue, Tailwind, GSAP, Swiper, AOS, icon/font CDNs, or any other new library.

Everything is served locally — no CDN links in the final HTML.

The static demo has no Livewire, so assets/js/demo/ holds Alpine + collapse, Isotope, jQuery + Slick, and search-shim.js (dispatches "filter-grid" from #nav-search-input on input). Label each of these "DEMO ONLY — already provided by the live site, do not deploy". Our own production files must not depend on the shim.

Bootstrap 4 → 5: convert classes (ml-/mr- → ms-/me-, pl-/pr- → ps-/pe-, no-gutters → g-0, data-toggle → data-bs-toggle, text-left → text-start, float-left → float-start, font-weight-bold → fw-bold, etc.) and record every conversion in the README migration table.

## Current layout (keep it recognisable)
- Dark collapsed left sidebar (Events, FAQs, Support, My Account; Search on mobile) and a dark top bar with search and a language dropdown (English, Afrikaans, isiZulu, isiXhosa, Sesotho, Deutsch, Français, Español, Português).
- Home: Slick hero of 1210x450 banners with the next slide peeking, an "Events" heading, then 3-column event cards.
- Event card: poster on top (135px tall, object-fit contain, light background), date block on the left (red bold day number, muted month), event title, venue with map pin, datetime like "2026-10-27, 19:00".
- Dark footer: Get In Touch (Instagram, LinkedIn, Facebook, WhatsApp), Support (Support, CMS Plugins, FAQs), Legal (Privacy Policy, Terms and Conditions), Language. "© 2024-2026 - Open Tickets - All rights reserved." Floating chat button bottom-right.
- Admin-only items (Customers) are left out of the public design.

## Navigation decision
Replace sidebar + top bar with ONE fixed top nav that shrinks on scroll:
logo | prominent search (#nav-search-input stays the live filter) | Events, FAQs, Support | language dropdown | My Account button.
Mobile: logo + search toggle + hamburger opening a Bootstrap offcanvas with the same links.
Shrink: reduced height, smaller logo, backdrop blur + shadow, using one passive scroll listener + requestAnimationFrame. Respect prefers-reduced-motion. Explain this choice in the README.

## Design direction — premium, elegant, familiar
- Palette refined from the current brand: deep navy/charcoal for nav and footer, warm ivory page background, white cards, the current red refined to a rich crimson for dates and primary buttons, a restrained muted gold for small highlights. WCAG AA contrast minimum.
- Type: an elegant display serif for headings (Playfair Display or Cormorant Garamond) + a clean sans for UI and body (Inter or Manrope). Self-hosted woff2 in assets/fonts/.
- 8px spacing scale, 12–16px radius, soft layered shadows, hairline borders, generous whitespace.
- Motion: subtle and fast — card lift on hover, slight image zoom inside its frame, gentle fades. Nothing flashy.
- Posters contain text, so NEVER crop them: object-fit contain inside a fixed-ratio frame, with the same image blurred and darkened behind it as the fill (CSS only).
- Date block: stacked, large serif day number in crimson, small-caps month, thin divider.
- Home above the fold at 1440x900: hero AND a featured-events strip must both be visible. Cap the hero height, keep the 1210x450 ratio.

## Variables
- All colours, fonts, font sizes, radii, shadows and spacing are CSS custom properties in assets/css/variables.css.
- No hard-coded colour values anywhere else (must be provable with grep).
- A commented alternative palette at the bottom of variables.css proves one-file retheming.
- User-facing text lives only in the HTML, clean and easy to find.

## Pages
1. index.html — Home: fixed nav, hero (Slick inside the original Alpine collapse wrapper), featured strip, "Events" heading, #events-grid with the original Alpine/Isotope attributes and every real event from current-home.html, footer, chat button.
2. event.html — follow current-event.html: same information and order, elevated. Sticky purchase panel on desktop / sticky bottom bar on mobile only if it keeps the familiar structure. Empty, commented <!-- SEATING MAP SLOT --> container for the follow-up project. Content: Appel in PE (Boardwalk Hotel and Casino, 6 Nov 2026).
3. faqs.html — follow current-faq.html; keep the real questions and answers word for word. Elegant header, live FAQ search (vanilla JS) with a no-match state, Bootstrap 5 accordion, "Still need help?" block.
4. search.html — follow current-search.html: search bar pre-filled with "chiefs", "X results for 'chiefs'", sort, results reusing the exact card component, and a designed empty state.
If a reference file doesn't contain what a page needs, ask before inventing structure.

## Folder structure
/
├── index.html
├── event.html
├── faqs.html
├── search.html
├── README.md
├── CLAUDE.md
├── reference/            (original HTML, never edited)
├── tools/                (dev-only scripts, not delivered)
├── presentation/         (contest images, not delivered)
└── assets/
    ├── css/
    │   ├── variables.css
    │   ├── base.css
    │   ├── components.css
    │   └── pages.css
    ├── js/
    │   ├── main.js        (nav shrink, offcanvas, helpers)
    │   ├── faq.js
    │   ├── search.js
    │   └── demo/          (DEMO ONLY: alpine, collapse, isotope, jquery, slick, search-shim.js)
    ├── vendor/            (bootstrap 5.3, font-awesome 5)
    ├── images/
    │   ├── logo/
    │   ├── banners/
    │   └── events/
    └── fonts/

## Code quality rules
- New classes use the "otr-" prefix + BEM (.otr-card, .otr-card__date, .otr-nav--shrunk). The live site already uses "ot-" (e.g. ot-chatbot__launcher), so we must never use "ot-". Keep the chat button's original class alongside ours.
- Comment every CSS section and component with a header block.
- JS: small named functions under one namespace object (window.OT). All scripts deferred.
- Accessibility: semantic landmarks, alt text, visible focus states, aria-labels on icon buttons, keyboard-accessible menus, carousel and accordion.
- Performance: loading="lazy" + width/height on below-the-fold images, no unused files.
- Zero console errors, valid HTML.

## README.md must cover
- Folder overview
- How to retheme via variables.css
- How to port each component back into the bookishow Blade views
- BS4 → BS5 class migration table
- Proof that the Isotope/Alpine markup is unchanged, with the exact selectors listed
- Which files are DEMO ONLY
- Where the seating-map slot is

## Working rules
- Work one step at a time, exactly as I ask in each message. Don't jump ahead to other pages.
- After building anything, test it in the browser at the listed breakpoints and report pass/fail honestly.
- If something in the brief conflicts or is unclear, ask me instead of guessing.