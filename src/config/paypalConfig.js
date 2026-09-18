/**
 * PayPal Configuration
 * 
 * Uses environment variables (REACT_APP_ prefix) for client-side access.
 * These are bundled into the frontend at build time.
 * 
 * Set these in your .env file:
 * REACT_APP_PAYPAL_CLIENT_ID=your_client_id
 * REACT_APP_PAYPAL_CLIENT_SECRET=your_client_secret
 * REACT_APP_PAYPAL_MODE=sandbox
 */

export const PAYPAL_CONFIG = {
    // Admin PayPal Business Account Credentials from environment variables
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || 'LESKRS3BRFMJA',
    clientSecret: process.env.REACT_APP_PAYPAL_CLIENT_SECRET || 'EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1',
    mode: process.env.REACT_APP_PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    
    // PayPal API URLs
    sandboxBaseUrl: 'https://api-m.sandbox.paypal.com',
    liveBaseUrl: 'https://api-m.paypal.com',
    
    // Admin PayPal Email (sender)
    adminPayPalEmail: 'biyahele@business.example.com',
};

