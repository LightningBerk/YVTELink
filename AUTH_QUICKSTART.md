# Authentication System - Quick Deploy Card

## 60-Second Setup

```bash
# 1. Set password
cd worker/
wrangler secret put ADMIN_PASSWORD
# Enter: [your-secure-password]

# 2. Verify token exists
wrangler secret list
# Should show ADMIN_PASSWORD and ADMIN_TOKEN

# 3. Deploy
wrangler publish
cd ..
git push
```

Done! Users can now login at `/login.html`

---

## What Users See

### Login Page (`/login.html`)
```
🔐 Analytics Login
Enter your password to access the dashboard

[Password input field]     [👁️ toggle]
[Sign In button]

✓ Includes show/hide password, error messages, loading states
✓ Mobile-friendly, dark mode, accessible
```

### After Login
```
📊 Analytics Dashboard

[Authenticated] [Logout ✕]  ← New

[All existing features work]
- Load data
- View charts
- Export CSV
- Real-time updates
```

---

## Environment Setup

### Secrets Required (via `wrangler secret put`)

| Name | Value | Example |
|------|-------|---------|
| ADMIN_PASSWORD | Login password | "MySecure123!" |
| ADMIN_TOKEN | Bearer token (should already exist) | "sk_live_abc123xyz..." |

### Verify Secrets

```bash
wrangler secret list
```

Should output:
```
ADMIN_PASSWORD
ADMIN_TOKEN
```

---

## Testing Flow (5 minutes)

```
1. Open incognito browser
2. Go to /admin/admin.html
   → Should redirect to /login.html ✓

3. Enter wrong password + Sign In
   → Should show error ✓

4. Enter correct password + Sign In
   → Should load dashboard + show "✓ Authenticated" ✓

5. Refresh page (F5)
   → Should stay logged in ✓

6. Click [Logout] button
   → Should redirect to /login.html ✓

7. Try to visit /admin/admin.html again
   → Should redirect to /login.html ✓

8. Test on mobile (DevTools: Ctrl+Shift+M)
   → Should be responsive and work normally ✓
```

---

## API Authentication

### Authenticated Endpoints (Require Bearer Token)

```bash
# /summary - Analytics data
curl https://your-worker/summary?range=7d \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 200 with data OR 401 Unauthorized

# /links - Link performance
curl https://your-worker/links?range=7d \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 200 with data OR 401 Unauthorized
```

### Public Endpoints (No Auth Required)

```bash
# /track - Event tracking
curl -X POST https://your-worker/track \
  -H "Content-Type: application/json" \
  -d '{"event_name":"page_view",...}'
# → 200 (tracking endpoint always public)

# /health - Health check
curl https://your-worker/health
# → {"ok": true}
```

---

## File Changes Summary

| File | Change | Impact |
|------|--------|--------|
| `login.html` | ✨ NEW | Login page |
| `admin/admin.html` | 🔧 MODIFIED | Removed token input, added logout |
| `admin/admin.js` | 🔧 MODIFIED | Auth guard, session management |
| `worker/worker.js` | 🔧 MODIFIED | Auth endpoints |
| `worker/wrangler.toml` | 🔧 MODIFIED | ADMIN_PASSWORD variable |
| `AUTH_SETUP.md` | 📚 NEW | Complete setup guide |
| `AUTH_SUMMARY.md` | 📚 NEW | Overview & reference |

---

## Troubleshooting

### "Invalid password" even with correct password?
```bash
# Check password was set correctly
wrangler secret list
# Verify no typos or spaces in password
wrangler secret put ADMIN_PASSWORD  # Re-enter
wrangler publish  # Redeploy
```

### Login page blank or won't load?
```javascript
// Check in browser console:
console.log(window.ANALYTICS_CONFIG)
// Should show ANALYTICS_API_BASE pointing to your Worker
// If not, update config.js
```

### Dashboard still shows login after entering password?
```bash
# Verify ADMIN_TOKEN is set and deployed
wrangler secret list
wrangler publish  # Redeploy Worker
```

### API calls returning 401?
```javascript
// Verify token format in browser DevTools → Network
// Should be: Authorization: Bearer <token>
// Check token is same as ADMIN_TOKEN
```

---

## Security Notes

✓ Password validated server-side (never sent to client)
✓ Tokens stored in sessionStorage (cleared when tab closes)
✓ HTTPS required in production (enforce in Worker)
✓ No passwords logged or stored anywhere
✓ Stateless authentication (no database needed)

⚠️ Single shared password (not multi-user)
⚠️ No rate limiting on login (add if needed)
⚠️ No session expiration (consider adding)
⚠️ No 2FA (can add later)

---

## Rolling Back

If needed, revert to previous version:

```bash
git revert 25e19f8  # Revert auth implementation
git revert 1bdc835 # Revert auth documentation
git push
```

---

## Deployment Checklist

- [ ] Run: `wrangler secret put ADMIN_PASSWORD`
- [ ] Run: `wrangler secret list` (verify both secrets)
- [ ] Run: `wrangler publish`
- [ ] Run: `git push`
- [ ] Test login at `/login.html`
- [ ] Test dashboard at `/admin/admin.html`
- [ ] Test logout button
- [ ] Verify on mobile
- [ ] Verify error messages work
- [ ] Check browser console (no errors)

---

## Quick Links

- **Setup Guide**: `AUTH_SETUP.md` (comprehensive, 15-point checklist)
- **Summary**: `AUTH_SUMMARY.md` (architecture, API reference)
- **Login Code**: `login.html` (beautiful, responsive, accessible)
- **Dashboard Code**: `admin/admin.js` (auth guard, session management)
- **Worker Code**: `worker/worker.js` (backend endpoints)

---

## Support

For detailed setup, testing, and troubleshooting, see **AUTH_SETUP.md**

For system overview and architecture, see **AUTH_SUMMARY.md**

For API documentation, see **docs/API.md**
