// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const vehicleRoutes = require('./vehicle.routes');
const bookingRoutes = require('./booking.routes');
const couponRoutes = require('./coupon.routes');

// API routes
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/coupons', couponRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
