(() => {
  const cfg = window.ANALYTICS_CONFIG || {};
  const API_BASE = (cfg.ANALYTICS_API_BASE || '').replace(/\/$/, '');

  const els = {
    token: document.getElementById('token'),
    range: document.getElementById('range'),
    start: document.getElementById('start'),
    end: document.getElementById('end'),
    load: document.getElementById('load'),
    kpiPageviews: document.getElementById('kpi-pageviews'),
    kpiClicks: document.getElementById('kpi-clicks'),
    kpiUniques: document.getElementById('kpi-uniques'),
    kpiCtr: document.getElementById('kpi-ctr'),
    chart: document.getElementById('chart'),
    linksTbody: document.querySelector('#links tbody'),
    refTbody: document.querySelector('#referrers tbody')
  };

  function saveToken(){ sessionStorage.setItem('admin_token', els.token.value || ''); }
  function loadToken(){ els.token.value = sessionStorage.getItem('admin_token') || ''; }

  async function apiGet(path, params = {}){
    const token = sessionStorage.getItem('admin_token') || '';
    const url = new URL(API_BASE + path);
    Object.entries(params).forEach(([k,v])=>{ if(v!=null) url.searchParams.set(k, v); });
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      mode: 'cors'
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    return res.json();
  }

  function renderKPIs(totals){
    els.kpiPageviews.textContent = String(totals.pageviews || 0);
    els.kpiClicks.textContent = String(totals.clicks || 0);
    els.kpiUniques.textContent = String(totals.uniques || 0);
    const ctr = (totals.ctr || 0) * 100;
    els.kpiCtr.textContent = ctr.toFixed(1) + '%';
  }

  function renderTable(tbody, rows, cols){
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = r[c] == null ? '' : String(r[c]);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function renderChart(series){
    const ctx = els.chart.getContext('2d');
    ctx.clearRect(0,0,els.chart.width,els.chart.height);
    const w = els.chart.width, h = els.chart.height;
    const margin = 24;
    const innerW = w - margin*2;
    const innerH = h - margin*2;
    const pageviews = series.map(s => s.pageviews || 0);
    const clicks = series.map(s => s.clicks || 0);
    const maxY = Math.max(1, ...pageviews, ...clicks);

    function scaleX(i){ return margin + (i/(series.length-1||1)) * innerW; }
    function scaleY(v){ return margin + innerH - (v/maxY)*innerH; }

    // Axes
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(margin, margin); ctx.lineTo(margin, h-margin); ctx.lineTo(w-margin, h-margin); ctx.stroke();

    // Pageviews line
    ctx.strokeStyle = '#6B3A8A'; ctx.lineWidth = 2; ctx.beginPath();
    series.forEach((s,i)=>{ const x=scaleX(i), y=scaleY(s.pageviews||0); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();
    // Clicks line
    ctx.strokeStyle = '#F6D1DD'; ctx.lineWidth = 2; ctx.beginPath();
    series.forEach((s,i)=>{ const x=scaleX(i), y=scaleY(s.clicks||0); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();
  }

  async function loadData(){
    saveToken();
    const range = els.range.value;
    const params = { range };
    if (range === 'custom') {
      params.start = els.start.value;
      params.end = els.end.value;
    }
    const summary = await apiGet('/summary', params);
    renderKPIs(summary.totals || {});
    renderTable(els.linksTbody, summary.top_links || [], ['label','clicks','uniques']);
    renderTable(els.refTbody, summary.top_referrers || [], ['referrer','pageviews']);
    renderChart(summary.timeseries || []);

    const links = await apiGet('/links', params);
    // Could render detailed per-link CTR here in future.
  }

  function onRangeChange(){
    const custom = els.range.value === 'custom';
    els.start.style.display = custom ? '' : 'none';
    els.end.style.display = custom ? '' : 'none';
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadToken();
    onRangeChange();
  });
  els.range.addEventListener('change', onRangeChange);
  els.load.addEventListener('click', () => {
    loadData().catch(err => alert('Error: ' + err.message));
  });
})();
