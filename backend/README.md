# PayPal Payout Backend API

This is a simple Express.js backend server that handles PayPal payouts securely. It can be deployed to any Node.js hosting service.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your PayPal credentials:
   ```
   PAYPAL_CLIENT_ID=LESKRS3BRFMJA
   PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1
   PAYPAL_MODE=sandbox
   PORT=3001
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:3001/health
   ```

## 📦 Deploy to Render (Free)

1. **Push to GitHub:**
   - Make sure your `backend` folder is in your repository
   - Push to GitHub

2. **Create Render Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service:**
   - **Name**: `biyahele-paypal-api` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables:**
   - Click "Environment" tab
   - Add these variables:
     ```
     PAYPAL_CLIENT_ID=LESKRS3BRFMJA
     PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1
     PAYPAL_MODE=sandbox
     PORT=3001
     ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy the service URL (e.g., `https://biyahele-paypal-api.onrender.com`)

6. **Update Frontend:**
   - Update `src/utils/paypalPayouts.js` to use your Render URL
   - Change the backend API URL to your Render service URL

## 📦 Deploy to Railway (Free)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize:**
   ```bash
   cd backend
   railway init
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set PAYPAL_CLIENT_ID=LESKRS3BRFMJA
   railway variables set PAYPAL_CLIENT_SECRET=EJaeI1_vK7LZReYgyRGZZJ6udsXjSnOjznDVmQGNrWumtCTPosCkCb42LEgXUoV7uWiWa8jJ6CZaYTo1
   railway variables set PAYPAL_MODE=sandbox
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

## 🔗 API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### PayPal Payout
```
POST /api/paypal/payout
Content-Type: application/json

{
  "recipientEmail": "hostuser@personal.example.com",
  "amount": 17.10,
  "currency": "USD",
  "originalAmount": 950,
  "originalCurrency": "PHP"
}
```

**Response:**
```json
{
  "success": true,
  "payoutId": "BATCH-1234567890",
  "batchStatus": "PENDING"
}
```

## 🔒 Security Notes

- Never commit `.env` file to Git
- Keep PayPal credentials secure
- Use HTTPS in production
- Consider adding authentication middleware for production

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PAYPAL_CLIENT_ID` | PayPal Client ID | Yes |
| `PAYPAL_CLIENT_SECRET` | PayPal Client Secret | Yes |
| `PAYPAL_MODE` | `sandbox` or `live` | Yes |
| `PORT` | Server port (default: 3001) | No |

## 🐛 Troubleshooting

- **Port already in use**: Change `PORT` in `.env`
- **PayPal errors**: Check credentials and mode (sandbox/live)
- **CORS errors**: Update allowed origins in `server.js`

