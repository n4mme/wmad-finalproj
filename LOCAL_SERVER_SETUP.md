# 🖥️ Local PayPal Server Setup

## Quick Start Guide

### Step 1: Navigate to Server Directory

```bash
cd server
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Express (web server)
- CORS (enable cross-origin requests)
- PayPal SDK
- dotenv (environment variables)

### Step 3: Start the Server

```bash
npm start
```

You should see:
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

### Step 4: Test It

1. **Keep the server running** in the terminal
2. Open your app in the browser
3. Try approving a cash-out request
4. Watch the server terminal for logs
5. Check browser console for success messages

## How It Works

1. **Frontend** → Calls `http://localhost:3001/api/paypal/payout`
2. **Local Server** → Handles PayPal API authentication
3. **PayPal API** → Processes the payout
4. **Response** → Returns to frontend

## Configuration

The server uses credentials from:
- `server/.env` (if exists)
- Defaults to credentials in `src/config/paypalConfig.js`

To customize, create `server/.env`:
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_MODE=sandbox
PORT=3001
```

## Troubleshooting

### Port Already in Use
Change port in `.env`:
```
PORT=3002
```

### Module Not Found
Run `npm install` again in the `server` directory.

### PayPal Authentication Failed
- Check credentials are correct
- Verify sandbox mode for testing
- Make sure PayPal account has Payouts enabled

## Development Mode

For auto-reload during development:
```bash
npm run dev
```

(Requires nodemon: `npm install -g nodemon`)

## Next Steps

Once testing works:
- Deploy to free hosting (Vercel, Netlify, Railway)
- Or use Firebase Cloud Functions
- Or keep using locally for development

---

**Ready to test!** Start the server and try approving a cash-out. 🚀

