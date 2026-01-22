/**
 * api.js - Data Fetching Service
 */
globalThis.ApiService = (() => {
    const cfg = globalThis.ANALYTICS_CONFIG || {};
    const API_BASE = (cfg.ANALYTICS_API_BASE || '').replace(/\/$/, '');

    async function apiGet(path, params = {}) {
        const token = globalThis.AuthService.getToken();
        const url = new URL(API_BASE + path);
        Object.entries(params).forEach(([k, v]) => {
            if (v != null) url.searchParams.set(k, v);
        });

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
            mode: 'cors'
        });

        if (!res.ok) {
            if (res.status === 401) {
                // Shared 401 handler
                sessionStorage.removeItem('auth_token');
                localStorage.removeItem('auth_token_backup');
                sessionStorage.setItem('return_to', globalThis.location.href);
                globalThis.location.href = '/src/pages/login.html';
            }
            throw new Error('API error ' + res.status);
        }
        return res.json();
    }

    function formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return String(n);
    }

    return {
        apiGet,
        formatNumber
    };
})();
