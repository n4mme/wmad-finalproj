# 🔴 FIX: "Unknown API key" Error

## The Problem

You're getting this error when uploading images:
```
Failed to upload images:
Image: Unknown API key
```

## The Cause

✅ Your Cloud Name is correct: `dmvdg5nxj`  
❌ The upload preset `biyahele_listings` **doesn't exist yet** in your Cloudinary account

## The Solution (2 minutes)

### 1. Go to Cloudinary Upload Settings

**Click here:** https://cloudinary.com/console/settings/upload

### 2. Click "Add upload preset"

Scroll down to "Upload presets" section and click the button.

### 3. Fill in These Settings

```
Upload preset name: biyahele_listings
Signing Mode:       Unsigned  ← MUST BE THIS!
Folder:             listings
```

### 4. Click "Save"

That's it! The preset is now created.

### 5. Test Again

1. Go to: https://biyahele.web.app
2. Press: `Ctrl + Shift + R` (hard refresh)
3. Login and try uploading images
4. Should work now! ✅

---

## Quick Checklist

- [ ] Go to https://cloudinary.com/console/settings/upload
- [ ] Click "Add upload preset"
- [ ] Name: `biyahele_listings` (exactly like this)
- [ ] Signing Mode: **Unsigned** (IMPORTANT!)
- [ ] Click "Save"
- [ ] Hard refresh your app (Ctrl + Shift + R)
- [ ] Try uploading images again

---

## After Creating the Preset

Your images will:
- ✅ Upload to Cloudinary successfully
- ✅ Display in the listing
- ✅ Be available for guests to view
- ✅ Load fast from Cloudinary CDN

---

**Create the preset now and it will work!** 🚀

See `CREATE_CLOUDINARY_PRESET.md` for detailed instructions.

