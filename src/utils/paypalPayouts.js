/**
 * PayPal Payouts Utility - Direct Client-Side Implementation
 * 
 * This implementation calls PayPal API directly from the frontend:
 * 1. Gets PayPal OAuth token using client credentials
 * 2. Calls PayPal Sandbox API directly: https://api-m.sandbox.paypal.com/v1/payments/payouts
 * 3. Creates payout transaction
 * 
 * PayPal credentials:
 * Uses VITE_PAYPAL_CLIENT_ID and VITE_PAYPAL_CLIENT_SECRET from environment variables
 * These are exposed in the browser (VITE_ prefix means they're bundled into the frontend)
 */

import { PAYPAL_CONFIG } from '../config/paypalConfig';

/**
 * Get PayPal OAuth Access Token
 * @returns {Promise<string>} Access token for PayPal API
 */
const getPayPalAccessToken = async () => {
    const baseUrl = PAYPAL_CONFIG.mode === 'live' 
        ? PAYPAL_CONFIG.liveBaseUrl 
        : PAYPAL_CONFIG.sandboxBaseUrl;
    
    // Create Basic Auth header
    const credentials = btoa(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`);
    
    try {
        const tokenUrl = `${baseUrl}/v1/oauth2/token`;
        
        console.log('Getting PayPal OAuth token...', {
            url: tokenUrl,
            mode: PAYPAL_CONFIG.mode
        });
        
        const formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json',
            },
            body: formData.toString(),
        });

        const responseText = await response.text();
        let errorData = {};
        
        try {
            errorData = JSON.parse(responseText);
        } catch (e) {
            // Not JSON
        }

        if (!response.ok) {
            const errorMsg = errorData.error_description || errorData.error || responseText || `HTTP ${response.status}`;
            console.error('PayPal token error:', {
                status: response.status,
                error: errorMsg
            });
            
            if (response.status === 401) {
                throw new Error(`PayPal Authentication Failed: Invalid Client ID or Secret. Check your VITE_PAYPAL_CLIENT_ID and VITE_PAYPAL_CLIENT_SECRET environment variables.`);
            } else if (response.status === 0 || response.status === 403) {
                throw new Error(`CORS Error: PayPal API blocked the request. This may require a CORS proxy or backend server.`);
            } else {
                throw new Error(`PayPal API Error (${response.status}): ${errorMsg}`);
            }
        }

        const data = JSON.parse(responseText);
        console.log('✅ PayPal OAuth token obtained');
        return data.access_token;
    } catch (error) {
        console.error('Error getting PayPal access token:', error);
        throw error;
    }
};

/**
 * Process PayPal Payout - Direct Client-Side Implementation
 * @param {string} recipientEmail - PayPal email to send money to
 * @param {number} amount - Amount in PHP (before fees)
 * @param {string} currency - Currency code (default: PHP)
 * @param {number} fees - PayPal fees to deduct from payout amount
 * @returns {Promise<{success: boolean, payoutId?: string, error?: string, batchStatus?: string}>}
 */
export const processPayPalPayout = async (recipientEmail, amount, currency = 'PHP', fees = 0) => {
    try {
        // Calculate amount after deducting fees from payout
        const amountAfterFees = amount - fees;
        
        // Validate amount after fees is positive
        if (amountAfterFees <= 0) {
            return {
                success: false,
                error: `Amount after fees (₱${amountAfterFees.toFixed(2)}) must be greater than 0. Fees (₱${fees.toFixed(2)}) exceed the requested amount (₱${amount.toFixed(2)}).`
            };
        }

        // Use PHP directly - no currency conversion needed
        const amountInPHP = parseFloat(amountAfterFees.toFixed(2));

        if (amountInPHP <= 0) {
            return {
                success: false,
                error: 'Amount after fees must be greater than 0'
            };
        }

        console.log('Processing PayPal payout (client-side)...', {
            recipientEmail,
            originalAmountPHP: amount,
            feesPHP: fees,
            amountAfterFeesPHP: amountAfterFees,
            amountInPHP,
            currency: 'PHP',
            mode: PAYPAL_CONFIG.mode
        });

        // Step 1: Get PayPal OAuth token
        const accessToken = await getPayPalAccessToken();
        
        // Step 2: Create payout request
        const baseUrl = PAYPAL_CONFIG.mode === 'live' 
            ? PAYPAL_CONFIG.liveBaseUrl 
            : PAYPAL_CONFIG.sandboxBaseUrl;

        const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create note based on context
        let note = `Cash out from BiyaHele wallet. Original amount: ₱${amount.toFixed(2)}, Fees: ₱${fees.toFixed(2)}`;
        let emailSubject = "You have a payout from BiyaHele";
        let emailMessage = `You have received ₱${amountAfterFees.toFixed(2)} (after fees) from BiyaHele.`;
        
        // If sending to admin account, update note and email
        if (recipientEmail === 'biyahele@business.example.com') {
            emailSubject = "Admin Fee Collection - BiyaHele";
            emailMessage = `Admin fee of ₱${amountAfterFees.toFixed(2)} has been collected.`;
            note = `Admin fee collection: ₱${amount.toFixed(2)}`;
        }
        
        const payoutRequest = {
            sender_batch_header: {
                sender_batch_id: batchId,
                email_subject: emailSubject,
                email_message: emailMessage
            },
            items: [{
                recipient_type: "EMAIL",
                amount: {
                    value: amountInPHP.toFixed(2),
                    currency: "PHP"  // Use PHP directly, no conversion
                },
                receiver: recipientEmail,
                note: note,
                sender_item_id: `ITEM-${Date.now()}`
            }]
        };

        console.log('Sending payout request to PayPal API...', {
            url: `${baseUrl}/v1/payments/payouts`,
            batchId
        });

        // Step 3: Call PayPal Payouts API directly
        const response = await fetch(`${baseUrl}/v1/payments/payouts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify(payoutRequest),
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            let errorMessage = responseData.message || responseData.error || `PayPal API error: ${response.status}`;
            
            // Provide more helpful error messages
            if (response.status === 422) {
                if (responseData.name === 'INSUFFICIENT_FUNDS' || errorMessage.includes('sufficient funds')) {
                    errorMessage = `PayPal Business Account has insufficient funds. Please add funds to your PayPal Sandbox Business Account (${PAYPAL_CONFIG.adminPayPalEmail}).\n\nRequired: ₱${amountInPHP.toFixed(2)} PHP\n\nNote: Make sure your PayPal account currency is set to PHP.`;
                } else if (responseData.name === 'INVALID_REQUEST') {
                    errorMessage = `Invalid PayPal request: ${responseData.message || 'Please check recipient email and amount'}`;
                } else {
                    errorMessage = `PayPal validation error: ${responseData.message || errorMessage}`;
                }
            } else if (response.status === 401) {
                errorMessage = `PayPal authentication failed. Please check your REACT_APP_PAYPAL_CLIENT_ID and REACT_APP_PAYPAL_CLIENT_SECRET in .env file.`;
            } else if (response.status === 400) {
                errorMessage = `PayPal request error: ${responseData.message || errorMessage}`;
            }
            
            console.error('PayPal payout failed:', {
                status: response.status,
                error: responseData,
                message: errorMessage
            });
            
            return {
                success: false,
                error: errorMessage
            };
        }

        console.log('✅ PayPal payout successful!', responseData);

        return { 
            success: true, 
            payoutId: responseData.batch_header?.payout_batch_id || batchId,
            batchStatus: responseData.batch_header?.batch_status || 'PENDING',
        };
    } catch (error) {
        console.error('PayPal Payout Error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to process payout' 
        };
    }
};
