/* DEMO ONLY — already provided by the live site, do not deploy.
 * ---------------------------------------------------------------------------
 * slick-init.js — on the live site Slick is initialised inside osahan.min.js.
 * The static demo has no osahan.min.js, so this file initialises the hero with
 * the options we RECOMMEND for the live init (also listed in the README).
 * centerPadding values must match --otr-hero-pad in components.css.
 */
(function ($) {
  'use strict';
  if (!$ || !$.fn.slick) return;

  function init() {
    var $slider = $('.osahan-slider');
    if (!$slider.length) return;

    $slider.slick({
      centerMode: true,            // next + previous slide peek in
      centerPadding: '120px',
      slidesToShow: 1,
      infinite: true,
      autoplay: true,
      autoplaySpeed: 5000,
      pauseOnHover: true,
      speed: 600,
      dots: true,
      dotsClass: 'otr-hero__dots',
      customPaging: function (slider, i) {
        return $('<button type="button"></button>').attr('aria-label', 'Go to slide ' + (i + 1));
      },
      arrows: true,
      prevArrow: '<button type="button" class="otr-hero__arrow otr-hero__arrow--prev" aria-label="Previous slide"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>',
      nextArrow: '<button type="button" class="otr-hero__arrow otr-hero__arrow--next" aria-label="Next slide"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>',
      responsive: [
        { breakpoint: 1200, settings: { centerPadding: '80px' } },
        { breakpoint: 768, settings: { centerPadding: '0px', arrows: false } }   // phones: full-width slide, no peek
      ]
    });

    /* The hero collapses (display:none) while filtering. Slick measures its
       width on init/resize, so re-measure once the wrapper has re-expanded. */
    window.addEventListener('filter-grid', function (e) {
      if (e.detail.length < 3) {
        setTimeout(function () { $slider.slick('setPosition'); }, 900);
      }
    });
  }

  $(init);
})(window.jQuery);
