// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        loyaltyPoints: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

module.exports = {
  authenticate,
  optionalAuth,
  isAdmin,
  isSuperAdmin,
  generateToken,
};
