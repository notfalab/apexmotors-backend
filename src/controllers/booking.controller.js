// src/controllers/booking.controller.js
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const stripeService = require('../services/stripe.service');
const emailService = require('../services/email.service');

const prisma = new PrismaClient();

// Generate booking reference
const generateBookingRef = () => {
  return `APEX-${Date.now().toString(36).toUpperCase()}${uuidv4().slice(0, 4).toUpperCase()}`;
};

// Calculate booking price
const calculatePrice = (vehicle, days, extras, coupon) => {
  const basePrice = vehicle.price * days;
  
  let extrasPrice = 0;
  if (extras && extras.length > 0) {
    extras.forEach((extra) => {
      if (config.extras[extra]) {
        extrasPrice += config.extras[extra] * days;
      }
    });
  }

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'PERCENT') {
      discount = (basePrice + extrasPrice) * (coupon.discount / 100);
    } else {
      discount = coupon.discount;
    }
  }

  const totalPrice = basePrice + extrasPrice - discount;

  return {
    basePrice,
    extrasPrice,
    discount,
    totalPrice: Math.max(0, totalPrice),
  };
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const {
      vehicleId,
      pickupDate,
      dropoffDate,
      pickupLocation,
      dropoffLocation,
      extras,
      couponCode,
      customerNotes,
    } = req.body;

    // Get vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check availability
    const existingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            pickupDate: { lte: new Date(dropoffDate) },
            dropoffDate: { gte: new Date(pickupDate) },
          },
        ],
      },
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Vehicle not available for selected dates' });
    }

    // Calculate days
    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (days < 1) {
      return res.status(400).json({ error: 'Minimum rental is 1 day' });
    }

    // Check coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!coupon) {
        return res.status(400).json({ error: 'Invalid or expired coupon' });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      }
    }

    // Calculate prices
    const pricing = calculatePrice(vehicle, days, extras, coupon);

    if (coupon && pricing.basePrice + pricing.extrasPrice < coupon.minOrder) {
      return res.status(400).json({
        error: `Minimum order for this coupon is AED ${coupon.minOrder}`,
      });
    }

    // Create payment intent
    const paymentResult = await stripeService.createPaymentIntent(pricing.totalPrice, {
      vehicleId,
      vehicleName: vehicle.name,
      userId: req.user.id,
    });

    if (!paymentResult.success) {
      return res.status(500).json({ error: 'Failed to create payment' });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        bookingRef: generateBookingRef(),
        userId: req.user.id,
        vehicleId,
        pickupDate: new Date(pickupDate),
        dropoffDate: new Date(dropoffDate),
        pickupLocation,
        dropoffLocation: dropoffLocation || pickupLocation,
        days,
        basePrice: pricing.basePrice,
        extrasPrice: pricing.extrasPrice,
        discount: pricing.discount,
        totalPrice: pricing.totalPrice,
        extras: extras || [],
        couponCode: coupon?.code || null,
        paymentIntentId: paymentResult.paymentIntentId,
        customerNotes,
      },
      include: {
        vehicle: {
          select: { name: true, brand: true, image: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Update coupon usage
    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    res.status(201).json({
      message: 'Booking created',
      booking,
      clientSecret: paymentResult.clientSecret,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Confirm payment (webhook or manual)
const confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentIntentId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: true,
        user: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify payment with Stripe
    const paymentResult = await stripeService.getPaymentIntent(paymentIntentId);
    
    if (!paymentResult.success || paymentResult.paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not confirmed' });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId,
        stripePaymentId: paymentIntentId,
        amount: booking.totalPrice,
        status: 'PAID',
        method: paymentResult.paymentIntent.payment_method_types[0] || 'card',
      },
    });

    // Add loyalty points (1 point per AED)
    await prisma.user.update({
      where: { id: booking.userId },
      data: {
        loyaltyPoints: { increment: Math.floor(booking.totalPrice) },
      },
    });

    // Send confirmation email to customer
    await emailService.sendBookingConfirmation(booking.user.email, {
      bookingRef: booking.bookingRef,
      customerName: booking.user.name,
      vehicleName: booking.vehicle.name,
      days: booking.days,
      pickupDate: booking.pickupDate.toLocaleDateString(),
      dropoffDate: booking.dropoffDate.toLocaleDateString(),
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      totalPrice: booking.totalPrice,
    });

    // Send notification to admin
    await emailService.sendAdminNewBooking({
      bookingRef: booking.bookingRef,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      vehicleName: booking.vehicle.name,
      pickupDate: booking.pickupDate.toLocaleDateString(),
      dropoffDate: booking.dropoffDate.toLocaleDateString(),
      totalPrice: booking.totalPrice,
    });

    res.json({ message: 'Payment confirmed', booking: updatedBooking });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Get user's bookings
const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status: status.toUpperCase() }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            select: { name: true, brand: true, image: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        ...(req.user.role === 'CUSTOMER' && { userId: req.user.id }),
      },
      include: {
        vehicle: true,
        user: {
          select: { name: true, email: true, phone: true },
        },
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        ...(req.user.role === 'CUSTOMER' && { userId: req.user.id }),
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    // If paid, process refund
    if (booking.paymentStatus === 'PAID' && booking.paymentIntentId) {
      const refundResult = await stripeService.refundPayment(booking.paymentIntentId);
      if (refundResult.success) {
        await prisma.payment.update({
          where: { bookingId: id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentStatus: booking.paymentStatus === 'PAID' ? 'REFUNDED' : booking.paymentStatus,
      },
    });

    res.json({ message: 'Booking cancelled', booking: updatedBooking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Admin: Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status: status.toUpperCase() }),
      ...(paymentStatus && { paymentStatus: paymentStatus.toUpperCase() }),
      ...(startDate && { pickupDate: { gte: new Date(startDate) } }),
      ...(endDate && { dropoffDate: { lte: new Date(endDate) } }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            select: { name: true, brand: true, image: true },
          },
          user: {
            select: { name: true, email: true, phone: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

// Admin: Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(adminNotes && { adminNotes }),
      },
      include: {
        vehicle: true,
        user: true,
      },
    });

    res.json({ message: 'Booking updated', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalBookings,
      monthlyBookings,
      lastMonthBookings,
      totalRevenue,
      monthlyRevenue,
      activeVehicles,
      totalCustomers,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.booking.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { totalPrice: true },
      }),
      prisma.vehicle.count({ where: { isActive: true, isAvailable: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { name: true } },
          user: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      stats: {
        totalBookings,
        monthlyBookings,
        bookingGrowth: lastMonthBookings > 0 
          ? ((monthlyBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1)
          : 100,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
        activeVehicles,
        totalCustomers,
      },
      recentBookings,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

module.exports = {
  createBooking,
  confirmPayment,
  getMyBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  getDashboardStats,
};
