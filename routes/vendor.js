/**
 * MSUKASHA B2B - Vendor Routes
 * File Path: routes/vendor.js
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const vendorController = require('../controllers/vendorController');

// Auth middleware
const requireAuth = (req, res, next) => {
    if (!req.session.sellerId) {
        return res.status(401).json({ success: false, message: 'Login karein pehle.' });
    }
    next();
};

// Product image upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'product-' + unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

// All routes need auth
router.use(requireAuth);

// GET  /api/vendor/dashboard
router.get('/dashboard', vendorController.getDashboardStats);

// GET  /api/vendor/profile
router.get('/profile', vendorController.getProfile);

// PUT  /api/vendor/profile
router.put('/profile', vendorController.updateProfile);

// GET  /api/vendor/products
router.get('/products', vendorController.getMyProducts);

// POST /api/vendor/products
router.post('/products', upload.single('image'), vendorController.addProduct);

// DELETE /api/vendor/products/:id
router.delete('/products/:id', vendorController.deleteProduct);

module.exports = router;
