// src/services/email.service.js
const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Email templates
const templates = {
  // Base layout
  layout: (content) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>APEX MOTORS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold; letter-spacing: 2px;">APEX MOTORS</h1>
                  <p style="margin: 5px 0 0; color: #000; font-size: 12px; letter-spacing: 3px;">LUXURY RENTALS</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #09090b; padding: 30px; text-align: center; border-top: 1px solid #27272a;">
                  <p style="margin: 0 0 10px; color: #a1a1aa; font-size: 14px;">
                    Need help? Contact us anytime
                  </p>
                  <p style="margin: 0 0 20px;">
                    <a href="https://wa.me/${config.whatsappNumber}" style="color: #f59e0b; text-decoration: none; margin: 0 10px;">WhatsApp</a>
                    <span style="color: #52525b;">|</span>
                    <a href="mailto:${config.adminEmail}" style="color: #f59e0b; text-decoration: none; margin: 0 10px;">Email</a>
                  </p>
                  <p style="margin: 0; color: #52525b; font-size: 12px;">
                    © ${new Date().getFullYear()} APEX MOTORS. Dubai, UAE
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  // Welcome email
  welcome: (name) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Welcome to APEX MOTORS! 🎉</h2>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #f59e0b;">${name}</strong>,
    </p>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Thank you for joining APEX MOTORS, Dubai's premier luxury car rental service. You now have access to the world's most prestigious vehicles.
    </p>
    <p style="margin: 0 0 30px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Start exploring our fleet and experience the ultimate in luxury driving.
    </p>
    <a href="${config.frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
      Explore Our Fleet
    </a>
  `,

  // Booking confirmation
  bookingConfirmation: (booking) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Booking Confirmed! ✅</h2>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #f59e0b;">${booking.customerName}</strong>,
    </p>
    <p style="margin: 0 0 30px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Your booking has been confirmed. Here are your details:
    </p>
    
    <!-- Booking Details Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 25px;">
          <p style="margin: 0 0 15px; color: #a1a1aa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
          <p style="margin: 0 0 25px; color: #f59e0b; font-size: 24px; font-weight: bold; font-family: monospace;">${booking.bookingRef}</p>
          
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Vehicle</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px; font-weight: bold;">${booking.vehicleName}</p>
              </td>
              <td width="50%" style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Duration</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px; font-weight: bold;">${booking.days} days</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Pick-up</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 14px;">${booking.pickupDate}</p>
                <p style="margin: 2px 0 0; color: #d4d4d8; font-size: 12px;">${booking.pickupLocation}</p>
              </td>
              <td width="50%" style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Drop-off</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 14px;">${booking.dropoffDate}</p>
                <p style="margin: 2px 0 0; color: #d4d4d8; font-size: 12px;">${booking.dropoffLocation}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 15px 0 0;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Total Amount</p>
                <p style="margin: 5px 0 0; color: #f59e0b; font-size: 28px; font-weight: bold;">AED ${booking.totalPrice.toLocaleString()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 14px; line-height: 1.6;">
      Please arrive 15 minutes before your scheduled pick-up time with your valid driver's license and the credit card used for booking.
    </p>
    
    <a href="https://wa.me/${config.whatsappNumber}?text=Hi! My booking ref is ${booking.bookingRef}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
      Contact Us on WhatsApp
    </a>
  `,

  // Payment confirmation
  paymentConfirmation: (payment) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Payment Received! 💳</h2>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #f59e0b;">${payment.customerName}</strong>,
    </p>
    <p style="margin: 0 0 30px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      We have received your payment. Thank you for choosing APEX MOTORS!
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 25px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Booking Reference</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px; font-family: monospace;">${payment.bookingRef}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Amount Paid</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 24px; font-weight: bold;">AED ${payment.amount.toLocaleString()}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Payment Method</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px;">${payment.method}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
      A receipt has been sent to your email. Keep this for your records.
    </p>
  `,

  // Password reset
  passwordReset: (name, resetUrl) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Reset Your Password 🔐</h2>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #f59e0b;">${name}</strong>,
    </p>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 30px;">
      Reset Password
    </a>
    
    <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `,

  // Booking reminder
  bookingReminder: (booking) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">Reminder: Your Booking Tomorrow! 🚗</h2>
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #f59e0b;">${booking.customerName}</strong>,
    </p>
    <p style="margin: 0 0 30px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      This is a friendly reminder that your <strong>${booking.vehicleName}</strong> is ready for pick-up tomorrow!
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 25px;">
          <p style="margin: 0 0 10px; color: #a1a1aa; font-size: 12px;">PICK-UP DETAILS</p>
          <p style="margin: 0 0 5px; color: #fff; font-size: 18px; font-weight: bold;">${booking.pickupDate}</p>
          <p style="margin: 0; color: #d4d4d8; font-size: 16px;">${booking.pickupLocation}</p>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 20px; color: #d4d4d8; font-size: 14px; line-height: 1.6;">
      <strong>Don't forget to bring:</strong><br>
      ✓ Valid driver's license<br>
      ✓ Credit card used for booking<br>
      ✓ Passport (for tourists)
    </p>
  `,

  // Admin notification
  adminNewBooking: (booking) => `
    <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px;">New Booking Received! 📋</h2>
    <p style="margin: 0 0 30px; color: #d4d4d8; font-size: 16px; line-height: 1.6;">
      A new booking has been made on APEX MOTORS:
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 12px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 25px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Booking Ref</p>
                <p style="margin: 5px 0 0; color: #f59e0b; font-size: 18px; font-weight: bold;">${booking.bookingRef}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Customer</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px;">${booking.customerName}</p>
                <p style="margin: 2px 0 0; color: #d4d4d8; font-size: 14px;">${booking.customerEmail}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Vehicle</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 16px;">${booking.vehicleName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #3f3f46;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Dates</p>
                <p style="margin: 5px 0 0; color: #fff; font-size: 14px;">${booking.pickupDate} → ${booking.dropoffDate}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">Total</p>
                <p style="margin: 5px 0 0; color: #22c55e; font-size: 24px; font-weight: bold;">AED ${booking.totalPrice.toLocaleString()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <a href="${config.frontendUrl}?admin=true" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
      View in Admin Panel
    </a>
  `,
};

// Send email function
const sendEmail = async (to, subject, template) => {
  try {
    const html = templates.layout(template);
    
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `APEX MOTORS - ${subject}`,
      html,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Export functions
module.exports = {
  sendEmail,
  
  sendWelcomeEmail: (to, name) => 
    sendEmail(to, 'Welcome to APEX MOTORS!', templates.welcome(name)),
  
  sendBookingConfirmation: (to, booking) => 
    sendEmail(to, `Booking Confirmed - ${booking.bookingRef}`, templates.bookingConfirmation(booking)),
  
  sendPaymentConfirmation: (to, payment) => 
    sendEmail(to, 'Payment Received', templates.paymentConfirmation(payment)),
  
  sendPasswordReset: (to, name, resetUrl) => 
    sendEmail(to, 'Reset Your Password', templates.passwordReset(name, resetUrl)),
  
  sendBookingReminder: (to, booking) => 
    sendEmail(to, 'Reminder: Your Booking Tomorrow', templates.bookingReminder(booking)),
  
  sendAdminNewBooking: (booking) => 
    sendEmail(config.adminEmail, `New Booking - ${booking.bookingRef}`, templates.adminNewBooking(booking)),
};
