/* DEMO ONLY — already provided by the live site, do not deploy.
 * ---------------------------------------------------------------------------
 * search-results-demo.js — stands in for the Laravel/Livewire search backend.
 * Reads the URL parameters
 *     ?q=<text>  &date=YYYY-MM  &venue=<name>  &category=<name>  &sort=soon|late|az  &page=N
 * filters the 19 real events from events-data.js (q matches name or venue, lowercase "includes", like
 * the live filter), sorts, pages (6 per page) and renders the cards into the original #events-grid.
 * It also fills the filter dropdown menus, toggles the designed empty state and keeps the heading,
 * count and search box in sync. It runs BEFORE Alpine starts, so Isotope is created on the final cards.
 * All user-facing wording lives in the HTML (data-* attributes).
 */
(function () {
  'use strict';

  var DEFAULT_QUERY = 'chiefs';   // matches the static markup in search.html
  var PAGE_SIZE = 6;              // demo page size (production: your Laravel paginate(n))
  var events = window.OT_DEMO_EVENTS || [];
  var params = new URLSearchParams(window.location.search);
  var query = params.has('q') ? params.get('q').trim() : DEFAULT_QUERY;
  var needle = query.toLowerCase();
  var f = {
    date: params.get('date') || '',
    venue: params.get('venue') || '',
    category: params.get('category') || '',
    sort: params.get('sort') || 'soon'
  };

  var grid = document.getElementById('events-grid');
  var results = document.getElementById('otr-results');
  var empty = document.getElementById('otr-empty');
  var title = document.getElementById('otr-results-title');
  if (!grid || !title) return;

  /* ---------- filter + sort ---------- */
  var matches = events.filter(function (e) {
    return (!needle || e.name.indexOf(needle) !== -1 || e.venue.indexOf(needle) !== -1) &&
      (!f.date || e.date.slice(0, 7) === f.date) &&
      (!f.venue || e.place === f.venue) &&
      (!f.category || e.cat === f.category);
  });
  if (f.sort === 'late') matches.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  else if (f.sort === 'az') matches.sort(function (a, b) { return a.name.localeCompare(b.name); });
  else matches.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  /* ---------- paging ---------- */
  var total = matches.length;
  var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  var page = Math.min(pages, Math.max(1, parseInt(params.get('page'), 10) || 1));
  var shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  grid.innerHTML = shown.map(function (e) { return e.html; }).join('');
  if (results) results.hidden = total === 0;
  if (empty) empty.hidden = total !== 0;

  /* ---------- heading ---------- */
  var filtered = !!(f.date || f.venue || f.category);
  if (!query) {
    title.textContent = total === 0 ? title.getAttribute('data-none-all')
      : total + ' ' + (total === 1 ? title.getAttribute('data-all-one') : title.getAttribute('data-all'));
  } else {
    var text = total === 0
      ? title.getAttribute('data-none')
      : total + ' ' + (total === 1 ? title.getAttribute('data-one') : title.getAttribute('data-many'));
    title.textContent = text + ' “' + query + '”';
  }
  document.title = title.textContent + ' — Open Tickets';

  var input = document.getElementById('otr-search-input');
  if (input) input.value = query;
  Array.prototype.forEach.call(document.querySelectorAll('[data-otr-query]'), function (el) { el.textContent = query; });
  var emptyText = document.querySelector('.otr-empty__text[data-generic]');
  if (emptyText && (!query || filtered) && total === 0) emptyText.textContent = emptyText.getAttribute('data-generic');

  /* ---------- links keep every parameter ---------- */
  function link(over) {
    var p = { q: query, date: f.date, venue: f.venue, category: f.category, sort: f.sort, page: '' };
    for (var k in over) p[k] = over[k];
    var qs = [];
    ['q', 'date', 'venue', 'category', 'sort', 'page'].forEach(function (key) {
      var v = p[key];
      if (key === 'q' || (v && !(key === 'sort' && v === 'soon') && !(key === 'page' && String(v) === '1'))) {
        qs.push(key + '=' + encodeURIComponent(v));
      }
    });
    return 'search.html?' + qs.join('&');
  }

  /* ---------- filter chips ---------- */
  function uniq(list) { return list.filter(function (v, i) { return list.indexOf(v) === i; }); }
  function monthName(ym) {
    var p = ym.split('-');
    return new Date(+p[0], +p[1] - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  }
  var choices = {
    date: uniq(events.map(function (e) { return e.date.slice(0, 7); })).sort().map(function (v) { return [v, monthName(v)]; }),
    venue: uniq(events.map(function (e) { return e.place; })).sort().map(function (v) { return [v, v]; }),
    category: uniq(events.map(function (e) { return e.cat; })).sort().map(function (v) { return [v, v]; })
  };

  function fillMenu(key, opts, current, anyLabel, anyLink) {
    var ul = document.querySelector('[data-otr-menu="' + key + '"]');
    if (!ul) return;
    var html = '';
    if (anyLabel) html += '<li><a class="dropdown-item' + (!current ? ' active' : '') + '" href="' + anyLink + '">' + anyLabel + '</a></li>';
    opts.forEach(function (o) {
      html += '<li><a class="dropdown-item' + (o[0] === current ? ' active' : '') + '" href="' + link(o[2]) + '"' + (o[0] === current ? ' aria-current="true"' : '') + '>' + o[1] + '</a></li>';
    });
    ul.innerHTML = html;
  }
  function setChip(key, text, on) {
    var chip = document.querySelector('[data-otr-chip="' + key + '"]');
    if (!chip) return;
    chip.querySelector('span').textContent = text;
    chip.classList.toggle('is-active', !!on);
  }

  ['date', 'venue', 'category'].forEach(function (key) {
    var ul = document.querySelector('[data-otr-menu="' + key + '"]');
    if (!ul) return;
    var opts = choices[key].map(function (c) { var o = {}; o[key] = c[0]; return [c[0], c[1], o]; });
    var anyOver = {}; anyOver[key] = '';
    fillMenu(key, opts, f[key], ul.getAttribute('data-any'), link(anyOver));
    var chip = document.querySelector('[data-otr-chip="' + key + '"]');
    var label = chip ? chip.getAttribute('data-label') : key;
    var current = choices[key].filter(function (c) { return c[0] === f[key]; })[0];
    setChip(key, current ? label + ' · ' + current[1] : label, !!current);
  });

  var sortUl = document.querySelector('[data-otr-menu="sort"]');
  if (sortUl) {
    var options = sortUl.getAttribute('data-options').split('|').map(function (s) { var p = s.split(':'); return [p[0], p[1], { sort: p[0] }]; });
    fillMenu('sort', options, f.sort, '', '');
    var cur = options.filter(function (o) { return o[0] === f.sort; })[0] || options[0];
    setChip('sort', 'Sort: ' + cur[1], false);
  }

  var all = document.querySelector('[data-otr-all]');
  if (all) {
    all.href = link({ date: '', venue: '', category: '', sort: 'soon' });
    all.classList.toggle('is-active', !filtered);
  }

  /* ---------- pagination (only when there is more than one page) ---------- */
  var nav = document.getElementById('otr-pagination');
  if (nav && pages > 1) {
    var item = function (cls, inner) { return '<li class="page-item ' + cls + '">' + inner + '</li>'; };
    var chevron = function (dir) { return '<i class="fas fa-chevron-' + dir + ' fa-sm" aria-hidden="true"></i>'; };
    var html = '';
    html += page > 1
      ? item('', '<a class="page-link" href="' + link({ page: page - 1 }) + '" aria-label="' + nav.getAttribute('data-prev') + '">' + chevron('left') + '</a>')
      : item('disabled', '<span class="page-link" aria-disabled="true" aria-label="' + nav.getAttribute('data-prev') + '">' + chevron('left') + '</span>');
    for (var p = 1; p <= pages; p++) {
      var label = nav.getAttribute('data-page') + ' ' + p;
      html += p === page
        ? item('active', '<span class="page-link" aria-current="page" aria-label="' + label + '">' + p + '</span>')
        : item('', '<a class="page-link" href="' + link({ page: p }) + '" aria-label="' + label + '">' + p + '</a>');
    }
    html += page < pages
      ? item('', '<a class="page-link" href="' + link({ page: page + 1 }) + '" aria-label="' + nav.getAttribute('data-next') + '">' + chevron('right') + '</a>')
      : item('disabled', '<span class="page-link" aria-disabled="true" aria-label="' + nav.getAttribute('data-next') + '">' + chevron('right') + '</span>');
    nav.querySelector('[data-otr-pages]').innerHTML = html;
    nav.querySelector('[data-otr-info]').textContent = nav.getAttribute('data-info')
      .replace('{from}', (page - 1) * PAGE_SIZE + 1).replace('{to}', Math.min(total, page * PAGE_SIZE)).replace('{total}', total);
    nav.hidden = false;
  }

  /* ---------- the page form: Enter keeps the filters and goes to search.html?q=... ---------- */
  var form = document.querySelector('[data-otr-search-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.href = link({ q: input.value.trim(), page: '' });
    });
  }
})();
