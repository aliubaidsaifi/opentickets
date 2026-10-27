/* DEMO ONLY — already provided by the live site, do not deploy.
 * ---------------------------------------------------------------------------
 * search-results-demo.js — stands in for the Laravel/Livewire search backend.
 * Reads ?q= from the URL (default "chiefs"), filters the 19 real events from
 * events-data.js by name / venue (lowercase "includes", like the live filter),
 * and renders the cards into the original #events-grid. It also toggles the
 * designed empty state and keeps the heading, count and search box in sync.
 * It runs BEFORE Alpine starts, so Isotope is created on the final cards.
 * All user-facing wording lives in the HTML (data-* attributes on the heading).
 */
(function () {
  'use strict';

  var DEFAULT_QUERY = 'chiefs';   // matches the static markup in search.html
  var PAGE_SIZE = 6;              // demo page size (production: your Laravel paginate(n))
  var events = window.OT_DEMO_EVENTS || [];
  var params = new URLSearchParams(window.location.search);
  var query = params.has('q') ? params.get('q').trim() : DEFAULT_QUERY;
  var needle = query.toLowerCase();

  var grid = document.getElementById('events-grid');
  var results = document.getElementById('otr-results');
  var empty = document.getElementById('otr-empty');
  var title = document.getElementById('otr-results-title');
  if (!grid || !title) return;

  var matches = events.filter(function (e) {
    return !needle || e.name.indexOf(needle) !== -1 || e.venue.indexOf(needle) !== -1;
  });

  // paging: ?page=N
  var total = matches.length;
  var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  var page = Math.min(pages, Math.max(1, parseInt(params.get('page'), 10) || 1));
  var shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // results
  grid.innerHTML = shown.map(function (e) { return e.html; }).join('');
  if (results) results.hidden = matches.length === 0;
  if (empty) empty.hidden = matches.length !== 0;

  // heading: "N result(s) for “query”" / "No results for “query”"
  var n = total;
  if (!query && n) {
    title.textContent = n + ' ' + title.getAttribute('data-all');          // empty search = all events
  } else {
    var text = n === 0
      ? title.getAttribute('data-none')
      : n + ' ' + (n === 1 ? title.getAttribute('data-one') : title.getAttribute('data-many'));
    title.textContent = text + ' “' + query + '”';
  }
  document.title = title.textContent + ' — Open Tickets';

  // search box + any "query" placeholders
  var input = document.getElementById('otr-search-input');
  if (input) input.value = query;
  Array.prototype.forEach.call(document.querySelectorAll('[data-otr-query]'), function (el) { el.textContent = query; });

  // pagination (only when there is more than one page)
  var nav = document.getElementById('otr-pagination');
  if (nav && pages > 1) {
    var link = function (p) { return 'search.html?q=' + encodeURIComponent(query) + '&page=' + p; };
    var item = function (cls, inner) { return '<li class="page-item ' + cls + '">' + inner + '</li>'; };
    var chevron = function (dir) { return '<i class="fas fa-chevron-' + dir + ' fa-sm" aria-hidden="true"></i>'; };
    var html = '';
    html += page > 1
      ? item('', '<a class="page-link" href="' + link(page - 1) + '" aria-label="' + nav.getAttribute('data-prev') + '">' + chevron('left') + '</a>')
      : item('disabled', '<span class="page-link" aria-disabled="true" aria-label="' + nav.getAttribute('data-prev') + '">' + chevron('left') + '</span>');
    for (var p = 1; p <= pages; p++) {
      var label = nav.getAttribute('data-page') + ' ' + p;
      html += p === page
        ? item('active', '<span class="page-link" aria-current="page" aria-label="' + label + '">' + p + '</span>')
        : item('', '<a class="page-link" href="' + link(p) + '" aria-label="' + label + '">' + p + '</a>');
    }
    html += page < pages
      ? item('', '<a class="page-link" href="' + link(page + 1) + '" aria-label="' + nav.getAttribute('data-next') + '">' + chevron('right') + '</a>')
      : item('disabled', '<span class="page-link" aria-disabled="true" aria-label="' + nav.getAttribute('data-next') + '">' + chevron('right') + '</span>');
    nav.querySelector('[data-otr-pages]').innerHTML = html;
    nav.querySelector('[data-otr-info]').textContent = nav.getAttribute('data-info')
      .replace('{from}', (page - 1) * PAGE_SIZE + 1).replace('{to}', Math.min(total, page * PAGE_SIZE)).replace('{total}', total);
    nav.hidden = false;
  }

  // the page form: Enter goes to search.html?q=... (the real form posts GET /search)
  var form = document.querySelector('[data-otr-search-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.href = 'search.html?q=' + encodeURIComponent(input.value.trim());
    });
  }
})();
