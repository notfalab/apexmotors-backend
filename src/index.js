// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const stripeService = require('./services/stripe.service');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Stripe webhook needs raw body
app.post('/api/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    const result = stripeService.constructWebhookEvent(req.body, sig);
    
    if (!result.success) {
      console.error('Webhook error:', result.error);
      return res.status(400).send(`Webhook Error: ${result.error}`);
    }

    const event = result.event;

    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update booking payment status
        const booking = await prisma.booking.findFirst({
          where: { paymentIntentId: paymentIntent.id },
        });
        
        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { 
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
            },
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        const failedBooking = await prisma.booking.findFirst({
          where: { paymentIntentId: failedPayment.id },
        });
        
        if (failedBooking) {
          await prisma.booking.update({
            where: { id: failedBooking.id },
            data: { paymentStatus: 'FAILED' },
          });
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'APEX MOTORS API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║     🚗 APEX MOTORS API Server 🚗          ║
║                                           ║
║     Running on: http://localhost:${PORT}     ║
║     Environment: ${config.nodeEnv}            ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing...');
  await prisma.$disconnect();
  process.exit(0);
});
