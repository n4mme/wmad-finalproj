/**
 * Firebase Cloud Functions Entry Point
 * 
 * This file exports all Cloud Functions for deployment.
 */

const paypalPayout = require('./paypalPayout');

// Export the PayPal payout function
exports.processPayPalPayout = paypalPayout.processPayPalPayout;

