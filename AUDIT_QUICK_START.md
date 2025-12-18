# 🚀 Audit Quick Start Guide

**Full audit:** See `COMPREHENSIVE_AUDIT.md`  
**This guide:** Focus on the critical 5 items to start with today

---

## The 5 Most Important Improvements

### 1️⃣ Fix Focus Indicators (15 mins) 🔴 CRITICAL

**Problem:** Users can't see keyboard focus when tabbing through page

**Solution:**
```css
/* Add to src/styles/main.css and src/styles/dashboard.css */
:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Optional: Remove default focus on button click (keep on keyboard) */
button:focus-visible {
  outline: 3px solid var(--color-primary);
}
```

**File to edit:** `src/styles/main.css` and `src/styles/dashboard.css`  
**Lines:** Add after `:root` block  
**Expected impact:** Keyboard users can now navigate visually

---

### 2️⃣ Fix Accent Color Contrast (30 mins) 🔴 CRITICAL

**Problem:** Pink accent `#F6D1DD` fails WCAG contrast ratio (1.5:1 vs 4.5:1 required)

**Solution:** Update all accent pink references from `#F6D1DD` → `#E5B8C7` (darker)

**Files to edit:**
1. `src/styles/main.css` — Find `--accent-pink: #F6D1DD;`
2. `src/styles/dashboard.css` — Find `--color-accent: #F6D1DD;`

**Find & replace:**
```
Old: #F6D1DD
New: #E5B8C7

Old: #F6D1DD
New: #E5B8C7
```

**Expected impact:** Better readability, WCAG AA compliance

---

### 3️⃣ Add Image Lazy Loading (15 mins) 🔴 CRITICAL

**Problem:** All 12 MB of images load upfront, slow initial page load

**Solution:** Add `loading="lazy"` to all `<img>` tags

**File to edit:** `index.html`

**Find all `<img>` tags and change:**
```html
<!-- Before -->
<img src="/assets/images/fanvueHero.png" alt="...">

<!-- After -->
<img src="/assets/images/fanvueHero.png" loading="lazy" alt="...">
```

**Expected impact:** 50% faster initial page load

---

### 4️⃣ Improve Button States (30 mins) 🟡 HIGH

**Problem:** Buttons lack proper focus, active, and hover feedback

**Solution:** Add comprehensive button styling

**File to edit:** `src/styles/main.css`

**Add after existing `.btn` styles:**
```css
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Expected impact:** Professional button feedback, better UX

---

### 5️⃣ Add Skip-to-Content Link (20 mins) 🟡 HIGH

**Problem:** Keyboard users must tab through entire header to reach main content

**Solution:** Add hidden skip link at top of page

**Files to edit:** `index.html`, `src/pages/dashboard.html`, `src/pages/login.html`

**Add to top of `<body>` (before everything):**
```html
<body>
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  <!-- rest of page -->
  <main id="main-content">
    <!-- content -->
  </main>
</body>
```

**Add CSS to `src/styles/main.css`:**
```css
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-purple);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;
}

.skip-to-content:focus {
  top: 0;
}
```

**Expected impact:** WCAG A11y compliance, faster keyboard navigation

---

## Implementation Checklist

### Today (2-3 hours)
- [ ] Item 1: Fix focus indicators (15 mins)
- [ ] Item 2: Fix accent color contrast (30 mins)
- [ ] Item 3: Add image lazy loading (15 mins)
- [ ] Item 4: Improve button states (30 mins)
- [ ] Item 5: Add skip-to-content link (20 mins)
- [ ] Test on desktop + mobile
- [ ] Commit to git

### This Week
- [ ] Add tablet breakpoints (1-2 hours)
- [ ] Improve form validation UX (2-3 hours)
- [ ] Add image fallbacks (30 mins)
- [ ] Deploy and monitor

---

## Testing After Changes

1. **Keyboard Navigation**
   - Open site
   - Press `Tab` repeatedly
   - Verify focus ring appears on all interactive elements
   - Verify skip link works
   - Press `Enter/Space` on focused buttons

2. **Color Contrast**
   - Open browser DevTools (F12)
   - Inspect text elements
   - Check contrast ratio (should be ≥4.5:1)
   - Use tool: https://webaim.org/resources/contrastchecker/

3. **Performance**
   - Open DevTools → Performance tab
   - Reload page
   - Should load faster (images lazy-load)
   - Check Network tab: images load on scroll

4. **Visual Inspection**
   - Click buttons → should have hover + active states
   - Tab to buttons → should have focus ring
   - Pink text should be more readable

---

## Questions?

- Full audit details: `COMPREHENSIVE_AUDIT.md`
- Architecture overview: `DESIGN_SYSTEM.md`
- Security info: `SECURITY.md`

---

**Estimated Time to Implement All 5:** 2-3 hours  
**Estimated Impact:** HUGE (accessibility, usability, performance)

Go go go! 🚀
