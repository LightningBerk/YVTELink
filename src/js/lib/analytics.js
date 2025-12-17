(() => {
  const cfg = window.ANALYTICS_CONFIG || {};
  const API_BASE = cfg.ANALYTICS_API_BASE || '';
  const ENABLED = !!cfg.ANALYTICS_ENABLED;
  const REQUIRE_CONSENT = !!cfg.ANALYTICS_REQUIRE_CONSENT;

  const LS_VISITOR_ID = 'visitor_id';
  const SS_SESSION_ID = 'session_id';
  const SS_UTM = 'utm_params';
  const LS_CONSENT = 'analytics_consent';

  function uuidv4(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function getVisitorId(){
    let v = localStorage.getItem(LS_VISITOR_ID);
    if (!v) { v = uuidv4(); localStorage.setItem(LS_VISITOR_ID, v); }
    return v;
  }
  function getSessionId(){
    let s = sessionStorage.getItem(SS_SESSION_ID);
    if (!s) { s = uuidv4(); sessionStorage.setItem(SS_SESSION_ID, s); }
    return s;
  }

  function hasAnalyticsConsent(){
    if (!REQUIRE_CONSENT) return true;
    return localStorage.getItem(LS_CONSENT) === 'true';
  }
  function setAnalyticsConsent(val){
    localStorage.setItem(LS_CONSENT, val ? 'true' : 'false');
  }
  window.setAnalyticsConsent = setAnalyticsConsent;
  window.hasAnalyticsConsent = hasAnalyticsConsent;

  function captureUTMs(){
    const qs = new URLSearchParams(location.search);
    const utm = {
      utm_source: qs.get('utm_source') || null,
      utm_medium: qs.get('utm_medium') || null,
      utm_campaign: qs.get('utm_campaign') || null,
      utm_content: qs.get('utm_content') || null,
      utm_term: qs.get('utm_term') || null
    };
    sessionStorage.setItem(SS_UTM, JSON.stringify(utm));
  }
  function readUTMs(){
    try { return JSON.parse(sessionStorage.getItem(SS_UTM) || '{}'); } catch { return {}; }
  }

  function sendEvent(event){
    if (!ENABLED || !API_BASE) return;
    if (REQUIRE_CONSENT && !hasAnalyticsConsent()) return;
    const url = API_BASE.replace(/\/$/, '') + '/track';
    const body = JSON.stringify(event);
    const headers = { 'Content-Type': 'application/json' };
    try {
      if (navigator.sendBeacon) {
        // sendBeacon is fire-and-forget; does not block page unload
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback to fetch with keepalive for older browsers
        fetch(url, { method: 'POST', headers, body, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(()=>{});
      }
    } catch {}
  }

  function trackPageView(){
    const visitor_id = getVisitorId();
    const session_id = getSessionId();
    const utm = readUTMs();
    const event = {
      event_id: uuidv4(),
      event_name: 'page_view',
      visitor_id,
      session_id,
      page_path: location.pathname,
      referrer: document.referrer || null,
      ...utm
    };
    sendEvent(event);
  }

  function attachLinkClicks(){
    const anchors = document.querySelectorAll('a[data-link-id][href]');
    anchors.forEach(a => {
      a.addEventListener('click', () => {
        const visitor_id = getVisitorId();
        const session_id = getSessionId();
        const utm = readUTMs();
        const event = {
          event_id: uuidv4(),
          event_name: 'link_click',
          visitor_id,
          session_id,
          page_path: location.pathname,
          link_id: a.getAttribute('data-link-id'),
          label: a.getAttribute('data-label') || (a.textContent || '').trim() || null,
          destination_url: a.href,
          referrer: document.referrer || null,
          ...utm
        };
        sendEvent(event);
      }, { passive: true });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { captureUTMs(); } catch {}
    trackPageView();
    attachLinkClicks();
  });
})();
