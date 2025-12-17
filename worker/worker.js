export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin, allowedOrigin) });
    }

    const path = url.pathname.replace(/\/$/, '');
    try {
      if (path === '/health') {
        return json({ ok: true }, origin, allowedOrigin);
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
    'Access-Control-Allow-Credentials': 'true'
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
    payload.page_path,
    payload.link_id || null,
    payload.label || null,
    payload.destination_url || null,
    payload.referrer || null,
    payload.utm_source || null,
    payload.utm_medium || null,
    payload.utm_campaign || null,
    payload.utm_content || null,
    payload.utm_term || null,
    ua,
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

  const totals = await env.DB.prepare(totalsSql).bind(startMs, endMs).first();
  const topLinks = await env.DB.prepare(topLinksSql).bind(startMs, endMs).all();
  const referrers = await env.DB.prepare(referrersSql).bind(startMs, endMs).all();
  const countries = await env.DB.prepare(countriesSql).bind(startMs, endMs).all();
  const locations = await env.DB.prepare(locationsSql).bind(startMs, endMs).all();
  const devices = await env.DB.prepare(devicesSql).bind(startMs, endMs).all();
  const operatingSystems = await env.DB.prepare(osSql).bind(startMs, endMs).all();
  const browsers = await env.DB.prepare(browsersSql).bind(startMs, endMs).all();
  const series = await env.DB.prepare(timeseriesSql).bind(startMs, endMs).all();

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
    timeseries: series?.results || []
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
