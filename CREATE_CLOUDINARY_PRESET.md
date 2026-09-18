# 🔧 Create Cloudinary Upload Preset - CRITICAL STEP!

## ⚠️ The Error You're Seeing

```
Unknown API key
401 (Unauthorized)
```

**This means:** The upload preset `biyahele_listings` doesn't exist yet in your Cloudinary account OR it's not set to "Unsigned" mode.

---

## ✅ Fix: Create the Upload Preset (2 minutes)

### Step 1: Go to Cloudinary Settings

**Click this link:** https://cloudinary.com/console/settings/upload

Or:
1. Login to Cloudinary: https://cloudinary.com/console
2. Click **Settings** (gear icon in top right)
3. Click **Upload** tab

### Step 2: Create Upload Preset

1. **Scroll down** to "Upload presets" section
2. **Click** the **"Add upload preset"** button

### Step 3: Configure the Preset

Fill in these **EXACT** settings:

| Setting | Value | ⚠️ IMPORTANT |
|---------|-------|--------------|
| **Upload preset name** | `biyahele_listings` | Must match exactly! |
| **Signing Mode** | **Unsigned** | MUST be Unsigned! |
| **Folder** | `listings` | Optional but recommended |
| **Use filename** | No | Leave unchecked |
| **Unique filename** | Yes | Check this |
| **Overwrite** | No | Leave unchecked |

### Step 4: Save

1. **Click the "Save" button** at the bottom
2. You should see your new preset in the list

---

## 🧪 Verify the Preset

After creating it:

1. **Check the preset list** - you should see `biyahele_listings`
2. **Verify "Signing mode"** shows **"Unsigned"**
3. **Note the preset name** - must be exactly `biyahele_listings`

---

## 🚀 Test Your Upload

After creating the preset:

1. **Go to:** https://biyahele.web.app
2. **Hard refresh:** Press `Ctrl + Shift + R` (clears cache)
3. **Login** as host
4. **Create a new listing**
5. **Upload images in Step 5**
6. **Click Publish**

**It should work now!** ✅

---

## 📸 Visual Guide

### Where to Find Upload Presets:

```
Cloudinary Dashboard
    ↓
Settings (gear icon)
    ↓
Upload tab
    ↓
Scroll to "Upload presets"
    ↓
Click "Add upload preset"
```

### Required Settings:

```
✅ Upload preset name: biyahele_listings
✅ Signing Mode: Unsigned (MUST be this!)
✅ Folder: listings
```

---

## ❓ Why "Unsigned"?

**Unsigned mode** allows your web app to upload images directly to Cloudinary **without** exposing your API secret. This is:
- ✅ **Secure** - No API keys in your frontend code
- ✅ **Simple** - Works from the browser
- ✅ **Standard** - Recommended for web apps

**Signed mode** requires backend server with API secret - not needed for your app!

---

## 🐛 Troubleshooting

### "Unknown API key" Error

**Cause:** Upload preset not created or wrong name  
**Fix:** 
1. Create preset with name `biyahele_listings`
2. Set to "Unsigned"
3. Save
4. Refresh your app (Ctrl + Shift + R)

### "Upload preset not found" Error

**Cause:** Preset name doesn't match  
**Fix:**
- Check spelling: `biyahele_listings` (no spaces, no caps)
- Must match exactly what's in `cloudinaryConfig.js`

### Still Getting Errors?

**Double-check:**
- [ ] Preset name is `biyahele_listings` (exact match)
- [ ] Signing Mode is **Unsigned**
- [ ] You clicked **Save**
- [ ] You hard-refreshed the app (Ctrl + Shift + R)

---

## ✅ Success Checklist

After creating the preset, you should be able to:

- [ ] Upload images without errors
- [ ] See upload progress in console
- [ ] See images appear in preview
- [ ] Publish listing successfully
- [ ] Find uploaded images in Cloudinary Media Library
- [ ] View listing with all 6 photos displayed

---

## 📊 What Happens After

Once configured, when guests view your listing:
- ✅ **Photos tab:** All 6 uploaded images
- ✅ **Fast loading:** Images from Cloudinary CDN
- ✅ **Optimized:** Automatic image optimization
- ✅ **Reliable:** Cloudinary's 99.9% uptime

---

## 🎉 You're Almost There!

Just create this one preset and everything will work perfectly!

**Go to:** https://cloudinary.com/console/settings/upload

**Create the preset, then try uploading again!** 🚀

