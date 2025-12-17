(() => {
  const cfg = window.ANALYTICS_CONFIG || {};
  const API_BASE = (cfg.ANALYTICS_API_BASE || '').replace(/\/$/, '');

  // =========================================================================
  // AUTH GUARD: Check if user is authenticated on page load
  // =========================================================================
  let authToken = null;

  async function checkAuth() {
    // Try to get token from sessionStorage first (freshly logged in)
    let token = sessionStorage.getItem('auth_token');
    
    // Fallback to localStorage backup if session cleared
    if (!token) {
      token = localStorage.getItem('auth_token_backup');
    }

    if (!token) {
      // No token found, redirect to login
      // Save the current URL so we can return after login
      sessionStorage.setItem('return_to', window.location.href);
      window.location.href = '/src/pages/login.html';
      return false;
    }

    // Verify token is still valid with backend
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Token invalid');
      }

      const data = await res.json();
      if (!data.authenticated) {
        throw new Error('Not authenticated');
      }

      // Token is valid, store for use
      authToken = token;
      return true;
    } catch (err) {
      // Token is invalid, clear storage and redirect to login
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_backup');
      sessionStorage.setItem('return_to', window.location.href);
      window.location.href = '/src/pages/login.html';
      return false;
    }
  }

  // Run auth check immediately on page load
  checkAuth().then(authenticated => {
    if (!authenticated) return;

    // If we reach here, user is authenticated
    initDashboard();
  });

  // =========================================================================
  // DASHBOARD INITIALIZATION
  // =========================================================================
  function initDashboard() {
    // Set up account menu and dropdown
    const accountToggle = document.getElementById('account-toggle');
    const accountDropdown = document.getElementById('account-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Update login time
    const loginTime = document.getElementById('login-time');
    if (loginTime) {
      loginTime.textContent = 'Logged in ' + new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Toggle dropdown menu
    if (accountToggle) {
      accountToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = accountDropdown.style.display !== 'none';
        accountDropdown.style.display = isOpen ? 'none' : 'block';
        accountToggle.classList.toggle('open');
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (accountDropdown) {
        accountDropdown.style.display = 'none';
        if (accountToggle) accountToggle.classList.remove('open');
      }
    });
    
    // Close dropdown when clicking inside it
    if (accountDropdown) {
      accountDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Continue with normal initialization
    loadToken();
    onRangeChange();
  }

  async function handleLogout(e) {
    e.preventDefault();
    try {
      // Call logout endpoint (optional, for server-side cleanup)
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(() => {}); // Ignore errors on logout
    } finally {
      // Clear tokens and redirect to login
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_backup');
      window.location.href = '/src/pages/login.html';
    }
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

  let lastData = null;
  let map = null;
  let markerLayer = null;

  function showAlert(msg, type = 'error') {
    // SECURITY: Use textContent to prevent XSS
    els.alert.innerHTML = ''; // Clear first
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = msg;
    els.alert.appendChild(alertDiv);
    els.alert.style.display = 'block';
    if (type === 'success') {
      setTimeout(() => { els.alert.style.display = 'none'; }, 4000);
    }
  }

  function updateStatus(authenticated) {
    if (authenticated) {
      els.statusBadge.textContent = '✓ Authenticated';
      els.statusBadge.className = 'status-badge authenticated';
      els.export.style.display = 'inline-block';
    } else {
      els.statusBadge.textContent = '';
      els.statusBadge.className = 'status-badge';
      els.export.style.display = 'none';
    }
  }

  async function apiGet(path, params = {}){
    const token = authToken;
    const url = new URL(API_BASE + path);
    Object.entries(params).forEach(([k,v])=>{ if(v!=null) url.searchParams.set(k, v); });
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      mode: 'cors'
    });
    if (!res.ok) {
      if (res.status === 401) {
        // Token expired or invalid, redirect to login
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_backup');
        sessionStorage.setItem('return_to', window.location.href);
        window.location.href = '/src/pages/login.html';
      }
      updateStatus(false);
      throw new Error('API error ' + res.status);
    }
    updateStatus(true);
    return res.json();
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function renderKPIs(totals){
    els.kpiPageviews.textContent = formatNumber(totals.pageviews || 0);
    els.kpiClicks.textContent = formatNumber(totals.clicks || 0);
    els.kpiUniques.textContent = formatNumber(totals.uniques || 0);
    const ctr = (totals.ctr || 0) * 100;
    els.kpiCtr.textContent = ctr.toFixed(1) + '%';
  }

  function renderTable(tbody, rows, cols){
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = cols.length;
      td.style.textAlign = 'center';
      td.style.padding = '40px 20px';
      td.style.color = '#6B3A8A';
      td.textContent = 'No data available';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    rows.forEach(r => {
      const tr = document.createElement('tr');
      cols.forEach((c, idx) => {
        const td = document.createElement('td');
        let val = r[c] == null ? '' : String(r[c]);
        if ((c === 'clicks' || c === 'uniques' || c === 'pageviews') && r[c] != null) {
          val = formatNumber(r[c]);
        }
        if (idx > 0) td.style.textAlign = 'right';
        td.textContent = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderChart(series){
    const ctx = els.chart.getContext('2d');
    ctx.clearRect(0, 0, els.chart.width, els.chart.height);
    
    if (!series || series.length === 0) {
      ctx.fillStyle = '#6B3A8A';
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
    
    const pageviews = series.map(s => s.pageviews || 0);
    const clicks = series.map(s => s.clicks || 0);
    const maxY = Math.max(1, Math.max(...pageviews), Math.max(...clicks));
    const pointCount = Math.max(series.length, 1);

    function scaleX(i){ 
      if (pointCount === 1) return margin + innerW / 2;
      return margin + (i / (pointCount - 1)) * innerW; 
    }
    function scaleY(v){ 
      return margin + innerH - (v / maxY) * innerH; 
    }

    // Background grid
    ctx.strokeStyle = 'rgba(107, 58, 138, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i / 4) * innerH;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(w - margin, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(107, 58, 138, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, h - margin);
    ctx.lineTo(w - margin, h - margin);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6B3A8A';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = margin + (i / 4) * innerH;
      const val = Math.round(maxY * (1 - i / 4));
      ctx.fillText(val, margin - 12, y);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6B3A8A';
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

    // Bar chart background (for single point)
    if (pointCount === 1) {
      const x = scaleX(0);
      const barWidth = 40;

      // Pageviews bar (purple)
      const pv = pageviews[0] || 0;
      const pvHeight = (pv / maxY) * innerH;
      ctx.fillStyle = 'rgba(107, 58, 138, 0.7)';
      ctx.fillRect(x - barWidth - 8, scaleY(pv), barWidth, pvHeight);

      // Clicks bar (pink)
      const cl = clicks[0] || 0;
      const clHeight = (cl / maxY) * innerH;
      ctx.fillStyle = 'rgba(246, 209, 221, 0.9)';
      ctx.fillRect(x + 8, scaleY(cl), barWidth, clHeight);

      // Value labels on bars
      ctx.fillStyle = '#0f1720';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(pv), x - barWidth / 2 - 8, scaleY(pv) - 4);
      ctx.fillText(String(cl), x + barWidth / 2 + 8, scaleY(cl) - 4);
    } else {
      // Line chart for multiple points
      // Pageviews line (purple)
      ctx.strokeStyle = '#6B3A8A';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      series.forEach((s, i) => {
        const x = scaleX(i);
        const y = scaleY(s.pageviews || 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Clicks line (pink)
      ctx.strokeStyle = '#F6D1DD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      series.forEach((s, i) => {
        const x = scaleX(i);
        const y = scaleY(s.clicks || 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Data point circles
      ctx.fillStyle = '#6B3A8A';
      series.forEach((s, i) => {
        const x = scaleX(i);
        const y = scaleY(s.pageviews || 0);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#F6D1DD';
      series.forEach((s, i) => {
        const x = scaleX(i);
        const y = scaleY(s.clicks || 0);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Legend
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.fillStyle = '#6B3A8A';
    ctx.fillRect(w - 200, margin, 14, 14);
    ctx.fillStyle = '#0f1720';
    ctx.fillText('Pageviews', w - 180, margin);

    ctx.fillStyle = '#F6D1DD';
    ctx.fillRect(w - 200, margin + 22, 14, 14);
    ctx.fillStyle = '#0f1720';
    ctx.fillText('Clicks', w - 180, margin + 22);
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
      const lat = parseFloat(loc.latitude);
      const lon = parseFloat(loc.longitude);
      if (isNaN(lat) || isNaN(lon)) return;

      const pageviews = loc.pageviews || 0;
      const uniques = loc.uniques || 0;
      const city = loc.city || 'Unknown';
      const country = loc.country || '';

      // Size based on pageviews (5-25px radius)
      const radius = 5 + (pageviews / maxPageviews) * 20;

      const circle = L.circleMarker([lat, lon], {
        radius: radius,
        fillColor: '#6B3A8A',
        color: '#fff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      circle.bindPopup(`
        <div style="font-family: Inter, sans-serif;">
          <strong style="color: #6B3A8A;">${city}, ${country}</strong><br>
          <span style="font-size: 0.9em;">
            ${pageviews} pageview${pageviews !== 1 ? 's' : ''}<br>
            ${uniques} unique visitor${uniques !== 1 ? 's' : ''}
          </span>
        </div>
      `);

      circle.addTo(markerLayer);
    });

    // Auto-fit bounds if there are locations
    if (locations.length > 0) {
      const bounds = locations
        .filter(l => !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude)))
        .map(l => [parseFloat(l.latitude), parseFloat(l.longitude)]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
      }
    }
  }

  function renderHeatmap(peakHours) {
    if (!els.heatmap) return;
    const canvas = els.heatmap;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cellWidth = (w - 60) / 24;
    const cellHeight = (h - 40) / 7;

    // Create data map
    const dataMap = {};
    let maxViews = 1;
    (peakHours || []).forEach(item => {
      const key = `${item.hour}-${item.day_of_week}`;
      dataMap[key] = item.pageviews || 0;
      maxViews = Math.max(maxViews, item.pageviews || 0);
    });

    // Draw cells
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${hour}-${day}`;
        const views = dataMap[key] || 0;
        const intensity = views / maxViews;
        
        // Purple gradient based on intensity
        const r = Math.floor(107 + (255 - 107) * (1 - intensity));
        const g = Math.floor(58 + (255 - 58) * (1 - intensity));
        const b = Math.floor(138 + (255 - 138) * (1 - intensity));
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(60 + hour * cellWidth, 30 + day * cellHeight, cellWidth - 1, cellHeight - 1);
        
        // Add text for significant values
        if (views > 0) {
          ctx.fillStyle = intensity > 0.5 ? '#fff' : '#6B3A8A';
          ctx.font = 'bold 10px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(views, 60 + hour * cellWidth + cellWidth / 2, 30 + day * cellHeight + cellHeight / 2);
        }
      }
    }

    // Y-axis labels (days)
    ctx.fillStyle = '#6B3A8A';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    days.forEach((day, i) => {
      ctx.fillText(day, 50, 30 + i * cellHeight + cellHeight / 2);
    });

    // X-axis labels (hours)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Inter';
    for (let h = 0; h < 24; h += 3) {
      ctx.fillText(h + ':00', 60 + h * cellWidth + cellWidth / 2, 10);
    }
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
      detailsDiv.textContent = `📍 ${location} • 📱 ${device}${browser ? ` • ${browser}` : ''}`;
      
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

  async function loadData(){
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

      const summary = await apiGet('/summary', params);
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

      els.lastUpdated.textContent = new Date().toLocaleTimeString();
      showAlert('✓ Data loaded successfully', 'success');
    } catch (err) {
      showAlert('❌ Error: ' + err.message, 'error');
      updateStatus(false);
    } finally {
      els.load.classList.remove('loading');
    }
  }

  function onRangeChange(){
    const custom = els.range.value === 'custom';
    els.dateStartGroup.style.display = custom ? 'flex' : 'none';
    els.dateEndGroup.style.display = custom ? 'flex' : 'none';
  }

  function exportCSV() {
    if (!lastData) {
      showAlert('Load data first before exporting', 'error');
      return;
    }

    const lines = [];
    lines.push('ANALYTICS EXPORT');
    lines.push(`Exported: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('KPI SUMMARY');
    const totals = lastData.totals || {};
    lines.push(`Pageviews,Clicks,Uniques,CTR`);
    lines.push(`${totals.pageviews || 0},${totals.clicks || 0},${totals.uniques || 0},${((totals.ctr || 0) * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('TOP LINKS');
    lines.push(`Link,Clicks,Uniques`);
    (lastData.top_links || []).forEach(row => {
      lines.push(`"${row.label || row.link_id || ''}",${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('TOP REFERRERS');
    lines.push(`Referrer,Pageviews`);
    (lastData.top_referrers || []).forEach(row => {
      lines.push(`"${row.referrer || 'Direct'}",${row.pageviews || 0}`);
    });
    lines.push('');

    lines.push('TOP COUNTRIES');
    lines.push(`Country,Pageviews,Clicks,Uniques`);
    (lastData.top_countries || []).forEach(row => {
      lines.push(`"${row.country || 'Unknown'}",${row.pageviews || 0},${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('DEVICES');
    lines.push(`Device,Pageviews,Uniques`);
    (lastData.devices || []).forEach(row => {
      lines.push(`"${row.device || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('OPERATING SYSTEMS');
    lines.push(`OS,Pageviews,Uniques`);
    (lastData.operating_systems || []).forEach(row => {
      lines.push(`"${row.os || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('BROWSERS');
    lines.push(`Browser,Pageviews,Uniques`);
    (lastData.browsers || []).forEach(row => {
      lines.push(`"${row.browser || 'Unknown'}",${row.pageviews || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('UTM CAMPAIGNS');
    lines.push(`Source,Medium,Campaign,Pageviews,Clicks,Uniques`);
    (lastData.utm_campaigns || []).forEach(row => {
      lines.push(`"${row.utm_source || ''}","${row.utm_medium || ''}","${row.utm_campaign || ''}",${row.pageviews || 0},${row.clicks || 0},${row.uniques || 0}`);
    });
    lines.push('');

    lines.push('TIMESERIES');
    lines.push(`Date,Pageviews,Clicks`);
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
    // Auth check and dashboard init already happened above
    // This is just for additional event listener setup
  });

  els.range.addEventListener('change', onRangeChange);
  els.load.addEventListener('click', loadData);
  els.export.addEventListener('click', exportCSV);
})();
