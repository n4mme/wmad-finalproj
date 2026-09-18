# 🔐 Create Admin Account - BiyaHele

This guide will help you create the admin account for your BiyaHele application.

## 📋 Admin Account Details

- **Email:** `admin@gmail.com`
- **Password:** `admin123456`

---

## 🚀 Method 1: Using Admin Setup Page (Easiest - Recommended)

This is the simplest method and doesn't require any additional setup.

### Steps:

1. **Make sure you are NOT logged in** to the application
2. **Start your development server** (if not already running):
   ```bash
   npm start
   ```
3. **Navigate to the admin setup page:**
   ```
   http://localhost:3000/admin-setup
   ```
4. **Click "Create Admin Account"** button
5. **Wait for confirmation** - you'll see a success message
6. **You'll be redirected to the login page**
7. **Sign in** with:
   - Email: `admin@gmail.com`
   - Password: `admin123456`

### ⚠️ Important Notes:

- This should only be done **ONCE**
- Make sure you are **NOT logged in** before creating the admin account
- After creating the admin account, you can remove the `/admin-setup` route from `App.js` if you want (it's optional)

---

## 🛠️ Method 2: Using Node.js Script (Alternative)

If you prefer using a command-line script, you can use the Node.js script.

### Prerequisites:

1. **Download Firebase Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: **biyahele**
   - Go to **Project Settings** (gear icon) → **Service Accounts** tab
   - Click **"Generate New Private Key"**
   - Save the JSON file as `serviceAccountKey.json` in your project root directory
   - ⚠️ **IMPORTANT:** Add `serviceAccountKey.json` to `.gitignore` to keep it secure!

2. **Run the script:**
   ```bash
   node scripts/createAdminAccount.js
   ```

### What the script does:

- Creates the admin user in Firebase Authentication
- Creates the admin user document in Firestore with `role: 'admin'`
- Sets `emailVerified: true` and `otpVerified: true`

---

## ✅ Verification

After creating the admin account, verify it works:

1. **Sign out** (if you're logged in)
2. **Go to the login page:** `http://localhost:3000/auth`
3. **Sign in** with:
   - Email: `admin@gmail.com`
   - Password: `admin123456`
4. **You should be redirected to the Admin Dashboard**

---

## 🔒 Security Notes

- ⚠️ **Change the password** after first login if you're deploying to production
- ⚠️ **Keep the admin credentials secure**
- ⚠️ **Don't commit** `serviceAccountKey.json` to version control
- ⚠️ **Remove the admin setup route** from production builds if desired

---

## 🐛 Troubleshooting

### Error: "Email already in use"
- The admin account already exists
- You can sign in directly with `admin@gmail.com` and `admin123456`

### Error: "Please sign out first"
- Make sure you're logged out before creating the admin account
- Clear your browser cache/cookies if needed

### Error: "serviceAccountKey.json not found" (Method 2)
- Make sure you've downloaded the service account key from Firebase Console
- Place it in the project root directory (same level as `package.json`)

---

## 📝 After Setup

Once the admin account is created, you can:

1. **Access the Admin Dashboard** at `http://localhost:3000` (when logged in as admin)
2. **Manage users, listings, transactions, and more**
3. **Optionally remove the setup route** from `App.js`:
   ```javascript
   // Remove this line after creating admin account:
   <Route path="/admin-setup" element={<AdminSetup />} />
   ```

---

## 🎉 Done!

Your admin account is now ready to use!

