/**
 * Cloudinary Configuration
 * 
 * To get your credentials:
 * 1. Sign up at https://cloudinary.com/users/register/free
 * 2. Go to Dashboard: https://cloudinary.com/console
 * 3. Copy your Cloud Name
 * 4. Create an unsigned upload preset:
 *    - Go to Settings > Upload
 *    - Add upload preset
 *    - Name: biyahele_listings
 *    - Signing Mode: Unsigned
 *    - Folder: listings
 */

export const cloudinaryConfig = {
  cloudName: 'dmvdg5nxj', // REPLACE THIS with your Cloudinary Cloud Name
  uploadPreset: 'biyahele_listings' // Create this in your Cloudinary dashboard
};

// Instructions to set up:
// 1. Replace 'YOUR_CLOUD_NAME' above with your actual Cloud Name from Cloudinary
// 2. In Cloudinary console, create an upload preset named 'biyahele_listings'
// 3. Make sure the preset is set to "Unsigned"

