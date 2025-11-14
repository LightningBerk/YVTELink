// parallax.js — lightweight, performant parallax for decorative SVG layers
(function () {
  'use strict';

  const layers = Array.from(document.querySelectorAll('.parallax-layer'));
  if (!layers.length) return;

  // Debug: confirm layers detected
  console.debug('parallax layers:', layers.map(l => ({ speed: l.getAttribute('data-speed') })));

  // Remove CSS-only fallback animation if JS runs successfully
  const parallaxContainer = document.querySelector('.parallax');
  if (parallaxContainer && parallaxContainer.classList.contains('parallax-auto')) {
    parallaxContainer.classList.remove('parallax-auto');
    console.debug('parallax: removed CSS fallback (JS active)');
  }

  // Update debug overlay indicating parallax loaded
  try {
    const dbg = document.getElementById('debug-parallax');
    if (dbg) dbg.textContent = 'parallax.js loaded';
  } catch (err) {
    // ignore
  }

  // Respect users who prefer reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Ensure content sits above decorative layers
  document.querySelectorAll('header, main, footer').forEach(el => el.style.position = 'relative');

  let latestScroll = window.scrollY || window.pageYOffset;
  let ticking = false;

  function onScroll() {
    latestScroll = window.scrollY || window.pageYOffset;
    requestTick();
  }

  function requestTick() {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }

  // small logging safeguard — only log the first few scroll events to avoid spam
  let _logCount = 0;
  function update() {
    // Use raw page scroll to ensure movement registers even on short pages
    const multiplier = 1.2; // tune this for motion intensity

    layers.forEach(layer => {
      const speed = parseFloat(layer.getAttribute('data-speed')) || 0.2;
      const y = Math.round(latestScroll * speed * multiplier);
      layer.style.transform = `translate3d(-50%, ${y}px, 0)`;

      // debug log first couple frames so we can confirm it's running
      if (_logCount < 3) {
        console.debug('parallax update:', { speed, y });
      }
    });
    _logCount++;
    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { latestScroll = window.scrollY || window.pageYOffset; requestTick(); }, { passive: true });
  // Initial position
  update();
})();
