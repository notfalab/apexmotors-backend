// src/routes/coupon.routes.js
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/validate', couponController.validateCoupon);

// Admin routes
router.get('/', authenticate, isAdmin, couponController.getCoupons);
router.post('/', authenticate, isAdmin, couponController.createCoupon);
router.put('/:id', authenticate, isAdmin, couponController.updateCoupon);
router.delete('/:id', authenticate, isAdmin, couponController.deleteCoupon);

module.exports = router;
