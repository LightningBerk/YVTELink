# Post-Reorganization Testing Guide

## Quick Test (2 minutes)

Run this checklist to verify everything works after the reorganization:

### 1. Start Local Server
```bash
cd /Users/russellmartin/Desktop/linkSite
python3 -m http.server 8000
# Or: npx http-server -p 8000
```

### 2. Test Landing Page
- [ ] Open `http://localhost:8000/`
- [ ] Verify hero image loads
- [ ] Verify all link cards display correctly
- [ ] Check browser console - should have no errors
- [ ] Click a link - verify analytics tracking works

### 3. Test Login (Direct URL)
- [ ] Open `http://localhost:8000/src/pages/login.html`
- [ ] Verify page loads with no console errors
- [ ] Enter password and click "Login"
- [ ] Should redirect to dashboard on success

### 4. Test Login (Redirect URL - Backward Compatibility)
- [ ] Open `http://localhost:8000/login.html`
- [ ] Should redirect to `/src/pages/login.html`
- [ ] Verify redirect happens automatically

### 5. Test Dashboard (Direct URL)
- [ ] Open `http://localhost:8000/src/pages/dashboard.html`
- [ ] If not logged in, should redirect to login
- [ ] If logged in, dashboard should load
- [ ] Verify all charts and tables render
- [ ] Click "Load Data" - verify data loads
- [ ] Click "Logout" - should redirect to login

### 6. Test Dashboard (Redirect URL - Backward Compatibility)
- [ ] Open `http://localhost:8000/admin/admin.html`
- [ ] Should redirect to `/src/pages/dashboard.html`
- [ ] Verify redirect happens automatically

### 7. Test Setup Page
- [ ] Open `http://localhost:8000/src/pages/setup.html`
- [ ] Verify password strength meter works
- [ ] Check "Already have an account?" link
- [ ] Should redirect to `/src/pages/login.html`

### 8. Browser Console Check
Open browser DevTools (F12) and check:
- [ ] No 404 errors for CSS files
- [ ] No 404 errors for JS files
- [ ] No 404 errors for images
- [ ] No JavaScript errors in console

### 9. Mobile Responsiveness
- [ ] Open DevTools → Toggle device toolbar
- [ ] Test mobile view (iPhone 12/13)
- [ ] Verify layout adapts correctly
- [ ] Test login form on mobile
- [ ] Test dashboard on mobile

### 10. Authentication Flow (End-to-End)
- [ ] Start at landing page
- [ ] Navigate to `/login.html` (old URL)
- [ ] Log in with correct password
- [ ] Should redirect to dashboard
- [ ] Load analytics data
- [ ] Click logout
- [ ] Should redirect to login
- [ ] Try accessing dashboard directly
- [ ] Should redirect to login (auth guard working)

## Detailed Testing (10 minutes)

### Dashboard Functionality
- [ ] KPI cards display correct numbers
- [ ] Timeseries chart renders
- [ ] Peak hours heatmap displays
- [ ] Activity feed shows recent events
- [ ] Top links table populates
- [ ] Top referrers table populates
- [ ] UTM campaigns table displays
- [ ] Visitor map renders (Leaflet.js)
- [ ] Device breakdown chart shows
- [ ] CSV export button works
- [ ] Date range picker works
- [ ] Custom date range works
- [ ] Auto-refresh toggle works

### All Page URLs Work
Test each URL to ensure no broken paths:

**Landing Page:**
- `http://localhost:8000/` ✓
- `http://localhost:8000/index.html` ✓

**Login:**
- `http://localhost:8000/src/pages/login.html` ✓ (new)
- `http://localhost:8000/login.html` ✓ (redirect)

**Setup:**
- `http://localhost:8000/src/pages/setup.html` ✓ (new)
- `http://localhost:8000/setup.html` ✓ (redirect)

**Dashboard:**
- `http://localhost:8000/src/pages/dashboard.html` ✓ (new)
- `http://localhost:8000/admin/admin.html` ✓ (redirect)

### Asset Loading
Check Network tab in DevTools:

**CSS Files:**
- [ ] `/src/styles/main.css` - Status 200
- [ ] `/src/styles/dashboard.css` - Status 200

**JavaScript Files:**
- [ ] `/src/js/lib/config.js` - Status 200
- [ ] `/src/js/lib/analytics.js` - Status 200
- [ ] `/src/js/lib/main.js` - Status 200
- [ ] `/src/js/services/dashboard.js` - Status 200

**Images:**
- [ ] `/assets/images/YVTEBATH-CENSOR.png` - Status 200
- [ ] `/assets/images/fanvueHero.png` - Status 200
- [ ] `/assets/icons/eyes-icon.svg` - Status 200

## Common Issues & Fixes

### Issue: "Failed to load resource: 404" in console
**Cause**: Incorrect path in HTML/CSS/JS file  
**Fix**: Check the file path - should use relative paths from src/ directories

### Issue: Login redirect goes to old URL
**Cause**: Stale browser cache  
**Fix**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Images not loading in CSS
**Cause**: CSS moved to src/styles/, relative path changed  
**Fix**: CSS should use `../../assets/images/` for image paths

### Issue: Dashboard shows "not authenticated"
**Cause**: Need to log in first  
**Fix**: Navigate to login page, enter password, then access dashboard

### Issue: Analytics not tracking
**Cause**: Worker not deployed or config.js has wrong API_BASE  
**Fix**: Check `src/js/lib/config.js` has correct Worker URL

## Deployment Testing

### GitHub Pages Deployment
After pushing to GitHub, test:
- [ ] Visit `https://yourusername.github.io/YVTELink/`
- [ ] Landing page loads
- [ ] Navigate to `/src/pages/login.html`
- [ ] Verify all assets load (no mixed content errors)
- [ ] Test authentication flow
- [ ] Verify old URLs redirect correctly

### Production Checklist
- [ ] Custom domain works (if using CNAME)
- [ ] HTTPS enabled
- [ ] All redirect pages work
- [ ] Analytics tracking works
- [ ] Dashboard loads data from Worker
- [ ] No console errors on any page

## Success Criteria

✅ **All tests pass if:**
1. Landing page loads with all images and styles
2. Login page accessible at both old and new URLs
3. Dashboard loads after authentication
4. All CSS and JS files return 200 status
5. No 404 errors in browser console
6. Redirects work automatically for old URLs
7. Authentication flow works end-to-end
8. Analytics tracking still works
9. CSV export still works
10. Mobile responsive design intact

## Next Steps

After verifying all tests pass:
1. ✅ Update any external documentation with new URLs
2. ✅ Update team about new structure
3. ✅ Monitor for any issues in production
4. ✅ Consider updating bookmarks to new URLs

## Rollback Plan (If Needed)

If critical issues are found:
```bash
# Revert to previous commit
git revert c53d806

# Or hard reset (use with caution)
git reset --hard 62d1abc

# Push the revert
git push origin main
```

Then file an issue with details of what broke.
