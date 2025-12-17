// src/controllers/coupon.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Validate coupon (public)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired coupon' });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ valid: false, error: 'Coupon usage limit reached' });
    }

    if (orderAmount && orderAmount < coupon.minOrder) {
      return res.status(400).json({
        valid: false,
        error: `Minimum order amount is AED ${coupon.minOrder}`,
      });
    }

    const discount = coupon.type === 'PERCENT'
      ? (orderAmount * coupon.discount / 100)
      : coupon.discount;

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        calculatedDiscount: discount,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

// Admin: Get all coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons' });
  }
};

// Admin: Create coupon
const createCoupon = async (req, res) => {
  try {
    const { code, discount, type, minOrder, maxUses, expiresAt } = req.body;

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount,
        type: type.toUpperCase(),
        minOrder: minOrder || 0,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({ message: 'Coupon created', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

// Admin: Update coupon
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    if (updateData.type) {
      updateData.type = updateData.type.toUpperCase();
    }
    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Coupon updated', coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

// Admin: Delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({ where: { id } });

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
