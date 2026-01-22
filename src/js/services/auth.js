/**
 * auth.js - Session and Token Management
 */
globalThis.AuthService = (() => {
    const cfg = globalThis.ANALYTICS_CONFIG || {};
    const API_BASE = (cfg.ANALYTICS_API_BASE || '').replace(/\/$/, '');

    let authToken = null;

    async function checkAuth() {
        let token = sessionStorage.getItem('auth_token');
        if (!token) {
            token = localStorage.getItem('auth_token_backup');
        }

        if (!token) {
            sessionStorage.setItem('return_to', globalThis.location.href);
            globalThis.location.href = '/src/pages/login.html';
            return null;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/verify`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Token invalid');

            const data = await res.json();
            if (!data.authenticated) throw new Error('Not authenticated');

            authToken = token;
            return token;
        } catch (err) {
            globalThis.console.error('Auth check failed:', err.message);
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token_backup');
            sessionStorage.setItem('return_to', globalThis.location.href);
            globalThis.location.href = '/src/pages/login.html';
            return null;
        }
    }

    async function logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(() => { });
        } finally {
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token_backup');
            globalThis.location.href = '/src/pages/login.html';
        }
    }

    return {
        checkAuth,
        logout,
        getToken: () => authToken
    };
})();
