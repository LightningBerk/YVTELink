# YVTELink

Official link hub for Yvette DeLaRue — virtual model, music producer, and creative.

## 🌸 Features

- **Responsive Design**: Optimized mobile and desktop experiences
- **Full-bleed Hero**: Immersive hero card with fade transitions
- **Parallax Animations**: Subtle cherry blossom decorative layers
- **Spotify Integration**: Desktop embed player for music streaming
- **Performance**: Optimized images, minimal dependencies, fast load times

## 🚀 Deployment

Hosted on GitHub Pages with custom domain: [yvette-delarue.com](https://yvette-delarue.com)

### Serverless Analytics (Cloudflare Workers + D1)

Files:
- `worker/worker.js` — Cloudflare Worker API
- `worker/migrations/0001_init.sql` — D1 schema
- `worker/wrangler.toml` — Worker config/bindings
- `config.js`, `analytics.js` — Frontend hooks
- `admin.html`, `admin.js` — Minimal admin dashboard

Setup steps:
1. Install Wrangler and login:
	- `npm i -g wrangler`
	- `wrangler login`
2. Create a D1 database:
	- `wrangler d1 create link_analytics`
	- Copy the `database_id` into `worker/wrangler.toml` under `REPLACE_WITH_D1_ID`.
3. Apply migrations:
	- `wrangler d1 migrations apply link_analytics --local` (optional for local)
	- `wrangler d1 migrations apply link_analytics`
4. Set environment variables:
	- `ALLOWED_ORIGIN` (e.g. `https://yvette-delarue.com`)
	- `ADMIN_TOKEN` (generate a strong token)
	- via `wrangler secrets put ADMIN_TOKEN` and `wrangler deploy --var ALLOWED_ORIGIN=...`
5. Deploy the Worker:
	- `cd worker`
	- `wrangler deploy`
6. Set `ANALYTICS_API_BASE` in `config.js` to your Worker URL.

Admin Usage:
- Open `/admin.html`, enter your token, select range, and load.

Event Coverage:
- `page_view` auto-sent on `DOMContentLoaded`
- `link_click` sent for anchors with `data-link-id` and `href`

Consent:
- If `ANALYTICS_REQUIRE_CONSENT` is true, call `setAnalyticsConsent(true)` before tracking.


## 🛠️ Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- CSS animations and parallax effects
- Accessible markup (ARIA labels, semantic HTML)
- Mobile-first responsive design
 - Cloudflare Worker + D1 (SQLite) for analytics

## 📝 License

© 2025 Yvette DeLaRue. All rights reserved.
