# 💰 PayPal Payouts Integration Guide

## Overview

To enable actual PayPal payouts (sending money to host's PayPal accounts), you need to set up a backend API endpoint that handles PayPal Payouts API calls.

## ⚠️ Important Security Note

**PayPal Payouts API requires server-side implementation** because:
- API credentials (Client ID and Secret) must be kept secure
- Never expose PayPal API secrets in client-side code
- All payout requests must be authenticated server-side

---

## 🔧 Current Implementation

The current code includes:
- ✅ Frontend function `processPayPalPayout()` in `src/utils/paypalPayouts.js`
- ✅ Integration in `ReviewCashOutModal.jsx`
- ⚠️ **Currently simulates payouts in development mode**

---

## 🚀 Setting Up Real PayPal Payouts

### Step 1: Create Backend API Endpoint

You need to create a backend endpoint (Node.js/Express, Python/Flask, etc.) that:

1. **Authenticates with PayPal:**
   ```javascript
   // Example (Node.js/Express)
   const paypal = require('@paypal/checkout-server-sdk');
   
   function environment() {
     const clientId = process.env.PAYPAL_CLIENT_ID;
     const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
     
     return new paypal.core.SandboxEnvironment(clientId, clientSecret);
     // Use LiveEnvironment for production
   }
   
   function client() {
     return new paypal.core.PayPalHttpClient(environment());
   }
   ```

2. **Create Payout Request:**
   ```javascript
   async function createPayout(recipientEmail, amount) {
     const request = new paypal.payouts.PayoutsPostRequest();
     request.requestBody({
       sender_batch_header: {
         sender_batch_id: `BATCH-${Date.now()}`,
         email_subject: "You have a payout from BiyaHele"
       },
       items: [{
         recipient_type: "EMAIL",
         amount: {
           value: amount,
           currency: "USD"
         },
         receiver: recipientEmail,
         note: "Cash out from BiyaHele wallet"
       }]
     });
     
     const response = await client().execute(request);
     return response.result;
   }
   ```

3. **Create API Endpoint:**
   ```javascript
   // POST /api/paypal/payout
   app.post('/api/paypal/payout', async (req, res) => {
     try {
       const { recipientEmail, amount, currency } = req.body;
       
       // Validate admin authentication
       // Process payout
       const payout = await createPayout(recipientEmail, amount);
       
       res.json({ 
         success: true, 
         payoutId: payout.batch_header.payout_batch_id 
       });
     } catch (error) {
       res.status(500).json({ 
         success: false, 
         error: error.message 
       });
     }
   });
   ```

### Step 2: Update Frontend to Call Your Backend

Update `src/utils/paypalPayouts.js`:

```javascript
export const processPayPalPayout = async (recipientEmail, amount, currency = 'PHP') => {
    try {
        // Convert PHP to USD
        const phpToUsdRate = 0.018; // Use real-time rate
        const amountInUSD = (amount * phpToUsdRate).toFixed(2);

        // Call YOUR backend API
        const response = await fetch('https://your-backend-api.com/api/paypal/payout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}` // Your auth token
            },
            body: JSON.stringify({
                recipientEmail,
                amount: amountInUSD,
                currency: 'USD',
                originalAmount: amount,
                originalCurrency: currency,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Payout failed' };
        }

        const data = await response.json();
        return { success: true, payoutId: data.payoutId };
    } catch (error) {
        console.error('PayPal Payout Error:', error);
        return { success: false, error: error.message };
    }
};
```

### Step 3: Install PayPal SDK (Backend)

```bash
npm install @paypal/checkout-server-sdk
```

### Step 4: Set Environment Variables

In your backend `.env`:
```
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
```

---

## 📋 PayPal Payouts API Requirements

1. **PayPal Business Account** with Payouts enabled
2. **API Credentials** (Client ID and Secret)
3. **Backend Server** to handle API calls securely
4. **Currency Conversion** (PHP to USD) if needed

---

## 🧪 Testing

### Sandbox Mode:
- Use PayPal Sandbox accounts
- No real money is transferred
- Test with sandbox recipient emails

### Production Mode:
- Use real PayPal business account
- Real money will be transferred
- Ensure proper error handling

---

## 📝 Current Status

- ✅ Frontend integration ready
- ✅ Wallet deduction working
- ⚠️ PayPal payout currently simulated
- ⚠️ Backend API endpoint needed for real payouts

---

## 🔗 Resources

- [PayPal Payouts API Documentation](https://developer.paypal.com/docs/payouts/)
- [PayPal Node.js SDK](https://github.com/paypal/Checkout-NodeJS-SDK)
- [PayPal Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)

---

## 💡 Quick Start (Development)

For now, the system will:
1. ✅ Deduct money from host's wallet
2. ✅ Mark transaction as approved
3. ⚠️ Simulate PayPal payout (no actual money sent)

To enable real payouts, implement the backend API endpoint as described above.

