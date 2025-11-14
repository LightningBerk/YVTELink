// main.js — form interactions (year + email form) and parallax fallback
(function () {
  'use strict';

  // --- Footer year ---
  try{
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }catch(e){}

  // --- Basic email form handling ---
  try{
    const form = document.getElementById('signup-form');
    const email = document.getElementById('email');
    const note = document.getElementById('form-note');

    if (form && email && note) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!email.checkValidity()) {
          note.textContent = 'Please enter a valid email.';
          note.classList.add('note-error');
          email.focus();
          return;
        }

        note.textContent = 'Thanks — check your inbox for the first drop.';
        note.classList.remove('note-error');
        note.classList.add('note-success');
        form.reset();
      });
    }
  }catch(e){}

  // --- Parallax fallback (single, self-contained) ---
  (function(){
    const docEl = document.documentElement;
    if(!docEl) return;

    let ticking = false;
    let virtualScroll = 0; // used when document isn't scrollable
    const maxVirtual = 800;   // max px of virtual scroll to keep motion reasonable
    let lastWheelAt = 0;
    let lastScrollAt = 0;

    // Cache DOM nodes once
    const parallaxEl = document.querySelector('.parallax');
    const blossomsEl = document.querySelector('.blossoms');

    function requestUpdate(){
      if(!ticking){
        window.requestAnimationFrame(updateVars);
        ticking = true;
      }
    }

    function onScroll(){ lastScrollAt = Date.now(); requestUpdate(); }

    // wheel handler to accumulate virtual scroll when page doesn't actually scroll
    function onWheel(e){
      if(document.body.scrollHeight > window.innerHeight) return;
      virtualScroll += (e.deltaY || e.wheelDelta || 0) * 0.6;
      virtualScroll = Math.max(Math.min(virtualScroll, maxVirtual), -maxVirtual);
      requestUpdate();
    }

    // touch move support (for mobile testing)
    let lastTouchY = null;
    function onTouchMove(e){
      if(document.body.scrollHeight > window.innerHeight) return;
      const t = e.touches && e.touches[0];
      if(!t) return;
      if(lastTouchY !== null){
        const dy = lastTouchY - t.clientY;
        virtualScroll += dy * 0.8;
        virtualScroll = Math.max(Math.min(virtualScroll, maxVirtual), -maxVirtual);
        requestUpdate();
      }
      lastTouchY = t.clientY;
    }
    function onTouchEnd(){ lastTouchY = null; }

    // mouse move subtle parallax when no scroll available
    function onMouseMove(e){
      if(document.body.scrollHeight > window.innerHeight) return;
      const centerY = window.innerHeight / 2;
      const dy = (e.clientY - centerY) * 0.08; // small offset based on pointer
      virtualScroll = dy;
      requestUpdate();
    }

    function updateVars(){
      const realScrollAvailable = (document.body.scrollHeight > window.innerHeight);
      // Prefer native scroll when a scroll event occurred very recently (e.g., dragging the scrollbar).
      const useRealScroll = (Date.now() - lastScrollAt) < 350; // 350ms window
      const useVirtual = !useRealScroll && (Math.abs(virtualScroll) > 0.5 || (Date.now() - lastWheelAt) < 1200);

      let sc = 0;
      if (useRealScroll) {
        // Prefer scrollTop from scrollingElement, then documentElement, then body, then window
        const se = document.scrollingElement;
        const seTop = (se && se.scrollTop) ? se.scrollTop : 0;
        const deTop = document.documentElement && document.documentElement.scrollTop ? document.documentElement.scrollTop : 0;
        const bTop = document.body && document.body.scrollTop ? document.body.scrollTop : 0;
        const wTop = window.scrollY || window.pageYOffset || 0;
        sc = seTop || deTop || bTop || wTop || 0;
        // clear virtualScroll so sources don't fight
        virtualScroll = 0;
      } else if (useVirtual) {
        sc = virtualScroll;
      } else if (realScrollAvailable) {
        sc = window.scrollY || window.pageYOffset || 0;
      } else {
        sc = virtualScroll || 0;
      }

      // visible multipliers
      const back = (sc * 0.02);
      const mid = (sc * 0.04);
      const front = (sc * 0.08);

      // Apply CSS variables and inline transforms (fast path)
      docEl.style.setProperty('--scroll-back-y', back + 'px');
      docEl.style.setProperty('--scroll-mid-y', mid + 'px');
      docEl.style.setProperty('--scroll-front-y', front + 'px');
      docEl.style.setProperty('--scroll-blossoms', (sc * 0.04) + 'px');

      if(parallaxEl){ parallaxEl.style.transform = 'translate3d(0,' + (sc * 0.01) + 'px,0)'; }
      if(blossomsEl){ blossomsEl.style.transform = 'translate3d(0,' + (sc * 0.06) + 'px,0)'; }

      ticking = false;
    }

    // initialize and bind
    updateVars();
    // Primary scroll listener on window
    window.addEventListener('scroll', onScroll, {passive:true});
    // Also bind to common scrollable targets to catch scrollbar drags in different browsers/profiles
    document.addEventListener('scroll', onScroll, {passive:true});
    if(document.scrollingElement){ document.scrollingElement.addEventListener('scroll', onScroll, {passive:true}); }
    document.documentElement.addEventListener('scroll', onScroll, {passive:true});
    document.body.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('wheel', onWheel, {passive:true});
    window.addEventListener('mousemove', onMouseMove, {passive:true});
    window.addEventListener('touchmove', onTouchMove, {passive:true});
    window.addEventListener('touchend', onTouchEnd, {passive:true});
    // also add capture-phase wheel listener to detect events before other handlers
    // Capture-phase wheel handler: some extensions or injected scripts stop
    // propagation for bubble-phase listeners. Use a capture listener to
    // accumulate virtualScroll and trigger an update so parallax still moves.
    const captureWheel = function(e){
      const dy = e.deltaY || e.wheelDelta || 0;
      // Always accumulate virtualScroll from wheel deltas and mark the time
      // so updateVars can prefer recent wheel input even if window.scrollY === 0.
      virtualScroll += dy * 0.6;
      virtualScroll = Math.max(Math.min(virtualScroll, maxVirtual), -maxVirtual);
      requestUpdate();
      lastWheelAt = Date.now();
    };
    window.addEventListener('wheel', captureWheel, {passive:true, capture:true});
    document.addEventListener('wheel', captureWheel, {passive:true, capture:true});
  })();

  // Demo removed in cleanup to avoid fighting live input.

})();
