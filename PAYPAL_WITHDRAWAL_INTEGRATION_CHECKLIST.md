# ✅ PayPal Withdrawal Integration Checklist

## 📋 Pre-Setup Requirements

### Environment Variables
- [ ] Create `.env` file in project root
- [ ] Add `REACT_APP_PAYPAL_CLIENT_ID=LESKRS3BRFMJA`
- [ ] Add `REACT_APP_PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1`
- [ ] Add `REACT_APP_PAYPAL_MODE=sandbox`
- [ ] Restart development server after creating `.env` (required for CRA to load env vars)

### PayPal Account Setup
- [ ] Verify PayPal Sandbox Business Account credentials
- [ ] Ensure PayPal account has Payouts enabled
- [ ] Test PayPal Sandbox account has sufficient balance
- [ ] Verify recipient PayPal email (sandbox account)

---

## 🔧 Code Integration Checklist

### 1. Configuration Files
- [x] `src/config/paypalConfig.js` - Uses environment variables
- [x] `src/utils/paypalPayouts.js` - Client-side PayPal API calls
- [x] `.env.example` - Template for environment variables

### 2. Host Wallet (Withdrawal Request)
- [x] Host can request cash-out from Wallet component
- [x] Host enters PayPal email
- [x] Host enters amount to cash out
- [x] Creates transaction with `type: 'cashout'`, `status: 'pending'`
- [x] Transaction stored in `walletTransactions` collection
- [x] PayPal email stored in `meta.paypalEmail`

### 3. Admin Approval Page
- [x] Admin sees pending cash-out requests
- [x] Layout shows: Profile Picture, Full Name, Email, Amount, PayPal Email, Date, Review button
- [x] Admin can click "Review" button
- [x] Review modal shows all details

### 4. Admin Approval Process
- [x] Admin clicks "Approve" button
- [x] System calculates PayPal fees (3.4% + ₱15)
- [x] System calculates amount after fees
- [x] Frontend gets PayPal OAuth token (client-side)
- [x] Frontend calls PayPal API: `POST /v1/payments/payouts`
- [x] PayPal payout is created
- [x] Payout transaction recorded in Firestore:
  - [x] `type: 'payout'`
  - [x] `status: 'processing'`
  - [x] `meta.paypalBatchId` stored
  - [x] All payout details in `meta`
- [x] Original cashout request updated to `status: 'approved'`
- [x] Wallet balance deducted (requested amount only)
- [x] Success message shown with payout ID

### 5. Transaction History
- [x] Host sees cashout transactions in Wallet
- [x] Pending cashouts show yellow color
- [x] "Pending" text appears under amount for pending cashouts
- [x] Approved cashouts show normal color

### 6. Error Handling
- [x] Invalid PayPal email validation
- [x] Amount too small (after fees) validation
- [x] PayPal API error handling
- [x] Wallet balance insufficient error
- [x] Network error handling
- [x] Clear error messages to admin

---

## 🧪 Testing Checklist

### Test 1: Host Requests Withdrawal
- [ ] Host logs in
- [ ] Host goes to Wallet page
- [ ] Host clicks "Request Cash Out"
- [ ] Host enters valid PayPal email
- [ ] Host enters amount (e.g., ₱1000)
- [ ] Host submits request
- [ ] Success message appears
- [ ] Transaction appears in Wallet with "Pending" status (yellow)
- [ ] Transaction visible in admin approval page

### Test 2: Admin Reviews Request
- [ ] Admin logs in
- [ ] Admin goes to Cash Out Approval page
- [ ] Admin sees pending request with correct layout:
  - [ ] Profile Picture (left)
  - [ ] Full Name (beside picture)
  - [ ] Email (below name)
  - [ ] Amount (with gap, beside email)
  - [ ] PayPal Email (beside amount)
  - [ ] Date & Time (beside PayPal email)
  - [ ] Review button (far right)
- [ ] Admin clicks "Review"
- [ ] Review modal opens with all details

### Test 3: Admin Approves Request
- [ ] Admin clicks "Approve" in review modal
- [ ] Browser console shows:
  - [ ] "Getting PayPal OAuth token..."
  - [ ] "✅ PayPal OAuth token obtained"
  - [ ] "Sending payout request to PayPal API..."
  - [ ] "✅ PayPal payout successful!"
  - [ ] "Payout transaction recorded: [transaction_id]"
- [ ] PayPal payout is created (check PayPal sandbox account)
- [ ] Money appears in recipient PayPal account
- [ ] Success alert shows payout ID
- [ ] Request disappears from pending list
- [ ] Host's wallet balance is deducted
- [ ] Transaction in Firestore has:
  - [ ] `type: 'payout'`
  - [ ] `status: 'processing'`
  - [ ] `meta.paypalBatchId` present
  - [ ] All payout details in `meta`

### Test 4: Transaction Display
- [ ] Host checks Wallet transaction history
- [ ] Cashout transaction shows:
  - [ ] Yellow color for pending
  - [ ] "Pending" text under amount
  - [ ] Correct amount displayed
- [ ] After approval, transaction shows:
  - [ ] Normal color (not yellow)
  - [ ] No "Pending" text
  - [ ] Status updated

### Test 5: Error Scenarios
- [ ] Test with invalid PayPal email → Error message
- [ ] Test with amount too small (fees exceed amount) → Error message
- [ ] Test with insufficient wallet balance → Error message
- [ ] Test with wrong PayPal credentials → Error message
- [ ] Test with network error → Error message

---

## 🔍 Verification Steps

### After Approval, Verify:

1. **PayPal Account**
   - [ ] Check PayPal sandbox account
   - [ ] Money received in recipient account
   - [ ] Payout batch ID matches

2. **Firestore Database**
   - [ ] Original cashout request: `status: 'approved'`
   - [ ] New payout transaction: `type: 'payout'`, `status: 'processing'`
   - [ ] `meta.paypalBatchId` matches PayPal batch ID
   - [ ] All amounts and fees recorded correctly

3. **Wallet Balance**
   - [ ] Host's wallet balance deducted correctly
   - [ ] Only requested amount deducted (fees already in payout)

4. **Transaction History**
   - [ ] Host sees transaction in Wallet
   - [ ] Status and colors correct
   - [ ] Amounts displayed correctly

---

## 🚀 Deployment Checklist

### Before Production
- [ ] Change `VITE_PAYPAL_MODE=live` in `.env`
- [ ] Update PayPal credentials to live account
- [ ] Test with real PayPal accounts (small amount)
- [ ] Verify all error handling works
- [ ] Check console for any errors
- [ ] Test with different amounts
- [ ] Verify fees calculation is correct

### Security Notes
- [ ] ⚠️ PayPal credentials are exposed in frontend (REACT_APP_ prefix)
- [ ] Consider using environment-specific builds
- [ ] For production, consider backend implementation
- [ ] Monitor PayPal API usage

---

## 📝 Current Status

### ✅ Completed
- [x] Client-side PayPal OAuth token retrieval
- [x] Direct PayPal API calls from frontend
- [x] Transaction recording after payout
- [x] Wallet balance deduction
- [x] Status updates (pending → approved)
- [x] Error handling
- [x] Console logging
- [x] Layout fixes
- [x] Yellow color for pending cashouts

### ⚠️ Known Limitations
- PayPal credentials exposed in frontend (VITE_ variables)
- CORS may block direct PayPal API calls (browser dependent)
- For production, consider backend implementation

---

## 🎯 Quick Start

1. **Create `.env` file:**
   ```env
   REACT_APP_PAYPAL_CLIENT_ID=LESKRS3BRFMJA
   REACT_APP_PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1
   REACT_APP_PAYPAL_MODE=sandbox
   ```

2. **Restart dev server:**
   ```bash
   npm start
   ```

3. **Test the flow:**
   - Host requests cash-out
   - Admin approves
   - Check console and PayPal account

---

**Ready to test!** Follow the checklist above to verify everything works. 🚀

