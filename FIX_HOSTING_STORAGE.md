# 🔧 Fix Firebase Hosting Storage Quota Error

## The Problem

You're getting this error:
```
Error: Request to https://firebasehosting.googleapis.com/v1beta1/projects/-/sites/biyahele/versions had HTTP Error: 429, You have exceeded the Hosting storage quota for your Firebase project
```

This happens because Firebase's free Spark plan has limited hosting storage, and old releases are taking up space.

---

## ✅ Solution 1: Configure Release Retention (Already Applied)

I've updated your `firebase.json` to automatically keep only the **last 5 releases**. This will automatically delete older releases to free up space.

### What I Changed:

Added this to your `firebase.json`:
```json
"release": {
  "retain": 5
}
```

This means Firebase will automatically delete releases older than the 5 most recent ones.

---

## ✅ Solution 2: Clean Up Old Releases via Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: **biyahele**

2. **Navigate to Hosting:**
   - Click **Hosting** in the left sidebar
   - Click on **Releases** tab

3. **Delete Old Releases:**
   - You'll see a list of all releases
   - Delete old/unnecessary releases manually
   - Keep only the most recent ones you need

---

## ✅ Solution 3: Try Deploying Again

After configuring release retention, try deploying again:

```bash
firebase deploy --only hosting
```

The retention setting should automatically clean up old releases when you deploy.

---

## ✅ Solution 4: Upgrade to Blaze Plan (Optional)

If you need more storage:

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: **biyahele**

2. **Upgrade Plan:**
   - Go to **Project Settings** (gear icon)
   - Click **Upgrade** or **Modify plan**
   - Select **Blaze plan** (pay-as-you-go)
   - Note: Blaze plan has a free tier that includes generous hosting storage

**Important:** The Blaze plan has a free tier that covers most usage. You only pay for what you use beyond the free tier limits.

---

## 📋 Recommended Settings

For the free Spark plan, I recommend:
- **Keep 3-5 releases** (already configured)
- **Delete preview channels** you no longer need
- **Clean up old releases** manually if needed

---

## 🚀 After Fixing

Once you've configured release retention or cleaned up old releases:

1. **Try deploying again:**
   ```bash
   firebase deploy --only hosting
   ```

2. **If it still fails:**
   - Wait a few minutes (Firebase may need time to process deletions)
   - Check Firebase Console → Hosting → Releases to see if old releases were deleted
   - Try deploying again

---

## 💡 Prevention Tips

To avoid this issue in the future:

1. **Keep release retention low** (3-5 releases is usually enough)
2. **Delete preview channels** when you're done testing
3. **Regularly clean up** old releases via Firebase Console
4. **Consider upgrading** to Blaze plan if you deploy frequently

---

## ✅ Next Steps

1. The `firebase.json` has been updated with release retention
2. Try deploying again: `firebase deploy --only hosting`
3. If it still fails, manually delete old releases in Firebase Console
4. Wait a few minutes and try again

The release retention setting will automatically manage old releases going forward!

