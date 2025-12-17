# Contributing Guide

Thank you for your interest in contributing to YVTELink! This guide will help you understand the codebase and make meaningful contributions.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account (free tier OK)
- GitHub account
- Git knowledge

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/YVTELink.git
cd YVTELink

# Create a feature branch
git checkout -b feature/your-feature-name

# Install Wrangler
npm install -g wrangler
```

### Local Development

```bash
# Start local development server
python -m http.server 8000

# In another terminal, watch for Worker changes
cd worker
wrangler dev

# Or deploy directly for testing
wrangler deploy --env development
```

## How to Contribute

### 1. Report Issues

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Browser/device information
- Screenshots if applicable

**Issue Template:**
```
## Description
Brief description of the issue

## Steps to Reproduce
1. Go to...
2. Click...
3. Observe...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- Device: MacBook Pro
- OS: macOS Sonoma
```

### 2. Request Features

Have an idea? Open a discussion with:
- Use case and motivation
- Proposed solution
- Alternative approaches
- Potential drawbacks

**Feature Request Template:**
```
## Use Case
Why would this feature be useful?

## Proposed Solution
How should it work?

## Example Usage
Show how it would be used

## Alternative Approaches
Are there other ways to achieve this?
```

### 3. Submit Pull Requests

Ready to code? Follow this process:

#### Step 1: Fork the Repository
```bash
# On GitHub, click "Fork"
git clone https://github.com/YOUR_USERNAME/YVTELink.git
cd YVTELink
```

#### Step 2: Create a Feature Branch
```bash
git checkout -b feature/descriptive-name

# Good branch names:
# - feature/add-email-tracking
# - fix/cors-error-handling
# - docs/update-api-reference
# - test/add-unit-tests

# Bad branch names:
# - my-changes
# - fix
# - update
```

#### Step 3: Make Changes

Follow the style guide:

**JavaScript**
```javascript
// Use clear variable names
const eventCount = data.length // ✓ Good
const cnt = data.length // ✗ Bad

// Comment complex logic
function calculateCTR(clicks, pageviews) {
  // Avoid division by zero
  return pageviews > 0 ? (clicks / pageviews * 100) : 0
}

// Use arrow functions where appropriate
const mapped = data.map(item => item.id)

// Async/await over promises
async function loadData() {
  const response = await fetch('/summary')
  return await response.json()
}
```

**HTML**
```html
<!-- Use semantic HTML -->
<nav class="admin-header"> ✓ Good
<div class="header"> ✗ Less semantic

<!-- Include ARIA labels for accessibility -->
<button aria-label="Load data">Load</button> ✓ Good
<button>Load</button> ✗ Missing context
```

**CSS**
```css
/* Use CSS custom properties -->
color: var(--color-text-primary); /* ✓ Good */
color: #111827; /* ✗ Hard-coded */

/* Use spacing scale */
padding: var(--space-4); /* ✓ Good */
padding: 16px; /* ✗ Not from scale */

/* Follow BEM naming for components */
.card { } /* ✓ Component */
.card-label { } /* ✓ Element */
.card.highlighted { } /* ✓ Modifier */
```

**SQL**
```sql
-- Use clear column names
SELECT event_id, visitor_id, event_name FROM events -- ✓ Good
SELECT * FROM events -- ✗ Implicit columns

-- Add indexes for large tables
CREATE INDEX idx_occurred_at ON events(occurred_at) -- ✓ Good

-- Use parameterized queries
WHERE visitor_id = ? -- ✓ Good (prevents SQL injection)
WHERE visitor_id = '$id' -- ✗ SQL injection risk
```

#### Step 4: Test Your Changes

```bash
# Test locally
python -m http.server 8000

# Test specific features:
# - Navigate the site
# - Check DevTools console for errors
# - Test on mobile (DevTools device emulation)
# - Verify analytics tracking works
# - Check admin dashboard loads

# If modifying Worker:
cd worker
wrangler dev
# Test endpoints with curl

# If modifying styles:
# Test responsive design at 375px, 768px, 1200px
```

#### Step 5: Commit with Clear Messages

```bash
# Good commit messages
git commit -m "Add email signup tracking event"
git commit -m "Fix CORS origin validation for localhost"
git commit -m "Improve dashboard load time by 30%"

# Detailed commit with body
git commit -m "Add device breakdown tables

- Add devices, OS, and browser tables
- Parse User-Agent string for device detection
- Update dashboard to display device metrics
- Fixes #123"

# Bad commit messages
git commit -m "update stuff"
git commit -m "fix"
git commit -m "changes"
```

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting (no code change)
- `refactor:` Code reorganization
- `test:` Testing additions
- `perf:` Performance improvement

#### Step 6: Push and Create PR

```bash
git push origin feature/your-feature-name
```

On GitHub, click "Compare & Pull Request"

**PR Template:**
```markdown
## Description
What does this PR do?

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?
- [ ] Local testing
- [ ] Browser compatibility
- [ ] Mobile responsive
- [ ] Admin dashboard
- [ ] Analytics tracking

## Screenshots
If applicable, add screenshots

## Checklist
- [ ] Code follows style guide
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors
- [ ] Changes tested locally
```

#### Step 7: Address Review Feedback

Reviewers may request changes. Respond by:
- Pushing additional commits to your branch
- Addressing feedback directly
- Asking clarifying questions
- Updating PR description if scope changed

```bash
# Make requested changes
git add .
git commit -m "Address review feedback: improve error handling"
git push origin feature/your-feature-name
```

#### Step 8: Merge

Once approved:
1. Maintainer merges your PR
2. Your branch is deleted
3. Changes are deployed to production

Congratulations! 🎉

## Documentation Contributions

### Improving Existing Docs

```bash
# Edit docs
vim docs/API.md

# Commit changes
git add docs/API.md
git commit -m "docs: Add example for custom events"
git push origin feature/improve-api-docs
```

**Documentation Standards:**
- Use clear, simple language
- Include code examples
- Explain the "why" not just the "what"
- Keep formatting consistent
- Add cross-references

### Adding New Docs

Create a new file in `docs/`:

```bash
# Create new documentation
touch docs/MY_TOPIC.md

# Structure:
# 1. Overview
# 2. Prerequisites
# 3. Step-by-step guide
# 4. Examples
# 5. Troubleshooting
# 6. Related topics
```

## Testing

### Manual Testing Checklist

- [ ] Feature works as intended
- [ ] No console errors (F12 → Console)
- [ ] No network errors (F12 → Network)
- [ ] Responsive design (DevTools mobile)
- [ ] All browsers tested
- [ ] Admin dashboard loads
- [ ] Analytics tracking works
- [ ] CSV export works

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance Guidelines

### Frontend
- Minimize blocking operations
- Use async/await for I/O
- Lazy load content
- Cache frequently accessed data
- Avoid forced reflows

### Backend
- Use database indexes for queries
- Cache results when possible
- Limit query result sets
- Profile slow queries

### Database
- Measure query performance
- Add indexes strategically
- Archive old data periodically
- Monitor storage usage

## Security Guidelines

### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention (parameterized)
- [ ] CORS properly configured
- [ ] Rate limiting enforced
- [ ] Error messages don't leak info
- [ ] Authentication verified

### Secrets Management
```bash
# Never commit tokens
echo "MY_SECRET=..." >> .gitignore

# Use Cloudflare secrets
wrangler secret put MY_SECRET

# Reference in Worker
env.MY_SECRET
```

## Git Workflow

### Keeping Fork Updated

```bash
# Add upstream remote
git remote add upstream https://github.com/LightningBerk/YVTELink.git

# Fetch latest changes
git fetch upstream

# Rebase on main
git rebase upstream/main

# Force push to your fork
git push -f origin main
```

### Squashing Commits

Keep commit history clean:

```bash
# Before pushing, squash if many small commits
git rebase -i HEAD~3 # Squash last 3 commits

# Mark commits as "squash" (s) in editor
# Keep first as "pick" (p)
```

## Types of Contributions

### Code Contributions
- New features
- Bug fixes
- Performance improvements
- Refactoring

### Documentation
- README updates
- API documentation
- Tutorials
- Troubleshooting guides

### Testing
- Unit tests
- Integration tests
- Browser compatibility testing

### Design
- UI improvements
- UX enhancements
- Accessibility improvements

### Community
- Answer questions
- Report bugs
- Suggest features
- Share knowledge

## Contributor Recognition

All contributors are recognized in:
- GitHub contributors page
- Release notes
- Documentation (if substantial)

## Development Tips

### Using the Admin Dashboard

```bash
# Deploy test Worker
cd worker && wrangler deploy

# Update config.js with test URL
ANALYTICS_API_BASE: "https://test-worker.workers.dev"

# Generate test data
# Visit main page multiple times
# Click links to trigger events

# View in dashboard
# Navigate to /admin/admin.html
# Enter test token (from wrangler secret)
```

### Debugging with Logs

```bash
# Real-time Worker logs
wrangler tail --format pretty

# Filter for specific events
wrangler tail --format pretty | grep "link_click"

# Check errors
wrangler tail --format pretty | grep "error"
```

### Database Debugging

```bash
# Query recent events
wrangler d1 execute link_analytics --remote --command "
  SELECT event_name, occurred_at, page_path 
  FROM events 
  ORDER BY occurred_at DESC 
  LIMIT 10
"

# Check specific visitor
wrangler d1 execute link_analytics --remote --command "
  SELECT * FROM events 
  WHERE visitor_id = 'YOUR_VISITOR_ID'
"
```

## Questions?

- Check [README.md](../README.md) for overview
- Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Open a GitHub discussion

## License

By contributing, you agree your work is licensed under the same license as the project.

---

**Thank you for contributing to YVTELink! 🚀**
