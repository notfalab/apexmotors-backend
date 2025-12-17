// src/routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', body('email').isEmail(), authController.forgotPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

// Admin routes
router.get('/users', authenticate, isAdmin, authController.getAllUsers);

module.exports = router;
