// main.js — Footer year and parallax fallback
(function () {
  "use strict";

  // --- Footer year ---
  try {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch {
    /* non-critical: footer year */
  }

  // --- Parallax (scroll position only) ---
  (function () {
    const docEl = document.documentElement;
    if (!docEl) return;

    // Cache DOM nodes
    const parallaxEl = document.querySelector(".parallax");
    const blossomsEl = document.querySelector(".blossoms");
    const layers = document.querySelectorAll(".parallax-layer");

    function update() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      // Set CSS custom properties
      docEl.style.setProperty("--scroll-back-y", progress * 60 + "px");
      docEl.style.setProperty("--scroll-mid-y", progress * 120 + "px");
      docEl.style.setProperty("--scroll-front-y", progress * 240 + "px");
      docEl.style.setProperty("--scroll-blossoms", progress * 140 + "px");

      // Direct transforms
      if (parallaxEl)
        parallaxEl.style.transform = "translate3d(0," + progress * 20 + "px,0)";
      if (blossomsEl)
        blossomsEl.style.transform =
          "translate3d(0," + progress * 140 + "px,0)";

      // Layer-specific transforms
      layers.forEach((layer, idx) => {
        let mult = 160;
        if (idx === 0) mult = 40;
        else if (idx === 1) mult = 90;
        layer.style.transform = "translate3d(-50%," + progress * mult + "px,0)";
      });
    }

    // Throttle via rAF
    let rafPending = false;
    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        update();
        rafPending = false;
      });
    }

    // Initial update and listener
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  // Demo removed in cleanup to avoid fighting live input.

  // --- Dynamic Content Logic ---
  (function () {
    // If bot, don't inject sensitive content
    if (typeof globalThis.isAnalyticsBot === 'function' && globalThis.isAnalyticsBot()) return;

    const linkContainer = document.getElementById("exclusive-link-container");
    const modalContainer = document.getElementById("age-gate-container");

    if (linkContainer) {
      linkContainer.innerHTML = `
                <article class="link-card link-card-hero fade-in" style="--card-bg: url('/assets/images/exclusiveHero.png')">
                    <div class="link-card-background" aria-hidden="true"></div>
                    <div class="link-card-overlay" aria-hidden="true"></div>
                    <div class="link-card-content">
                        <p class="link-card-eyebrow">Exclusive</p>
                        <h2>Exclusive Content</h2>
                        <p class="link-card-subtitle">Exclusive content drops and members-only visuals.</p>
                        <a class="link-card-button" data-link-id="exclusive" data-label="Exclusive Content"
                            href="#" data-enc-href="aHR0cHM6Ly93d3cuZmFudnVlLmNvbS95dmV0dGVfZGVsYXJ1ZQ==" target="_blank"
                            rel="noopener noreferrer">Explore Exclusive Content ${atob("KDE4Kyk=")}</a>
                        <div class="cta-arrow" aria-hidden="true">
                            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <defs>
                                    <linearGradient id="ctaArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#F6D1DD" />
                                        <stop offset="100%" stop-color="#6B3A8A" />
                                    </linearGradient>
                                </defs>
                                <path d="M12 46 L40 18 M40 18 L33 18 M40 18 L40 25" stroke="#000" stroke-width="9"
                                    stroke-linecap="round" stroke-linejoin="round" fill="none" />
                                <path d="M12 46 L40 18 M40 18 L33 18 M40 18 L40 25" stroke="url(#ctaArrowGrad)"
                                    stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                            </svg>
                        </div>
                    </div>
                </article>
      `;
    }

    if (modalContainer) {
      modalContainer.innerHTML = `
    <dialog id="age-gate-modal" class="modal-overlay" aria-hidden="true" aria-modal="true" aria-labelledby="age-gate-title">
        <div class="modal-content fade-in">
            <h2 id="age-gate-title">${atob("QWdlIFZlcmlmaWNhdGlvbg==")}</h2>
            <p>${atob("VGhlIGV4Y2x1c2l2ZSBjb250ZW50IGlzIHN0cmljdGx5IGZvciB1c2VycyAxOCB5ZWFycyBvZiBhZ2UgYW5kIG9sZGVyLiBCeSBjb250aW51aW5nLCB5b3UgY29uZmlybSB0aGF0IHlvdSBhcmUgYXQgbGVhc3QgMTggeWVhcnMgb2xkLg==")}</p>
            <div class="modal-actions">
                <button id="age-gate-cancel" class="btn btn-secondary">Go Back</button>
                <button id="age-gate-confirm" class="btn btn-primary">${atob("SSBhbSAxOCBvciBvbGRlcg==")}</button>
            </div>
        </div>
    </dialog>
      `;
    }

    const modal = document.getElementById("age-gate-modal");
    const btnCancel = document.getElementById("age-gate-cancel");
    const btnConfirm = document.getElementById("age-gate-confirm");

    if (!modal || !btnCancel || !btnConfirm) return;

    let targetUrl = "";

    document.body.addEventListener("click", (e) => {
      const link = e.target.closest('a[data-link-id="exclusive"]');
      if (link) {
        e.preventDefault();
        targetUrl = link.dataset.encHref ? atob(link.dataset.encHref) : link.href;
        modal.setAttribute("aria-hidden", "false");
      }
    });

    function closeModal() {
      modal.setAttribute("aria-hidden", "true");
    }

    function confirmAge() {
      closeModal();
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    }

    btnCancel.addEventListener("click", closeModal);
    btnConfirm.addEventListener("click", confirmAge);

    // Close on click outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  })();
})();
