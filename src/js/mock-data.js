/**
 * mock-data.js — Development-only mock data for the Analytics Dashboard.
 * Include this script BEFORE the main service scripts to stub auth & API.
 *
 * Usage: Add ?mock=true to the dashboard URL, or include this script directly.
 * This file should NOT be deployed to production.
 */
(() => {
  // ── Helper: generate dates for the last N days ──
  function recentDates(n) {
    const dates = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ── Build mock summary payload ──
  const days = recentDates(7);

  const timeseries = days.map(day => ({
    day,
    pageviews: rand(120, 480),
    clicks: rand(30, 150)
  }));

  const totalPageviews = timeseries.reduce((s, d) => s + d.pageviews, 0);
  const totalClicks = timeseries.reduce((s, d) => s + d.clicks, 0);
  const totalUniques = Math.round(totalPageviews * 0.62);

  const MOCK_SUMMARY = {
    totals: {
      pageviews: totalPageviews,
      clicks: totalClicks,
      uniques: totalUniques,
      ctr: totalClicks / Math.max(totalPageviews, 1)
    },

    timeseries,

    top_links: [
      { label: 'Instagram', link_id: 'instagram', clicks: rand(80, 200), uniques: rand(50, 140) },
      { label: 'YouTube Channel', link_id: 'youtube', clicks: rand(60, 160), uniques: rand(40, 110) },
      { label: 'Portfolio Site', link_id: 'portfolio', clicks: rand(40, 120), uniques: rand(25, 85) },
      { label: 'Discord Server', link_id: 'discord', clicks: rand(30, 100), uniques: rand(20, 70) },
      { label: 'Merch Store', link_id: 'merch', clicks: rand(20, 80), uniques: rand(15, 55) },
      { label: 'TikTok', link_id: 'tiktok', clicks: rand(15, 60), uniques: rand(10, 40) },
      { label: 'GitHub', link_id: 'github', clicks: rand(10, 50), uniques: rand(8, 35) }
    ],

    top_referrers: [
      { referrer: 'instagram.com', pageviews: rand(200, 600) },
      { referrer: 'google.com', pageviews: rand(150, 400) },
      { referrer: 'twitter.com', pageviews: rand(80, 250) },
      { referrer: 'Direct', pageviews: rand(60, 180) },
      { referrer: 'reddit.com', pageviews: rand(30, 120) },
      { referrer: 'tiktok.com', pageviews: rand(20, 100) }
    ],

    utm_campaigns: [
      { utm_source: 'instagram', utm_medium: 'social', utm_campaign: 'bio_link', pageviews: rand(150, 400), clicks: rand(50, 150), uniques: rand(40, 120) },
      { utm_source: 'twitter', utm_medium: 'social', utm_campaign: 'launch_promo', pageviews: rand(80, 200), clicks: rand(30, 80), uniques: rand(25, 70) },
      { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'weekly_digest', pageviews: rand(60, 150), clicks: rand(20, 60), uniques: rand(18, 50) },
      { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'brand_search', pageviews: rand(40, 100), clicks: rand(15, 45), uniques: rand(12, 35) }
    ],

    top_countries: [
      { country: 'United States', pageviews: rand(400, 900), clicks: rand(100, 300), uniques: rand(200, 500) },
      { country: 'United Kingdom', pageviews: rand(100, 300), clicks: rand(30, 100), uniques: rand(60, 180) },
      { country: 'Canada', pageviews: rand(80, 250), clicks: rand(25, 80), uniques: rand(50, 150) },
      { country: 'Germany', pageviews: rand(50, 150), clicks: rand(15, 50), uniques: rand(30, 100) },
      { country: 'Australia', pageviews: rand(40, 120), clicks: rand(10, 40), uniques: rand(25, 80) },
      { country: 'Japan', pageviews: rand(20, 80), clicks: rand(8, 30), uniques: rand(15, 50) }
    ],

    devices: [
      { device: 'Mobile', pageviews: rand(500, 1200), uniques: rand(300, 700) },
      { device: 'Desktop', pageviews: rand(300, 800), uniques: rand(180, 450) },
      { device: 'Tablet', pageviews: rand(40, 150), uniques: rand(25, 90) }
    ],

    operating_systems: [
      { os: 'iOS', pageviews: rand(400, 900), uniques: rand(250, 550) },
      { os: 'Android', pageviews: rand(200, 500), uniques: rand(120, 300) },
      { os: 'Windows', pageviews: rand(180, 450), uniques: rand(100, 260) },
      { os: 'macOS', pageviews: rand(100, 300), uniques: rand(60, 180) },
      { os: 'Linux', pageviews: rand(15, 60), uniques: rand(10, 40) }
    ],

    browsers: [
      { browser: 'Chrome', pageviews: rand(400, 900), uniques: rand(250, 550) },
      { browser: 'Safari', pageviews: rand(300, 700), uniques: rand(180, 420) },
      { browser: 'Firefox', pageviews: rand(60, 180), uniques: rand(35, 100) },
      { browser: 'Edge', pageviews: rand(30, 100), uniques: rand(20, 60) },
      { browser: 'Samsung Internet', pageviews: rand(15, 50), uniques: rand(10, 30) }
    ],

    locations: [
      { city: 'New York', country: 'US', latitude: '40.7128', longitude: '-74.0060', pageviews: rand(80, 200), uniques: rand(50, 120) },
      { city: 'Los Angeles', country: 'US', latitude: '34.0522', longitude: '-118.2437', pageviews: rand(60, 150), uniques: rand(35, 90) },
      { city: 'London', country: 'GB', latitude: '51.5074', longitude: '-0.1278', pageviews: rand(50, 130), uniques: rand(30, 80) },
      { city: 'Toronto', country: 'CA', latitude: '43.6532', longitude: '-79.3832', pageviews: rand(30, 100), uniques: rand(20, 60) },
      { city: 'Berlin', country: 'DE', latitude: '52.5200', longitude: '13.4050', pageviews: rand(25, 80), uniques: rand(15, 50) },
      { city: 'Sydney', country: 'AU', latitude: '-33.8688', longitude: '151.2093', pageviews: rand(20, 70), uniques: rand(12, 40) },
      { city: 'Tokyo', country: 'JP', latitude: '35.6762', longitude: '139.6503', pageviews: rand(15, 50), uniques: rand(10, 30) },
      { city: 'Chicago', country: 'US', latitude: '41.8781', longitude: '-87.6298', pageviews: rand(30, 90), uniques: rand(18, 55) },
      { city: 'Paris', country: 'FR', latitude: '48.8566', longitude: '2.3522', pageviews: rand(20, 60), uniques: rand(12, 35) },
      { city: 'Amsterdam', country: 'NL', latitude: '52.3676', longitude: '4.9041', pageviews: rand(10, 40), uniques: rand(8, 25) }
    ],

    peak_hours: (() => {
      const data = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          // Simulate realistic traffic patterns — peaks at 10-14 and 19-22
          let base = 2;
          if (hour >= 10 && hour <= 14) base = rand(15, 40);
          else if (hour >= 19 && hour <= 22) base = rand(12, 35);
          else if (hour >= 7 && hour <= 23) base = rand(3, 15);
          // Weekends slightly lower
          if (day === 0 || day === 6) base = Math.round(base * 0.7);
          data.push({ hour, day_of_week: day, pageviews: base });
        }
      }
      return data;
    })(),

    recent_activity: (() => {
      const events = [];
      const links = ['Instagram', 'YouTube Channel', 'Portfolio Site', 'Discord Server', 'Merch Store', 'TikTok', 'GitHub'];
      const cities = ['New York', 'London', 'Toronto', 'Berlin', 'Sydney', 'Tokyo', 'Los Angeles', 'Chicago'];
      const countries = ['US', 'GB', 'CA', 'DE', 'AU', 'JP', 'US', 'US'];
      const devices = ['Mobile', 'Desktop', 'Tablet', 'Mobile', 'Desktop'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Chrome'];
      const now = Date.now();

      for (let i = 0; i < 25; i++) {
        const isClick = Math.random() > 0.4;
        const cityIdx = rand(0, cities.length - 1);
        events.push({
          event_name: isClick ? 'link_click' : 'pageview',
          occurred_at: new Date(now - i * rand(30000, 300000)).toISOString(),
          label: isClick ? links[rand(0, links.length - 1)] : undefined,
          link_id: isClick ? 'link_' + rand(1, 7) : undefined,
          page_path: isClick ? undefined : '/',
          city: cities[cityIdx],
          country: countries[cityIdx],
          device: devices[rand(0, devices.length - 1)],
          browser: browsers[rand(0, browsers.length - 1)]
        });
      }
      return events;
    })()
  };

  // ── Stub AuthService (bypass login redirect) ──
  globalThis.AuthService = {
    checkAuth: () => Promise.resolve('mock-dev-token'),
    logout: () => { console.log('[MOCK] Logout called'); },
    getToken: () => 'mock-dev-token'
  };

  // ── Stub ApiService (return mock data) ──
  globalThis.ApiService = {
    apiGet: (path, params) => {
      console.log(`[MOCK] apiGet("${path}")`, params);
      if (path === '/summary') return Promise.resolve(MOCK_SUMMARY);
      return Promise.resolve({});
    },
    formatNumber: (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    }
  };

  console.log('%c[MOCK MODE] Dashboard loaded with mock data', 'color: #6B3A8A; font-weight: bold; font-size: 14px;');
})();
