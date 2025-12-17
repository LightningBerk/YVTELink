# Authentication System Setup Guide

This guide explains the new authentication system and how to deploy and test it.

## Overview

The analytics dashboard is now protected with a secure login system:

- **Frontend**: Beautiful, responsive login page (`login.html`) with password input
- **Backend**: Cloudflare Worker endpoints for authentication (`/auth/login`, `/auth/verify`, `/auth/logout`)
- **Session**: Stateless Bearer token authentication (same as existing `ADMIN_TOKEN`)
- **Access Control**: Dashboard redirects to login if not authenticated
- **All Analytics Preserved**: Tracking, data fetch, charts, filters, exports all work as before

## Architecture

```
Login Flow:
1. User visits /login.html or /admin/admin.html (while not authenticated)
2. If not authenticated, redirected to /login.html
3. User enters password
4. POST /auth/login validates password against ADMIN_PASSWORD env var
5. Server returns ADMIN_TOKEN as Bearer token
6. Client stores token in sessionStorage (cleared when tab closes)
7. Client includes token in Authorization header for all API requests
8. Dashboard initializes only after auth verification
9. Logout clears tokens and redirects to /login.html

API Protection:
- /summary → requires Bearer token (401 if unauthorized)
- /links → requires Bearer token (401 if unauthorized)
- /track → public (for pixel tracking)
- /auth/login → public (for login attempts)
- /auth/verify → requires Bearer token (for status check)
- /auth/logout → requires Bearer token (optional, idempotent)
```

## Deployment Steps

### 1. Set Admin Password Secret

```bash
cd worker/
wrangler secret put ADMIN_PASSWORD
# Enter your chosen password when prompted
# This is the password users will enter on the login page
```

### 2. Verify ADMIN_TOKEN is Set

The `ADMIN_TOKEN` should already be configured. Verify it exists:

```bash
wrangler secret list
# Should show both ADMIN_PASSWORD and ADMIN_TOKEN
```

If `ADMIN_TOKEN` is not set:

```bash
wrangler secret put ADMIN_TOKEN
# Generate a strong random token (or reuse existing one)
# This is used internally as the Bearer token for API requests
```

### 3. Deploy Worker Updates

```bash
wrangler publish
```

### 4. Deploy Frontend

Push to GitHub (changes are automatically deployed):

```bash
git push
```

Or if using manual deployment:
- Copy `login.html` to web root
- Copy updated `admin/admin.html` and `admin/admin.js` to web root

## Testing Checklist

### Setup (Before Testing)

- [ ] Deployed Worker with ADMIN_PASSWORD and ADMIN_TOKEN secrets set
- [ ] Frontend files deployed (login.html, admin/admin.html, admin/admin.js)
- [ ] ANALYTICS_API_BASE in config.js points to correct Worker URL

### Test 1: Anonymous User → Redirect to Login

```
Steps:
1. Open incognito/private browser window
2. Navigate to https://your-domain/admin/admin.html
3. Dashboard should NOT load
4. Should be redirected to /login.html
5. Check browser console for auth check logs

Expected: Login page displays with password input
```

### Test 2: Login with Wrong Password

```
Steps:
1. On login page, enter wrong password
2. Click "Sign In"
3. Wait for response

Expected:
- Button shows loading spinner briefly
- Error message appears: "Invalid password"
- Input remains focused for retry
- Button becomes clickable again
```

### Test 3: Login with Correct Password

```
Steps:
1. On login page, enter correct password
2. Click "Sign In"
3. Wait for redirect

Expected:
- Button shows loading spinner
- Success message: "✓ Login successful! Redirecting..."
- Page redirects to /admin/admin.html
- Dashboard loads with data (if available in database)
- Status badge shows "✓ Authenticated"
- "Authenticated" label and "Logout" button visible in header
```

### Test 4: Verify Token is in Session

```
Steps:
1. Login successfully
2. Open browser DevTools → Application → Session Storage
3. Look for "auth_token" key

Expected:
- "auth_token" key present with Bearer token value
- (Also check localStorage for "auth_token_backup" as fallback)
```

### Test 5: Page Refresh While Logged In

```
Steps:
1. Login successfully
2. Verify dashboard loads
3. Press F5 or Ctrl+R to refresh page
4. Wait for page to load

Expected:
- Page should NOT redirect to login
- Auth check verifies token is still valid
- Dashboard loads with previous session preserved
- User remains authenticated
```

### Test 6: Load Data (API Call with Auth)

```
Steps:
1. Login successfully
2. Dashboard visible
3. Click "Load Data" button
4. Wait for API response

Expected:
- Data loads (if events exist in database)
- KPI cards update (Pageviews, Clicks, Uniques, CTR)
- Charts render
- Tables populate
- Status badge remains "✓ Authenticated"
- Check DevTools → Network tab:
  - Request to /summary should include Authorization header
  - Authorization: Bearer <token>
  - Response should be 200 with data
```

### Test 7: API Rejects Requests Without Token

```
Steps:
1. Open a new incognito window (no auth)
2. Open DevTools → Console
3. Run:
   ```javascript
   fetch('https://your-worker-url/summary?range=7d').then(r => r.json()).then(console.log)
   ```
4. Check response

Expected:
- Response should be 401 Unauthorized
- Body should be: { error: 'unauthorized' }
- If using wrong token:
   ```javascript
   fetch('https://your-worker-url/summary?range=7d', {
     headers: { 'Authorization': 'Bearer wrong-token' }
   }).then(r => r.json()).then(console.log)
   ```
- Still 401 Unauthorized
```

### Test 8: Logout Functionality

```
Steps:
1. Login successfully
2. Verify "Logout" button visible in header
3. Click "Logout" button
4. Wait for page to redirect

Expected:
- Token cleared from sessionStorage
- Token cleared from localStorage
- Page redirects to /login.html
- Cannot access dashboard directly; must re-login
- Verify in DevTools → Application:
  - auth_token key removed from Session Storage
  - auth_token_backup key removed from Local Storage
```

### Test 9: Deep Link Redirect (Direct Dashboard Access While Logged Out)

```
Steps:
1. Open incognito window
2. Manually navigate to /admin/admin.html
3. Check sessionStorage

Expected:
- Redirected to /login.html
- sessionStorage should contain:
  - "return_to": "https://your-domain/admin/admin.html"
- Login successfully
- After login, should be redirected back to /admin/admin.html
- Dashboard loads directly (not to home page)
```

### Test 10: Show/Hide Password Toggle

```
Steps:
1. On login page
2. Enter a password
3. Click the eye icon (👁️)
4. Verify password is visible
5. Click eye icon again
6. Verify password is hidden

Expected:
- Icon changes between 👁️ and 🙈
- Accessibility: aria-label updates
- Password field type changes between 'text' and 'password'
```

### Test 11: Keyboard Navigation

```
Steps:
1. On login page
2. Press Tab key to navigate between:
   - Password input
   - Show password button
   - Sign In button
   - Other focusable elements
3. Press Enter on button to activate

Expected:
- Clear focus outline on all elements
- Tab order is logical
- Enter key submits form
- Buttons respond to keyboard activation
```

### Test 12: Mobile Responsiveness

```
Steps (Desktop):
1. Open DevTools
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test viewport sizes: 375px, 480px, 768px, 1024px
4. Login and test dashboard

Expected:
- Login card responsive
- Button sizes appropriate for touch (min 44px)
- Password field readable and accessible
- Dashboard controls stack on mobile
- Charts resize appropriately
- No horizontal scrolling at 375px width
```

### Test 13: Dark Mode (if browser supports)

```
Steps:
1. Set OS to dark mode
2. Visit login page
3. Notice styling

Expected:
- Login card has dark background
- Text is light/readable
- Contrast meets WCAG standards
- Colors adapt to prefers-color-scheme
```

### Test 14: Error Scenarios

```
Scenario A: Network Error During Login
- Disable network in DevTools
- Try to login
- Expected: "Network error" message displayed

Scenario B: Invalid JSON Response
- Should not occur, but if server returns bad JSON:
- Expected: Error message displayed

Scenario C: Logout with Network Error
- Disable network
- Click Logout
- Expected: Still clears tokens and redirects (logout is idempotent)

Scenario D: Verify Endpoint Down
- On login page with token in storage
- Simulate 500 error on verify
- Expected: Redirect to login (assume token invalid)
```

### Test 15: API Rate Limiting (Tracking Endpoint)

```
Steps:
1. Tracking endpoint should NOT require auth (still public)
2. Send 20 events in 15 seconds from same IP
3. Check response on 16th event

Expected:
- Events 1-15: 200 OK or { ok: true }
- Event 16: 429 Too Many Requests (rate limited)
- Analytics tracking still works without auth
```

## Troubleshooting

### "Token invalid" message during login

**Issue**: Login returns 401 even with correct password.

**Solutions**:
- Verify ADMIN_PASSWORD secret is set correctly
  ```bash
  wrangler secret list
  ```
- Check password doesn't have leading/trailing spaces
- Verify wrangler.toml is deployed with new endpoints
- Test locally:
  ```bash
  wrangler dev
  # Then test /auth/login endpoint
  ```

### Dashboard redirects immediately to login after login

**Issue**: User logs in successfully but dashboard won't load.

**Solutions**:
- Check browser console for errors
- Verify ADMIN_TOKEN secret is set
- Check that token returned from /auth/login matches ADMIN_TOKEN
- Verify config.js has correct ANALYTICS_API_BASE URL
- Test /auth/verify endpoint:
  ```javascript
  fetch('https://your-worker-url/auth/verify', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }).then(r => r.json()).then(console.log)
  // Should return { authenticated: true }
  ```

### API returns 401 even with valid token

**Issue**: Token works on login but API calls fail.

**Solutions**:
- Check Authorization header in request (DevTools → Network)
- Format should be: `Authorization: Bearer <token>`
- Verify token hasn't been modified
- Check ADMIN_TOKEN secret hasn't changed
- Verify API endpoints check `requireAdminAuth()` function

### Login page loads but won't submit

**Issue**: Form doesn't submit when clicking Sign In.

**Solutions**:
- Check browser console for JavaScript errors
- Verify ANALYTICS_API_BASE in config.js is correct
- Check CORS headers in Worker (should allow the domain)
- Test with curl:
  ```bash
  curl -X POST https://your-worker-url/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"your-password"}'
  ```

### Logout doesn't work

**Issue**: After clicking Logout, user stays on dashboard.

**Solutions**:
- Check browser console for errors
- Verify logout button click is being registered
- Check that tokens are being cleared from storage:
  ```javascript
  console.log(sessionStorage.getItem('auth_token'))
  console.log(localStorage.getItem('auth_token_backup'))
  // Should both be null after logout
  ```

## Security Notes

### Passwords are Not Stored

- The dashboard uses a **single shared password** (ADMIN_PASSWORD)
- Not intended for multi-user scenarios
- For multiple admins, implement a user database and hashing

### Token Storage

- Tokens stored in `sessionStorage` (cleared when tab closes)
- Backup in `localStorage` (survives page refresh)
- **Not** suitable for highly sensitive environments
- For ultra-security: use only memory storage (tokens lost on refresh)

### HTTPS Only

- Always use HTTPS in production
- Never transmit passwords or tokens over HTTP
- Browser will enforce Secure flag on cookies if needed

### CORS

- Worker allows CORS from configured origin
- Also allows GitHub Pages for testing (lightningberk.github.io)
- Update ALLOWED_ORIGIN in wrangler.toml for production

### Rate Limiting

- Login endpoint has no rate limiting (add if needed)
- Tracking endpoint has rate limiting (15 events/15s per IP)
- Consider adding rate limiting to login if brute-force concern

## Files Modified

- **New**: `login.html` - Login page UI and logic
- **Modified**: `admin/admin.html` - Removed token input, added logout button
- **Modified**: `admin/admin.js` - Added auth guard, session management, logout
- **Modified**: `worker/worker.js` - Added /auth/* endpoints
- **Modified**: `worker/wrangler.toml` - Added ADMIN_PASSWORD documentation

## Rollback Instructions

If you need to revert to the old system:

```bash
git revert 25e19f8
# Or cherry-pick specific commits to undo
```

The old system required manual token pasting in the dashboard. The new system is more secure (one-time login).

## What's Next?

### Optional Enhancements

1. **Rate Limiting on Login**
   ```javascript
   // Prevent brute force attempts
   // Add loginAttempts tracking per IP
   ```

2. **Two-Factor Authentication**
   ```javascript
   // Add TOTP or email verification
   ```

3. **Remember Me**
   ```javascript
   // Extend token expiration if checkbox selected
   ```

4. **Session Management**
   ```javascript
   // Revoke tokens from server side
   // Track active sessions
   // Force logout all sessions
   ```

5. **Multi-User Support**
   ```javascript
   // Add user database
   // Hash passwords with bcrypt
   // Session tokens with expiration
   ```

6. **Audit Logging**
   ```javascript
   // Log login/logout events
   // Track failed attempts
   // Send alerts for suspicious activity
   ```

7. **Password Reset**
   ```javascript
   // Add forgotten password flow
   ```

## Questions?

Refer to:
- `/docs/ARCHITECTURE.md` - System design overview
- `/docs/API.md` - API endpoint reference
- `/admin/admin.js` - Session management code
- `worker/worker.js` - Backend auth implementation
