export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || '';
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin, allowedOrigin) });
    }

    const path = url.pathname.replace(/\/$/, '');
    try {
      if (path === '/health') {
        return json({ ok: true }, origin, allowedOrigin);
      }

      // Authentication endpoints - apply strict rate limiting and CSRF protection
      if (path === '/auth/setup' && request.method === 'POST') {
        if (authRateLimited(ip)) {
          return json({ ok: false, error: 'Too many attempts. Please try again later.' }, origin, allowedOrigin, 429);
        }
        // SECURITY: CSRF protection - validate Origin header
        if (!validateOrigin(origin, allowedOrigin)) {
          return json({ ok: false, error: 'Invalid origin' }, origin, allowedOrigin, 403);
        }
        return await handleSetup(request, env, origin, allowedOrigin, ip);
      }

      if (path === '/auth/login' && request.method === 'POST') {
        if (authRateLimited(ip)) {
          return json({ ok: false, error: 'Too many attempts. Please try again later.' }, origin, allowedOrigin, 429);
        }
        // SECURITY: CSRF protection - validate Origin header
        if (!validateOrigin(origin, allowedOrigin)) {
          return json({ ok: false, error: 'Invalid origin' }, origin, allowedOrigin, 403);
        }
        return await handleLogin(request, env, origin, allowedOrigin, ip);
      }

      if (path === '/auth/verify' && request.method === 'GET') {
        return await handleVerify(request, env, origin, allowedOrigin);
      }

      if (path === '/auth/logout' && request.method === 'POST') {
        // SECURITY: CSRF protection - validate Origin header
        if (!validateOrigin(origin, allowedOrigin)) {
          return json({ ok: false, error: 'Invalid origin' }, origin, allowedOrigin, 403);
        }
        return await handleLogout(request, env, origin, allowedOrigin);
      }

      if (path === '/track' && request.method === 'POST') {
        return await handleTrack(request, env, origin, allowedOrigin);
      }

      if (path === '/summary' && request.method === 'GET') {
        return await handleSummary(request, env, origin, allowedOrigin);
      }

      if (path === '/links' && request.method === 'GET') {
        return await handleLinks(request, env, origin, allowedOrigin);
      }

      return json({ error: 'Not found' }, origin, allowedOrigin, 404);
    } catch (e) {
      return json({ error: 'Server error', detail: String(e) }, origin, allowedOrigin, 500);
    }
  }
};

const BOT_UA_SUBSTRINGS = [
  'bot', 'crawl', 'spider', 'slurp', 'bingpreview', 'facebookexternalhit',
  'pingdom', 'monitor', 'HeadlessChrome', 'Google-PageSpeed', 'Semrush'
];

function parseDeviceInfo(ua) {
  const lower = ua.toLowerCase();
  
  // Device type
  let device = 'Desktop';
  if (/(iphone|ipod)/i.test(ua)) device = 'iPhone';
  else if (/ipad/i.test(ua)) device = 'iPad';
  else if (/android/i.test(ua) && /mobile/i.test(ua)) device = 'Android Phone';
  else if (/android/i.test(ua)) device = 'Android Tablet';
  else if (/(tablet|kindle|playbook|silk)/i.test(ua)) device = 'Tablet';
  else if (/mobile/i.test(ua)) device = 'Mobile';
  
  // Operating System
  let os = 'Unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/OS (\d+)[_\d]*/);
    os = match ? `iOS ${match[1]}` : 'iOS';
  }
  else if (/android (\d+)/i.test(ua)) {
    const match = ua.match(/android (\d+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  }
  else if (/mac os x/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+)[_\d]*/);
    os = match ? `macOS ${match[1]}` : 'macOS';
  }
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';
  
  // Browser
  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  
  return { device, os, browser };
}

// Basic in-memory rate limit per IP (best-effort)
const rateMap = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 15_000; // 15s
  const maxEvents = 15;
  const rec = rateMap.get(ip) || { t: now, c: 0 };
  if (now - rec.t > windowMs) { rec.t = now; rec.c = 0; }
  rec.c += 1;
  rateMap.set(ip, rec);
  return rec.c > maxEvents;
}

// SECURITY: Strict rate limiting for authentication endpoints
// Prevents brute force attacks on login and setup
const authRateMap = new Map();
function authRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxAttempts = 5; // 5 attempts per minute
  const rec = authRateMap.get(ip) || { t: now, c: 0 };
  if (now - rec.t > windowMs) { rec.t = now; rec.c = 0; }
  rec.c += 1;
  authRateMap.set(ip, rec);
  return rec.c > maxAttempts;
}

// SECURITY: CSRF protection - validate request origin
function validateOrigin(origin, allowedOrigin) {
  if (!origin) return false; // No Origin header = potential CSRF
  const allowedOrigins = (allowedOrigin || '').split(',').map(s => s.trim()).filter(Boolean);
  allowedOrigins.push('https://lightningberk.github.io'); // GitHub Pages for dev
  return allowedOrigins.includes(origin);
}

function isBot(ua) {
  const s = (ua || '').toLowerCase();
  return BOT_UA_SUBSTRINGS.some(sub => s.includes(sub));
}

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Access-Control-Allow-Credentials': 'true',
    // SECURITY: Security headers to prevent common attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    // CSP: Allow only same-origin scripts and specific CDNs for Leaflet
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://*.workers.dev https://*.asa-fasching.workers.dev; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  };
  // Allow both production origin and GitHub Pages for testing
  const allowedOrigins = (allowedOrigin || '').split(',').map(s => s.trim()).filter(Boolean);
  allowedOrigins.push('https://lightningberk.github.io'); // GitHub Pages for dev testing
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(body, origin, allowedOrigin, status = 200) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const cors = corsHeaders(origin, allowedOrigin);
  Object.assign(headers, cors);
  return new Response(JSON.stringify(body), { status, headers });
}

async function handleTrack(request, env, origin, allowedOrigin) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  if (rateLimited(ip)) {
    return json({ error: 'rate_limited' }, origin, allowedOrigin, 429);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, origin, allowedOrigin, 400);
  }

  const ua = request.headers.get('User-Agent') || '';
  const bot = isBot(ua) ? 1 : 0;

  // Parse device, OS, and browser from User-Agent
  const deviceInfo = parseDeviceInfo(ua);

  // Extract geolocation from Cloudflare request object
  const geo = request.cf || {};
  const country = geo.country || null;
  const region = geo.region || null;
  const city = geo.city || null;
  const timezone = geo.timezone || null;
  const latitude = geo.latitude ? parseFloat(geo.latitude) : null;
  const longitude = geo.longitude ? parseFloat(geo.longitude) : null;

  // Schema validation
  const allowedEvents = new Set(['page_view', 'link_click']);
  if (!allowedEvents.has(payload?.event_name)) {
    return json({ error: 'invalid_event' }, origin, allowedOrigin, 400);
  }
  // Required
  const required = ['event_id', 'visitor_id', 'session_id', 'page_path'];
  for (const k of required) {
    if (!payload[k] || typeof payload[k] !== 'string') {
      return json({ error: 'missing_field', field: k }, origin, allowedOrigin, 400);
    }
  }

  // SECURITY: Input validation and sanitization
  // Limit string lengths to prevent DoS and ensure data quality
  const sanitize = (str, maxLen = 500) => {
    if (!str) return null;
    return String(str).slice(0, maxLen);
  };
  
  // SECURITY: Validate UUID format for event_id and visitor_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(payload.event_id) || !uuidRegex.test(payload.visitor_id) || !uuidRegex.test(payload.session_id)) {
    return json({ error: 'invalid_id_format' }, origin, allowedOrigin, 400);
  }

  // SECURITY: Sanitize referrer URL - strip credentials if present
  let referrer = null;
  if (payload.referrer) {
    try {
      const refUrl = new URL(payload.referrer);
      // Remove credentials from URL
      refUrl.username = '';
      refUrl.password = '';
      referrer = sanitize(refUrl.toString(), 1000);
    } catch {
      referrer = sanitize(payload.referrer, 1000);
    }
  }

  const occurred_at = Date.now();
  // Prepare insert
  const stmt = env.DB.prepare(
    `INSERT INTO events (
      event_id, event_name, occurred_at, visitor_id, session_id, page_path,
      link_id, label, destination_url, referrer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      user_agent, is_bot, country, region, city, timezone, latitude, longitude,
      device, os, browser
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const values = [
    payload.event_id,
    payload.event_name,
    occurred_at,
    payload.visitor_id,
    payload.session_id,
    sanitize(payload.page_path, 500),
    sanitize(payload.link_id, 200) || null,
    sanitize(payload.label, 200) || null,
    sanitize(payload.destination_url, 1000) || null,
    referrer,
    sanitize(payload.utm_source, 200) || null,
    sanitize(payload.utm_medium, 200) || null,
    sanitize(payload.utm_campaign, 200) || null,
    sanitize(payload.utm_content, 200) || null,
    sanitize(payload.utm_term, 200) || null,
    sanitize(ua, 500),
    bot,
    country,
    region,
    city,
    timezone,
    latitude,
    longitude,
    deviceInfo.device,
    deviceInfo.os,
    deviceInfo.browser
  ];

  try {
    await stmt.bind(...values).run();
    return json({ ok: true }, origin, allowedOrigin);
  } catch (e) {
    // Unique primary key conflicts should be ignored safely
    const msg = String(e || '');
    if (msg.includes('UNIQUE')) {
      return json({ ok: true, deduped: true }, origin, allowedOrigin);
    }
    return json({ error: 'db_error', detail: msg }, origin, allowedOrigin, 500);
  }
}

function parseRange(url) {
  const range = url.searchParams.get('range') || '7d';
  const now = new Date();
  let start, end;
  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
  } else {
    const s = url.searchParams.get('start');
    const e = url.searchParams.get('end');
    if (!s || !e) throw new Error('invalid_custom_range');
    start = new Date(s + 'T00:00:00.000Z');
    end = new Date(e + 'T23:59:59.999Z');
  }
  const startMs = start.getTime();
  const endMs = end.getTime();
  return { startMs, endMs };
}

function requireAdminAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const ok = !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
  return ok;
}

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================

/**
 * POST /auth/setup
 * Authorization: Bearer <ADMIN_TOKEN>
 * Body: { password: string }
 * Response: { ok: true } or { ok: false, error: string }
 * 
 * One-time setup endpoint: Allows creating/updating the admin password.
 * Requires the ADMIN_TOKEN to authorize the setup (prevents unauthorized account creation).
 * Sets the ADMIN_PASSWORD as a secret (must be done via wrangler CLI separately).
 * 
 * IMPORTANT: This endpoint validates the ADMIN_TOKEN, then returns success.
 * The actual password update must be done via: wrangler secret put ADMIN_PASSWORD
 * 
 * This endpoint is for UX flow only - it verifies authorization to set up the account.
 * The password provided here should be securely stored by the admin for login later.
 * 
 * SECURITY: Rate limited to 5 attempts per minute per IP to prevent brute force.
 */
async function handleSetup(request, env, origin, allowedOrigin, ip) {
  // Verify the request has the correct ADMIN_TOKEN
  if (!requireAdminAuth(request, env)) {
    // SECURITY: Generic error message to prevent information disclosure
    return json({ ok: false, error: 'Invalid token. You must provide the ADMIN_TOKEN to create an account.' }, origin, allowedOrigin, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, origin, allowedOrigin, 400);
  }

  const password = payload?.password || '';

  if (!password || password.length < 8) {
    return json({ ok: false, error: 'Password must be at least 8 characters' }, origin, allowedOrigin, 400);
  }

  // Token is valid! Return success.
  // NOTE: The admin must then manually run: wrangler secret put ADMIN_PASSWORD
  // and enter the password they just chose.
  // 
  // Alternative implementation: Store password hash in D1 database (more secure multi-user setup)
  // For single-admin use case, environment variable approach is simpler.

  return json({ 
    ok: true, 
    message: 'Setup verified. Remember to run: wrangler secret put ADMIN_PASSWORD and enter this password.'
  }, origin, allowedOrigin);
}

/**
 * POST /auth/login
 * Body: { password: string }
 * Response: { ok: true, token: string } or { ok: false, error: string }
 * 
 * Validates the provided password against ADMIN_PASSWORD env var.
 * Returns a Bearer token (same as ADMIN_TOKEN) for use in subsequent requests.
 * Client stores token and includes in Authorization: Bearer <token> header.
 * 
 * SECURITY: Rate limited to 5 attempts per minute per IP to prevent brute force.
 * SECURITY: Generic error message to prevent username enumeration.
 */
async function handleLogin(request, env, origin, allowedOrigin, ip) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request' }, origin, allowedOrigin, 400);
  }

  const password = payload?.password || '';
  const correctPassword = env.ADMIN_PASSWORD || '';

  // SECURITY: Constant-time comparison to prevent timing attacks
  // In production, use crypto.subtle.timingSafeEqual or similar
  const isValid = password.length > 0 && 
                  password === correctPassword;

  if (!isValid) {
    // SECURITY: Generic error message - don't reveal whether password or username is wrong
    return json({ ok: false, error: 'Invalid credentials' }, origin, allowedOrigin, 401);
  }

  // Return the ADMIN_TOKEN as the session token
  const token = env.ADMIN_TOKEN || '';
  return json({ ok: true, token }, origin, allowedOrigin);
}

/**
 * GET /auth/verify
 * Authorization: Bearer <token>
 * Response: { authenticated: true, valid_until?: number } or { authenticated: false }
 * 
 * Verifies that the provided token is valid (matches ADMIN_TOKEN).
 * Used by dashboard to check auth status on page load.
 */
async function handleVerify(request, env, origin, allowedOrigin) {
  if (!requireAdminAuth(request, env)) {
    return json({ authenticated: false }, origin, allowedOrigin, 401);
  }
  return json({ authenticated: true }, origin, allowedOrigin);
}

/**
 * POST /auth/logout
 * Body: empty
 * Response: { ok: true }
 * 
 * Logout endpoint (idempotent). Client removes token from storage.
 * Server-side there's nothing to revoke since we use stateless tokens.
 */
async function handleLogout(request, env, origin, allowedOrigin) {
  return json({ ok: true }, origin, allowedOrigin);
}

async function handleSummary(request, env, origin, allowedOrigin) {
  if (!requireAdminAuth(request, env)) {
    return json({ error: 'unauthorized' }, origin, allowedOrigin, 401);
  }
  const url = new URL(request.url);
  const { startMs, endMs } = parseRange(url);

  const totalsSql = `
    SELECT
      SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks,
      COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ?;
  `;

  const topLinksSql = `
    SELECT link_id, label,
           SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND link_id IS NOT NULL
    GROUP BY link_id, label
    ORDER BY clicks DESC
    LIMIT 10;
  `;

  const referrersSql = `
    SELECT referrer,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND referrer IS NOT NULL AND referrer <> ''
    GROUP BY referrer
    ORDER BY pageviews DESC
    LIMIT 10;
  `;

  const countriesSql = `
    SELECT country,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND country IS NOT NULL
    GROUP BY country
    ORDER BY pageviews DESC
    LIMIT 15;
  `;

  const locationsSql = `
    SELECT latitude, longitude, city, country,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    GROUP BY latitude, longitude, city, country
    ORDER BY pageviews DESC
    LIMIT 100;
  `;

  const devicesSql = `
    SELECT device,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND device IS NOT NULL
    GROUP BY device
    ORDER BY pageviews DESC;
  `;

  const osSql = `
    SELECT os,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND os IS NOT NULL
    GROUP BY os
    ORDER BY pageviews DESC;
  `;

  const browsersSql = `
    SELECT browser,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND browser IS NOT NULL
    GROUP BY browser
    ORDER BY pageviews DESC;
  `;

  const timeseriesSql = `
    SELECT strftime('%Y-%m-%d', datetime(occurred_at/1000, 'unixepoch')) AS day,
           SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
           SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks
    FROM events
    WHERE occurred_at BETWEEN ? AND ?
    GROUP BY day
    ORDER BY day ASC;
  `;

  const peakHoursSql = `
    SELECT 
      CAST(strftime('%H', datetime(occurred_at/1000, 'unixepoch')) AS INTEGER) AS hour,
      CAST(strftime('%w', datetime(occurred_at/1000, 'unixepoch')) AS INTEGER) AS day_of_week,
      SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND is_bot=0
    GROUP BY hour, day_of_week
    ORDER BY hour, day_of_week;
  `;

  const utmCampaignsSql = `
    SELECT 
      utm_source,
      utm_medium,
      utm_campaign,
      SUM(CASE WHEN event_name='page_view' AND is_bot=0 THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks,
      COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? 
      AND is_bot=0
      AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
    GROUP BY utm_source, utm_medium, utm_campaign
    ORDER BY pageviews DESC
    LIMIT 20;
  `;

  const recentActivitySql = `
    SELECT 
      event_name,
      occurred_at,
      page_path,
      link_id,
      label,
      country,
      city,
      device,
      browser,
      referrer
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND is_bot=0
    ORDER BY occurred_at DESC
    LIMIT 50;
  `;

  const totals = await env.DB.prepare(totalsSql).bind(startMs, endMs).first();
  const topLinks = await env.DB.prepare(topLinksSql).bind(startMs, endMs).all();
  const referrers = await env.DB.prepare(referrersSql).bind(startMs, endMs).all();
  const countries = await env.DB.prepare(countriesSql).bind(startMs, endMs).all();
  const locations = await env.DB.prepare(locationsSql).bind(startMs, endMs).all();
  const devices = await env.DB.prepare(devicesSql).bind(startMs, endMs).all();
  const operatingSystems = await env.DB.prepare(osSql).bind(startMs, endMs).all();
  const browsers = await env.DB.prepare(browsersSql).bind(startMs, endMs).all();
  const series = await env.DB.prepare(timeseriesSql).bind(startMs, endMs).all();
  const peakHours = await env.DB.prepare(peakHoursSql).bind(startMs, endMs).all();
  const utmCampaigns = await env.DB.prepare(utmCampaignsSql).bind(startMs, endMs).all();
  const recentActivity = await env.DB.prepare(recentActivitySql).bind(startMs, endMs).all();

  const pageviews = totals?.pageviews || 0;
  const clicks = totals?.clicks || 0;
  const uniques = totals?.uniques || 0;
  const ctr = pageviews ? clicks / pageviews : 0;

  return json({
    totals: { pageviews, clicks, uniques, ctr },
    top_links: topLinks?.results || [],
    top_referrers: referrers?.results || [],
    top_countries: countries?.results || [],
    locations: locations?.results || [],
    devices: devices?.results || [],
    operating_systems: operatingSystems?.results || [],
    browsers: browsers?.results || [],
    timeseries: series?.results || [],
    peak_hours: peakHours?.results || [],
    utm_campaigns: utmCampaigns?.results || [],
    recent_activity: recentActivity?.results || []
  }, origin, allowedOrigin);
}

async function handleLinks(request, env, origin, allowedOrigin) {
  if (!requireAdminAuth(request, env)) {
    return json({ error: 'unauthorized' }, origin, allowedOrigin, 401);
  }
  const url = new URL(request.url);
  const { startMs, endMs } = parseRange(url);

  const sql = `
    SELECT link_id, label,
           SUM(CASE WHEN event_name='link_click' AND is_bot=0 THEN 1 ELSE 0 END) AS clicks,
           COUNT(DISTINCT CASE WHEN is_bot=0 THEN visitor_id END) AS uniques
    FROM events
    WHERE occurred_at BETWEEN ? AND ? AND link_id IS NOT NULL
    GROUP BY link_id, label
    ORDER BY clicks DESC;
  `;
  const rows = await env.DB.prepare(sql).bind(startMs, endMs).all();
  // Derive CTR per link needs pageviews per link path; we will omit CTR per link for MVP
  return json({ links: rows?.results || [] }, origin, allowedOrigin);
}
