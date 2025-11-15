/**
 * Express Backend Server for PayPal Payouts
 * 
 * This server handles PayPal payout requests securely.
 * Can be deployed to Render, Railway, Heroku, or any Node.js hosting service.
 * 
 * Deploy to Render (Free):
 * 1. Push to GitHub
 * 2. Connect to Render
 * 3. Set environment variables
 * 4. Deploy
 */

const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://biyahele.web.app',
        'https://biyahele.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());

// PayPal Environment Setup
function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    
    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.');
    }
    
    if (mode === 'live') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PayPal Payout API is running' });
});

// PayPal Payout endpoint
app.post('/api/paypal/payout', async (req, res) => {
    try {
        const { recipientEmail, amount, currency = 'USD', originalAmount, originalCurrency } = req.body;

        // Validate input
        if (!recipientEmail || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: recipientEmail and amount are required'
            });
        }

        if (!recipientEmail.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid PayPal email address'
            });
        }

        console.log('Processing PayPal payout request:', {
            recipientEmail,
            amount,
            currency,
            originalAmount,
            originalCurrency
        });

        // Create PayPal Payout Request
        const request = new paypal.payouts.PayoutsPostRequest();
        request.requestBody({
            sender_batch_header: {
                sender_batch_id: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                email_subject: "You have a payout from BiyaHele"
            },
            items: [{
                recipient_type: "EMAIL",
                amount: {
                    value: amount.toString(),
                    currency: currency
                },
                receiver: recipientEmail,
                note: "Cash out from BiyaHele wallet",
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
            batchStatus: payout.batch_header.batch_status
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
            error: errorMessage
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PayPal Payout API server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`💰 Payout endpoint: http://localhost:${PORT}/api/paypal/payout`);
});

