// src/config/index.js
require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || 'aed',
  },

  // Email
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'APEX MOTORS <noreply@apexmotors.ae>',
  },

  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@apexmotors.ae',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '971501234567',

  // Extras pricing
  extras: {
    chauffeur: 500,
    insurance: 200,
    gps: 50,
    baby_seat: 75,
    wifi: 30,
  },
};
