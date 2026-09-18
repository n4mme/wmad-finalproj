# Alternative: Use Cloudinary for Image Storage (FREE)

If you cannot enable Firebase Storage, you can use Cloudinary instead.

## Cloudinary Free Plan

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ FREE forever
- ✅ No credit card required

## Setup Cloudinary (10 minutes)

### Step 1: Create Account

1. Go to: https://cloudinary.com/users/register/free
2. Sign up (free account)
3. Verify your email

### Step 2: Get Your Credentials

1. Go to Dashboard: https://cloudinary.com/console
2. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Install Cloudinary SDK

```bash
cd C:\Users\EMMAN\Desktop\WMAD\final-project
npm install cloudinary-react
```

### Step 4: Create Cloudinary Config

Create `src/cloudinaryConfig.js`:

```javascript
export const cloudinaryConfig = {
  cloudName: 'YOUR_CLOUD_NAME', // Replace with your Cloud Name
  uploadPreset: 'biyahele_listings' // We'll create this next
};
```

### Step 5: Create Upload Preset

1. Go to: https://cloudinary.com/console/settings/upload
2. Scroll to "Upload presets"
3. Click "Add upload preset"
4. Set:
   - **Preset name:** `biyahele_listings`
   - **Signing Mode:** Unsigned
   - **Folder:** `listings`
5. Click "Save"

### Step 6: Replace Storage Utils

Replace the content of `src/utils/storageUtils.js`:

```javascript
import { cloudinaryConfig } from '../cloudinaryConfig';

/**
 * Upload image to Cloudinary
 */
export const uploadListingImage = async (listingId, file, retries = 3) => {
    try {
        console.log('Uploading to Cloudinary:', file.name);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', `listings/${listingId}`);
        
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                console.log('✓ Image uploaded successfully:', data.secure_url);
                return {
                    success: true,
                    url: data.secure_url,
                    filename: data.public_id
                };
            } catch (uploadError) {
                lastError = uploadError;
                console.error(`Upload attempt ${attempt} failed:`, uploadError.message);
                
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
            }
        }
        
        throw lastError;
        
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Upload multiple images
 */
export const uploadListingImages = async (listingId, files) => {
    try {
        console.log(`Starting upload of ${files.length} images`);
        
        const results = [];
        for (let i = 0; i < files.length; i++) {
            console.log(`Uploading image ${i + 1}/${files.length}...`);
            const result = await uploadListingImage(listingId, files[i]);
            results.push(result);
            
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        const successfulUploads = results.filter(r => r.success);
        const failedUploads = results.filter(r => !r.success);
        
        console.log(`Upload complete: ${successfulUploads.length} succeeded`);
        
        return {
            success: failedUploads.length === 0,
            uploadedImages: successfulUploads.map(r => ({
                url: r.url,
                filename: r.filename
            })),
            failedUploads: failedUploads.map(r => ({
                error: r.error || 'Unknown error'
            }))
        };
    } catch (error) {
        console.error('Error uploading images:', error);
        return {
            success: false,
            error: error.message,
            uploadedImages: [],
            failedUploads: []
        };
    }
};

/**
 * Create image preview
 */
export const createImagePreview = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Invalid file type'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

/**
 * Delete functions (Cloudinary requires authenticated requests for deletion)
 * For now, images remain in Cloudinary (within free limits)
 */
export const deleteListingImage = async (listingId, filename) => {
    console.log('Note: Cloudinary deletion requires backend API');
    return { success: true };
};

export const deleteListingImages = async (listingId, filenames) => {
    console.log('Note: Cloudinary deletion requires backend API');
    return { success: true };
};
```

### Step 7: Update Firebase Config

Keep Firebase config as is - we're only replacing the storage part.

### Step 8: Rebuild and Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Test Cloudinary Upload

1. Go to https://biyahele.web.app
2. Create a listing and upload images
3. Images will upload to Cloudinary (no CORS issues!)
4. Check Cloudinary Dashboard to see uploaded images

## Advantages of Cloudinary

- ✅ No CORS issues
- ✅ Automatic image optimization
- ✅ Image transformations (resize, crop, etc.)
- ✅ CDN delivery (faster loading)
- ✅ More free storage than Firebase (25GB vs 5GB)

## Cloudinary vs Firebase Storage

| Feature | Cloudinary Free | Firebase Free |
|---------|----------------|---------------|
| Storage | 25 GB | 5 GB |
| Bandwidth | 25 GB/month | 1 GB/day |
| Setup | Easier (no CORS) | Requires CORS config |
| Cost | Free forever | Free forever |

## Important Notes

- Image URLs will be from Cloudinary (cloudinary.com domain)
- Images stored securely in cloud
- Can switch to Firebase Storage later if needed
- Delete functionality requires backend API (optional)

---

**Cloudinary is a great alternative if you can't use Firebase Storage!** 🌟

