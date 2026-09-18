# 💳 Client-Side PayPal Payout Integration

## How It Works

### Flow Overview

1. **Host Requests Withdrawal**
   - Host enters PayPal email and amount in Wallet
   - Creates transaction with `type: 'cashout'`, `status: 'pending'`
   - Stored in `walletTransactions` collection

2. **Admin Reviews Request**
   - Admin sees pending requests in Cash Out Approval page
   - Admin clicks "Review" button

3. **Admin Approves (Client-Side PayPal Processing)**
   - Frontend gets PayPal OAuth token using client credentials from env vars
   - Frontend calls PayPal Sandbox API directly: `https://api-m.sandbox.paypal.com/v1/payments/payouts`
   - Creates payout transaction
   - Records transaction in Firestore with `type: 'payout'`, `status: 'processing'`
   - Deducts amount from host's wallet
   - Updates original request status to `'approved'`

## Setup Instructions

### Step 1: Create `.env` File

Create a `.env` file in the root directory:

```env
REACT_APP_PAYPAL_CLIENT_ID=LESKRS3BRFMJA
REACT_APP_PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1
REACT_APP_PAYPAL_MODE=sandbox
```

**Note:** `REACT_APP_` prefix is required for Create React App. These are bundled into the frontend at build time.

### Step 2: Restart Development Server

After creating `.env` file:
```bash
npm start
```

The environment variables will be loaded.

### Step 3: Test the Flow

1. **Host Side:**
   - Go to Wallet
   - Click "Request Cash Out"
   - Enter PayPal email: `hostuser@personal.example.com`
   - Enter amount (e.g., ₱1000)
   - Submit request

2. **Admin Side:**
   - Go to Cash Out Approval
   - See the pending request
   - Click "Review"
   - Click "Approve"
   - Watch console for PayPal API calls
   - Money is sent to PayPal account

## Transaction Recording

After successful PayPal payout, a transaction is recorded:

```javascript
{
  userId: "host_user_id",
  type: 'payout',
  amount: 1000, // PHP
  currency: 'PHP',
  status: 'processing',
  meta: {
    paypalEmail: 'hostuser@personal.example.com',
    paypalBatchId: 'BATCH-123456789',
    paypalBatchStatus: 'PENDING',
    amountRequested: 1000,
    amountSent: 951, // After fees
    paypalFees: 49,
    originalCurrency: 'PHP',
    convertedAmount: 17.12, // USD
    convertedCurrency: 'USD',
  },
  createdAt: Timestamp,
  payoutProcessedAt: Timestamp,
}
```

## PayPal Credentials

- **Uses:** `REACT_APP_PAYPAL_CLIENT_ID` and `REACT_APP_PAYPAL_CLIENT_SECRET` from environment variables
- **Exposed in browser:** Yes (REACT_APP_ prefix means they're bundled into the frontend)
- **Security:** For production, consider using a backend or environment-specific builds

## API Endpoints Used

1. **OAuth Token:**
   - `POST https://api-m.sandbox.paypal.com/v1/oauth2/token`
   - Gets access token using Basic Auth

2. **Payouts:**
   - `POST https://api-m.sandbox.paypal.com/v1/payments/payouts`
   - Creates payout using Bearer token

## Checklist

- [x] PayPal config uses environment variables
- [x] Client-side OAuth token retrieval
- [x] Direct PayPal API calls from frontend
- [x] Transaction recording after payout
- [x] Wallet balance deduction
- [x] Status updates (pending → approved)
- [x] Error handling
- [x] Console logging for debugging

## Testing

1. ✅ Create `.env` file with PayPal credentials
2. ✅ Restart dev server
3. ✅ Host requests cash-out
4. ✅ Admin approves
5. ✅ Check browser console for PayPal API calls
6. ✅ Verify transaction in Firestore
7. ✅ Check PayPal sandbox account for money

---

**Ready to test!** No backend server needed! 🚀

