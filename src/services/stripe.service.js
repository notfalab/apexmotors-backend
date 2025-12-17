// src/services/stripe.service.js
const Stripe = require('stripe');
const config = require('../config');

const stripe = new Stripe(config.stripe.secretKey);

// Create payment intent
const createPaymentIntent = async (amount, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to fils (cents)
      currency: config.stripe.currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Retrieve payment intent
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { success: true, paymentIntent };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Cancel payment intent
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true, paymentIntent };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Refund payment
const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    const refundParams = { payment_intent: paymentIntentId };
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }
    
    const refund = await stripe.refunds.create(refundParams);
    return { success: true, refund };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Construct webhook event
const constructWebhookEvent = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
    return { success: true, event };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create customer
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return { success: true, customer };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  refundPayment,
  constructWebhookEvent,
  createCustomer,
};
