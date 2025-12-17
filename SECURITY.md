# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest (main branch) | ✅ |
| Older commits | ❌ |

We only provide security updates for the latest version on the main branch.

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Preferred: Private Security Advisory

1. Go to the [Security tab](https://github.com/LightningBerk/YVTELink/security)
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form

### Alternative: Direct Email

Send an email to the repository owner with:
- Subject: `[SECURITY] Brief description`
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## What to Include in Your Report

A good security report includes:

1. **Type of vulnerability** (XSS, SQL injection, auth bypass, etc.)
2. **Location** (file path and line number if possible)
3. **Proof of Concept** (steps to reproduce or code snippet)
4. **Impact Assessment** (what an attacker could do)
5. **Suggested Mitigation** (optional but appreciated)
6. **Your contact information** (for follow-up questions)

## Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Status Update**: Within 7 days
- **Fix Timeline**:
  - **Critical**: 7 days
  - **High**: 30 days
  - **Medium**: 60 days
  - **Low**: 90 days or next release

## Disclosure Policy

- We follow **coordinated disclosure**
- We will not disclose the vulnerability until a fix is available
- We request that you do the same
- Once a fix is deployed, we will:
  1. Credit you in the security advisory (if desired)
  2. Publish a security advisory on GitHub
  3. Update the SECURITY_AUDIT.md document

## Security Measures in Place

This project implements the following security measures:

### Authentication & Authorization
- ✅ Server-side token validation on all protected endpoints
- ✅ Dashboard auth guard with automatic redirect
- ✅ Rate limiting on authentication endpoints (5 attempts/min)
- ✅ Generic error messages to prevent information disclosure

### API Security
- ✅ CORS validation with whitelist
- ✅ CSRF protection via Origin header validation
- ✅ Input validation and sanitization
- ✅ SQL injection protection via parameterized queries
- ✅ Rate limiting on tracking endpoint (15 events/15s)

### Frontend Security
- ✅ XSS protection via safe DOM manipulation
- ✅ Content Security Policy (CSP)
- ✅ Subresource Integrity (SRI) on third-party scripts
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)

### Data Privacy
- ✅ No IP addresses stored
- ✅ Minimal PII collection
- ✅ Bot detection and filtering
- ✅ Referrer URL sanitization

### Infrastructure
- ✅ HTTPS enforced (HSTS)
- ✅ Cloudflare DDoS protection
- ✅ Secrets managed via environment variables (not in code)
- ✅ No hardcoded credentials

See [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for complete security documentation.

## Security Best Practices for Contributors

If you're contributing to this project:

1. **Never commit secrets** (passwords, tokens, API keys)
2. **Use parameterized queries** for database operations
3. **Sanitize all user input** before storing or displaying
4. **Use textContent, not innerHTML** for dynamic content
5. **Validate Origin headers** on state-changing endpoints
6. **Follow principle of least privilege**
7. **Test security implications** of your changes

## Known Limitations

### Acceptable Risks (Documented)

1. **LocalStorage token storage**: Tokens stored in localStorage are accessible to JavaScript. This is acceptable for our single-admin use case. Future improvement: migrate to HttpOnly cookies.

2. **Inline scripts**: Some inline scripts require CSP `'unsafe-inline'`. Future improvement: move to external files.

3. **No multi-factor authentication**: Currently single-factor (password). Future enhancement.

4. **No account lockout**: Relies on rate limiting instead of permanent lockout. Acceptable for current threat model.

See [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for detailed risk assessment and mitigation strategies.

## Security Updates

When a security fix is released:

1. A security advisory will be published on GitHub
2. The fix will be included in the main branch
3. SECURITY_AUDIT.md will be updated with details
4. Users will be notified via GitHub notifications

## Resources

- **Security Audit**: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Documentation**: [docs/API.md](docs/API.md)
- **Authentication**: [docs/auth/AUTH_SUMMARY.md](docs/auth/AUTH_SUMMARY.md)

## Questions?

For security-related questions that are not vulnerabilities:

- Open a GitHub Discussion
- Tag with `security` label
- Do not include sensitive information

Thank you for helping keep YVTELink secure! 🔒
