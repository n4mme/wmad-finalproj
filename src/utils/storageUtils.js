/**
 * Cloudinary Image Upload Utilities for BiyaHele
 * 
 * This file contains helper functions for uploading and managing images using Cloudinary
 */

import { cloudinaryConfig } from '../cloudinaryConfig';

// ==========================================
// IMAGE UPLOAD UTILITIES
// ==========================================

/**
 * Validate image file
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
    const errors = [];
    
    // Check if file exists
    if (!file) {
        errors.push('No file provided');
        return { isValid: false, errors };
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        errors.push('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
        errors.push(`File size must be less than ${maxSizeMB}MB. Current size: ${fileSizeMB.toFixed(2)}MB`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Upload listing image to Cloudinary with retry logic
 */
export const uploadListingImage = async (listingId, file, retries = 3) => {
    try {
        // Validate file
        const validation = validateImageFile(file, 10); // 10MB limit for listing images
        if (!validation.isValid) {
            console.error('Image validation failed:', validation.errors);
            return { success: false, errors: validation.errors };
        }
        
        console.log('Uploading to Cloudinary:', file.name);
        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        
        // Prepare form data for Cloudinary upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', `biyahele/listings/${listingId}`);
        formData.append('public_id', `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
        
        // Upload with retry logic
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Upload attempt ${attempt}/${retries}...`);
                
                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                console.log('✓ Image uploaded successfully to Cloudinary:', data.secure_url);
                return {
                    success: true,
                    url: data.secure_url,
                    filename: data.public_id,
                };
                
            } catch (uploadError) {
                lastError = uploadError;
                console.error(`Upload attempt ${attempt} failed:`, uploadError.message);
                
                // If this is not the last attempt, wait before retrying
                if (attempt < retries) {
                    const waitTime = attempt * 1000; // Exponential backoff
                    console.log(`Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // All retries failed
        throw lastError;
        
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name
        });
        
        let errorMessage = error.message || 'Unknown error occurred';
        
        // Provide more specific error messages
        if (errorMessage.includes('Invalid cloud_name')) {
            errorMessage = 'Invalid Cloudinary configuration. Please check your Cloud Name in cloudinaryConfig.js';
        } else if (errorMessage.includes('Upload preset')) {
            errorMessage = 'Upload preset not found. Please create "biyahele_listings" preset in Cloudinary dashboard';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        return {
            success: false,
            error: errorMessage,
        };
    }
};

/**
 * Upload multiple listing images to Cloudinary
 */
export const uploadListingImages = async (listingId, files) => {
    try {
        console.log(`Starting upload of ${files.length} images for listing ${listingId}`);
        
        // Validate all files first
        const validationResults = files.map((file, index) => ({
            index,
            file,
            validation: validateImageFile(file, 10)
        }));
        
        const invalidFiles = validationResults.filter(r => !r.validation.isValid);
        if (invalidFiles.length > 0) {
            console.error('Some files failed validation:', invalidFiles);
            return {
                success: false,
                error: `${invalidFiles.length} file(s) failed validation`,
                uploadedImages: [],
                failedUploads: invalidFiles.map(r => ({
                    filename: r.file.name,
                    error: r.validation.errors.join(', ')
                }))
            };
        }
        
        // Upload images sequentially to avoid overwhelming the connection
        const results = [];
        for (let i = 0; i < files.length; i++) {
            console.log(`Uploading image ${i + 1}/${files.length}...`);
            const result = await uploadListingImage(listingId, files[i]);
            results.push(result);
            
            // Add a small delay between uploads to prevent rate limiting
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        const successfulUploads = results.filter(r => r.success);
        const failedUploads = results.filter(r => !r.success);
        
        console.log(`Upload complete: ${successfulUploads.length} succeeded, ${failedUploads.length} failed`);
        
        if (failedUploads.length > 0) {
            console.error('Failed uploads:', failedUploads);
        }
        
        return {
            success: failedUploads.length === 0,
            uploadedImages: successfulUploads.map(r => ({
                url: r.url,
                filename: r.filename,
            })),
            failedUploads: failedUploads.map(r => ({
                error: r.error || r.errors?.join(', ') || 'Unknown error'
            })),
        };
    } catch (error) {
        console.error('Error uploading multiple listing images:', error);
        return {
            success: false,
            error: error.message,
            uploadedImages: [],
            failedUploads: [],
        };
    }
};

/**
 * Create a preview URL for an image file
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
 * Delete functions
 * Note: Cloudinary deletion requires authenticated requests (API key + secret)
 * For security, deletion should be done server-side
 * For now, images remain in Cloudinary (within free limits)
 */
export const deleteListingImage = async (listingId, filename) => {
    console.log('Note: Cloudinary deletion requires backend API with authentication');
    console.log('Image will remain in Cloudinary:', filename);
    return { success: true };
};

export const deleteListingImages = async (listingId, filenames) => {
    console.log('Note: Cloudinary deletion requires backend API with authentication');
    console.log('Images will remain in Cloudinary:', filenames);
    return { success: true };
};

// ==========================================
// PROFILE PHOTO OPERATIONS  
// ==========================================

/**
 * Upload profile photo to Cloudinary
 */
export const uploadProfilePhoto = async (userId, file) => {
    try {
        // Validate file
        const validation = validateImageFile(file, 5); // 5MB limit for profile photos
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }
        
        console.log('Uploading profile photo to Cloudinary:', file.name);
        
        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', `biyahele/profile-photos/${userId}`);
        formData.append('public_id', `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }
        
        const data = await response.json();
        
        console.log('✓ Profile photo uploaded successfully:', data.secure_url);
        return {
            success: true,
            url: data.secure_url,
            filename: data.public_id,
        };
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Delete profile photo
 */
export const deleteProfilePhoto = async (userId, filename) => {
    console.log('Note: Cloudinary deletion requires backend API');
    return { success: true };
};
