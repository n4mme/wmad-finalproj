/**
 * Firebase Cloud Function for PayPal Payouts
 * 
 * This is an example Cloud Function that you can deploy to Firebase Functions
 * to handle PayPal Payouts securely.
 * 
 * To deploy:
 * 1. Install Firebase Functions: npm install -g firebase-tools
 * 2. Initialize Functions: firebase init functions
 * 3. Install dependencies: cd functions && npm install @paypal/checkout-server-sdk
 * 4. Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const paypal = require('@paypal/checkout-server-sdk');

// Initialize Firebase Admin
admin.initializeApp();

// PayPal Environment Setup
function environment() {
    const clientId = functions.config().paypal.client_id;
    const clientSecret = functions.config().paypal.client_secret;
    const mode = functions.config().paypal.mode || 'sandbox';
    
    if (mode === 'live') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

// Cloud Function: Process PayPal Payout
exports.processPayPalPayout = functions.https.onCall(async (data, context) => {
    // Verify admin authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can process payouts');
    }

    const { recipientEmail, amount, currency = 'USD' } = data;

    if (!recipientEmail || !amount) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        // Validate PayPal credentials are configured
        const clientId = functions.config().paypal?.client_id;
        const clientSecret = functions.config().paypal?.client_secret;
        
        if (!clientId || !clientSecret) {
            console.error('PayPal credentials not configured');
            throw new functions.https.HttpsError(
                'failed-precondition',
                'PayPal credentials not configured. Please set paypal.client_id and paypal.client_secret in Firebase Functions config.'
            );
        }

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

        console.log('Executing PayPal payout request...', {
            recipientEmail,
            amount,
            currency
        });

        // Execute payout
        const response = await client().execute(request);
        const payout = response.result;

        console.log('PayPal payout successful:', {
            payoutId: payout.batch_header.payout_batch_id,
            status: payout.batch_header.batch_status
        });

        return {
            success: true,
            payoutId: payout.batch_header.payout_batch_id,
            batchStatus: payout.batch_header.batch_status
        };
    } catch (error) {
        console.error('PayPal Payout Error:', error);
        
        // Provide more detailed error messages
        let errorMessage = 'Failed to process payout';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response) {
            errorMessage = `PayPal API error: ${JSON.stringify(error.response)}`;
        }
        
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});

