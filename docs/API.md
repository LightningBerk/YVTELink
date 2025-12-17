# API Reference

## Overview

The YVTELink Analytics API is a RESTful API built with Cloudflare Workers. It provides endpoints for event tracking, analytics retrieval, and system health monitoring.

**Base URL:** `https://yvette-link-backend.asa-fasching.workers.dev`

## Authentication

The API uses token-based authentication via the `Authorization` header:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

Only the `/summary` and `/links` endpoints require authentication. The `/track` endpoint is public but rate-limited.

## Endpoints

### POST /track

Submit a tracking event (page view or link click).

**Public Endpoint** — No authentication required

**Rate Limit:** 15 events per 15 seconds per IP address

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```javascript
{
  // Required
  "event_name": "page_view" | "link_click",
  "page_path": "/some-path",
  
  // Optional - general
  "referrer": "https://example.com",
  "user_agent": "Mozilla/5.0...",
  
  // Optional - for link_click events
  "link_id": "about-section",
  "label": "About",
  
  // Optional - UTM parameters
  "utm_source": "instagram",
  "utm_medium": "social",
  "utm_campaign": "summer2024",
  "utm_content": "post_1",
  "utm_term": "yvette"
}
```

**Request Example:**
```bash
curl -X POST https://yvette-link-backend.asa-fasching.workers.dev/track \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "page_view",
    "page_path": "/",
    "referrer": "https://google.com",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)"
  }'
```

**Response (Success - 200):**
```javascript
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Rate Limited - 429):**
```javascript
{
  "error": "Too many requests"
}
```

**Response (Invalid Data - 400):**
```javascript
{
  "error": "Invalid event data"
}
```

**Field Details:**

| Field | Type | Description |
|-------|------|-------------|
| event_name | string | 'page_view' or 'link_click' |
| page_path | string | URL path (e.g., '/about') |
| referrer | string | HTTP Referer header |
| user_agent | string | Browser user agent string |
| link_id | string | Identifier for the link (link_click only) |
| label | string | Human-readable link label (link_click only) |
| utm_source | string | Campaign source (e.g., 'instagram') |
| utm_medium | string | Campaign medium (e.g., 'social') |
| utm_campaign | string | Campaign name (e.g., 'summer2024') |
| utm_content | string | Campaign content identifier |
| utm_term | string | Search term if applicable |

---

### GET /summary

Retrieve aggregated analytics data.

**Protected Endpoint** — Requires authentication

**Authentication:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| range | string | '7d' | '7d', '30d', or 'custom' |
| start | string | — | ISO date for custom range (YYYY-MM-DD) |
| end | string | — | ISO date for custom range (YYYY-MM-DD) |

**Request Example:**
```bash
# Last 7 days
curl https://yvette-link-backend.asa-fasching.workers.dev/summary?range=7d \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Custom range
curl 'https://yvette-link-backend.asa-fasching.workers.dev/summary?range=custom&start=2024-01-01&end=2024-01-31' \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (Success - 200):**
```javascript
{
  "totals": {
    "pageviews": 1523,
    "clicks": 487,
    "uniques": 342,
    "ctr": "31.9%"
  },
  
  "top_links": [
    {
      "link_id": "spotify",
      "label": "Listen on Spotify",
      "clicks": 234,
      "uniques": 198
    },
    // ... more links
  ],
  
  "top_referrers": [
    {
      "referrer": "instagram.com",
      "pageviews": 456
    },
    // ... more referrers
  ],
  
  "top_countries": [
    {
      "country": "US",
      "pageviews": 567,
      "clicks": 187,
      "uniques": 123
    },
    // ... more countries
  ],
  
  "locations": [
    {
      "city": "Los Angeles",
      "country": "US",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "pageviews": 45,
      "uniques": 28
    },
    // ... more locations
  ],
  
  "devices": [
    {
      "device": "iPhone",
      "pageviews": 456,
      "uniques": 234
    },
    // ... more devices
  ],
  
  "operating_systems": [
    {
      "os": "iOS",
      "pageviews": 456,
      "uniques": 234
    },
    // ... more OS
  ],
  
  "browsers": [
    {
      "browser": "Safari",
      "pageviews": 456,
      "uniques": 234
    },
    // ... more browsers
  ],
  
  "timeseries": [
    {
      "date": "2024-01-15",
      "pageviews": 234,
      "clicks": 78
    },
    // ... one entry per day
  ],
  
  "peak_hours": [
    {
      "hour": 18,
      "day_of_week": 5,
      "pageviews": 123
    },
    // ... one entry per hour/day combination with data
  ],
  
  "utm_campaigns": [
    {
      "utm_source": "instagram",
      "utm_medium": "social",
      "utm_campaign": "summer2024",
      "pageviews": 234,
      "clicks": 78,
      "uniques": 45
    },
    // ... more campaigns
  ],
  
  "recent_activity": [
    {
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_name": "link_click",
      "occurred_at": "2024-01-15T18:45:30Z",
      "page_path": "/",
      "link_id": "spotify",
      "label": "Listen on Spotify",
      "city": "Los Angeles",
      "country": "US",
      "device": "iPhone",
      "os": "iOS",
      "browser": "Safari"
    },
    // ... last 50 events
  ]
}
```

**Response (Unauthorized - 401):**
```javascript
{
  "error": "Unauthorized"
}
```

**Response (Invalid Range - 400):**
```javascript
{
  "error": "Invalid date range"
}
```

---

### GET /health

Health check endpoint. Returns API status.

**Public Endpoint** — No authentication required

**Request Example:**
```bash
curl https://yvette-link-backend.asa-fasching.workers.dev/health
```

**Response (Success - 200):**
```javascript
{
  "ok": true
}
```

---

### GET /links

Retrieve all UTM-enabled links for the property.

**Protected Endpoint** — Requires authentication

**Authentication:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Example:**
```bash
curl https://yvette-link-backend.asa-fasching.workers.dev/links \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (Success - 200):**
```javascript
[
  {
    "id": "spotify",
    "url": "https://open.spotify.com/artist/...",
    "label": "Listen on Spotify",
    "utm_source": "yvette_link_hub",
    "utm_medium": "homepage",
    "utm_campaign": "main"
  },
  {
    "id": "instagram",
    "url": "https://instagram.com/yvette",
    "label": "Follow on Instagram",
    "utm_source": "yvette_link_hub",
    "utm_medium": "homepage",
    "utm_campaign": "socials"
  },
  // ... more links
]
```

---

## Data Models

### Event Object

Represents a tracked event in the database.

```javascript
{
  event_id: string,           // UUID
  visitor_id: string,         // Persistent visitor ID
  event_name: string,         // 'page_view' | 'link_click'
  occurred_at: string,        // ISO 8601 timestamp
  page_path: string,          // URL path
  referrer: string | null,    // HTTP referrer
  link_id: string | null,     // For link_click events
  label: string | null,       // Link label
  user_agent: string,         // Browser user agent
  
  // Geolocation (from Cloudflare)
  country: string | null,     // ISO country code (e.g., 'US')
  region: string | null,      // State/province (e.g., 'CA')
  city: string | null,        // City name
  timezone: string | null,    // IANA timezone
  latitude: number | null,    // Latitude
  longitude: number | null,   // Longitude
  
  // Device Detection (from User-Agent)
  device: string | null,      // 'iPhone' | 'Android Phone' | 'Desktop' | etc.
  os: string | null,          // 'iOS' | 'Android' | 'macOS' | 'Windows'
  browser: string | null,     // 'Chrome' | 'Safari' | 'Firefox' | 'Edge'
  
  // UTM Parameters
  utm_source: string | null,  // Campaign source
  utm_medium: string | null,  // Campaign medium
  utm_campaign: string | null,// Campaign name
  utm_content: string | null, // Campaign content
  utm_term: string | null     // Search term
}
```

### KPI Object

Aggregated key performance indicators.

```javascript
{
  pageviews: number,    // Total page views
  clicks: number,       // Total link clicks
  uniques: number,      // Unique visitors
  ctr: string           // Click-through rate (formatted as "XX.X%")
}
```

### Location Object

Geographic breakdown of visitors.

```javascript
{
  city: string,        // City name
  country: string,     // ISO country code
  latitude: number,    // Latitude coordinate
  longitude: number,   // Longitude coordinate
  pageviews: number,   // Visits from this location
  uniques: number      // Unique visitors from this location
}
```

---

## Error Handling

All error responses include an `error` field with a descriptive message.

**Common Error Codes:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid request | Malformed JSON, missing required fields |
| 401 | Unauthorized | Invalid or missing authentication token |
| 404 | Not found | Endpoint doesn't exist |
| 429 | Too many requests | Rate limit exceeded (15 events/15s per IP) |
| 500 | Internal server error | Database or server error |

---

## Rate Limiting

### Event Submission Rate Limit
- **Limit:** 15 events per 15 seconds per IP address
- **Headers Returned:**
  - `RateLimit-Limit: 15`
  - `RateLimit-Remaining: X`
  - `RateLimit-Reset: UNIX_timestamp`

### Recommendations
- Batch events when possible
- Use `sendBeacon` for non-blocking submissions
- Implement exponential backoff for retries

---

## CORS Configuration

The API accepts requests from:
- `https://your-domain.com` (configured in Worker)
- `https://lightningberk.github.io` (for testing)

**CORS Headers:**
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Examples

### JavaScript (Frontend)

```javascript
// Send page view
fetch('https://api.example.com/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'page_view',
    page_path: window.location.pathname,
    referrer: document.referrer
  })
});

// Get analytics data
const token = 'YOUR_ADMIN_TOKEN';
const response = await fetch(
  'https://api.example.com/summary?range=7d',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const data = await response.json();
console.log(data.totals); // KPI data
```

### cURL

```bash
# Submit an event
curl -X POST https://api.example.com/track \
  -H "Content-Type: application/json" \
  -d '{"event_name":"page_view","page_path":"/"}'

# Get analytics
curl https://api.example.com/summary?range=30d \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check health
curl https://api.example.com/health
```

### Python

```python
import requests
import json

# Submit event
response = requests.post(
    'https://api.example.com/track',
    json={
        'event_name': 'page_view',
        'page_path': '/',
        'referrer': 'https://google.com'
    }
)
print(response.json())

# Get analytics
headers = {'Authorization': 'Bearer YOUR_TOKEN'}
response = requests.get(
    'https://api.example.com/summary?range=7d',
    headers=headers
)
data = response.json()
print(f"Pageviews: {data['totals']['pageviews']}")
```

---

## Webhooks & Integrations

Currently, the API doesn't support webhooks. However, you can:
- Export data via CSV from the dashboard
- Query the `/summary` endpoint on a schedule
- Use a serverless function to periodically fetch data

Consider opening a GitHub issue if you need webhook support.
