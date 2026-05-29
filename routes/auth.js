/**
 * MSUKASHA B2B - Auth Routes
 * File Path: routes/auth.js
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');

// Multer setup for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'doc-' + unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|jpg|jpeg|png/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        if (ext) return cb(null, true);
        cb(new Error('Only PDF, JPG, PNG files allowed'));
    }
});

// POST /api/auth/register
router.post('/register', upload.single('document'), authController.registerSeller);

// POST /api/auth/login
router.post('/login', authController.loginSeller);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// GET /api/auth/check - Check if logged in (for frontend)
router.get('/check', (req, res) => {
    if (req.session.sellerId) {
        res.json({ success: true, loggedIn: true, companyName: req.session.companyName });
    } else {
        res.json({ success: false, loggedIn: false });
    }
});

module.exports = router;
