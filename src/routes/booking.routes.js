// src/routes/booking.routes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// User routes (protected)
router.post('/', authenticate, bookingController.createBooking);
router.get('/my-bookings', authenticate, bookingController.getMyBookings);
router.get('/:id', authenticate, bookingController.getBooking);
router.post('/:bookingId/confirm-payment', authenticate, bookingController.confirmPayment);
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

// Admin routes
router.get('/', authenticate, isAdmin, bookingController.getAllBookings);
router.get('/stats/dashboard', authenticate, isAdmin, bookingController.getDashboardStats);
router.put('/:id/status', authenticate, isAdmin, bookingController.updateBookingStatus);

module.exports = router;
