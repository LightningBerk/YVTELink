# Security Verification Checklist

**Purpose**: Verify all security hardening measures are working correctly  
**When to Use**: After deployment, after major changes, quarterly security review  
**Time Required**: ~15 minutes for complete verification

---

## Quick Verification (5 minutes)

### 1. Authentication Basics
- [ ] Navigate to `/src/pages/dashboard.html` without logging in
  - **Expected**: Redirect to `/src/pages/login.html`
  - **Status**: ⬜ Pass / ⬜ Fail

- [ ] Login with correct password
  - **Expected**: Redirect to dashboard, data loads
  - **Status**: ⬜ Pass / ⬜ Fail

- [ ] Click logout button
  - **Expected**: Redirect to login, cannot access dashboard without re-login
  - **Status**: ⬜ Pass / ⬜ Fail

### 2. API Protection
- [ ] Test unauthenticated API access:
  ```bash
  curl https://yvette-link-backend.asa-fasching.workers.dev/summary
  ```
  - **Expected**: `{"error":"unauthorized"}` with 401 status
  - **Status**: ⬜ Pass / ⬜ Fail

### 3. Browser Security
- [ ] Open dashboard in browser, check Console (F12)
  - **Expected**: No errors, no CSP violations
  - **Status**: ⬜ Pass / ⬜ Fail

- [ ] Check Network tab for security headers
  - **Expected**: X-Frame-Options, CSP, HSTS present
  - **Status**: ⬜ Pass / ⬜ Fail

---

## Complete Verification (15 minutes)

### Authentication & Authorization

#### Test 1: Unauthenticated Dashboard Access
**Command**: Open browser incognito window, navigate to dashboard
```
https://your-site.com/src/pages/dashboard.html
```

**Expected Result**:
- Immediate redirect to `/src/pages/login.html`
- URL changes without showing dashboard content
- No analytics data exposed

**Verification**:
- [ ] ✅ Redirects to login
- [ ] ✅ No data visible before redirect
- [ ] ✅ Return URL saved (after login, returns to dashboard)

---

#### Test 2: Unauthenticated API Access
**Command**:
```bash
curl -X GET https://yvette-link-backend.asa-fasching.workers.dev/summary
```

**Expected Result**:
```json
{"error":"unauthorized"}
```
**HTTP Status**: 401

**Verification**:
- [ ] ✅ Returns 401 status
- [ ] ✅ Returns error message (not data)
- [ ] ✅ No analytics data in response

---

#### Test 3: Login Rate Limiting
**Command**: Run this script to attempt 6 rapid logins
```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/auth/login \
    -H "Content-Type: application/json" \
    -H "Origin: https://your-site.com" \
    -d '{"password":"wrongpassword"}' \
    echo ""
  sleep 0.5
done
```

**Expected Result**:
- Attempts 1-5: `{"ok":false,"error":"Invalid credentials"}` (401)
- Attempt 6: `{"ok":false,"error":"Too many attempts. Please try again later."}` (429)

**Verification**:
- [ ] ✅ First 5 attempts return 401
- [ ] ✅ 6th attempt returns 429
- [ ] ✅ Rate limit resets after 60 seconds

---

#### Test 4: Logout Invalidates Session
**Steps**:
1. Login successfully
2. Open dashboard (should work)
3. Click "Logout" button
4. Try to access dashboard again

**Expected Result**:
- After logout, dashboard redirects to login
- Tokens cleared from sessionStorage and localStorage
- Cannot access protected routes without re-login

**Verification**:
- [ ] ✅ Logout button redirects to login
- [ ] ✅ sessionStorage.getItem('auth_token') returns null
- [ ] ✅ localStorage.getItem('auth_token_backup') returns null
- [ ] ✅ Dashboard requires new login

---

### XSS Protection

#### Test 5: Activity Feed XSS Safety
**Steps**:
1. Login to dashboard
2. Load analytics data
3. Open DevTools → Elements
4. Inspect activity feed HTML

**Expected Result**:
- Activity items use text nodes, not innerHTML
- No `<script>` tags in rendered content
- Special characters (&, <, >) automatically escaped

**Verification**:
- [ ] ✅ No innerHTML usage visible
- [ ] ✅ Text content properly escaped
- [ ] ✅ No inline JavaScript in DOM

---

#### Test 6: Alert Message XSS Safety
**Steps**:
1. Trigger an error (e.g., invalid date range)
2. Inspect alert HTML in DevTools

**Expected Result**:
- Alert uses textContent for message
- No HTML interpretation of error message

**Verification**:
- [ ] ✅ Error displayed safely
- [ ] ✅ No HTML execution in error messages

---

### CSRF Protection

#### Test 7: Login CSRF Protection
**Command**: Attempt login from invalid origin
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-site.com" \
  -d '{"password":"anypassword"}'
```

**Expected Result**:
```json
{"ok":false,"error":"Invalid origin"}
```
**HTTP Status**: 403

**Verification**:
- [ ] ✅ Returns 403 status
- [ ] ✅ Rejects invalid Origin
- [ ] ✅ Accepts valid Origin (your site)

---

#### Test 8: Logout CSRF Protection
**Command**: Attempt logout from invalid origin
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/auth/logout \
  -H "Origin: https://evil-site.com"
```

**Expected Result**:
```json
{"ok":false,"error":"Invalid origin"}
```
**HTTP Status**: 403

**Verification**:
- [ ] ✅ Returns 403 status
- [ ] ✅ Requires valid Origin header

---

### Security Headers

#### Test 9: CSP (Content Security Policy)
**Steps**:
1. Open dashboard in browser
2. Open DevTools → Console
3. Look for CSP violations

**Expected Result**:
- No CSP violation errors
- Leaflet.js loads correctly
- Charts render correctly
- Map displays correctly

**Verification**:
- [ ] ✅ No CSP violation errors
- [ ] ✅ All scripts load
- [ ] ✅ All functionality works

---

#### Test 10: Security Headers Present
**Command**:
```bash
curl -I https://yvette-link-backend.asa-fasching.workers.dev/health
```

**Expected Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'...`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**Verification**:
- [ ] ✅ X-Frame-Options present
- [ ] ✅ X-Content-Type-Options present
- [ ] ✅ X-XSS-Protection present
- [ ] ✅ Strict-Transport-Security present
- [ ] ✅ Content-Security-Policy present
- [ ] ✅ Permissions-Policy present

---

### Input Validation

#### Test 11: UUID Validation
**Command**: Send tracking event with invalid UUID
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/track \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-site.com" \
  -d '{
    "event_id": "not-a-valid-uuid",
    "event_name": "page_view",
    "visitor_id": "also-invalid",
    "session_id": "bad-format",
    "page_path": "/"
  }'
```

**Expected Result**:
```json
{"error":"invalid_id_format"}
```
**HTTP Status**: 400

**Verification**:
- [ ] ✅ Rejects invalid UUIDs
- [ ] ✅ Returns 400 status
- [ ] ✅ Does not store invalid data

---

#### Test 12: String Length Limits
**Command**: Send extremely long strings
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/track \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-site.com" \
  -d "{
    \"event_id\": \"$(uuidgen)\",
    \"event_name\": \"page_view\",
    \"visitor_id\": \"$(uuidgen)\",
    \"session_id\": \"$(uuidgen)\",
    \"page_path\": \"$(python3 -c 'print("A"*2000)')\"
  }"
```

**Expected Result**:
- Event accepted (returns 200)
- page_path truncated to 500 characters in database

**Verification**:
- [ ] ✅ Long strings accepted
- [ ] ✅ Data truncated to limits
- [ ] ✅ No DoS from long inputs

---

### Third-Party Security

#### Test 13: Leaflet SRI (Subresource Integrity)
**Steps**:
1. Open dashboard
2. Open DevTools → Network tab
3. Find `leaflet.js` and `leaflet.css` requests

**Expected Result**:
- Both files load successfully
- integrity attribute present in HTML
- Browser validates hash before executing

**Verification**:
- [ ] ✅ Leaflet CSS has integrity hash
- [ ] ✅ Leaflet JS has integrity hash
- [ ] ✅ Both load successfully (integrity check passes)

---

### Data Privacy

#### Test 14: No IP Addresses Stored
**Steps**:
1. Send tracking event
2. Check D1 database events table

**Command**:
```bash
cd worker
wrangler d1 execute link_analytics --remote --command "SELECT * FROM events ORDER BY occurred_at DESC LIMIT 1;"
```

**Expected Result**:
- Event has geolocation data (country, city, etc.)
- No ip_address column exists
- No IP in any field

**Verification**:
- [ ] ✅ No ip_address column
- [ ] ✅ Geolocation present
- [ ] ✅ Privacy maintained

---

#### Test 15: Referrer URL Sanitization
**Command**: Send event with referrer containing credentials
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/track \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-site.com" \
  -d "{
    \"event_id\": \"$(uuidgen)\",
    \"event_name\": \"page_view\",
    \"visitor_id\": \"$(uuidgen)\",
    \"session_id\": \"$(uuidgen)\",
    \"page_path\": \"/\",
    \"referrer\": \"https://user:password@example.com/page\"
  }"
```

**Expected Result**:
- Event accepted
- Referrer stored without credentials: `https://example.com/page`

**Verification**:
- [ ] ✅ Credentials stripped from referrer
- [ ] ✅ URL otherwise preserved

---

## Manual UI Testing

### Test 16: Login Flow
**Steps**:
1. Go to `/login.html`
2. Enter wrong password
3. Enter correct password
4. Verify redirect to dashboard

**Verification**:
- [ ] ✅ Wrong password shows error
- [ ] ✅ Correct password redirects to dashboard
- [ ] ✅ No console errors

---

### Test 17: Dashboard Functionality
**Steps**:
1. Login successfully
2. Click "Load Data"
3. Change date range
4. Click "Load Data" again
5. Export CSV
6. Click logout

**Verification**:
- [ ] ✅ Data loads without errors
- [ ] ✅ Charts render correctly
- [ ] ✅ Tables populate
- [ ] ✅ Map displays (Leaflet)
- [ ] ✅ CSV export works
- [ ] ✅ Logout redirects to login

---

### Test 18: Mobile Responsiveness
**Steps**:
1. Open DevTools
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Test iPhone 12/13 size
4. Test iPad size

**Verification**:
- [ ] ✅ Login page responsive
- [ ] ✅ Dashboard layout adapts
- [ ] ✅ Touch interactions work
- [ ] ✅ No horizontal scroll

---

## Automated Security Scan (Optional)

### Test 19: OWASP ZAP Scan
**Tool**: OWASP ZAP (Zed Attack Proxy)

**Steps**:
1. Install OWASP ZAP
2. Configure proxy
3. Navigate through entire app
4. Run active scan

**Expected Result**:
- No high or critical vulnerabilities
- Medium/low findings acceptable if mitigated

**Verification**:
- [ ] ⬜ Scan completed
- [ ] ⬜ No critical vulnerabilities
- [ ] ⬜ Findings documented

---

### Test 20: npm audit (If Using Node)
**Command**:
```bash
cd worker
npm audit
```

**Expected Result**:
- 0 high vulnerabilities
- 0 critical vulnerabilities

**Verification**:
- [ ] ✅ No critical vulnerabilities
- [ ] ✅ No high vulnerabilities

---

## Verification Results Summary

**Date**: _______________  
**Tester**: _______________  
**Environment**: ⬜ Production ⬜ Staging ⬜ Local

### Results

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Authentication & Authorization | 4 | ___ | ___ |
| XSS Protection | 2 | ___ | ___ |
| CSRF Protection | 2 | ___ | ___ |
| Security Headers | 2 | ___ | ___ |
| Input Validation | 2 | ___ | ___ |
| Third-Party Security | 1 | ___ | ___ |
| Data Privacy | 2 | ___ | ___ |
| Manual UI Testing | 3 | ___ | ___ |
| **TOTAL** | **20** | **___** | **___** |

### Overall Status

- [ ] ✅ **PASS** - All critical tests passed, ready for production
- [ ] ⚠️ **PARTIAL** - Some non-critical tests failed, investigate and fix
- [ ] ❌ **FAIL** - Critical tests failed, do not deploy

### Notes

_______________________________________________
_______________________________________________
_______________________________________________

### Action Items

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Sign-off

**Verified by**: _______________  
**Date**: _______________  
**Signature**: _______________

---

## Troubleshooting

### Common Issues

**Issue**: CSP violations in console  
**Fix**: Check Content-Security-Policy header, ensure Leaflet.js allowed

**Issue**: Rate limiting prevents legitimate logins  
**Fix**: Wait 60 seconds for rate limit to reset, or increase limit in worker.js

**Issue**: CORS errors  
**Fix**: Verify ALLOWED_ORIGIN environment variable matches your site

**Issue**: Leaflet SRI failure  
**Fix**: Verify integrity hash matches Leaflet 1.9.4, update if needed

**Issue**: Dashboard doesn't load data  
**Fix**: Check browser console for errors, verify auth token present

---

## Next Review

**Recommended Frequency**: Quarterly (every 3 months)  
**Next Review Date**: _______________

**Trigger for Immediate Review**:
- After major code changes
- After dependency updates
- After security incident
- When new vulnerabilities discovered in dependencies
