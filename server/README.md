# 🚀 Local PayPal Payout Server

This is a local Node.js server for testing PayPal payouts without CORS issues.

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure PayPal Credentials

The server uses the credentials from your `paypalConfig.js` by default, but you can create a `.env` file to override:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials (optional - defaults are already set)
```

### 3. Start the Server

```bash
npm start
```

Or for auto-reload during development:

```bash
npm run dev
```

### 4. Server Status

Once running, you'll see:
```
==================================================
🚀 PayPal Payout Server Running
==================================================
📍 Server: http://localhost:3001
🔐 Mode: sandbox
💳 Client ID: LESKRS3B...
📡 Endpoint: POST http://localhost:3001/api/paypal/payout
==================================================
✅ Ready to process PayPal payouts!
```

## How It Works

1. **Frontend calls local server** - When you approve a cash-out, the frontend tries `http://localhost:3001` first
2. **Server processes PayPal API** - The server handles PayPal authentication and API calls
3. **No CORS issues** - Since it's a local server, there are no CORS restrictions
4. **Secure** - Credentials stay on the server, not in browser code

## Testing

1. Start the server: `npm start`
2. Keep it running in a terminal
3. Open your app and try approving a cash-out
4. Check the server terminal for logs
5. Check browser console for success messages

## Endpoints

### POST `/api/paypal/payout`

Process a PayPal payout.

**Request Body:**
```json
{
  "recipientEmail": "hostuser@personal.example.com",
  "amount": 18.00,
  "currency": "USD",
  "originalAmount": 1000,
  "originalCurrency": "PHP"
}
```

**Response:**
```json
{
  "success": true,
  "payoutId": "BATCH-123456789",
  "batchStatus": "PENDING",
  "amount": 18.00,
  "currency": "USD",
  "recipientEmail": "hostuser@personal.example.com"
}
```

## Troubleshooting

### Port Already in Use
If port 3001 is taken, change it in `.env`:
```
PORT=3002
```

### PayPal Authentication Failed
- Check your credentials in `.env` or `paypalConfig.js`
- Verify you're using sandbox credentials for sandbox mode
- Make sure your PayPal account has Payouts enabled

### Server Not Starting
- Make sure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check for errors in the terminal

## Next Steps

Once testing is complete, you can:
1. Deploy to a free hosting service (Vercel, Netlify, Railway)
2. Use Firebase Cloud Functions (requires Blaze plan)
3. Keep using local server for development

---

**Note:** This server is for testing only. For production, use a hosted backend or Cloud Functions.

