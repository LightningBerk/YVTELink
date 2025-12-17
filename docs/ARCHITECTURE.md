# Architecture Overview

## System Design

YVTELink is a modern analytics-powered link hub built with a serverless architecture. The system consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Pages (Static)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend: HTML/CSS/JS                               │   │
│  │  - Landing page (index.html)                         │   │
│  │  - Analytics dashboard (admin/)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────────────┘
                  │ HTTPS Requests
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Cloudflare Workers (Serverless Compute)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Endpoints:                                      │   │
│  │  - POST /track (event tracking)                      │   │
│  │  - GET /summary (analytics data)                     │   │
│  │  - GET /health (status check)                        │   │
│  │  - GET /links (UTM links)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────────────────────────────┘
                  │ SQL Queries
                  ▼
┌─────────────────────────────────────────────────────────────┐
│          Cloudflare D1 (Serverless SQLite)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database: link_analytics                            │   │
│  │  - events table (26 columns)                         │   │
│  │  - 3 optimized indexes                               │   │
│  │  - 3 schema migrations applied                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Core Components

**index.html**
- Landing page with links and Spotify integration
- Triggers `page_view` event on page load
- Tracks link clicks via `data-link-id` attribute
- Mobile-responsive design

**admin/admin.html**
- Analytics dashboard for authenticated users
- Displays 12 different analytics widgets
- Implements date range filtering
- Handles CSV export

**admin/admin.js (598 lines)**
- Manages dashboard state and data flow
- Implements 12 rendering functions for different widgets
- Handles authentication flow
- Provides CSV export functionality

**admin/admin.css**
- Modern design system with CSS custom properties
- 8 color tokens, spacing scale, typography system
- Responsive breakpoints for mobile, tablet, desktop
- Smooth transitions and animations

### Analytics Integration

**config.js**
```javascript
window.ANALYTICS_CONFIG = {
  ANALYTICS_API_BASE: 'https://yvette-link-backend.asa-fasching.workers.dev',
  ANALYTICS_REQUIRE_CONSENT: false
}
```

**analytics.js (265 lines)**
- `sendEvent(event_name, data)` — Core tracking function
- `setAnalyticsConsent(consent)` — Handle user consent
- Non-blocking event transmission using sendBeacon/fetch
- Unique visitor identification
- Persistent UTM parameter tracking

**main.js**
- Page initialization logic
- Event listener setup
- DOM manipulation

## Backend Architecture

### Cloudflare Worker (worker.js - 451 lines)

**Request Handling**
- Routes requests to appropriate handlers
- Implements CORS for security
- Validates incoming data

**Event Tracking (/track endpoint)**
- Receives tracking events from frontend
- Extracts device info from User-Agent
- Captures geolocation from Cloudflare `request.cf`
- Enforces rate limiting (15 events/15s per IP)
- Inserts event into D1 database

**Analytics Aggregation (/summary endpoint)**
- Queries database for metrics
- Returns 12 separate data arrays:
  - totals (KPIs)
  - top_links
  - top_referrers
  - top_countries
  - locations (for map)
  - devices
  - operating_systems
  - browsers
  - timeseries
  - peak_hours
  - utm_campaigns
  - recent_activity

### Database Schema

**Events Table** (26 columns)

Core Fields:
- `event_id` — Unique identifier (UUID)
- `visitor_id` — Persistent visitor identifier
- `event_name` — 'page_view' or 'link_click'
- `occurred_at` — ISO 8601 timestamp
- `page_path` — URL path visited
- `referrer` — HTTP referrer

Event-Specific:
- `link_id` — For link_click events
- `label` — Link label/text
- `session_id` — Per-session identifier

Geolocation (6 columns):
- `country` — ISO country code
- `region` — State/province
- `city` — City name
- `timezone` — IANA timezone
- `latitude` — Coordinates
- `longitude` — Coordinates

Device Detection (3 columns):
- `device` — 'iPhone', 'Android Phone', 'Desktop', etc.
- `os` — 'iOS', 'Android', 'macOS', 'Windows'
- `browser` — 'Chrome', 'Safari', 'Firefox', 'Edge'

Campaign Tracking (5 columns):
- `utm_source` — Campaign source
- `utm_medium` — Campaign medium
- `utm_campaign` — Campaign name
- `utm_content` — Ad content
- `utm_term` — Search term

Metadata:
- `user_agent` — Full user agent string

### Database Indexes

1. **idx_occurred_at** — For time-range queries
2. **idx_event_name** — For event filtering
3. **idx_visitor_country** — For geographic analysis

### Migrations

**0001_init.sql** — Initial schema with geolocation
- Creates events table with all columns
- Creates indexes

**0002_add_geolocation.sql** — Geolocation columns
- Adds country, region, city, timezone, latitude, longitude
- Adds index for geographic queries

**0003_add_device_tracking.sql** — Device detection
- Adds device, os, browser columns
- Adds indexes for device breakdown analysis

## API Endpoints

### POST /track
Submits a tracking event

**Request:**
```javascript
{
  event_name: 'page_view' | 'link_click',
  page_path: '/some-path',
  link_id: 'optional-link-id',
  label: 'optional-label',
  referrer: 'https://...',
  user_agent: 'Mozilla/...',
  utm_source: 'optional',
  utm_medium: 'optional',
  utm_campaign: 'optional',
  utm_content: 'optional',
  utm_term: 'optional'
}
```

**Response:**
```javascript
{ success: true, event_id: 'uuid' }
```

### GET /summary
Retrieves analytics data

**Query Parameters:**
- `range` — '7d', '30d', or 'custom'
- `start` — ISO date (for custom range)
- `end` — ISO date (for custom range)

**Response:**
```javascript
{
  totals: { pageviews, clicks, uniques, ctr },
  top_links: [...],
  top_referrers: [...],
  top_countries: [...],
  locations: [...],
  devices: [...],
  operating_systems: [...],
  browsers: [...],
  timeseries: [...],
  peak_hours: [...],
  utm_campaigns: [...],
  recent_activity: [...]
}
```

### GET /health
Health check endpoint

**Response:**
```javascript
{ ok: true }
```

### GET /links
Retrieve UTM links (for admin use)

**Response:**
```javascript
[
  {
    id: 'link-id',
    url: 'https://...',
    utm_source: 'source',
    utm_medium: 'medium',
    utm_campaign: 'campaign'
  },
  ...
]
```

## Data Flow

### Page View Tracking

```
Page Load
    ↓
DOMContentLoaded event
    ↓
analytics.js initializes
    ↓
sendEvent('page_view', {...})
    ↓
Fetch to /track endpoint
    ↓
Worker processes event
    ↓
Extract device/geo info
    ↓
Insert into D1 database
    ↓
Response: { success: true }
```

### Link Click Tracking

```
User clicks link with data-link-id
    ↓
main.js click handler fires
    ↓
sendEvent('link_click', {...})
    ↓
Fetch to /track endpoint (non-blocking)
    ↓
Navigate to link
    ↓
Worker processes event asynchronously
    ↓
Extract device/geo info
    ↓
Insert into D1 database
```

### Dashboard Data Loading

```
User enters token and clicks "Load Data"
    ↓
admin.js calls apiGet('/summary', {range, start, end})
    ↓
Verify authentication token
    ↓
Query database for metrics
    ↓
Aggregate data into 12 arrays
    ↓
Return JSON response
    ↓
Render 12 dashboard widgets
    ↓
Display to user
```

## Security Architecture

### Authentication
- Token-based API protection
- Token stored in Cloudflare secrets
- Session storage in browser (cleared on close)
- Protected /summary and /links endpoints

### CORS Security
- Strict origin validation
- Allowed origins: custom domain + GitHub Pages
- Credentials enabled for sendBeacon
- Proper header configuration

### Data Privacy
- No IP address storage
- Geolocation via Cloudflare (privacy-preserving)
- Unique visitor IDs without PII
- Rate limiting prevents abuse
- Bot detection filters

### Rate Limiting
- 15 events per 15 seconds per IP
- Prevents tracking spam
- Returns 429 Too Many Requests if exceeded

## Performance Considerations

### Frontend
- Minimal dependencies (no frameworks)
- Inline critical CSS
- Canvas rendering for charts
- Lazy chart initialization

### Backend
- Serverless (instant scale)
- Database indexes for fast queries
- Efficient SQL with LIMIT/OFFSET
- Response caching possible

### Database
- SQLite (no network latency)
- Indexes on common queries
- Partitioning by date possible
- Retention policies recommended

## Deployment Pipeline

```
Local Development
    ↓
Git commit
    ↓
Push to GitHub main branch
    ↓
GitHub Pages deployment (static files)
    ↓
Wrangler deploy (Worker)
    ↓
D1 migrations applied
    ↓
Live on production
```

## Monitoring & Maintenance

### Health Checks
- /health endpoint for uptime monitoring
- Monitor Worker logs in Cloudflare Dashboard
- Track D1 database storage usage

### Analytics Data
- CSV export for external analysis
- Data retention: indefinite (consider archival)
- Backup strategy: GitHub source, D1 backup

### Performance
- Monitor query response times
- Track event volume over time
- Analyze dashboard load times
- Review error rates in Worker logs
