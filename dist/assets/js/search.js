/* ==========================================================================
   search.js — search results page helpers. Vanilla JS, no dependencies.
   --------------------------------------------------------------------------
   Shows a clear (x) button inside the page search box while it has text.
   The results themselves come from the server in production (the existing
   Livewire search); nothing here depends on the demo files.
   ========================================================================== */
(function () {
  'use strict';

  var OT = (window.OT = window.OT || {});

  OT.search = {
    init: function () {
      var input = document.getElementById('otr-search-input');
      var clear = document.querySelector('[data-otr-clear]');
      if (!input || !clear) return;

      function sync() { clear.hidden = !input.value; }
      input.addEventListener('input', sync);
      clear.addEventListener('click', function () {
        input.value = '';
        sync();
        input.focus();
      });
      sync();
    }
  };

  function init() { OT.search.init(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
