// src/routes/vehicle.routes.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', vehicleController.getVehicles);
router.get('/brands', vehicleController.getBrands);
router.get('/:id', vehicleController.getVehicle);
router.get('/:id/availability', vehicleController.getAvailability);
router.get('/:id/check-availability', vehicleController.checkAvailability);

// Admin routes
router.post('/', authenticate, isAdmin, vehicleController.createVehicle);
router.put('/:id', authenticate, isAdmin, vehicleController.updateVehicle);
router.delete('/:id', authenticate, isAdmin, vehicleController.deleteVehicle);

module.exports = router;
