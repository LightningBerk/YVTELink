// main.js — Footer year and parallax fallback
(function () {
  'use strict';

  // --- Footer year ---
  try{
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch { /* non-critical: footer year */ }

  // --- Parallax (scroll position only) ---
  (function(){
    const docEl = document.documentElement;
    if(!docEl) return;

    // Cache DOM nodes
    const parallaxEl = document.querySelector('.parallax');
    const blossomsEl = document.querySelector('.blossoms');
    const layers = document.querySelectorAll('.parallax-layer');

    function update(){
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      // Set CSS custom properties
      docEl.style.setProperty('--scroll-back-y', (progress * 60) + 'px');
      docEl.style.setProperty('--scroll-mid-y', (progress * 120) + 'px');
      docEl.style.setProperty('--scroll-front-y', (progress * 240) + 'px');
      docEl.style.setProperty('--scroll-blossoms', (progress * 140) + 'px');

      // Direct transforms
      if(parallaxEl) parallaxEl.style.transform = 'translate3d(0,' + (progress * 20) + 'px,0)';
      if(blossomsEl) blossomsEl.style.transform = 'translate3d(0,' + (progress * 140) + 'px,0)';

      // Layer-specific transforms
      layers.forEach((layer, idx) => {
        let mult = 160;
        if (idx === 0) mult = 40;
        else if (idx === 1) mult = 90;
        layer.style.transform = 'translate3d(-50%,' + (progress * mult) + 'px,0)';
      });
    }

    // Throttle via rAF
    let rafPending = false;
    function onScroll(){
      if(rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        update();
        rafPending = false;
      });
    }

    // Initial update and listener
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  // Demo removed in cleanup to avoid fighting live input.

})();
