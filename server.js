require('dotenv').config();

/**
 * MSUKASHA B2B Seller Portal - Main Server
 * File Path: server.js
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// 1. Connect MongoDB
connectDB();

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_change_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ── Auth Middleware ──
const requireAuth = (req, res, next) => {
    if (!req.session.sellerId) return res.redirect('/login');
    next();
};

// Helper function to serve HTML files
const serveFile = (filename) => (req, res) => {
    res.sendFile(path.join(__dirname, 'public', filename));
};

// ── Public Pages ──
app.get('/',          serveFile('index.html'));
app.get('/login',     serveFile('pages/login.html'));
app.get('/register',  serveFile('pages/register.html'));
app.get('/about',     serveFile('pages/about.html'));
app.get('/contact',   serveFile('pages/contact.html'));
app.get('/become-seller',   serveFile('pages/become-seller.html'));
app.get('/start-selling',   serveFile('pages/start-selling.html'));
app.get('/seller-policies', serveFile('pages/seller-policies.html'));
app.get('/privacy-policy',  serveFile('pages/privacy-policy.html'));
app.get('/terms-conditions',serveFile('pages/terms-conditions.html'));
app.get('/refund-policy',   serveFile('pages/refund-policy.html'));
app.get('/commission-fees', serveFile('pages/commission-fees.html'));
app.get('/seller-support',  serveFile('pages/seller-support.html'));
app.get('/sellers',         serveFile('pages/sellers.html'));

// ── Protected Seller Pages ──
app.get('/dashboard',   requireAuth, serveFile('pages/seller-dashboard.html'));
app.get('/products',    requireAuth, serveFile('pages/products.html'));
app.get('/add-product', requireAuth, serveFile('pages/add-product.html'));
app.get('/orders',      requireAuth, serveFile('pages/orders.html'));
app.get('/bulk-orders', requireAuth, serveFile('pages/bulk-orders.html'));
app.get('/payments',    requireAuth, serveFile('pages/payments.html'));
app.get('/profile',     requireAuth, serveFile('pages/profile.html'));
app.get('/settings',    requireAuth, serveFile('pages/settings.html'));
app.get('/messages',    requireAuth, serveFile('pages/messages.html'));
app.get('/analytics',   requireAuth, serveFile('pages/analytics.html'));
app.get('/notifications', requireAuth, serveFile('pages/notifications.html'));
app.get('/security',    requireAuth, serveFile('pages/security.html'));
app.get('/commission',  requireAuth, serveFile('pages/commission.html'));
app.get('/logout',      serveFile('pages/logout.html'));

// ── Admin Panel ──
app.get('/msukasha-admin-control', serveFile('pages/admin.html'));
app.get('/admin-approvals',        serveFile('pages/approvals.html'));
app.get('/admin-users',            serveFile('pages/users.html'));
app.get('/admin-database',         serveFile('pages/database.html'));

// ── API Routes ──
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/vendor', require('./routes/vendor'));

// ── 404 ──
app.use((req, res) => {
    res.status(404).send('<div style="font-family:sans-serif;text-align:center;padding:60px"><h2>404 - Page Not Found</h2><a href="/">← Go Home</a></div>');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 MSUKASHA Seller Portal running on port: ${PORT}`));
