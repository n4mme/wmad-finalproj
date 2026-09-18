/**
 * Local PayPal Payout Server
 * 
 * Run this server locally to test PayPal payouts without CORS issues.
 * 
 * Usage:
 * 1. Install dependencies: npm install
 * 2. Create .env file with PayPal credentials
 * 3. Run: npm start
 * 4. Server runs on http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'LESKRS3BRFMJA';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

// PayPal Environment Setup
function environment() {
    if (PAYPAL_MODE === 'live') {
        return new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
    }
    return new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'PayPal Payout Server is running',
        mode: PAYPAL_MODE,
        endpoints: {
            payout: 'POST /api/paypal/payout'
        }
    });
});

// PayPal Payout Endpoint
app.post('/api/paypal/payout', async (req, res) => {
    try {
        const { recipientEmail, amount, currency = 'USD', originalAmount, originalCurrency } = req.body;

        // Validate input
        if (!recipientEmail || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: recipientEmail and amount'
            });
        }

        if (!recipientEmail.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        console.log('Processing PayPal payout request...', {
            recipientEmail,
            amount,
            currency,
            originalAmount,
            originalCurrency,
            mode: PAYPAL_MODE
        });

        // Create PayPal Payout Request
        const request = new paypal.payouts.PayoutsPostRequest();
        request.requestBody({
            sender_batch_header: {
                sender_batch_id: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                email_subject: "You have a payout from BiyaHele",
                email_message: originalAmount 
                    ? `You have received ₱${originalAmount.toFixed(2)} (converted to $${amount}) from BiyaHele.`
                    : `You have received $${amount} from BiyaHele.`
            },
            items: [{
                recipient_type: "EMAIL",
                amount: {
                    value: amount.toString(),
                    currency: currency
                },
                receiver: recipientEmail,
                note: originalAmount 
                    ? `Cash out from BiyaHele wallet. Original amount: ₱${originalAmount}, Converted: $${amount} ${currency}`
                    : `Cash out from BiyaHele wallet. Amount: $${amount} ${currency}`,
                sender_item_id: `ITEM-${Date.now()}`
            }]
        });

        // Execute payout
        const response = await client().execute(request);
        const payout = response.result;

        console.log('PayPal payout successful:', {
            payoutId: payout.batch_header.payout_batch_id,
            status: payout.batch_header.batch_status
        });

        res.json({
            success: true,
            payoutId: payout.batch_header.payout_batch_id,
            batchStatus: payout.batch_header.batch_status,
            amount: amount,
            currency: currency,
            recipientEmail: recipientEmail
        });

    } catch (error) {
        console.error('PayPal Payout Error:', error);
        
        let errorMessage = 'Failed to process payout';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response) {
            errorMessage = `PayPal API error: ${JSON.stringify(error.response)}`;
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.response || error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 PayPal Payout Server Running');
    console.log('='.repeat(50));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🔐 Mode: ${PAYPAL_MODE}`);
    console.log(`💳 Client ID: ${PAYPAL_CLIENT_ID.substring(0, 8)}...`);
    console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/paypal/payout`);
    console.log('='.repeat(50));
    console.log('✅ Ready to process PayPal payouts!');
    console.log('');
});

