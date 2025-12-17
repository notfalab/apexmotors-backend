// src/controllers/vehicle.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all vehicles (public)
const getVehicles = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, available } = req.query;

    const where = {
      isActive: true,
      ...(category && { category: category.toUpperCase() }),
      ...(brand && { brand: { contains: brand, mode: 'insensitive' } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(available === 'true' && { isAvailable: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true,
        image: true,
        images: true,
        specs: true,
        features: true,
        rating: true,
        reviewCount: true,
        isAvailable: true,
      },
    });

    res.json({ vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
};

// Get single vehicle
const getVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to get vehicle' });
  }
};

// Get vehicle availability (calendar)
const getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get bookings for this vehicle in date range
    const bookings = await prisma.booking.findMany({
      where: {
        vehicleId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            pickupDate: { lte: new Date(endDate) },
            dropoffDate: { gte: new Date(startDate) },
          },
        ],
      },
      select: {
        pickupDate: true,
        dropoffDate: true,
        status: true,
      },
    });

    // Generate date array with availability
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availability = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const isBooked = bookings.some(
        (b) => currentDate >= new Date(b.pickupDate) && currentDate <= new Date(b.dropoffDate)
      );

      availability.push({
        date: currentDate.toISOString().split('T')[0],
        available: !isBooked,
      });
    }

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
};

// Check specific dates availability
const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupDate, dropoffDate } = req.query;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            pickupDate: { lte: new Date(dropoffDate) },
            dropoffDate: { gte: new Date(pickupDate) },
          },
        ],
      },
    });

    res.json({
      available: !existingBooking,
      message: existingBooking
        ? 'Vehicle is not available for selected dates'
        : 'Vehicle is available',
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

// Admin: Create vehicle
const createVehicle = async (req, res) => {
  try {
    const { name, brand, category, price, image, images, description, specs, features } = req.body;

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        brand,
        category: category.toUpperCase(),
        price,
        image,
        images: images || [image],
        description,
        specs,
        features: features || [],
      },
    });

    res.status(201).json({ message: 'Vehicle created', vehicle });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// Admin: Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.category) {
      updateData.category = updateData.category.toUpperCase();
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Vehicle updated', vehicle });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// Admin: Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - just mark as inactive
    await prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};

// Get brands list
const getBrands = async (req, res) => {
  try {
    const brands = await prisma.vehicle.findMany({
      where: { isActive: true },
      select: { brand: true },
      distinct: ['brand'],
    });

    res.json({ brands: brands.map((b) => b.brand) });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to get brands' });
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  getAvailability,
  checkAvailability,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getBrands,
};
