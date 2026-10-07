/**
 * MSUKASHA B2B - Auth Check
 * Include this in all protected pages
 * File Path: public/js/auth-check.js
 */
(async function() {
    try {
        const res = await fetch('/api/auth/check', { credentials: 'include' });
        const data = await res.json();
        if (!data.loggedIn) {
            window.location.href = '/login';
        }
    } catch (e) {
        window.location.href = '/login';
    }
})();
