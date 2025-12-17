# Analytics Implementation Guide

## Overview

YVTELink implements comprehensive event tracking across the landing page and admin dashboard. This guide explains what data is collected, how it's collected, and how to interpret it.

## Tracking Events

### Event Types

**page_view**
- Automatically triggered when a page loads
- Captures page path, referrer, and device info
- Sent via `sendBeacon` for non-blocking delivery

**link_click**
- Triggered when user clicks a tracked link
- Captures link ID, label, and event details
- Non-blocking to prevent delaying navigation

### Automatic Event Collection

The following data is automatically captured for all events:

**User Identification**
- `visitor_id` — Persistent identifier (localStorage-based)
- `session_id` — Per-tab identifier

**Request Context**
- `user_agent` — Browser/device/OS info
- `referrer` — HTTP Referer header
- `page_path` — Current page URL path
- `occurred_at` — ISO 8601 timestamp

**Geolocation** (via Cloudflare)
- `country` — ISO 3166-1 alpha-2 country code
- `region` — State/province name
- `city` — City name
- `timezone` — IANA timezone identifier
- `latitude` — Decimal latitude
- `longitude` — Decimal longitude

**Device Detection** (from User-Agent parsing)
- `device` — Device type (iPhone, Android Phone, iPad, Desktop, etc.)
- `os` — Operating system (iOS, Android, macOS, Windows)
- `browser` — Browser name (Chrome, Safari, Firefox, Edge)

**Campaign Parameters** (if present in URL)
- `utm_source` — Campaign source (e.g., 'instagram')
- `utm_medium` — Campaign medium (e.g., 'social')
- `utm_campaign` — Campaign name (e.g., 'summer2024')
- `utm_content` — Content identifier
- `utm_term` — Search term (for paid search)

## Implementation Details

### Frontend Tracking (analytics.js)

**Initialization:**
```javascript
// Called on page load
initializeAnalytics()
  ├─ Restore visitor ID from localStorage
  ├─ Generate session ID
  ├─ Set up click handlers
  └─ Send page_view event
```

**Event Sending:**
```javascript
sendEvent(event_name, data)
  ├─ Add automatic fields (visitor_id, session_id, etc.)
  ├─ Merge with event-specific data
  ├─ Use sendBeacon (non-blocking)
  ├─ Fallback to fetch if sendBeacon unavailable
  └─ Silent failure (no error messages to users)
```

**Link Tracking:**
Links with `data-link-id` attribute are automatically tracked:
```html
<a href="https://spotify.com" data-link-id="spotify" class="link">
  Listen on Spotify
</a>
```

### Backend Processing (worker.js)

**Event Reception:**
```javascript
handleTrack()
  ├─ Validate incoming event
  ├─ Extract Cloudflare geolocation (request.cf)
  ├─ Parse User-Agent for device info
  ├─ Apply rate limiting (15 events/15s per IP)
  ├─ Detect and filter bots
  ├─ Insert into D1 database
  └─ Return event_id
```

**Device Detection:**
```javascript
parseDeviceInfo(userAgent)
  ├─ Check for mobile patterns (iPhone, Android)
  ├─ Detect device type (iPhone, iPad, Desktop, etc.)
  ├─ Identify operating system
  ├─ Recognize browser (Chrome, Safari, Firefox, Edge)
  └─ Return { device, os, browser }
```

**Bot Filtering:**
```javascript
Bot user agents are filtered and not inserted:
  - Googlebot, bingbot, slurp
  - Semrush, Ahrefs, SEMrush robots
  - Scrapy, curl, wget
  - Other known bot signatures
```

## Key Metrics

### KPIs (Key Performance Indicators)

**Pageviews**
- Total number of page_view events
- Counts multiple visits from same user

**Clicks**
- Total number of link_click events
- Aggregated across all tracked links

**Unique Visitors**
- Count of distinct visitor_ids
- Based on persistent cookie/localStorage

**Click-Through Rate (CTR)**
- Clicks ÷ Pageviews × 100
- Indicates link engagement
- Expressed as percentage

### Traffic Sources

**Top Links**
- Which links get the most clicks
- Ordered by click count
- Shows unique visitors per link

**Top Referrers**
- Which websites send traffic
- Helps identify marketing effectiveness
- Includes direct traffic (referrer = 'direct')

**UTM Campaigns**
- Performance of marketing campaigns
- Breakdown by source/medium/campaign
- Metrics: pageviews, clicks, uniques

### Geographic Data

**Top Countries**
- Traffic by country
- Identifies primary markets
- Shows clicks and uniques per country

**Visitor Map**
- Interactive world map visualization
- Circle markers sized by traffic volume
- Detailed location information (city, country)
- Hover for detailed stats

### Device Analytics

**Device Breakdown**
- iPhone, iPad, Android Phone, Desktop, etc.
- Shows usage by device type
- Helps optimize for target devices

**OS Breakdown**
- iOS, Android, macOS, Windows, etc.
- Platform preference analysis
- Useful for marketing segmentation

**Browser Breakdown**
- Chrome, Safari, Firefox, Edge, etc.
- Browser compatibility insights
- Version tracking via User-Agent

### Time-Based Analysis

**Peak Hours Heatmap**
- 24 × 7 grid showing activity patterns
- Darker colors = more activity
- Identifies when audience is most active
- Useful for scheduling posts/campaigns

**Timeseries Chart**
- Pageviews and clicks over time
- Line chart for trends
- Bar chart for single day
- Helps identify patterns and spikes

## Privacy Considerations

### Data Collection Philosophy

YVTELink follows a privacy-first approach:

1. **No IP Storage** — IP addresses are not stored in the database
2. **Geolocation via Cloudflare** — Privacy-preserving location data
3. **No Personal Data** — No names, emails, or identifiable information
4. **Session-Based** — No long-term user profiles beyond analytics

### Visitor Identification

**visitor_id** generation:
```javascript
// Generated once per browser
let visitor_id = localStorage.getItem('visitor_id')
if (!visitor_id) {
  visitor_id = generateUUID()
  localStorage.setItem('visitor_id', visitor_id)
}
```

This creates a stable identifier across sessions while respecting privacy:
- Cleared when user deletes browser data
- Different for each device
- No correlation to personal identity

### Consent Management

If consent is required:

```javascript
// In config.js
ANALYTICS_REQUIRE_CONSENT: true

// User must call
setAnalyticsConsent(true)

// Before tracking begins
if (hasConsent()) {
  sendEvent(...)
}
```

## Data Retention

Currently, **all data is retained indefinitely**. Consider implementing:

- **30-day retention** — For privacy compliance
- **Annual archival** — For long-term trend analysis
- **GDPR deletion** — Visitor right to deletion

To implement, add a migration:

```sql
-- Archive old data
INSERT INTO events_archive
SELECT * FROM events
WHERE occurred_at < DATE('now', '-1 year')

-- Delete old data
DELETE FROM events
WHERE occurred_at < DATE('now', '-30 days')
```

## Custom Event Tracking

### Adding New Events

To track custom events, add to `analytics.js`:

```javascript
// Track form submission
document.getElementById('contact-form').addEventListener('submit', (e) => {
  sendEvent('form_submit', {
    form_id: 'contact',
    form_type: 'contact'
  })
})

// Track video play
document.getElementById('video').addEventListener('play', () => {
  sendEvent('video_play', {
    video_id: 'intro',
    video_title: 'Introduction'
  })
})
```

Then update the Worker to handle the new event:

```javascript
case 'form_submit':
case 'video_play':
  // Process new event types
  break
```

### Custom Fields

Add custom fields to events:

```javascript
sendEvent('purchase', {
  // Auto-captured
  // ... (visitor_id, session_id, etc.)
  
  // Custom fields
  product_id: 'album_2024',
  amount: 9.99,
  currency: 'USD',
  purchase_method: 'stripe'
})
```

Then add to database schema:

```sql
ALTER TABLE events ADD COLUMN product_id TEXT DEFAULT NULL
ALTER TABLE events ADD COLUMN amount REAL DEFAULT NULL
ALTER TABLE events ADD COLUMN currency TEXT DEFAULT NULL
ALTER TABLE events ADD COLUMN purchase_method TEXT DEFAULT NULL
```

## Dashboard Usage

### Date Range Filtering

- **Last 7 days** — Recent trends
- **Last 30 days** — Monthly overview
- **Custom** — Specific date range for campaigns

### Data Export

Export all metrics as CSV:
- Totals (KPIs)
- Links and clicks
- Referrers
- Countries
- Device breakdown
- OS breakdown
- Browser breakdown
- UTM campaigns
- Timeseries data

### Interpreting Charts

**Timeseries Chart:**
- Line chart = multiple days (trend analysis)
- Bar chart = single day (hourly breakdown)
- Peaks indicate high-traffic periods
- Dips show low-activity times

**Heatmap:**
- Darker purple = more activity
- Shows weekly patterns (weekend vs weekday)
- Horizontal lines = daily trends
- Vertical lines = time-of-day patterns

**Activity Feed:**
- Last 50 events in reverse chronological order
- Shows real-time user behavior
- Identifies which content drives clicks

## Common Questions

### Q: Why is my visitor count different than Google Analytics?
**A:** YVTELink counts unique visitor_ids (based on localStorage). GA uses multiple identification methods. Numbers may differ due to:
- Cookie privacy settings
- Bot filtering differences
- Definition of "unique"

### Q: How are bots filtered?
**A:** Common bot user agents are excluded from tracking. If you see suspicious traffic:
1. Check Worker logs: `wrangler tail`
2. Note the user agent pattern
3. Add to bot filter in `worker.js`

### Q: Can I track cross-domain traffic?
**A:** Currently, YVTELink tracks a single domain. For multiple domains:
- Create separate Workers for each
- Use separate tokens
- Aggregate manually or with custom script

### Q: How long until data appears in the dashboard?
**A:** Near-real-time. Data appears within seconds of tracking events. Dashboard refreshes every 60 seconds when open.

### Q: Can I edit or delete data?
**A:** Directly querying D1:
```bash
# Delete test data
wrangler d1 execute link_analytics --remote \
  --command "DELETE FROM events WHERE visitor_id LIKE 'test-%'"

# Update data
wrangler d1 execute link_analytics --remote \
  --command "UPDATE events SET city='New York' WHERE city='NYC'"
```

## Troubleshooting

### Events Not Being Recorded

**Symptoms:** No data in dashboard after loading page

**Debugging:**
1. Open browser DevTools (F12 → Network tab)
2. Look for POST requests to `/track` endpoint
3. Check response status (should be 200)
4. Check Worker logs: `wrangler tail --format pretty`

**Common Causes:**
- CORS error (check Cloudflare origin whitelist)
- Rate limiting (too many events too quickly)
- Bot detection (user agent matches bot pattern)
- Worker not deployed

### Incorrect Device Detection

**Symptoms:** Device shows "Desktop" on mobile

**Causes:**
- Browser spoofs user agent
- Custom user agent string
- New device/browser combination

**Solution:** Update device detection in `parseDeviceInfo()`

### Missing Geolocation Data

**Symptoms:** City/country fields are null

**Causes:**
- Cloudflare doesn't have location for IP range
- VPN/proxy masking location
- Very new IP range

**Note:** This is expected for some traffic and not an error

### Memory Spike in Dashboard

**Symptoms:** Dashboard becomes slow with large date ranges

**Solutions:**
- Use smaller date range
- Archive old data
- Implement pagination

## Advanced Topics

### Aggregating Data at Tracking Time

Instead of aggregating on read, aggregate on write:

```javascript
// In Worker
// Track top_links on insert instead of on query
const { clicks } = await env.DB.prepare(`
  SELECT COUNT(*) as clicks FROM events
  WHERE link_id = ? AND occurred_at > date('now', '-30 days')
`).bind(link_id).first()

// Store in separate table
await env.DB.prepare(`
  INSERT OR REPLACE INTO link_stats (link_id, clicks_30d)
  VALUES (?, ?)
`).bind(link_id, clicks).run()
```

### Real-Time Notifications

Implement notifications when traffic spikes:

```javascript
// Check every minute in Worker
if (current_pageviews > baseline * 1.5) {
  sendAlert('Traffic spike detected!')
}
```

### A/B Testing Integration

Track experiment variants:

```javascript
sendEvent('page_view', {
  experiment_id: 'header_test',
  variant: 'variant_b'
})

// Dashboard shows conversion by variant
```

### Multi-Property Support

Extend for multiple sites:

```javascript
sendEvent('page_view', {
  property_id: 'yvette_main', // or 'yvette_store', etc.
  // ... other data
})
```

Then filter in dashboard by property_id.
