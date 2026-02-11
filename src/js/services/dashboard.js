(() => {
  // Use AuthService and ApiService instead of local logic
  const auth = globalThis.AuthService;
  const api = globalThis.ApiService;

  // Run auth check immediately on page load
  auth.checkAuth().then(token => {
    if (!token) return;
    initDashboard();
  });

  // =========================================================================
  // DASHBOARD INITIALIZATION
  // =========================================================================
  function initDashboard() {
    const accountToggle = document.getElementById('account-toggle');
    const accountDropdown = document.getElementById('account-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginTime) {
      loginTime.textContent = 'Logged in ' + new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      });
    }

    if (accountToggle) {
      accountToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = accountDropdown.style.display !== 'none';
        accountDropdown.style.display = isOpen ? 'none' : 'block';
        accountToggle.classList.toggle('open');
      });
    }

    document.addEventListener('click', () => {
      if (accountDropdown) {
        accountDropdown.style.display = 'none';
        if (accountToggle) accountToggle.classList.remove('open');
      }
    });

    if (logoutBtn) logoutBtn.addEventListener('click', () => auth.logout());

    onRangeChange();
    loadData(); // Auto-load on init
  }

  const els = {
    range: document.getElementById('range'),
    start: document.getElementById('start'),
    end: document.getElementById('end'),
    load: document.getElementById('load'),
    export: document.getElementById('export'),
    alert: document.getElementById('alert'),
    lastUpdated: document.getElementById('last-updated'),
    kpiPageviews: document.getElementById('kpi-pageviews'),
    kpiClicks: document.getElementById('kpi-clicks'),
    kpiUniques: document.getElementById('kpi-uniques'),
    kpiCtr: document.getElementById('kpi-ctr'),
    chart: document.getElementById('chart'),
    heatmap: document.getElementById('heatmap'),
    activityFeed: document.getElementById('activity-feed'),
    linksTbody: document.querySelector('#links tbody'),
    refTbody: document.querySelector('#referrers tbody'),
    countriesTbody: document.querySelector('#countries tbody'),
    devicesTbody: document.querySelector('#devices tbody'),
    osTbody: document.querySelector('#operating-systems tbody'),
    browsersTbody: document.querySelector('#browsers tbody'),
    utmTbody: document.querySelector('#utm-campaigns tbody'),
    dateStartGroup: document.getElementById('date-start-group'),
    dateEndGroup: document.getElementById('date-end-group'),
    map: document.getElementById('map')
  };

  const loginTime = document.getElementById('login-time');

  let lastData = null;
  let map = null;
  let markerLayer = null;

  // =========================================================================
  // INTERACTIVE STATE
  // =========================================================================
  let chartState = { series: null, scaleX: null, scaleY: null, margin: 0, maxY: 0, pointCount: 0 };
  let heatmapState = { data: null, cellWidth: 0, cellHeight: 0, maxViews: 1, dataMap: {} };
  let chartTooltipEl = null;
  let heatmapTooltipEl = null;
  let chartHoverRafId = null;
  let heatmapHoverRafId = null;

  /** Escape HTML special characters to prevent XSS injection */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function createTooltip(id) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'chart-tooltip';
      document.body.appendChild(el);
    }
    return el;
  }

  function positionTooltip(tooltipEl, clientX, clientY) {
    const pad = 14;
    const rect = tooltipEl.getBoundingClientRect();
    let left = clientX + pad;
    let top = clientY - pad - rect.height;
    if (left + rect.width > window.innerWidth - 10) left = clientX - pad - rect.width;
    if (top < 10) top = clientY + pad;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  /** Build a single tooltip row and append it to the container */
  function buildTooltipRow(container, color, label, value) {
    const row = document.createElement('div');
    row.className = 'tooltip-row';
    const dot = document.createElement('div');
    dot.className = 'tooltip-dot';
    dot.style.background = color;
    const lbl = document.createElement('span');
    lbl.className = 'tooltip-label';
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'tooltip-value';
    val.textContent = String(value);
    row.appendChild(dot);
    row.appendChild(lbl);
    row.appendChild(val);
    container.appendChild(row);
  }

  /** Draw a single heatmap cell with optional hover highlight */
  function drawHeatmapCell(ctx, opts) {
    const { day, hour, cellWidth, cellHeight, dataMap, maxViews, hoverDay, hoverHour } = opts;
    const key = `${hour}-${day}`;
    const views = dataMap[key] || 0;
    const intensity = views / maxViews;

    const r = Math.floor(19 + (166 - 19) * intensity);
    const g = Math.floor(15 + (107 - 15) * intensity);
    const b = Math.floor(27 + (197 - 27) * intensity);

    const cx = 60 + hour * cellWidth;
    const cy = 30 + day * cellHeight;

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(cx, cy, cellWidth - 1, cellHeight - 1);

    if (day === hoverDay && hour === hoverHour) {
      ctx.strokeStyle = '#E5B8C7';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cellWidth - 1, cellHeight - 1);
    }

    if (views > 0) {
      ctx.fillStyle = intensity > 0.5 ? '#F0EDF4' : '#6A5A7E';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(views, cx + cellWidth / 2, cy + cellHeight / 2);
    }
  }

  function showAlert(msg, type = 'error') {
    els.alert.innerHTML = '';
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = msg;
    els.alert.appendChild(alertDiv);
    els.alert.style.display = 'block';
    if (type === 'success') {
      setTimeout(() => { els.alert.style.display = 'none'; }, 4000);
    }
  }

  function formatNumber(n) {
    return api.formatNumber(n);
  }


  // =========================================================================
  // ANIMATED KPI COUNTERS
  // =========================================================================
  function animateValue(el, target, suffix, duration) {
    const start = performance.now();
    const isPercent = suffix === '%';
    const from = 0;
    function tick(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - elapsed, 3); // easeOutCubic
      const current = from + (target - from) * ease;
      if (isPercent) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = formatNumber(Math.round(current));
      }
      if (elapsed < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderKPIs(totals) {
    animateValue(els.kpiPageviews, totals.pageviews || 0, '', 700);
    animateValue(els.kpiClicks, totals.clicks || 0, '', 700);
    animateValue(els.kpiUniques, totals.uniques || 0, '', 700);
    const ctr = (totals.ctr || 0) * 100;
    animateValue(els.kpiCtr, ctr, '%', 700);
  }

  // =========================================================================
  // SORTABLE TABLES WITH BAR INDICATORS
  // =========================================================================
  const numericCols = new Set(['clicks', 'uniques', 'pageviews']);
  const sortStates = new Map(); // tbodyEl -> { col, dir }

  function renderTable(tbody, rows, cols) {
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = cols.length;
      td.style.textAlign = 'center';
      td.style.padding = '40px 20px';
      td.style.color = 'var(--color-text-muted)';
      td.textContent = 'No data available';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // Compute max for each numeric column (for bar indicators)
    const maxes = {};
    cols.forEach(c => {
      if (numericCols.has(c)) {
        maxes[c] = Math.max(1, ...rows.map(r => r[c] || 0));
      }
    });

    rows.forEach(r => {
      const tr = document.createElement('tr');
      cols.forEach((c, idx) => {
        const td = document.createElement('td');
        const rawVal = r[c];
        const isNum = numericCols.has(c) && rawVal != null;

        if (isNum) {
          td.style.textAlign = 'right';
          // Bar indicator wrapper
          const wrapper = document.createElement('div');
          wrapper.className = 'bar-wrapper';
          const bar = document.createElement('div');
          bar.className = 'bar-indicator';
          const pct = Math.max(2, (rawVal / maxes[c]) * 100);
          bar.style.width = pct + '%';
          bar.style.minWidth = '4px';
          bar.style.maxWidth = '60px';
          const valSpan = document.createElement('span');
          valSpan.className = 'bar-value';
          valSpan.textContent = formatNumber(rawVal);
          wrapper.appendChild(bar);
          wrapper.appendChild(valSpan);
          td.appendChild(wrapper);
        } else {
          if (idx > 0) td.style.textAlign = 'right';
          td.textContent = rawVal == null ? '' : String(rawVal);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Setup sortable headers
    setupSortableHeaders(tbody, rows, cols);
  }

  /** Compare two row values for sort */
  function compareRowValues(a, b, col, dir) {
    let av = a[col], bv = b[col];
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av;
    }
    av = String(av || '').toLowerCase();
    bv = String(bv || '').toLowerCase();
    const cmp = av.localeCompare(bv);
    return dir === 'asc' ? cmp : -cmp;
  }

  /** Apply sort to a table: update state, headers, re-render */
  function applySortToTable(tbody, rows, cols, ths, th, idx) {
    const state = sortStates.get(tbody) || { col: null, dir: 'asc' };
    const col = cols[idx];
    let newDir = 'desc';
    if (state.col === col) {
      newDir = state.dir === 'asc' ? 'desc' : 'asc';
    }
    state.dir = newDir;
    state.col = col;
    sortStates.set(tbody, state);

    ths.forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(state.dir === 'asc' ? 'sort-asc' : 'sort-desc');

    const sorted = [...rows].sort((a, b) => compareRowValues(a, b, col, state.dir));
    renderTable(tbody, sorted, cols);
  }

  function setupSortableHeaders(tbody, rows, cols) {
    const thead = tbody.closest('table')?.querySelector('thead');
    if (!thead) return;
    const ths = thead.querySelectorAll('th');
    ths.forEach((th, idx) => {
      if (th._sortHandler) th.removeEventListener('click', th._sortHandler);
      th.classList.add('sortable');
      th._sortHandler = () => applySortToTable(tbody, rows, cols, ths, th, idx);
      th.addEventListener('click', th._sortHandler);
    });
  }

  // =========================================================================
  // CHART RENDERING — Bézier curves, gradient fills, hover interaction
  // =========================================================================
  function drawBezierLine(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.stroke();
  }

  function drawGradientFill(ctx, points, bottomY, r, g, b, alpha) {
    if (points.length < 2) return;
    const minY = Math.min(...points.map(p => p.y));
    const grad = ctx.createLinearGradient(0, minY, 0, bottomY);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.lineTo(points[points.length - 1].x, bottomY);
    ctx.lineTo(points[0].x, bottomY);
    ctx.closePath();
    ctx.fill();
  }

  function renderChart(series, hoverIdx) {
    if (!els.chart) return;
    const ctx = els.chart.getContext('2d');
    ctx.clearRect(0, 0, els.chart.width, els.chart.height);

    if (!series || series.length === 0) {
      ctx.fillStyle = '#9B8AAE';
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No data available yet', els.chart.width / 2, els.chart.height / 2);
      return;
    }

    const w = els.chart.width, h = els.chart.height;
    const margin = 48;
    const innerW = w - margin * 2;
    const innerH = h - margin * 2;
    const bottomY = margin + innerH;

    const pageviews = series.map(s => s.pageviews || 0);
    const clicks = series.map(s => s.clicks || 0);
    const maxY = Math.max(1, Math.max(...pageviews), Math.max(...clicks));
    const pointCount = Math.max(series.length, 1);

    function scaleX(i) {
      if (pointCount === 1) return margin + innerW / 2;
      return margin + (i / (pointCount - 1)) * innerW;
    }
    function scaleY(v) {
      return margin + innerH - (v / maxY) * innerH;
    }

    // Store for hover interaction
    chartState = { series, scaleX, scaleY, margin, maxY, pointCount };

    // Background grid
    ctx.strokeStyle = 'rgba(139, 75, 168, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i / 4) * innerH;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }

    // Y-axis
    ctx.strokeStyle = 'rgba(139, 75, 168, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, h - margin);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#9B8AAE';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxY / 4) * (4 - i));
      const y = margin + (i / 4) * innerH;
      ctx.fillText(String(val), margin - 8, y);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9B8AAE';
    ctx.font = '11px Inter, sans-serif';
    const labelStep = Math.max(1, Math.floor(series.length / 6));
    series.forEach((s, i) => {
      if (i % labelStep === 0 || i === series.length - 1) {
        const x = scaleX(i);
        const dateStr = s.day || '';
        const shortDate = dateStr.split('-').slice(1).join('/');
        ctx.save();
        ctx.translate(x, h - margin + 14);
        ctx.rotate(-Math.PI / 8);
        ctx.textAlign = 'right';
        ctx.fillText(shortDate, 0, 0);
        ctx.restore();
      }
    });

    if (pointCount === 1) {
      // Bar chart for single data point
      const x = scaleX(0);
      const barWidth = 40;
      const pv = pageviews[0] || 0;
      const pvHeight = (pv / maxY) * innerH;
      ctx.fillStyle = 'rgba(166, 107, 197, 0.7)';
      ctx.fillRect(x - barWidth - 8, scaleY(pv), barWidth, pvHeight);
      const cl = clicks[0] || 0;
      const clHeight = (cl / maxY) * innerH;
      ctx.fillStyle = 'rgba(229, 184, 199, 0.85)';
      ctx.fillRect(x + 8, scaleY(cl), barWidth, clHeight);
      ctx.fillStyle = '#F0EDF4';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(pv), x - barWidth / 2 - 8, scaleY(pv) - 4);
      ctx.fillText(String(cl), x + barWidth / 2 + 8, scaleY(cl) - 4);
    } else {
      // Build coordinate arrays
      const pvPoints = series.map((s, i) => ({ x: scaleX(i), y: scaleY(s.pageviews || 0) }));
      const clPoints = series.map((s, i) => ({ x: scaleX(i), y: scaleY(s.clicks || 0) }));

      // Gradient fills under curves
      drawGradientFill(ctx, pvPoints, bottomY, 166, 107, 197, 0.2);
      drawGradientFill(ctx, clPoints, bottomY, 229, 184, 199, 0.12);

      // Pageview Bézier line
      ctx.strokeStyle = '#A66BC5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawBezierLine(ctx, pvPoints);

      // Clicks Bézier line
      ctx.strokeStyle = '#E5B8C7';
      ctx.lineWidth = 2.5;
      drawBezierLine(ctx, clPoints);

      // Data point circles
      series.forEach((s, i) => {
        const isHovered = i === hoverIdx;
        ctx.fillStyle = '#A66BC5';
        ctx.beginPath();
        ctx.arc(pvPoints[i].x, pvPoints[i].y, isHovered ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = 'rgba(166, 107, 197, 0.3)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      });
      series.forEach((s, i) => {
        const isHovered = i === hoverIdx;
        ctx.fillStyle = '#E5B8C7';
        ctx.beginPath();
        ctx.arc(clPoints[i].x, clPoints[i].y, isHovered ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = 'rgba(229, 184, 199, 0.3)';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      });

      // Vertical crosshair at hovered index
      if (hoverIdx != null && hoverIdx >= 0 && hoverIdx < series.length) {
        const hx = scaleX(hoverIdx);
        ctx.save();
        ctx.strokeStyle = 'rgba(240, 237, 244, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hx, margin);
        ctx.lineTo(hx, bottomY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Legend
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#A66BC5';
    ctx.fillRect(w - 200, margin, 14, 14);
    ctx.fillStyle = '#F0EDF4';
    ctx.fillText('Pageviews', w - 180, margin);
    ctx.fillStyle = '#E5B8C7';
    ctx.fillRect(w - 200, margin + 22, 14, 14);
    ctx.fillStyle = '#F0EDF4';
    ctx.fillText('Clicks', w - 180, margin + 22);
  }

  // =========================================================================
  // CHART HOVER INTERACTION
  // =========================================================================
  function initChartHover() {
    if (!els.chart) return;
    chartTooltipEl = createTooltip('chart-tooltip');

    els.chart.addEventListener('mousemove', (e) => {
      const clientX = e.clientX, clientY = e.clientY;
      if (chartHoverRafId) return; // throttle: skip if a frame is already queued
      chartHoverRafId = requestAnimationFrame(() => {
        chartHoverRafId = null;
        const { series, scaleX, pointCount } = chartState;
        if (!series || series.length < 2) return;

        const rect = els.chart.getBoundingClientRect();
        const canvasX = (clientX - rect.left) * (els.chart.width / rect.width);

        // Find nearest data point index
        let nearest = 0;
        let minDist = Infinity;
        for (let i = 0; i < series.length; i++) {
          const dist = Math.abs(canvasX - scaleX(i));
          if (dist < minDist) { minDist = dist; nearest = i; }
        }

        // Only show if close enough
        if (minDist > (els.chart.width / pointCount) * 0.7) {
          chartTooltipEl.classList.remove('visible');
          renderChart(series, -1);
          return;
        }

        // Re-render with hover highlight
        renderChart(series, nearest);

        // Build tooltip safely (textContent, no innerHTML XSS)
        const s = series[nearest];
        chartTooltipEl.textContent = '';
        const dateDiv = document.createElement('div');
        dateDiv.className = 'tooltip-date';
        dateDiv.textContent = s.day || 'N/A';
        chartTooltipEl.appendChild(dateDiv);

        buildTooltipRow(chartTooltipEl, '#A66BC5', 'Pageviews', formatNumber(s.pageviews || 0));
        buildTooltipRow(chartTooltipEl, '#E5B8C7', 'Clicks', formatNumber(s.clicks || 0));

        chartTooltipEl.classList.add('visible');
        positionTooltip(chartTooltipEl, clientX, clientY);
      });
    });

    els.chart.addEventListener('mouseleave', () => {
      if (chartHoverRafId) { cancelAnimationFrame(chartHoverRafId); chartHoverRafId = null; }
      chartTooltipEl.classList.remove('visible');
      if (chartState.series) renderChart(chartState.series, -1);
    });
  }

  function initMap() {
    if (!map && typeof L !== 'undefined') {
      map = L.map(els.map).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
      }).addTo(map);
      markerLayer = L.layerGroup().addTo(map);
    }
  }

  function renderMap(locations) {
    if (!map) initMap();
    if (!markerLayer) return;

    markerLayer.clearLayers();

    if (!locations || locations.length === 0) {
      return;
    }

    const maxPageviews = Math.max(...locations.map(l => l.pageviews || 0), 1);

    locations.forEach(loc => {
      const lat = Number.parseFloat(loc.latitude);
      const lon = Number.parseFloat(loc.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;

      const pageviews = loc.pageviews || 0;
      const uniques = loc.uniques || 0;
      const city = loc.city || 'Unknown';
      const country = loc.country || '';

      // Size based on pageviews (5-25px radius)
      const radius = 5 + (pageviews / maxPageviews) * 20;

      const circle = L.circleMarker([lat, lon], {
        radius: radius,
        fillColor: '#A66BC5',
        color: 'rgba(166, 107, 197, 0.6)',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      // Sanitize user-sourced strings to prevent XSS in Leaflet popup
      circle.bindPopup(`
        <div style="font-family: Inter, sans-serif;">
          <strong style="color: #A66BC5;">${escapeHtml(city)}, ${escapeHtml(country)}</strong><br>
          <span style="font-size: 0.9em;">
            ${pageviews} pageview${pageviews === 1 ? '' : 's'}<br>
            ${uniques} unique visitor${uniques === 1 ? '' : 's'}
          </span>
        </div>
      `);

      circle.addTo(markerLayer);
    });

    // Auto-fit bounds if there are locations
    if (locations.length > 0) {
      const bounds = locations
        .filter(l => !Number.isNaN(Number.parseFloat(l.latitude)) && !Number.isNaN(Number.parseFloat(l.longitude)))
        .map(l => [Number.parseFloat(l.latitude), Number.parseFloat(l.longitude)]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
      }
    }
  }

  // =========================================================================
  // HEATMAP RENDERING + HOVER INTERACTION
  // =========================================================================
  const HEATMAP_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function renderHeatmap(peakHours, hoverDay, hoverHour) {
    if (!els.heatmap) return;
    const canvas = els.heatmap;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cellWidth = (w - 60) / 24;
    const cellHeight = (h - 40) / 7;
    const dataMap = {};
    let maxViews = 1;
    (peakHours || []).forEach(item => {
      const key = `${item.hour}-${item.day_of_week}`;
      dataMap[key] = item.pageviews || 0;
      maxViews = Math.max(maxViews, item.pageviews || 0);
    });

    // Store state for hover
    heatmapState = { data: peakHours, cellWidth, cellHeight, maxViews, dataMap };

    // Draw cells
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        drawHeatmapCell(ctx, { day, hour, cellWidth, cellHeight, dataMap, maxViews, hoverDay, hoverHour });
      }
    }

    // Y-axis labels
    ctx.fillStyle = '#9B8AAE';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    HEATMAP_DAYS.forEach((day, i) => {
      ctx.fillText(day, 50, 30 + i * cellHeight + cellHeight / 2);
    });

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Inter';
    for (let hr = 0; hr < 24; hr += 3) {
      ctx.fillText(hr + ':00', 60 + hr * cellWidth + cellWidth / 2, 10);
    }
  }

  function initHeatmapHover() {
    if (!els.heatmap) return;
    heatmapTooltipEl = createTooltip('heatmap-tooltip');

    els.heatmap.addEventListener('mousemove', (e) => {
      const clientX = e.clientX, clientY = e.clientY;
      if (heatmapHoverRafId) return; // throttle
      heatmapHoverRafId = requestAnimationFrame(() => {
        heatmapHoverRafId = null;
        const { data, cellWidth, cellHeight, dataMap } = heatmapState;
        if (!data) return;

        const rect = els.heatmap.getBoundingClientRect();
        const mx = (clientX - rect.left) * (els.heatmap.width / rect.width);
        const my = (clientY - rect.top) * (els.heatmap.height / rect.height);

        const hour = Math.floor((mx - 60) / cellWidth);
        const day = Math.floor((my - 30) / cellHeight);

        if (hour < 0 || hour >= 24 || day < 0 || day >= 7) {
          heatmapTooltipEl.classList.remove('visible');
          renderHeatmap(data, -1, -1);
          return;
        }

        renderHeatmap(data, day, hour);

        const key = `${hour}-${day}`;
        const views = dataMap[key] || 0;
        let hourStr;
        if (hour === 0) hourStr = '12 AM';
        else if (hour < 12) hourStr = hour + ' AM';
        else if (hour === 12) hourStr = '12 PM';
        else hourStr = (hour - 12) + ' PM';

        // Build tooltip safely (textContent, no innerHTML XSS)
        heatmapTooltipEl.textContent = '';
        const dateDiv = document.createElement('div');
        dateDiv.className = 'tooltip-date';
        dateDiv.textContent = HEATMAP_DAYS[day] + ' \u2014 ' + hourStr;
        heatmapTooltipEl.appendChild(dateDiv);

        const row = document.createElement('div');
        row.className = 'tooltip-row';
        const dot = document.createElement('div');
        dot.className = 'tooltip-dot';
        dot.style.background = '#A66BC5';
        const lbl = document.createElement('span');
        lbl.className = 'tooltip-label';
        lbl.textContent = 'Pageviews';
        const val = document.createElement('span');
        val.className = 'tooltip-value';
        val.textContent = String(views);
        row.appendChild(dot);
        row.appendChild(lbl);
        row.appendChild(val);
        heatmapTooltipEl.appendChild(row);

        heatmapTooltipEl.classList.add('visible');
        positionTooltip(heatmapTooltipEl, clientX, clientY);
      });
    });

    els.heatmap.addEventListener('mouseleave', () => {
      if (heatmapHoverRafId) { cancelAnimationFrame(heatmapHoverRafId); heatmapHoverRafId = null; }
      heatmapTooltipEl.classList.remove('visible');
      if (heatmapState.data) renderHeatmap(heatmapState.data, -1, -1);
    });
  }

  function renderActivityFeed(activity) {
    if (!els.activityFeed) return;
    els.activityFeed.innerHTML = '';

    if (!activity || activity.length === 0) {
      els.activityFeed.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }

    activity.forEach(item => {
      const div = document.createElement('div');
      div.className = 'activity-item';

      const time = new Date(item.occurred_at).toLocaleString();
      const icon = item.event_name === 'link_click' ? '🔗' : '👁️';
      const action = item.event_name === 'link_click' ? 'clicked' : 'viewed';
      const target = item.event_name === 'link_click' ? (item.label || item.link_id || 'link') : item.page_path;
      const location = item.city && item.country ? `${item.city}, ${item.country}` : (item.country || 'Unknown');
      const device = item.device || 'Unknown';
      const browser = item.browser || '';

      // SECURITY: Use textContent to prevent XSS - do not use innerHTML with user data
      const mainDiv = document.createElement('div');
      mainDiv.style.flex = '1';

      const actionDiv = document.createElement('div');
      const actionStrong = document.createElement('strong');
      actionStrong.textContent = `${icon} ${action}`;
      const targetSpan = document.createElement('span');
      targetSpan.textContent = ` ${target}`;
      actionDiv.appendChild(actionStrong);
      actionDiv.appendChild(targetSpan);

      const detailsDiv = document.createElement('div');
      detailsDiv.style.color = 'var(--color-text-muted)';
      detailsDiv.style.fontSize = 'var(--text-xs)';
      detailsDiv.style.marginTop = '4px';
      const browserInfo = browser ? ` • ${browser}` : '';
      detailsDiv.textContent = `📍 ${location} • 📱 ${device}${browserInfo}`;

      mainDiv.appendChild(actionDiv);
      mainDiv.appendChild(detailsDiv);

      const timeDiv = document.createElement('div');
      timeDiv.style.color = 'var(--color-text-muted)';
      timeDiv.style.fontSize = 'var(--text-xs)';
      timeDiv.style.whiteSpace = 'nowrap';
      timeDiv.textContent = time;

      div.appendChild(mainDiv);
      div.appendChild(timeDiv);
      els.activityFeed.appendChild(div);
    });
  }

  async function loadData() {
    els.load.classList.add('loading');
    try {
      const range = els.range.value;
      const params = { range };
      if (range === 'custom') {
        params.start = els.start.value;
        params.end = els.end.value;
        if (!params.start || !params.end) {
          showAlert('Please select both start and end dates', 'error');
          return;
        }
      }

      const summary = await api.apiGet('/summary', params);
      lastData = summary;

      renderKPIs(summary.totals || {});
      renderTable(els.linksTbody, summary.top_links || [], ['label', 'clicks', 'uniques']);
      renderTable(els.refTbody, summary.top_referrers || [], ['referrer', 'pageviews']);
      renderTable(els.utmTbody, summary.utm_campaigns || [], ['utm_source', 'utm_medium', 'utm_campaign', 'pageviews', 'clicks', 'uniques']);
      renderTable(els.countriesTbody, summary.top_countries || [], ['country', 'pageviews', 'clicks', 'uniques']);
      renderTable(els.devicesTbody, summary.devices || [], ['device', 'pageviews', 'uniques']);
      renderTable(els.osTbody, summary.operating_systems || [], ['os', 'pageviews', 'uniques']);
      renderTable(els.browsersTbody, summary.browsers || [], ['browser', 'pageviews', 'uniques']);
      renderMap(summary.locations || []);
      renderChart(summary.timeseries || []);
      renderHeatmap(summary.peak_hours || []);
      renderActivityFeed(summary.recent_activity || []);

      if (els.lastUpdated) {
        els.lastUpdated.textContent = new Date().toLocaleTimeString();
      }
      showAlert('✓ Data loaded successfully', 'success');
    } catch (err) {
      showAlert('\u274C Error: ' + err.message, 'error');
    } finally {
      els.load.classList.remove('loading');
    }
  }

  function onRangeChange() {
    const custom = els.range.value === 'custom';
    els.dateStartGroup.style.display = custom ? 'flex' : 'none';
    els.dateEndGroup.style.display = custom ? 'flex' : 'none';
  }

  function exportCSV() {
    if (!lastData) {
      showAlert('Load data first before exporting', 'error');
      return;
    }

    const lines = [
      'ANALYTICS EXPORT',
      `Exported: ${new Date().toISOString()}`,
      '',
      'KPI SUMMARY',
      `Pageviews,Clicks,Uniques,CTR`,
    ];
    const totals = lastData.totals || {};
    lines.push(`${totals.pageviews || 0},${totals.clicks || 0},${totals.uniques || 0},${((totals.ctr || 0) * 100).toFixed(1)}%`, '', 'TOP LINKS', `Link,Clicks,Uniques`);
    (lastData.top_links || []).forEach(row => {
      lines.push(`"${row.label || row.link_id || ''}",${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('', 'TOP REFERRERS', `Referrer,Pageviews`);
    (lastData.top_referrers || []).forEach(row => {
      lines.push(`"${row.referrer || 'Direct'}",${row.pageviews || 0}`);
    });
    lines.push('', 'TOP COUNTRIES', `Country,Pageviews,Clicks,Uniques`);
    (lastData.top_countries || []).forEach(row => {
      lines.push(`"${row.country || 'Unknown'}",${row.pageviews || 0},${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('', 'DEVICES', `Device,Pageviews,Uniques`);
    (lastData.devices || []).forEach(row => {
      lines.push(`"${row.device || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('', 'OPERATING SYSTEMS', `OS,Pageviews,Uniques`);
    (lastData.operating_systems || []).forEach(row => {
      lines.push(`"${row.os || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('', 'BROWSERS', `Browser,Pageviews,Uniques`);
    (lastData.browsers || []).forEach(row => {
      lines.push(`"${row.browser || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('', 'UTM CAMPAIGNS', `Source,Medium,Campaign,Pageviews,Clicks,Uniques`);
    (lastData.utm_campaigns || []).forEach(row => {
      lines.push(`"${row.utm_source || ''}","${row.utm_medium || ''}","${row.utm_campaign || ''}",${row.pageviews || 0},${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('', 'TIMESERIES', `Date,Pageviews,Clicks`);
    (lastData.timeseries || []).forEach(row => {
      lines.push(`${row.day || ''},${row.pageviews || 0},${row.clicks || 0}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize chart and heatmap hover interactions
    initChartHover();
    initHeatmapHover();
  });

  els.range.addEventListener('change', onRangeChange);
  els.load.addEventListener('click', loadData);
  els.export.addEventListener('click', exportCSV);
})();
