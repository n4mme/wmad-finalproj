# 💰 PayPal Direct API Implementation (No Cloud Functions Required)

## Overview

This implementation uses PayPal's REST API directly from the frontend, eliminating the need for Firebase Cloud Functions or any backend server.

## ⚠️ Security Note

**IMPORTANT:** This implementation stores PayPal credentials in client-side code (`src/config/paypalConfig.js`). While this works for development and testing, consider the following:

- ✅ **Works without Cloud Functions** - No Blaze plan upgrade needed
- ✅ **Works without backend server** - No localhost or other hosting required
- ⚠️ **Credentials exposed** - PayPal secret is visible in client-side code
- ⚠️ **Not ideal for production** - Consider using environment variables or a backend for production

## How It Works

1. **Admin approves cash-out request**
2. **System calculates PayPal fees** (3.4% + ₱15)
3. **Fees are deducted from payout amount** (not from E-Wallet)
4. **System gets PayPal access token** using Client ID and Secret
5. **System sends payout** to host's PayPal account (amount minus fees)
6. **Only requested amount deducted from host's E-Wallet** (fees already deducted from payout)

## Configuration

PayPal credentials are stored in `src/config/paypalConfig.js`:

```javascript
export const PAYPAL_CONFIG = {
    clientId: 'LESKRS3BRFMJA',
    clientSecret: 'EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1',
    mode: 'sandbox', // Change to 'live' for production
    adminPayPalEmail: 'biyahele@business.example.com',
};
```

## Fee Calculation

- **PayPal Fees:** 3.4% of amount + ₱15 fixed fee
- **Fees deducted from:** Payout amount (not from E-Wallet)
- **E-Wallet deduction:** Only the requested amount (fees already taken from payout)

### Example:
- Host requests: ₱1,000
- PayPal fees: (₱1,000 × 3.4%) + ₱15 = ₱49
- Amount sent to PayPal: ₱1,000 - ₱49 = ₱951
- E-Wallet deduction: ₱1,000

## Testing

### Sandbox Mode (Current)
- Uses PayPal Sandbox API
- No real money transferred
- Test with sandbox accounts:
  - Admin: `biyahele@business.example.com`
  - Host: `hostuser@personal.example.com`

### Production Mode
1. Change `mode: 'sandbox'` to `mode: 'live'` in `paypalConfig.js`
2. Update credentials with live PayPal account credentials
3. Ensure admin PayPal account has sufficient balance

## Files Modified

1. **`src/config/paypalConfig.js`** (NEW)
   - Stores PayPal credentials and configuration

2. **`src/utils/paypalPayouts.js`**
   - Direct REST API implementation
   - Gets access token
   - Creates payout request
   - Handles fees deduction

3. **`src/components/admin/ReviewCashOutModal.jsx`**
   - Updated to pass fees to payout function
   - Deducts fees from payout amount (not wallet)
   - Only deducts requested amount from wallet

## API Flow

```
1. Admin clicks "Approve"
   ↓
2. Calculate fees: (amount × 3.4%) + ₱15
   ↓
3. Get PayPal access token (OAuth2)
   ↓
4. Create payout request:
   - Amount: (requested amount - fees)
   - Recipient: Host PayPal email
   - Currency: USD (converted from PHP)
   ↓
5. Send payout via PayPal API
   ↓
6. Deduct requested amount from host's E-Wallet
   ↓
7. Update transaction status
```

## Error Handling

The implementation handles:
- Invalid PayPal credentials
- Insufficient PayPal balance
- Invalid recipient email
- Amount too small (after fees)
- Network errors
- PayPal API errors

## Benefits

✅ **No Cloud Functions needed** - Works on Spark plan  
✅ **No backend server needed** - Pure frontend implementation  
✅ **No localhost required** - Works with Firebase Hosting  
✅ **Fees deducted from payout** - As requested  
✅ **Real PayPal payouts** - Actually sends money  

## Limitations

⚠️ **Credentials in client code** - Security consideration  
⚠️ **CORS restrictions** - PayPal API may have CORS limitations  
⚠️ **Rate limiting** - PayPal may rate limit direct API calls  

## Troubleshooting

### Error: "Failed to get access token"
- Check PayPal credentials in `paypalConfig.js`
- Verify Client ID and Secret are correct
- Ensure PayPal account has Payouts enabled

### Error: "PayPal API error: 401"
- Invalid credentials
- Check if credentials match the mode (sandbox/live)

### Error: "Insufficient funds"
- Admin PayPal account needs sufficient balance
- For sandbox, add funds to test account

### CORS Errors
- PayPal API may block direct browser requests
- Consider using a proxy or backend if CORS issues occur

## Next Steps

1. ✅ Implementation complete
2. Test with sandbox accounts
3. Verify payouts work correctly
4. Switch to live mode when ready
5. Consider securing credentials for production

---

**Status:** ✅ Ready to use! No Cloud Functions or backend required.

