/* ==========================================================================
   main.js — Open Tickets "Elegant" theme kit
   --------------------------------------------------------------------------
   Everything lives under window.OT. Load with `defer`. No dependencies.
   Bootstrap 5 handles the offcanvas and dropdowns (data-bs-* attributes).
   Does NOT touch Alpine / Isotope / #events-grid in any way.
   ========================================================================== */
(function () {
  'use strict';

  var OT = (window.OT = window.OT || {});

  /* ------------------------------------------------------------------------
     OT.nav — fixed top nav that shrinks on scroll, plus the mobile search
     toggle. One passive scroll listener, throttled with requestAnimationFrame.
     ------------------------------------------------------------------------ */
  OT.nav = {
    threshold: 24,          // px scrolled before the nav shrinks
    el: null,
    ticking: false,

    init: function () {
      this.el = document.getElementById('otr-nav');
      if (!this.el) return;
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      this.update();
      this.bindSearchToggle();
    },

    onScroll: function () {
      if (this.ticking) return;
      this.ticking = true;
      window.requestAnimationFrame(this.update.bind(this));
    },

    update: function () {
      this.ticking = false;
      this.el.classList.toggle('otr-nav--shrunk', window.scrollY > this.threshold);
    },

    /* Below lg the search form is a drawer under the bar. */
    bindSearchToggle: function () {
      var toggle = document.getElementById('otr-search-toggle');
      var form = document.getElementById('otr-nav-search');
      var input = document.getElementById('nav-search-input');
      if (!toggle || !form) return;

      function setOpen(open) {
        form.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (open && input) input.focus();
      }
      toggle.addEventListener('click', function () {
        setOpen(!form.classList.contains('is-open'));
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && form.classList.contains('is-open')) {
          setOpen(false);
          toggle.focus();
        }
      });
    }
  };

  /* ------------------------------------------------------------------------
     OT.menu — the offcanvas menu is a MOBILE pattern only (below lg). If it is
     open and the viewport grows to desktop, close it so no sidebar ever shows.
     ------------------------------------------------------------------------ */
  OT.menu = {
    query: '(min-width: 992px)',

    init: function () {
      var el = document.getElementById('otr-offcanvas');
      if (!el || !window.matchMedia || !window.bootstrap) return;
      window.matchMedia(this.query).addEventListener('change', function (e) {
        if (!e.matches) return;
        var instance = window.bootstrap.Offcanvas.getInstance(el);
        if (instance) instance.hide();
      });
    }
  };

  /* ------------------------------------------------------------------------
     OT.share — share buttons on the event page.
     Links carry a template in data-share ({url}, {title} are filled in at run time) so the same
     markup works on any event URL. [data-copy-link] copies the page address.
     ------------------------------------------------------------------------ */
  OT.share = {
    init: function () {
      var links = document.querySelectorAll('[data-share]');
      if (!links.length && !document.querySelector('[data-copy-link]')) return;

      var heading = document.querySelector('h1');
      var url = encodeURIComponent(window.location.href);
      var title = encodeURIComponent(heading ? heading.textContent.trim() : document.title);
      Array.prototype.forEach.call(links, function (a) {
        a.href = a.getAttribute('data-share').replace('{url}', url).replace('{title}', title);
      });

      Array.prototype.forEach.call(document.querySelectorAll('[data-copy-link]'), function (btn) {
        btn.addEventListener('click', function () { OT.share.copy(btn); });
      });
    },

    copy: function (btn) {
      var done = function () {
        var label = btn.querySelector('span');
        var status = document.querySelector('[data-share-status]');
        var original = label ? label.textContent : '';
        var message = btn.getAttribute('data-copied');
        if (label) label.textContent = message;
        if (status) status.textContent = message;
        window.setTimeout(function () { if (label) label.textContent = original; if (status) status.textContent = ''; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(done, done);
      } else {
        var field = document.createElement('textarea');
        field.value = window.location.href;
        document.body.appendChild(field);
        field.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(field);
        done();
      }
    }
  };

  /* ------------------------------------------------------------------------
     OT.init — run everything once the DOM is ready
     ------------------------------------------------------------------------ */
  OT.init = function () { OT.nav.init(); OT.menu.init(); OT.share.init(); };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', OT.init);
  else OT.init();
})();
