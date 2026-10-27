/* DEMO ONLY — already provided by the live site, do not deploy.
 * ---------------------------------------------------------------------------
 * search-shim.js — stands in for the inline script in the live theme.
 * The static demo has no Livewire, so nothing dispatches "filter-grid".
 * This mirrors the live behaviour exactly: the event fires with the query
 * string when it is 3+ characters or empty (the live site uses "keyup"; we
 * listen to "input" so paste / cut / clear-button also work).
 * It also intercepts the search form submit and goes to search.html?q=<query> so Enter
 * works locally (the real form action="/search" is left untouched).
 * The production files (main.js, search.js, faq.js) never depend on this.
 */
(function () {
  'use strict';
  function init() {
    var input = document.getElementById('nav-search-input');
    if (!input) return;
    /* Enter / the search button: the live form posts GET /search; locally go to search.html?q=... */
    if (input.form) {
      input.form.addEventListener('submit', function (e) {
        e.preventDefault();
        window.location.href = 'search.html?q=' + encodeURIComponent(input.value.trim());
      });
    }

    input.addEventListener('input', function (e) {
      var query = e.target.value;
      if (query.length >= 3 || query.length === 0) {
        window.dispatchEvent(new CustomEvent('filter-grid', { detail: query }));
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
