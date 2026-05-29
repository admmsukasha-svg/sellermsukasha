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

// ── Public Pages ──
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));
app.get('/login',     (req, res) => res.sendFile(path.join(__dirname, 'pages', 'login.html')));
app.get('/register',  (req, res) => res.sendFile(path.join(__dirname, 'pages', 'register.html')));
app.get('/about',     (req, res) => res.sendFile(path.join(__dirname, 'pages', 'about.html')));
app.get('/contact',   (req, res) => res.sendFile(path.join(__dirname, 'pages', 'contact.html')));
app.get('/become-seller',     (req, res) => res.sendFile(path.join(__dirname, 'pages', 'become-seller.html')));
app.get('/start-selling',     (req, res) => res.sendFile(path.join(__dirname, 'pages', 'start-selling.html')));
app.get('/seller-policies',   (req, res) => res.sendFile(path.join(__dirname, 'pages', 'seller-policies.html')));
app.get('/privacy-policy',    (req, res) => res.sendFile(path.join(__dirname, 'pages', 'privacy-policy.html')));
app.get('/terms-conditions',  (req, res) => res.sendFile(path.join(__dirname, 'pages', 'terms-conditions.html')));
app.get('/refund-policy',     (req, res) => res.sendFile(path.join(__dirname, 'pages', 'refund-policy.html')));
app.get('/commission-fees',   (req, res) => res.sendFile(path.join(__dirname, 'pages', 'commission-fees.html')));
app.get('/seller-support',    (req, res) => res.sendFile(path.join(__dirname, 'pages', 'seller-support.html')));
app.get('/sellers',   (req, res) => res.sendFile(path.join(__dirname, 'pages', 'sellers.html')));

// ── Protected Seller Pages ──
app.get('/dashboard',   requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'seller-dashboard.html')));
app.get('/products',    requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'products.html')));
app.get('/add-product', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'add-product.html')));
app.get('/orders',      requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'orders.html')));
app.get('/bulk-orders', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'bulk-orders.html')));
app.get('/payments',    requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'payments.html')));
app.get('/profile',     requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'profile.html')));
app.get('/settings',    requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'settings.html')));
app.get('/messages',    requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'messages.html')));
app.get('/analytics',   requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'analytics.html')));
app.get('/notifications', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'notifications.html')));
app.get('/security',    requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'security.html')));
app.get('/commission',  requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'pages', 'commission.html')));
app.get('/logout',      (req, res)  => res.sendFile(path.join(__dirname, 'pages', 'logout.html')));

// ── Admin Panel ──
app.get('/msukasha-admin-control', (req, res) => res.sendFile(path.join(__dirname, 'pages', 'admin.html')));
app.get('/admin-approvals',        (req, res) => res.sendFile(path.join(__dirname, 'pages', 'approvals.html')));
app.get('/admin-users',            (req, res) => res.sendFile(path.join(__dirname, 'pages', 'users.html')));
app.get('/admin-database',         (req, res) => res.sendFile(path.join(__dirname, 'pages', 'database.html')));

// ── API Routes ──
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/vendor', require('./routes/vendor'));

// ── 404 ──
app.use((req, res) => {
    res.status(404).send('<div style="font-family:sans-serif;text-align:center;padding:60px"><h2>404 - Page Not Found</h2><a href="/">← Go Home</a></div>');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 MSUKASHA Seller Portal running on port: ${PORT}`));
