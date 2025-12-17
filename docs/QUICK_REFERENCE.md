# Quick Reference Guide

## Essential Commands

### Cloudflare Worker Management

```bash
# Deploy Worker
cd worker && wrangler deploy

# View live logs
wrangler tail --format pretty

# Check Worker status
curl https://yvette-link-backend.asa-fasching.workers.dev/health

# List secrets
wrangler secret list

# Update secret
wrangler secret put ADMIN_TOKEN
```

### Database Management

```bash
# Apply migrations
wrangler d1 migrations apply link_analytics --remote

# Query database
wrangler d1 execute link_analytics --remote --command "SELECT * FROM events LIMIT 10;"

# Count events
wrangler d1 execute link_analytics --remote --command "SELECT COUNT(*) as total FROM events;"

# Delete test data
wrangler d1 execute link_analytics --remote --command "DELETE FROM events WHERE visitor_id LIKE 'test-%';"
```

### Git & Deployment

```bash
# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# View recent commits
git log --oneline -5

# Revert a commit
git revert <commit-hash>
```

### Testing & Debugging

```bash
# Start local server
python -m http.server 8000

# Check browser console
# Open DevTools: F12 or Cmd+Option+I

# Monitor Worker requests
curl -X POST https://api.example.com/track \
  -H "Content-Type: application/json" \
  -d '{"event_name":"page_view","page_path":"/"}'

# Test admin endpoint
curl https://api.example.com/summary?range=7d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## File Locations

### Frontend
- **Landing Page:** `index.html`
- **Styles:** `styles.css`
- **Page Logic:** `main.js`
- **Analytics Config:** `config.js`
- **Analytics Tracking:** `analytics.js`

### Admin Dashboard
- **HTML:** `admin/admin.html`
- **JavaScript:** `admin/admin.js`
- **Styles:** `admin/admin.css`

### Backend
- **Worker Code:** `worker/worker.js`
- **Configuration:** `worker/wrangler.toml`
- **Migrations:** `worker/migrations/*.sql`

### Documentation
- **README:** `README.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Setup Guide:** `docs/SETUP_GUIDE.md`
- **API Reference:** `docs/API.md`
- **Analytics:** `docs/ANALYTICS.md`
- **Design System:** `DESIGN_SYSTEM.md`

## Key Configuration Values

### worker/wrangler.toml
```toml
# Replace with your values
database_id = "YOUR_D1_DATABASE_ID"
ALLOWED_ORIGIN = "https://your-domain.com"
```

### config.js
```javascript
ANALYTICS_API_BASE: "https://your-worker-url.workers.dev"
ANALYTICS_REQUIRE_CONSENT: false
```

### CNAME
```
your-domain.com
```

## Admin Dashboard Access

1. Navigate to `/admin/admin.html`
2. Enter admin token (from `wrangler secret`)
3. Select date range (7d, 30d, or custom)
4. Click "Load Data"
5. View analytics across 12 different widgets

**Widget Summary:**
- KPI Cards (4) — Pageviews, clicks, uniques, CTR
- Timeseries Chart — Pageviews/clicks over time
- Peak Hours Heatmap — 24×7 activity grid
- Activity Feed — Last 50 events
- Top Links — Most clicked links
- Top Referrers — Traffic sources
- UTM Campaigns — Marketing performance
- Visitor Map — Geographic distribution
- Top Countries — Country breakdown
- Device Breakdown (3 tables) — Devices, OS, browsers

## Common Tasks

### Add a New Link to Track

1. Add to `index.html`:
   ```html
   <a href="https://..." data-link-id="my-link" class="link">
     Link Text
   </a>
   ```

2. Links with `data-link-id` are automatically tracked

### Track a Custom Event

1. In `analytics.js`, add:
   ```javascript
   sendEvent('custom_event', {
     field1: 'value1',
     field2: 'value2'
   })
   ```

2. In `worker/worker.js`, handle the event type

### Export Analytics Data

1. Go to `/admin/admin.html`
2. Select date range
3. Click "Export CSV"
4. Use in Excel, Google Sheets, or custom analysis

### View Live Events

```bash
# Watch events as they arrive
wrangler tail --format pretty

# Filter by link clicks
wrangler tail --format pretty | grep "link_click"
```

### Backup Database

```bash
# Export all events to CSV
wrangler d1 execute link_analytics --remote \
  --command ".mode csv" \
  --command "SELECT * FROM events;" > backup.csv
```

### Monitor Performance

1. Check Cloudflare dashboard for:
   - Worker analytics
   - Request count
   - Error rates
   - Performance metrics

2. View Worker logs:
   ```bash
   wrangler tail --format pretty
   ```

3. Monitor database size:
   ```bash
   wrangler d1 execute link_analytics --remote \
     --command "SELECT COUNT(*) as total_events FROM events;"
   ```

## Design System Quick Ref

### Colors
- Primary: `#6B3A8A` (purple)
- Accent: `#F6D1DD` (pink)
- Background: `#F8F9FB`
- Text: `#111827`

### Spacing
- Base unit: 4px
- Common: 8px (space-2), 16px (space-4), 24px (space-6)

### Typography
- Headings: Sizes 24px-36px
- Body: 14px-16px
- Labels: 12px

## Deployment Checklist

Before deploying:
- [ ] Update `config.js` with correct Worker URL
- [ ] Set `ALLOWED_ORIGIN` in `wrangler.toml`
- [ ] Set `ADMIN_TOKEN` via `wrangler secret put`
- [ ] Apply migrations: `wrangler d1 migrations apply`
- [ ] Test `/health` endpoint
- [ ] Test `/track` endpoint
- [ ] Test admin dashboard
- [ ] Verify analytics data appears

## Troubleshooting Quick Guide

| Issue | Solution |
|-------|----------|
| 404 on `/admin/` | Check GitHub Pages build completed |
| CORS errors | Verify `ALLOWED_ORIGIN` in Worker |
| No data in dashboard | Check Worker logs: `wrangler tail` |
| Token rejected | Verify `ADMIN_TOKEN` secret is set |
| Slow dashboard | Try smaller date range |
| Worker not updating | Run `wrangler deploy` in `worker/` directory |

## Useful Links

- **Cloudflare Workers:** https://workers.cloudflare.com
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **GitHub Pages:** https://pages.github.com
- **Leaflet.js:** https://leafletjs.com

## Documentation Index

- **New to the project?** Start with [README.md](../README.md)
- **Setting up?** Follow [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Understanding architecture?** Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Building with the API?** See [API.md](API.md)
- **Analyzing data?** Check [ANALYTICS.md](ANALYTICS.md)
- **Design questions?** Visit [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## Need Help?

1. Check relevant documentation
2. Search Worker logs: `wrangler tail`
3. Query database: `wrangler d1 execute`
4. Open GitHub issue with details
5. Contact repository owner
