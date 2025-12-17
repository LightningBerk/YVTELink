# Setup & Deployment Guide

## Prerequisites

Before setting up YVTELink, ensure you have:

- **Node.js 18+** — For Wrangler CLI
- **Git** — For version control
- **Cloudflare Account** — Free tier is sufficient
- **GitHub Account** — For Pages hosting
- **Command Line Experience** — Bash/PowerShell basics

## Step 1: Clone the Repository

```bash
git clone https://github.com/LightningBerk/YVTELink.git
cd YVTELink
```

## Step 2: Install Wrangler CLI

```bash
npm install -g wrangler

# Verify installation
wrangler --version
```

## Step 3: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window to authorize Wrangler. Accept the authorization and return to the terminal.

## Step 4: Create Cloudflare D1 Database

```bash
wrangler d1 create link_analytics

# Output will show:
# ✅ Created D1 database 'link_analytics'
# Database ID: ba86b86b-edd1-4681-8738-fce6e8aa4b91
```

**Copy the Database ID** from the output.

## Step 5: Configure Worker

Edit `worker/wrangler.toml`:

```toml
[env.production]
d1_databases = [
  { binding = "DB", database_id = "YOUR_DATABASE_ID", database_name = "link_analytics" }
]
```

Replace `YOUR_DATABASE_ID` with the ID from Step 4.

Also set your domain:

```toml
[env.production]
vars = { ALLOWED_ORIGIN = "https://your-domain.com" }
```

## Step 6: Apply Database Migrations

```bash
# Apply all migrations to production
wrangler d1 migrations apply link_analytics --remote

# Verify the tables were created
wrangler d1 execute link_analytics --remote --command ".schema"
```

You should see the `events` table with all 26 columns.

## Step 7: Set Secrets

```bash
# Set admin token (create a strong random string)
wrangler secret put ADMIN_TOKEN

# When prompted, enter a strong token like:
# MyS3cur3P@ssw0rdH3r3!RandomString
```

**Save this token** — you'll need it to access the admin dashboard.

## Step 8: Deploy the Worker

```bash
cd worker

# Deploy to Cloudflare
wrangler deploy

# Output will show:
# ✅ Uploaded worker.js (XX.XX KiB)
# ✅ Uploaded D1 database
# Your worker is live at:
# https://yvette-link-backend.asa-fasching.workers.dev/
```

**Copy the Worker URL** — you'll need it in the next step.

## Step 9: Configure Frontend

Edit `config.js`:

```javascript
window.ANALYTICS_CONFIG = {
  ANALYTICS_API_BASE: 'https://yvette-link-backend.asa-fasching.workers.dev',
  ANALYTICS_REQUIRE_CONSENT: false
}
```

Replace the URL with your Worker URL from Step 8.

## Step 10: Update GitHub Pages

If using a custom domain:

1. Edit `CNAME` to contain your domain:
   ```
   your-domain.com
   ```

2. Push changes to GitHub:
   ```bash
   git add config.js CNAME
   git commit -m "Configure analytics and domain"
   git push origin main
   ```

3. In GitHub repository settings:
   - Go to **Settings → Pages**
   - Select **Deploy from a branch**
   - Select **main** branch
   - Set custom domain (if applicable)
   - Verify DNS records

## Step 11: Test the Setup

### Local Testing

```bash
# Start a local server
python -m http.server 8000

# Open in browser
open http://localhost:8000
```

Check the console for any errors. You should see analytics events being tracked.

### Admin Dashboard Test

1. Navigate to `/admin/admin.html`
2. Enter your admin token (from Step 7)
3. Click "Load Data"
4. You should see analytics data

If you see errors:
- Check the browser console (F12 → Console tab)
- Verify the Worker URL is correct
- Ensure the admin token matches what you set
- Check CORS headers in Worker response

## Step 12: Verify Production

Once deployed:

1. Visit your main domain
2. Navigate to `/admin/admin.html`
3. Test with your admin token
4. Verify all widgets load correctly

## Updating the Analytics

### Adding New Events

Edit `analytics.js` to track additional events:

```javascript
// Track custom event
sendEvent('custom_event', {
  custom_field: 'value',
  // other fields...
})
```

### Modifying the Database Schema

To add new columns:

1. Create a new migration file:
   ```bash
   cat > worker/migrations/0004_add_new_field.sql << 'EOF'
   ALTER TABLE events ADD COLUMN new_field TEXT DEFAULT NULL;
   CREATE INDEX idx_new_field ON events(new_field);
   EOF
   ```

2. Apply the migration:
   ```bash
   wrangler d1 migrations apply link_analytics --remote
   ```

3. Update frontend code to send the new field

### Extending the Dashboard

Edit `admin/admin.js` to add new widgets:

```javascript
function renderNewWidget(data) {
  // Render your new widget
  const container = document.getElementById('new-widget');
  container.innerHTML = /* ... */;
}

// Call in loadData():
renderNewWidget(lastData.new_data_array);
```

## Troubleshooting

### "Database not found" Error

**Problem:** Worker can't connect to D1 database

**Solution:**
- Verify `database_id` in `wrangler.toml` is correct
- Run `wrangler d1 list` to see all databases
- Ensure you're logged in: `wrangler login`

### CORS Errors

**Problem:** Frontend gets "blocked by CORS policy" error

**Solution:**
- Verify `ALLOWED_ORIGIN` is set to your domain
- Check Worker logs: `wrangler tail`
- Ensure HTTP methods are correct (GET, POST, OPTIONS)

### "Invalid token" Error

**Problem:** Admin dashboard rejects your token

**Solution:**
- Verify you copied the correct token
- Check that `ADMIN_TOKEN` secret was set: `wrangler secret list`
- If forgotten, create a new one: `wrangler secret put ADMIN_TOKEN`

### Events Not Being Tracked

**Problem:** No data appears in dashboard

**Solution:**
- Check browser console for JavaScript errors (F12)
- Verify `ANALYTICS_API_BASE` is correct
- Ensure Worker is deployed and responding
- Check Worker logs: `wrangler tail --format pretty`
- Verify database migrations were applied

### Dashboard Loads Slowly

**Problem:** Dashboard takes a long time to load data

**Solution:**
- Large date ranges require more queries
- Try a smaller date range first (7 days)
- Add indexes to frequently queried columns
- Consider implementing data pagination

## Environment Variables & Secrets

### Public (in `wrangler.toml`)
- `ALLOWED_ORIGIN` — Your domain for CORS

### Secret (via `wrangler secret put`)
- `ADMIN_TOKEN` — Authentication token for admin dashboard

### Frontend (in `config.js`)
- `ANALYTICS_API_BASE` — Worker URL
- `ANALYTICS_REQUIRE_CONSENT` — Whether to require user consent

## Monitoring & Logs

### View Worker Logs

```bash
wrangler tail --format pretty
```

This shows real-time logs from your Worker, including:
- Incoming requests
- Database queries
- Error messages
- Performance metrics

### Check Database Health

```bash
# Connect to D1 database
wrangler d1 execute link_analytics --remote --command "SELECT COUNT(*) as total_events FROM events;"

# View recent events
wrangler d1 execute link_analytics --remote --command "SELECT * FROM events ORDER BY occurred_at DESC LIMIT 10;"
```

## Scaling Considerations

### Database Growth
- D1 has generous free tier limits
- Monitor storage usage in Cloudflare dashboard
- Implement data archival if needed
- Consider partitioning by date range

### Query Performance
- Current indexes handle typical queries well
- Add more indexes for custom queries
- Use LIMIT/OFFSET for pagination
- Cache frequently accessed data

### Worker Performance
- Serverless = instant scale
- No action needed for growth
- Monitor Worker analytics in Cloudflare dashboard

## Security Hardening

### Token Security
- Use a strong, random token (32+ characters)
- Store securely in Cloudflare secrets
- Never commit tokens to git
- Rotate token periodically

### CORS Headers
- Keep `ALLOWED_ORIGIN` specific to your domain
- Add additional origins only if necessary
- Review CORS configuration after domain changes

### Data Privacy
- YVTELink doesn't store IP addresses
- Geolocation comes from Cloudflare (privacy-preserving)
- Review data retention policy
- Implement GDPR compliance if needed

## Backup & Recovery

### Data Backup
D1 is managed by Cloudflare. Current best practices:
- Export data regularly as CSV from dashboard
- Keep GitHub repository as version control
- Monitor for unusual data patterns

### Code Recovery
All code is version controlled in GitHub:
```bash
# Revert to previous version if needed
git log --oneline
git revert <commit-hash>
git push origin main
```

## Maintenance Schedule

### Daily
- Monitor Worker logs for errors
- Check dashboard loads correctly

### Weekly
- Review analytics trends
- Spot-check for bot activity

### Monthly
- Export analytics data
- Review and clean test data
- Check storage usage
- Update dependencies if any

### Quarterly
- Archive old data if volume is high
- Review security settings
- Plan feature updates
