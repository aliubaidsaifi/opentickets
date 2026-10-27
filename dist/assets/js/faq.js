/* ==========================================================================
   faq.js — FAQ page behaviour (live search, category cards). Vanilla JS.
   --------------------------------------------------------------------------
   Load with `defer` after main.js. Works with the Bootstrap 5 accordion markup
   in faqs.html: [data-faq-group] sections that contain [data-faq-item] items.
   No dependency on Alpine, jQuery or the demo shims.
   ========================================================================== */
(function () {
  'use strict';

  var OT = (window.OT = window.OT || {});

  OT.faq = {
    input: null,
    status: null,
    empty: null,
    groups: [],

    init: function () {
      this.input = document.getElementById('otr-faq-search');
      if (!this.input) return;
      this.status = document.getElementById('otr-faq-status');
      this.empty = document.getElementById('otr-faq-empty');
      this.groups = Array.prototype.slice.call(document.querySelectorAll('[data-faq-group]'));

      this.input.addEventListener('input', this.filter.bind(this));
      this.bindClear();
      this.bindCategoryCards();
      this.openFromHash();
    },

    /* ---------- live search: question + answer text, case-insensitive ---------- */
    filter: function () {
      var q = this.input.value.trim().toLowerCase();
      var total = 0;

      this.groups.forEach(function (group) {
        var visible = 0;
        group.querySelectorAll('[data-faq-item]').forEach(function (item) {
          var match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
          item.hidden = !match;
          if (match) visible++;
        });
        group.hidden = visible === 0;
        total += visible;
      });

      if (this.empty) {
        this.empty.hidden = total !== 0;
        var word = this.empty.querySelector('[data-faq-query]');
        if (word) word.textContent = this.input.value.trim();
      }
      if (this.status) {
        this.status.textContent = !q ? '' : total + (total === 1 ? ' question found' : ' questions found');
      }
      var clear = document.querySelector('[data-faq-clear]');
      if (clear) clear.hidden = !this.input.value;
    },

    bindClear: function () {
      var self = this;
      document.querySelectorAll('[data-faq-clear]').forEach(function (btn) {
        btn.hidden = !self.input.value;
        btn.addEventListener('click', function () {
          self.input.value = '';
          self.filter();
          self.input.focus();
        });
      });
    },

    /* ---------- category cards: scroll to the group and open its first question ---------- */
    bindCategoryCards: function () {
      var self = this;
      document.querySelectorAll('[data-faq-target]').forEach(function (card) {
        card.addEventListener('click', function (e) {
          e.preventDefault();
          self.goTo(card.getAttribute('data-faq-target'), true);
        });
      });
    },

    goTo: function (id, updateHash) {
      var group = document.getElementById(id);
      if (!group) return;
      if (this.input && this.input.value) {          // a search hides groups; clear it first
        this.input.value = '';
        this.filter();
      }
      var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      group.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });

      var first = group.querySelector('.accordion-collapse');
      if (first && window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(first, { toggle: false }).show();

      var title = group.querySelector('[data-faq-title]');
      if (title) title.focus({ preventScroll: true });
      if (updateHash && window.history && history.replaceState) history.replaceState(null, '', '#' + id);
    },

    openFromHash: function () {
      var id = window.location.hash.replace('#', '');
      if (id && document.querySelector('[data-faq-group]#' + id)) {
        var self = this;
        window.setTimeout(function () { self.goTo(id, false); }, 0);
      }
    }
  };

  function init() { OT.faq.init(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
