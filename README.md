# YVTELink — Analytics-Powered Link Hub

> 🌸 Official link hub for Yvette DeLaRue — virtual model, music producer, and creative  
> Powered by serverless analytics and a modern design system

[![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-blue)](https://lightningberk.github.io/YVTELink/)
[![Cloudflare Workers](https://img.shields.io/badge/analytics-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)](#license)

## ✨ Features

### Frontend
- **Responsive Design** — Mobile-first approach optimized for all devices
- **Hero Section** — Full-bleed immersive card with fade transitions
- **Parallax Effects** — Subtle cherry blossom decorative layers
- **Spotify Integration** — Desktop embed player for music streaming
- **Performance Optimized** — Minimal dependencies, fast load times
- **Accessible** — ARIA labels and semantic HTML throughout

### Analytics
- **Real-time Tracking** — Page views and link clicks with geolocation
- **Device Detection** — Identify device type, OS, and browser
- **Campaign Tracking** — UTM parameter capture and aggregation
- **Visitor Mapping** — Interactive world map with visit locations
- **Heatmap Analytics** — Peak hours visualization
- **Advanced Metrics** — Click-through rates, unique visitors, and more

### Admin Dashboard
- **Modern UI** — Professional card-based layout with design system
- **Authentication** — Secure token-based access control
- **Real-time Data** — Live updates with 60-second refresh
- **Multiple Views** — Tables, charts, heatmaps, and maps
- **Export** — Download analytics as CSV for further analysis
- **Responsive** — Works seamlessly on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for Wrangler)
- Cloudflare account (for Workers and D1)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/LightningBerk/YVTELink.git
cd YVTELink

# Install Wrangler globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Create D1 database
wrangler d1 create link_analytics

# Copy database ID into worker/wrangler.toml
# Update REPLACE_WITH_D1_ID with your database ID

# Apply migrations
wrangler d1 migrations apply link_analytics --remote

# Set secrets
wrangler secret put ADMIN_TOKEN
# Enter a strong token when prompted

# Deploy the Worker
cd worker && wrangler deploy

# Update config.js with your Worker URL
# Edit config.js and set ANALYTICS_API_BASE to your deployed Worker URL
```

### Local Testing

1. Open `index.html` in your browser (or use `python -m http.server 8000`)
2. Navigate to `/admin/admin.html` and enter your admin token
3. Select a date range and click "Load Data"

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design and component overview
- **[SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** — Detailed deployment instructions
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — CSS tokens and component styles
- **[API.md](docs/API.md)** — Analytics API endpoints and data models
- **[ANALYTICS.md](docs/ANALYTICS.md)** — Tracking events and implementation details

## 🏗️ Project Structure

```
├── index.html              # Main landing page
├── admin/
│   ├── admin.html          # Analytics dashboard
│   ├── admin.js            # Dashboard logic
│   └── admin.css           # Dashboard styles
├── worker/
│   ├── worker.js           # Cloudflare Worker API
│   ├── wrangler.toml       # Worker configuration
│   └── migrations/         # D1 database migrations
├── config.js               # Analytics configuration
├── analytics.js            # Tracking implementation
├── main.js                 # Page logic
├── styles.css              # Global styles
└── assets/                 # Images and icons
```

## 🔧 Technology Stack

### Frontend
- **HTML5** — Semantic markup
- **CSS3** — Animations, grid, flexbox
- **Vanilla JavaScript** — No frameworks or build tools
- **Leaflet.js** — Interactive mapping (admin dashboard)

### Backend
- **Cloudflare Workers** — Serverless compute
- **D1** — Serverless SQLite database
- **Wrangler CLI** — Worker deployment and management

### Deployment
- **GitHub Pages** — Static hosting
- **Custom Domain** — CNAME configuration
- **HTTPS** — Automatic with GitHub Pages

## 📊 Analytics Features

### Tracking
- **Events**: Page views, link clicks
- **Metadata**: User agent, referrer, page path
- **Geolocation**: Country, region, city, timezone, coordinates
- **Device Info**: Device type, operating system, browser
- **Campaigns**: UTM source, medium, campaign parameters
- **Session**: Unique visitor ID, timestamp

### Dashboard Widgets
1. **KPI Cards** — Pageviews, clicks, unique visitors, CTR
2. **Timeseries Chart** — Pageviews and clicks over time
3. **Peak Hours Heatmap** — Activity by hour and day of week
4. **Real-time Activity Feed** — Last 50 events with device/location
5. **Top Links Table** — Performance of each link
6. **Top Referrers Table** — Traffic sources
7. **UTM Campaigns** — Marketing campaign performance
8. **Visitor Map** — World map with visitor locations
9. **Top Countries** — Geographic breakdown
10. **Device Breakdown** — Device, OS, and browser statistics

## 🔐 Security

- **Token Authentication** — Secure admin dashboard access
- **CORS Headers** — Strict origin validation
- **Rate Limiting** — 15 events per 15 seconds per IP
- **Bot Detection** — Filters bot user agents
- **Privacy** — No IP address storage, uses Cloudflare geolocation
- **Environment Variables** — Secrets stored in Cloudflare

## 📱 Responsive Design

- **Mobile** (<480px) — Single column, optimized touch
- **Tablet** (480-768px) — 2-column grid layout
- **Desktop** (>768px) — Full 1400px container, 4-column grids

## 🎨 Design System

The project uses a comprehensive CSS custom property system with:
- **8 Color Tokens** — Primary, secondary, backgrounds, text, status
- **8 Spacing Levels** — Consistent 8px-based scale
- **4 Shadow Levels** — For visual hierarchy
- **8 Typography Sizes** — With proper hierarchy
- **3 Transition Durations** — For smooth animations

See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete reference.

## 🧪 Testing

### Manual Testing
1. Visit the main page and verify all links work
2. Check responsive design on different screen sizes
3. Access admin dashboard with correct/incorrect tokens
4. Load data for different date ranges
5. Verify CSV export contains all data

### Browser Support
- Chrome 49+
- Firefox 49+
- Safari 9.1+
- Edge 15+
- Modern mobile browsers

## 📝 License

© 2025 Yvette DeLaRue. All rights reserved.

## 🤝 Contributing

To request features or report issues, please open a GitHub issue with:
- Clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Browser and device information

## 📧 Contact

For inquiries about this project, contact the repository owner or visit [yvette-delarue.com](https://yvette-delarue.com)
