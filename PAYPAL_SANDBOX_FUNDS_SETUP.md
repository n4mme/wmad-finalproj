# 💰 PayPal Sandbox Account - Adding Funds

## The Problem

You're getting this error:
```
Sender does not have sufficient funds. Please add funds and retry.
```

This means your PayPal Sandbox Business Account doesn't have enough balance to send payouts.

## Solution: Add Funds to PayPal Sandbox Account

### Step 1: Log into PayPal Sandbox

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Go to **Dashboard** → **Sandbox** → **Accounts**

### Step 2: Find Your Business Account

Look for your business account:
- **Email:** `biyahele@business.example.com` (or your actual sandbox business account)
- **Type:** Business Account

### Step 3: Add Funds (Method 1: Manual Transfer)

1. Click on your business account
2. Go to **Account Details**
3. Look for **"Add Funds"** or **"Transfer Funds"** option
4. Add test funds (e.g., $1000 USD)

### Step 4: Add Funds (Method 2: Using Sandbox Test Accounts)

1. In PayPal Sandbox, you can create a **Personal Account** with funds
2. Transfer funds from Personal Account to Business Account
3. Or use PayPal's test credit card to add funds

### Step 5: Verify Balance

1. Check your business account balance
2. Make sure it's sufficient for the payout amount
3. Remember: Amount is converted to USD (PHP × 0.018)

## Quick Test

To test with a small amount:
1. Request a small cash-out (e.g., ₱100 = ~$1.80 USD)
2. Make sure business account has at least $2 USD
3. Try approving again

## Alternative: Use Different PayPal Account

If you can't add funds, you can:

1. **Create a new Sandbox Business Account:**
   - Go to PayPal Developer Dashboard
   - Create new business account
   - Add funds to it
   - Update credentials in `.env` file

2. **Use a different existing account:**
   - Use a sandbox account that already has funds
   - Update `REACT_APP_PAYPAL_CLIENT_ID` and `REACT_APP_PAYPAL_CLIENT_SECRET` in `.env`

## Current Account Details

- **Business Account Email:** `biyahele@business.example.com`
- **Client ID:** `LESKRS3BRFMJA`
- **Mode:** Sandbox

## Verification

After adding funds:
1. Check PayPal Sandbox account balance
2. Try approving a cash-out request again
3. Check console for success message

---

**Note:** In sandbox mode, you can add unlimited test funds. This is just for testing!

