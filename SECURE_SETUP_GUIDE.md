# Secure Admin Account Setup Guide

## Overview

This system uses a **token-gated account creation** process to ensure only authorized users can create admin accounts.

## Security Model

```
Setup Flow (One-Time):
1. Admin receives ADMIN_TOKEN (set in Cloudflare Worker secrets)
2. Admin visits /setup.html
3. Admin provides ADMIN_TOKEN + chooses password
4. System verifies ADMIN_TOKEN is correct
5. Admin manually runs: wrangler secret put ADMIN_PASSWORD
6. Account is ready for use

Login Flow (Regular Use):
1. User visits /login.html
2. User enters password
3. System validates against ADMIN_PASSWORD
4. User receives session token and accesses dashboard
```

## Why This Approach?

✅ **Token-Gated:** Only people with `ADMIN_TOKEN` can create accounts  
✅ **No Unauthorized Signups:** Random visitors can't create admin accounts  
✅ **Simple:** No database needed for user management  
✅ **Secure:** Passwords stored as Cloudflare Worker secrets (encrypted at rest)  
✅ **Single Admin:** Perfect for 1-2 person teams  

## Step-by-Step Setup

### 1. Set Initial Admin Token (First Time Only)

```bash
cd worker/
wrangler secret put ADMIN_TOKEN
# Enter a secure random token (e.g., generate with: openssl rand -hex 32)
# Example: sk_live_abc123def456xyz789
```

**Save this token securely!** You'll need it to create your admin account.

### 2. Deploy the Worker

```bash
wrangler publish
```

### 3. Deploy Frontend

```bash
cd ..
git push  # Or deploy manually
```

### 4. Visit Setup Page

Open your browser and go to:
```
https://your-domain.com/setup.html
```

### 5. Complete Setup Form

1. **Admin Token**: Paste the `ADMIN_TOKEN` you created in step 1
2. **New Admin Password**: Choose a secure password (8+ characters)
3. **Confirm Password**: Re-enter your password
4. Click "Create Admin Account"

The system will verify your ADMIN_TOKEN and confirm setup.

### 6. Set Password Secret

**Important:** You must manually set the password in Cloudflare:

```bash
cd worker/
wrangler secret put ADMIN_PASSWORD
# Enter the exact password you chose in the setup form
```

### 7. Test Login

Visit:
```
https://your-domain.com/login.html
```

Enter your password and you should be able to access the dashboard.

## Security Features

### Token-Gated Account Creation

The `/auth/setup` endpoint requires a valid `ADMIN_TOKEN` in the Authorization header:

```javascript
POST /auth/setup
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "password": "your-chosen-password"
}
```

If the token is invalid, setup is rejected with `401 Unauthorized`.

### Password Strength Validation

The setup page enforces:
- ✅ Minimum 8 characters
- ✅ Real-time strength meter
- ✅ Password confirmation matching
- ✅ Visual feedback for weak/medium/strong passwords

### No Public Signup

Unlike typical signup pages:
- ❌ No public registration endpoint
- ❌ No "Create Account" link on login page
- ✅ Setup page requires token authorization
- ✅ Only authorized users can create accounts

## Multi-User Setup (Advanced)

For teams with multiple admins, you can:

### Option 1: Shared Password (Current)
- All admins use the same `ADMIN_PASSWORD`
- Simple to manage
- No per-user tracking

### Option 2: Database-Backed Users (Upgrade)
To implement proper multi-user support:

1. Create `users` table in D1:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

2. Update `/auth/setup` to:
   - Accept email + password
   - Hash password with bcrypt
   - Store in database
   - Require ADMIN_TOKEN for first user only

3. Update `/auth/login` to:
   - Query user by email
   - Verify password hash
   - Generate unique JWT for each user

4. Add user management UI to dashboard

## Troubleshooting

### "Invalid token" on setup page

**Problem:** Setup page rejects your ADMIN_TOKEN.

**Solutions:**
1. Verify token was set correctly:
   ```bash
   wrangler secret list
   # Should show ADMIN_TOKEN
   ```
2. Check for typos or spaces in token
3. Redeploy Worker:
   ```bash
   wrangler publish
   ```
4. Verify API_BASE in config.js points to correct Worker URL

### Setup succeeds but login fails

**Problem:** Setup works, but can't login with password.

**Solutions:**
1. Verify you ran `wrangler secret put ADMIN_PASSWORD`:
   ```bash
   wrangler secret list
   # Should show both ADMIN_PASSWORD and ADMIN_TOKEN
   ```
2. Ensure password entered in Wrangler matches password from setup form
3. Check for typos or extra spaces
4. Redeploy if needed:
   ```bash
   wrangler publish
   ```

### Password strength meter not updating

**Problem:** Typing in password field doesn't update strength indicator.

**Solutions:**
1. Check browser console for JavaScript errors
2. Ensure setup.html loaded correctly
3. Try refreshing page (Ctrl+R)
4. Check config.js is accessible

### Can't access setup page

**Problem:** setup.html returns 404.

**Solutions:**
1. Verify file was deployed:
   ```bash
   git status
   # Should show setup.html in repository
   ```
2. Check deployment succeeded
3. Verify URL is correct (https://your-domain.com/setup.html)
4. Check web server configuration (GitHub Pages, etc.)

## API Reference

### POST /auth/setup

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "password": "your-secure-password"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "message": "Setup verified. Remember to run: wrangler secret put ADMIN_PASSWORD and enter this password."
}
```

**Response (Invalid Token):**
```json
{
  "ok": false,
  "error": "Invalid token. You must provide the ADMIN_TOKEN to create an account."
}
```

**Response (Weak Password):**
```json
{
  "ok": false,
  "error": "Password must be at least 8 characters"
}
```

## Best Practices

### Generating Strong Tokens

For `ADMIN_TOKEN`, use a cryptographically secure random string:

```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Password manager
# Use 1Password, LastPass, or similar to generate a 64-character random string
```

### Password Requirements

For `ADMIN_PASSWORD`, enforce:
- Minimum 12 characters (8 is bare minimum)
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words or patterns
- Use a password manager to generate and store

### Securing ADMIN_TOKEN

⚠️ **Never commit ADMIN_TOKEN to git**  
⚠️ **Never share in public channels**  
⚠️ **Store in password manager**  
⚠️ **Rotate periodically (every 90 days)**  

✅ **Share via encrypted channels only** (Signal, 1Password, etc.)  
✅ **Use different tokens for dev/staging/production**  
✅ **Revoke immediately if compromised**  

### Revoking Access

If ADMIN_TOKEN is compromised:

```bash
# 1. Generate new token
NEW_TOKEN=$(openssl rand -hex 32)

# 2. Update secret
wrangler secret put ADMIN_TOKEN
# Enter: $NEW_TOKEN

# 3. Redeploy
wrangler publish

# 4. Notify authorized users of new token
```

All existing sessions remain valid (they use ADMIN_PASSWORD), but new accounts can't be created with old token.

## Comparison: Setup vs Login

| Feature | /auth/setup | /auth/login |
|---------|-------------|-------------|
| **Purpose** | Create admin account | Authenticate existing user |
| **Required** | ADMIN_TOKEN | ADMIN_PASSWORD |
| **Frequency** | One-time (or when changing password) | Every session |
| **Authorization** | Bearer token in header | Password in body |
| **Returns** | Success message | Session token |
| **Public?** | No (token-gated) | Yes (but rate-limited) |

## Migration from Old System

If you were using the old system (manual token pasting):

### Before:
1. User visits /admin/admin.html
2. User manually pastes ADMIN_TOKEN into form field
3. Dashboard loads

### After:
1. Admin runs setup once with ADMIN_TOKEN
2. Admin sets ADMIN_PASSWORD in Wrangler
3. User visits /login.html
4. User enters password (no token pasting)
5. Dashboard loads

### Migration Steps:

1. ✅ Already done - Auth system implemented
2. Run setup page with your existing ADMIN_TOKEN
3. Set ADMIN_PASSWORD via Wrangler
4. Share login page with users (they don't need token anymore)
5. Optional: Rotate ADMIN_TOKEN for security

## Files

- `setup.html` - Token-gated account creation page
- `login.html` - Password-based login page  
- `admin/admin.html` - Protected dashboard
- `worker/worker.js` - Backend with /auth/setup endpoint

## Next Steps

After completing setup:

1. ✅ Bookmark /login.html for future access
2. ✅ Store ADMIN_TOKEN securely (you'll need it to change password)
3. ✅ Store ADMIN_PASSWORD in password manager
4. ✅ Test logout and re-login to verify everything works
5. ✅ Optional: Add rate limiting to /auth/setup endpoint
6. ✅ Optional: Implement database-backed multi-user system

## Questions?

- See `AUTH_QUICKSTART.md` for quick reference
- See `AUTH_SETUP.md` for comprehensive testing guide
- See `AUTH_SUMMARY.md` for architecture overview
