/**
 * Firestore Utility Functions for BiyaHele
 * 
 * This file contains all CRUD operations for Firestore collections:
 * - Listings
 * - Favorites
 * - Bookings
 * - Messages
 */

import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    Timestamp,
    serverTimestamp,
    runTransaction,
    increment
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
    createListingDocument,
    createFavoriteDocument,
    createBookingDocument,
    generateFavoriteId,
    validateListingForPublish,
    createCouponDocument,
    createWishDocument
} from './firestoreModels';

// ==========================================
// USER UTILITIES
// ==========================================

/**
 * Check if user is verified in Firestore
 */
export const checkUserVerification = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return { 
                success: false, 
                verified: false,
                error: 'User document not found' 
            };
        }
        
        const userData = userSnap.data();
        const isVerified = userData.emailVerified === true || userData.otpVerified === true;
        
        return { 
            success: true, 
            verified: isVerified,
            data: userData 
        };
    } catch (error) {
        console.error('Error checking user verification:', error);
        return { 
            success: false, 
            verified: false,
            error: error.message 
        };
    }
};

// ==========================================
// LISTINGS CRUD OPERATIONS
// ==========================================

/**
 * Create a new listing
 */
// Helper function to extract province from location data
const extractProvince = (locationData) => {
    // Priority 1: Use location.province if it exists
    if (locationData?.province && locationData.province.trim()) {
        return locationData.province.trim();
    }
    
    // Priority 2: Try to extract from locationName
    if (locationData?.locationName) {
        const locationName = locationData.locationName;
        const provinceMatch = locationName.match(/\b(Cavite|Metro Manila|Manila|Laguna|Batangas|Rizal|Quezon|Bulacan|Pampanga|Nueva Ecija|Tarlac|Zambales|Bataan|Aurora|Palawan|Mindoro|Romblon|Marinduque|Albay|Camarines|Sorsogon|Catanduanes|Masbate|Aklan|Antique|Capiz|Guimaras|Iloilo|Negros|Bohol|Cebu|Leyte|Samar|Biliran|Eastern Samar|Northern Samar|Western Samar|Surigao|Agusan|Dinagat|Davao|Compostela|Cotabato|Sarangani|South Cotabato|Sultan Kudarat|Lanao|Maguindanao|Sulu|Tawi-Tawi|Basilan|Zamboanga|Misamis|Bukidnon|Camiguin|Lanao del Norte|Lanao del Sur)\b/i);
        if (provinceMatch) {
            return provinceMatch[1];
        }
    }
    
    // Priority 3: Try to extract from city (known cities)
    if (locationData?.city) {
        const city = locationData.city.toLowerCase();
        // Tagaytay is in Cavite
        if (city.includes('tagaytay')) {
            return 'Cavite';
        }
        // Add more city-to-province mappings as needed
    }
    
    return '';
};

export const createListing = async (hostId, listingData) => {
    try {
        const listingRef = doc(collection(db, 'listings'));
        
        // Extract province from location data if not provided
        let province = listingData.province || listingData.location?.province;
        if (!province || !province.trim()) {
            province = extractProvince(listingData.location);
        }
        
        // Ensure province is set at top level for easier querying
        const listingWithProvince = {
            ...listingData,
            province: province || '',
            // Also ensure location.province is set if we extracted it
            location: {
                ...listingData.location,
                province: listingData.location?.province || province || '',
            }
        };
        
        const listingDoc = createListingDocument({
            ...listingWithProvince,
            id: listingRef.id,
            hostId: hostId,
            createdAt: serverTimestamp(),
        });
        
        await setDoc(listingRef, listingDoc);
        return { success: true, id: listingRef.id };
    } catch (error) {
        console.error('Error creating listing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get a single listing by ID
 */
export const getListing = async (listingId) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
            return { success: true, data: { ...listingSnap.data(), id: listingSnap.id } };
        } else {
            return { success: false, error: 'Listing not found' };
        }
    } catch (error) {
        console.error('Error getting listing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all listings for a specific host
 */
export const getHostListings = async (hostId) => {
    try {
        const listingsRef = collection(db, 'listings');
        const q = query(listingsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const listings = [];
        querySnapshot.forEach((doc) => {
            listings.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: listings };
    } catch (error) {
        console.error('Error getting host listings:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all active listings (for guest view)
 */
export const getActiveListings = async (filters = {}) => {
    try {
        const listingsRef = collection(db, 'listings');
        
        // Build query constraints
        const constraints = [
            where('isActive', '==', true),
            where('status', '==', 'active')
        ];
        
        // Add category filter if specified
        if (filters.category) {
            constraints.push(where('category', '==', filters.category));
        }
        
        constraints.push(orderBy('createdAt', 'desc'));
        
        let q = query(listingsRef, ...constraints);
        
        // Apply limit if specified
        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }
        
        const querySnapshot = await getDocs(q);
        
        const listings = [];
        querySnapshot.forEach((doc) => {
            listings.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: listings };
    } catch (error) {
        console.error('Error getting active listings:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all listings (for admin/maintenance operations)
 */
export const getAllListings = async () => {
    try {
        const listingsRef = collection(db, 'listings');
        const querySnapshot = await getDocs(listingsRef);
        
        const listings = [];
        querySnapshot.forEach((doc) => {
            listings.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: listings };
    } catch (error) {
        console.error('Error getting all listings:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all booked dates from all listings (for testing/maintenance)
 * Note: This only clears booked dates from the current user's listings due to Firestore permissions
 */
export const clearAllBookedDates = async (hostId) => {
    try {
        if (!hostId) {
            return { success: false, error: 'Host ID is required' };
        }
        
        // Get only the host's listings (which they have permission to read/update)
        const result = await getHostListings(hostId);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        const listings = result.data;
        const updates = [];
        
        for (const listing of listings) {
            if (listing.bookedDates && listing.bookedDates.length > 0) {
                updates.push(
                    updateListing(listing.id, { bookedDates: [] })
                );
            }
        }
        
        if (updates.length === 0) {
            return { 
                success: true, 
                message: 'No booked dates found to clear in your listings' 
            };
        }
        
        await Promise.all(updates);
        
        return { 
            success: true, 
            message: `Cleared booked dates from ${updates.length} listing(s)` 
        };
    } catch (error) {
        console.error('Error clearing all booked dates:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update a listing
 */
export const updateListing = async (listingId, updates) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        // If location.province is being updated, also update top-level province
        const updateData = { ...updates };
        if (updates.location?.province) {
            updateData.province = updates.location.province;
        } else if (updates.province) {
            // If province is updated directly, ensure it's also in location if location exists
            if (updates.location) {
                updateData.location = { ...updates.location, province: updates.province };
            }
        }
        await updateDoc(listingRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating listing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Publish a listing (set to active)
 */
export const publishListing = async (listingId) => {
    try {
        // First, get the listing to validate
        const listingResult = await getListing(listingId);
        if (!listingResult.success) {
            return listingResult;
        }
        
        // Validate listing before publishing
        const validation = validateListingForPublish(listingResult.data);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }
        
        // Update listing status
        const listingRef = doc(db, 'listings', listingId);
        await updateDoc(listingRef, {
            isActive: true,
            status: 'active',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error publishing listing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Unlist a listing (set to inactive)
 */
export const unlistListing = async (listingId) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        await updateDoc(listingRef, {
            isActive: false,
            status: 'unlisted',
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error unlisting listing:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a listing
 */
export const deleteListing = async (listingId) => {
    try {
        const listingRef = doc(db, 'listings', listingId);
        await deleteDoc(listingRef);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting listing:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// FAVORITES CRUD OPERATIONS
// ==========================================

/**
 * Add a listing to favorites
 */
export const addToFavorites = async (userId, listingId, listingSnapshot) => {
    try {
        const favoriteId = generateFavoriteId(userId, listingId);
        const favoriteRef = doc(db, 'favorites', favoriteId);
        
        const favoriteDoc = createFavoriteDocument({
            userId,
            listingId,
            listingSnapshot,
            createdAt: serverTimestamp(),
        });
        
        await setDoc(favoriteRef, favoriteDoc);
        return { success: true, id: favoriteId };
    } catch (error) {
        console.error('Error adding to favorites:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove a listing from favorites
 */
export const removeFromFavorites = async (userId, listingId) => {
    try {
        const favoriteId = generateFavoriteId(userId, listingId);
        const favoriteRef = doc(db, 'favorites', favoriteId);
        await deleteDoc(favoriteRef);
        
        return { success: true };
    } catch (error) {
        console.error('Error removing from favorites:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if a listing is favorited by user
 */
export const isFavorited = async (userId, listingId) => {
    try {
        const favoriteId = generateFavoriteId(userId, listingId);
        const favoriteRef = doc(db, 'favorites', favoriteId);
        const favoriteSnap = await getDoc(favoriteRef);
        
        return { success: true, isFavorited: favoriteSnap.exists() };
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all favorites for a user
 */
export const getUserFavorites = async (userId) => {
    try {
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const favorites = [];
        querySnapshot.forEach((doc) => {
            favorites.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: favorites };
    } catch (error) {
        console.error('Error getting user favorites:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Toggle favorite status (add if not favorited, remove if favorited)
 */
export const toggleFavorite = async (userId, listingId, listingSnapshot) => {
    try {
        const checkResult = await isFavorited(userId, listingId);
        
        if (checkResult.isFavorited) {
            return await removeFromFavorites(userId, listingId);
        } else {
            return await addToFavorites(userId, listingId, listingSnapshot);
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// BOOKINGS CRUD OPERATIONS
// ==========================================

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
    try {
        const bookingRef = doc(collection(db, 'bookings'));
        const bookingDoc = createBookingDocument({
            ...bookingData,
            createdAt: serverTimestamp(),
        });
        
        await setDoc(bookingRef, bookingDoc);
        return { success: true, id: bookingRef.id };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get a single booking by ID
 */
export const getBooking = async (bookingId) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
            return { success: true, data: { ...bookingSnap.data(), id: bookingSnap.id } };
        } else {
            return { success: false, error: 'Booking not found' };
        }
    } catch (error) {
        console.error('Error getting booking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all bookings for a user (as guest)
 */
export const getGuestBookings = async (guestId) => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('guestId', '==', guestId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const bookings = [];
        querySnapshot.forEach((doc) => {
            bookings.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error getting guest bookings:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all bookings for a host
 */
export const getHostBookings = async (hostId) => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const bookings = [];
        querySnapshot.forEach((doc) => {
            bookings.push({ ...doc.data(), id: doc.id });
        });
        
        return { success: true, data: bookings };
    } catch (error) {
        console.error('Error getting host bookings:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        const updates = {
            status: status,
            updatedAt: serverTimestamp(),
        };
        
        // Add confirmation timestamp if confirmed
        if (status === 'confirmed') {
            updates.confirmedAt = serverTimestamp();
        }
        
        await updateDoc(bookingRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Error updating booking status:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Approve a pending booking (host action)
 * Updates status to 'confirmed' and sets confirmedAt timestamp
 */
export const approveBooking = async (bookingId) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: 'confirmed',
            confirmedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error approving booking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId, cancelledBy, cancellationReason) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: 'cancelled',
            cancelledBy: cancelledBy,
            cancellationReason: cancellationReason,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Request cancellation (guest initiates)
 */
export const requestCancellation = async (bookingId, cancellationReason = '') => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: 'requesting_cancellation',
            cancellationReason: cancellationReason,
            cancellationRequestedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error requesting cancellation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Approve cancellation request (host approves)
 */
export const approveCancellation = async (bookingId, refundAmount, refundPolicy) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
            return { success: false, error: 'Booking not found' };
        }
        
        const booking = bookingSnap.data();
        
        // Update booking status
        await updateDoc(bookingRef, {
            status: 'cancelled',
            cancelledBy: 'guest',
            cancelledAt: serverTimestamp(),
            cancellationApprovedAt: serverTimestamp(),
            cancellationApprovedBy: 'host',
            refundAmount: refundAmount,
            refundPolicy: refundPolicy,
            paymentStatus: refundAmount > 0 ? 'refunded' : booking.paymentStatus,
            updatedAt: serverTimestamp(),
        });
        
        // Deduct refund from host wallet (host received the payment, so refund comes from host)
        if (refundAmount > 0 && booking.hostId) {
            console.log('Deducting refund from host wallet:', { hostId: booking.hostId, refundAmount, bookingId });
            const hostResult = await updateUserWalletBalance(booking.hostId, -refundAmount);
            if (hostResult.success) {
                console.log('Refund deducted from host wallet successfully. New balance:', hostResult.newBalance);
                await recordWalletTransaction({
                    userId: booking.hostId,
                    type: 'refund',
                    amount: -refundAmount,
                    currency: booking.currency || 'PHP',
                    meta: { bookingId: bookingId, listingId: booking.listingId, toUser: booking.guestId, reason: 'Booking cancellation refund' },
                });
            } else {
                console.error('Failed to deduct refund from host wallet:', hostResult.error);
                // Continue with guest refund even if host deduction fails (will need manual intervention)
            }
        }
        
        // Refund to guest wallet if applicable
        if (refundAmount > 0 && booking.guestId) {
            console.log('Crediting refund to guest wallet:', { guestId: booking.guestId, refundAmount, bookingId });
            const guestResult = await updateUserWalletBalance(booking.guestId, refundAmount);
            if (guestResult.success) {
                console.log('Refund credited to guest wallet successfully. New balance:', guestResult.newBalance);
                await recordWalletTransaction({
                    userId: booking.guestId,
                    type: 'refund',
                    amount: refundAmount,
                    currency: booking.currency || 'PHP',
                    meta: { bookingId: bookingId, listingId: booking.listingId, fromUser: booking.hostId, reason: 'Booking cancellation refund' },
                });
            } else {
                console.error('Failed to credit refund to guest wallet:', guestResult.error);
            }
        }
        
        // Remove booked dates from listing
        if (booking.listingId) {
            const listingResult = await getListing(booking.listingId);
            if (listingResult.success) {
                const listing = listingResult.data;
                const bookedDates = listing.bookedDates || [];
                
                // Convert booking dates to YYYY-MM-DD format
                let checkInDate, checkOutDate;
                
                // Handle checkIn
                if (typeof booking.checkIn === 'string') {
                    checkInDate = new Date(booking.checkIn);
                } else if (booking.checkIn?.toDate) {
                    checkInDate = booking.checkIn.toDate();
                } else if (booking.checkIn) {
                    checkInDate = booking.checkIn;
                }
                
                // Handle checkOut
                if (typeof booking.checkOut === 'string') {
                    checkOutDate = new Date(booking.checkOut);
                } else if (booking.checkOut?.toDate) {
                    checkOutDate = booking.checkOut.toDate();
                } else if (booking.checkOut) {
                    checkOutDate = booking.checkOut;
                }
                
                if (checkInDate && checkOutDate) {
                    // Generate date range in YYYY-MM-DD format (same as when booking)
                    const datesToRemove = [];
                    const d = new Date(checkInDate);
                    d.setHours(0, 0, 0, 0);
                    const end = new Date(checkOutDate);
                    end.setHours(0, 0, 0, 0);
                    
                    // Include check-in through check-out (inclusive)
                    while (d <= end) {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        datesToRemove.push(`${year}-${month}-${day}`);
                        d.setDate(d.getDate() + 1);
                    }
                    
                    console.log('Removing booked dates:', { 
                        listingId: booking.listingId, 
                        datesToRemove, 
                        existingBookedDates: bookedDates 
                    });
                    
                    // Filter out the dates to remove
                    const filteredDates = bookedDates.filter(d => !datesToRemove.includes(d));
                    
                    console.log('Updated booked dates:', filteredDates);
                    
                    await updateListing(booking.listingId, { bookedDates: filteredDates });
                }
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error approving cancellation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Deny cancellation request (host denies)
 */
export const denyCancellation = async (bookingId, denialReason = '') => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            status: 'confirmed', // Revert to confirmed
            cancellationDeniedAt: serverTimestamp(),
            cancellationDeniedBy: 'host',
            cancellationDenialReason: denialReason,
            updatedAt: serverTimestamp(),
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error denying cancellation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate refund amount based on cancellation policy
 * Policy is based on time since booking was created, not time until check-in
 */
export const calculateRefund = (booking, cancellationRequestTime) => {
    if (!booking.createdAt || !cancellationRequestTime) {
        return { amount: 0, policy: 'no_refund' };
    }
    
    // Get booking creation time
    let bookingCreatedDate;
    if (typeof booking.createdAt === 'string') {
        bookingCreatedDate = new Date(booking.createdAt);
    } else if (booking.createdAt.toDate) {
        bookingCreatedDate = booking.createdAt.toDate();
    } else {
        bookingCreatedDate = booking.createdAt;
    }
    
    // Get cancellation request time
    let requestDate;
    if (typeof cancellationRequestTime === 'string') {
        requestDate = new Date(cancellationRequestTime);
    } else if (cancellationRequestTime.toDate) {
        requestDate = cancellationRequestTime.toDate();
    } else {
        requestDate = cancellationRequestTime;
    }
    
    // Calculate hours since booking was created
    const hoursSinceBooking = (requestDate - bookingCreatedDate) / (1000 * 60 * 60);
    const totalPrice = booking.totalPrice || 0;
    
    // Refund policy (based on time since booking was created):
    // - Within 24hrs of booking: Full Refund - no deduction
    // - After 24hrs to 48hrs of booking: Partial Refund with 20% deduction (80% refund)
    // - After 48hrs of booking: Cancellation only - no refund
    
    if (hoursSinceBooking < 0) {
        // This shouldn't happen, but handle edge case
        return { amount: 0, policy: 'no_refund' };
    } else if (hoursSinceBooking <= 24) {
        // Within 24 hours of booking: Full refund
        return { amount: totalPrice, policy: 'full_refund' };
    } else if (hoursSinceBooking <= 48) {
        // After 24hrs to 48hrs of booking: Partial refund (80% of total, 20% deduction)
        const refundAmount = totalPrice * 0.8;
        return { amount: refundAmount, policy: 'partial_refund_20pct_deduction' };
    } else {
        // More than 48 hours after booking: No refund (cancellation only)
        return { amount: 0, policy: 'no_refund' };
    }
};

// Helper function to generate date array
const dateArray = (startIso, endIso) => {
    if (!startIso || !endIso) return [];
    const dates = [];
    let d;
    if (typeof startIso === 'string') {
        d = new Date(startIso);
    } else if (startIso.toDate) {
        d = startIso.toDate();
    } else {
        d = startIso;
    }
    d.setHours(0, 0, 0, 0);
    
    let end;
    if (typeof endIso === 'string') {
        end = new Date(endIso);
    } else if (endIso.toDate) {
        end = endIso.toDate();
    } else {
        end = endIso;
    }
    end.setHours(0, 0, 0, 0);
    
    while (d < end) {
        dates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
    }
    return dates;
};

// ==========================================
// PAYMENTS
// ==========================================

/**
 * Record a PayPal payment in Firestore
 */
export const recordPayment = async ({
    userId,
    hostId,
    listingId,
    amount,
    currency = 'PHP',
    orderId,
    paypalPayload = {},
    bookingContext = {},
}) => {
    try {
        const paymentsRef = collection(db, 'payments');
        const paymentDoc = {
            userId,
            hostId,
            listingId,
            amount,
            currency,
            provider: 'paypal',
            orderId,
            status: 'paid',
            paypal: paypalPayload,
            bookingContext,
            createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(paymentsRef, paymentDoc);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error recording payment:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Wallet helpers
 */
export const getUserWallet = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return { success: true, balance: 0 };
        const data = snap.data();
        return { success: true, balance: data.walletBalance || 0 };
    } catch (error) {
        console.error('Error getting wallet:', error);
        return { success: false, error: error.message };
    }
};

export const updateUserWalletBalance = async (userId, amountDelta) => {
    try {
        if (!userId) {
            console.error('updateUserWalletBalance: userId is required');
            return { success: false, error: 'User ID is required' };
        }
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            console.error('updateUserWalletBalance: User document does not exist:', userId);
            return { success: false, error: 'User document not found' };
        }
        const userData = snap.data();
        // Ensure walletBalance exists, default to 0 if not present
        const current = (userData.walletBalance !== undefined && userData.walletBalance !== null) 
            ? Number(userData.walletBalance) 
            : 0;
        const newBalance = Math.max(0, current + Number(amountDelta));
        console.log('Updating wallet balance:', { userId, current, amountDelta, newBalance });
        
        // Use updateDoc - it only updates specified fields and preserves all others
        // This is the correct approach for partial updates
        await updateDoc(userRef, { 
            walletBalance: newBalance, 
            updatedAt: serverTimestamp() 
        });
        console.log('Wallet balance updated successfully');
        return { success: true, newBalance };
    } catch (error) {
        console.error('Error updating wallet:', error);
        console.error('Error details:', { 
            userId, 
            amountDelta, 
            errorCode: error.code, 
            errorMessage: error.message,
            errorStack: error.stack 
        });
        return { success: false, error: error.message, errorCode: error.code };
    }
};

export const recordWalletTransaction = async ({ userId, type, amount, currency = 'PHP', meta = {}, status = 'completed' }) => {
    try {
        const ref = collection(db, 'walletTransactions');
        const docRef = await addDoc(ref, {
            userId,
            type, // 'topup' | 'payment' | 'refund' | 'cashout' | 'earning'
            amount,
            currency,
            meta,
            status, // 'completed' | 'pending' | 'approved' | 'rejected'
            createdAt: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error recording wallet transaction:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get wallet transactions for a user
 */
export const getWalletTransactions = async (userId, max = 50) => {
    try {
        const ref = collection(db, 'walletTransactions');
        const qy = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(max));
        const snap = await getDocs(qy);
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        return { success: true, data: rows };
    } catch (error) {
        console.error('Error loading wallet transactions:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update booking fields
 */
export const updateBooking = async (bookingId, updates) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, { ...updates, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        console.error('Error updating booking:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// STATISTICS & AGGREGATIONS
// ==========================================

/**
 * Get host statistics
 */
export const getHostStats = async (hostId) => {
    try {
        // Get all host listings
        const listingsResult = await getHostListings(hostId);
        const listings = listingsResult.success ? listingsResult.data : [];
        
        // Get all host bookings
        const bookingsResult = await getHostBookings(hostId);
        const bookings = bookingsResult.success ? bookingsResult.data : [];
        
        // Calculate stats
        const totalListings = listings.length;
        const activeListings = listings.filter(l => l.isActive && l.status === 'active').length;
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const totalEarnings = bookings
            .filter(b => b.paymentStatus === 'paid')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        
        // Get today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = bookings.filter(b => {
            const checkIn = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn);
            checkIn.setHours(0, 0, 0, 0);
            return checkIn.getTime() === today.getTime() && b.status === 'confirmed';
        }).sort((a, b) => {
            // Sort by check-in date - earliest first
            const checkInA = a.checkIn instanceof Timestamp ? a.checkIn.toDate() : new Date(a.checkIn);
            const checkInB = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn);
            return checkInA.getTime() - checkInB.getTime();
        });
        
        // Get upcoming bookings (next 30 days)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const upcomingBookings = bookings.filter(b => {
            const checkIn = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn);
            return checkIn > today && checkIn <= futureDate && b.status === 'confirmed';
        }).sort((a, b) => {
            // Sort by check-in date - earliest first
            const checkInA = a.checkIn instanceof Timestamp ? a.checkIn.toDate() : new Date(a.checkIn);
            const checkInB = b.checkIn instanceof Timestamp ? b.checkIn.toDate() : new Date(b.checkIn);
            return checkInA.getTime() - checkInB.getTime();
        });
        
        return {
            success: true,
            data: {
                totalListings,
                activeListings,
                totalBookings,
                confirmedBookings,
                totalEarnings,
                todayBookings,
                upcomingBookings,
            }
        };
    } catch (error) {
        console.error('Error getting host stats:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// MESSAGING OPERATIONS
// ==========================================

/**
 * Get or create a message thread between guest and host
 */
export const getOrCreateMessageThread = async (guestId, hostId, listingId = null) => {
    try {
        if (!guestId || !hostId) {
            console.warn('getOrCreateMessageThread called with missing IDs', { guestId, hostId, listingId });
            return { success: false, error: 'Missing participant IDs' };
        }

        // Check if thread already exists
        const threadsRef = collection(db, 'messages');
        const q = query(
            threadsRef,
            where('guestId', '==', guestId),
            where('hostId', '==', hostId),
            ...(listingId ? [where('listingId', '==', listingId)] : [])
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const threadDoc = querySnapshot.docs[0];
            return { success: true, threadId: threadDoc.id, data: threadDoc.data() };
        }
        
        // Create new thread
        const { createMessageThreadDocument } = await import('./firestoreModels');
        const threadRef = doc(collection(db, 'messages'));
        const threadData = createMessageThreadDocument({
            participants: [guestId, hostId],
            guestId,
            hostId,
            listingId,
            createdAt: serverTimestamp(),
        });
        console.log('Creating new message thread', { threadId: threadRef.id, threadData });

        await setDoc(threadRef, threadData);
        return { success: true, threadId: threadRef.id, data: threadData };
    } catch (error) {
        console.error('Error getting/creating message thread:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a message in a thread
 */
export const sendMessage = async (threadId, senderId, senderName, text) => {
    try {
        const messagesRef = collection(db, 'messages', threadId, 'messages');
        const messageRef = doc(messagesRef);
        
        const { createMessageDocument } = await import('./firestoreModels');
        const messageData = createMessageDocument({
            senderId,
            senderName,
            text,
            read: false,
            createdAt: serverTimestamp(),
        });
        
        await setDoc(messageRef, messageData);
        
        // Update thread with last message and increment unread count for recipient
        const threadRef = doc(db, 'messages', threadId);
        const threadSnap = await getDoc(threadRef);
        if (threadSnap.exists()) {
            const threadData = threadSnap.data();
            const recipientId = threadData.guestId === senderId ? threadData.hostId : threadData.guestId;
            const unreadCount = threadData.unreadCount || {};
            unreadCount[recipientId] = (unreadCount[recipientId] || 0) + 1;
            
            await updateDoc(threadRef, {
                lastMessage: {
                    text,
                    senderId,
                    timestamp: serverTimestamp(),
                },
                unreadCount,
                updatedAt: serverTimestamp(),
            });
        }
        
        return { success: true, messageId: messageRef.id };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all messages in a thread
 */
export const getThreadMessages = async (threadId) => {
    try {
        const messagesRef = collection(db, 'messages', threadId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: messages };
    } catch (error) {
        console.error('Error getting thread messages:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all message threads for a user
 */
export const getUserMessageThreads = async (userId) => {
    try {
        const threadsRef = collection(db, 'messages');
        const q = query(
            threadsRef,
            where('participants', 'array-contains', userId),
            orderBy('updatedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const threads = [];
        querySnapshot.forEach((doc) => {
            threads.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: threads };
    } catch (error) {
        console.error('Error getting user message threads:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark messages as read in a thread
 */
export const markThreadAsRead = async (threadId, userId) => {
    try {
        const threadRef = doc(db, 'messages', threadId);
        const threadSnap = await getDoc(threadRef);
        
        if (!threadSnap.exists()) {
            return { success: false, error: 'Thread not found' };
        }
        
        const threadData = threadSnap.data();
        const unreadCount = threadData.unreadCount || {};
        unreadCount[userId] = 0;
        
        await updateDoc(threadRef, {
            unreadCount,
            updatedAt: serverTimestamp(),
        });
        
        // Mark all messages in thread as read
        const messagesRef = collection(db, 'messages', threadId, 'messages');
        const q = query(messagesRef, where('read', '==', false));
        const querySnapshot = await getDocs(q);
        
        const updatePromises = [];
        querySnapshot.forEach((messageDoc) => {
            const messageData = messageDoc.data();
            if (messageData.senderId !== userId) {
                updatePromises.push(updateDoc(doc(db, 'messages', threadId, 'messages', messageDoc.id), {
                    read: true,
                }));
            }
        });
        
        await Promise.all(updatePromises);
        
        return { success: true };
    } catch (error) {
        console.error('Error marking thread as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get total unread message count for a user
 */
export const getUnreadMessageCount = async (userId) => {
    try {
        const threadsRef = collection(db, 'messages');
        const q = query(threadsRef, where('participants', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        
        let totalUnread = 0;
        querySnapshot.forEach((doc) => {
            const threadData = doc.data();
            const unreadCount = threadData.unreadCount || {};
            totalUnread += unreadCount[userId] || 0;
        });
        
        return { success: true, count: totalUnread };
    } catch (error) {
        console.error('Error getting unread message count:', error);
        return { success: false, error: error.message, count: 0 };
    }
};

// ==========================================
// COUPON OPERATIONS
// ==========================================

const toDateSafe = (value) => {
    if (!value) return null;
    if (value.toDate) return value.toDate();
    if (value instanceof Date) return value;
    return new Date(value);
};

/**
 * Set a date to 11:59:59 PM of that day
 * This ensures coupons are valid until the end of the end date
 */
const setEndOfDay = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

export const createCoupon = async (hostId, payload) => {
    try {
        const code = (payload.code || '').trim().toUpperCase();
        if (!code) {
            return { success: false, error: 'Coupon name is required.' };
        }

        const couponsRef = collection(db, 'coupons');
        const duplicateQuery = query(
            couponsRef,
            where('hostId', '==', hostId),
            where('code', '==', code)
        );
        const duplicateSnap = await getDocs(duplicateQuery);
        if (!duplicateSnap.empty) {
            return { success: false, error: 'A coupon with this name already exists.' };
        }

        const couponRef = doc(couponsRef);
        const validFromDate = payload.validFrom || new Date();
        const validToDate = payload.validTo ? setEndOfDay(payload.validTo) : setEndOfDay(new Date());

        const couponData = createCouponDocument({
            hostId,
            code,
            type: payload.type,
            value: Number(payload.value),
            usageLimitPerAccount: Number(payload.usageLimitPerAccount),
            description: payload.description || '',
            minAmount: Number(payload.minAmount),
            validFrom: Timestamp.fromDate(validFromDate),
            validTo: Timestamp.fromDate(validToDate),
            isActive: payload.isActive !== false,
            totalUsage: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await setDoc(couponRef, couponData);
        return { success: true, id: couponRef.id };
    } catch (error) {
        console.error('Error creating coupon:', error);
        return { success: false, error: error.message };
    }
};

export const updateCoupon = async (couponId, hostId, payload) => {
    try {
        const couponRef = doc(db, 'coupons', couponId);
        const couponSnap = await getDoc(couponRef);
        if (!couponSnap.exists()) {
            return { success: false, error: 'Coupon not found.' };
        }

        const existingData = couponSnap.data();
        if (existingData.hostId !== hostId) {
            return { success: false, error: 'You do not have permission to update this coupon.' };
        }

        const code = (payload.code || '').trim().toUpperCase();
        if (!code) {
            return { success: false, error: 'Coupon name is required.' };
        }

        if (code !== existingData.code) {
            const couponsRef = collection(db, 'coupons');
            const duplicateQuery = query(
                couponsRef,
                where('hostId', '==', hostId),
                where('code', '==', code)
            );
            const duplicateSnap = await getDocs(duplicateQuery);
            if (!duplicateSnap.empty) {
                return { success: false, error: 'A coupon with this name already exists.' };
            }
        }

        const updatePayload = {
            code,
            type: payload.type,
            value: Number(payload.value),
            usageLimitPerAccount: Number(payload.usageLimitPerAccount),
            description: payload.description || '',
            minAmount: Number(payload.minAmount),
            validFrom: payload.validFrom ? Timestamp.fromDate(payload.validFrom) : existingData.validFrom,
            validTo: payload.validTo ? Timestamp.fromDate(setEndOfDay(payload.validTo)) : existingData.validTo,
            isActive: payload.isActive !== undefined ? payload.isActive : existingData.isActive,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(couponRef, updatePayload);
        return { success: true };
    } catch (error) {
        console.error('Error updating coupon:', error);
        return { success: false, error: error.message };
    }
};

export const deleteCoupon = async (couponId, hostId) => {
    try {
        const couponRef = doc(db, 'coupons', couponId);
        const couponSnap = await getDoc(couponRef);
        if (!couponSnap.exists()) {
            return { success: false, error: 'Coupon not found.' };
        }
        const couponData = couponSnap.data();
        if (couponData.hostId !== hostId) {
            return { success: false, error: 'You do not have permission to delete this coupon.' };
        }

        // Delete usage subcollection
        const usageRef = collection(db, 'coupons', couponId, 'usage');
        const usageSnapshot = await getDocs(usageRef);
        const deletionPromises = usageSnapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, 'coupons', couponId, 'usage', docSnap.id))
        );
        await Promise.all(deletionPromises);

        await deleteDoc(couponRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return { success: false, error: error.message };
    }
};

export const getHostCoupons = async (hostId) => {
    try {
        const couponsRef = collection(db, 'coupons');
        const q = query(couponsRef, where('hostId', '==', hostId), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const now = new Date();

        const coupons = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const validFrom = toDateSafe(data.validFrom);
            const validToRaw = toDateSafe(data.validTo);
            const validTo = validToRaw ? setEndOfDay(validToRaw) : null;
            const isWithinRange = validFrom && validTo ? (now >= validFrom && now <= validTo) : true;
            const isCurrentlyActive = data.isActive !== false && isWithinRange;
            return {
                id: docSnap.id,
                ...data,
                validFrom,
                validTo,
                isCurrentlyActive,
            };
        });

        return { success: true, data: coupons };
    } catch (error) {
        console.error('Error getting host coupons:', error);
        return { success: false, error: error.message };
    }
};

export const getActiveCouponsForHost = async (hostId) => {
    try {
        const { success, data, error } = await getHostCoupons(hostId);
        if (!success) {
            return { success: false, error };
        }
        const now = new Date();
        const activeCoupons = data.filter((coupon) => {
            const validFrom = coupon.validFrom || now;
            const validTo = coupon.validTo ? setEndOfDay(coupon.validTo) : now;
            return coupon.isActive !== false && now >= validFrom && now <= validTo;
        });
        return { success: true, data: activeCoupons };
    } catch (error) {
        console.error('Error getting active coupons:', error);
        return { success: false, error: error.message };
    }
};

export const validateCouponForBooking = async (hostId, code, userId, bookingAmount) => {
    try {
        const normalizedCode = (code || '').trim().toUpperCase();
        if (!normalizedCode) {
            return { success: false, error: 'Enter a coupon code.' };
        }

        const couponsRef = collection(db, 'coupons');
        const q = query(
            couponsRef,
            where('hostId', '==', hostId),
            where('code', '==', normalizedCode),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return { success: false, error: 'Coupon not found.' };
        }

        const couponDoc = snapshot.docs[0];
        const couponData = couponDoc.data();
        if (couponData.isActive === false) {
            return { success: false, error: 'This coupon is no longer active.' };
        }

        const now = new Date();
        const validFrom = toDateSafe(couponData.validFrom);
        const validToRaw = toDateSafe(couponData.validTo);
        const validTo = validToRaw ? setEndOfDay(validToRaw) : null;

        if (validFrom && now < validFrom) {
            return { success: false, error: 'This coupon is not yet valid.' };
        }
        if (validTo && now > validTo) {
            return { success: false, error: 'This coupon has expired.' };
        }

        if (bookingAmount < Number(couponData.minAmount || 0)) {
            return { success: false, error: `Booking total must be at least ₱${Number(couponData.minAmount || 0).toLocaleString()} to use this coupon.` };
        }

        const usageRef = doc(db, 'coupons', couponDoc.id, 'usage', userId);
        const usageSnap = await getDoc(usageRef);
        const usageCount = usageSnap.exists() ? Number(usageSnap.data().count || 0) : 0;

        if (couponData.usageLimitPerAccount && usageCount >= couponData.usageLimitPerAccount) {
            return { success: false, error: 'You have reached the usage limit for this coupon.' };
        }

        return {
            success: true,
            coupon: {
                id: couponDoc.id,
                code: couponData.code,
                type: couponData.type,
                value: Number(couponData.value),
                usageLimitPerAccount: Number(couponData.usageLimitPerAccount),
                description: couponData.description || '',
                minAmount: Number(couponData.minAmount),
                validFrom,
                validTo,
                isActive: couponData.isActive !== false,
                totalUsage: Number(couponData.totalUsage || 0),
                currentUsage: usageCount,
            }
        };
    } catch (error) {
        console.error('Error validating coupon:', error);
        return { success: false, error: error.message };
    }
};

export const recordCouponUsage = async (couponId, userId) => {
    try {
        await runTransaction(db, async (transaction) => {
            const couponRef = doc(db, 'coupons', couponId);
            const couponSnap = await transaction.get(couponRef);
            if (!couponSnap.exists()) {
                throw new Error('Coupon not found.');
            }
            const couponData = couponSnap.data();

            const usageRef = doc(db, 'coupons', couponId, 'usage', userId);
            const usageSnap = await transaction.get(usageRef);
            const currentCount = usageSnap.exists() ? Number(usageSnap.data().count || 0) : 0;

            if (couponData.usageLimitPerAccount && currentCount >= couponData.usageLimitPerAccount) {
                throw new Error('Usage limit reached for this coupon.');
            }

            transaction.set(usageRef, {
                count: currentCount + 1,
                updatedAt: serverTimestamp(),
                userId
            }, { merge: true });

            transaction.update(couponRef, {
                totalUsage: increment(1),
                updatedAt: serverTimestamp(),
            });
        });

        return { success: true };
    } catch (error) {
        console.error('Error recording coupon usage:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get user data by userId
 */
export const getUserData = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' };
        }
        
        return { success: true, data: userSnap.data() };
    } catch (error) {
        console.error('Error getting user data:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update host rules acceptance status
 */
export const updateHostRulesAccepted = async (userId, accepted = true) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            hostRulesAccepted: accepted,
            hostRulesAcceptedAt: accepted ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating host rules acceptance:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// SAMPLE DATA CREATION
// ==========================================

/**
 * Create 2 sample home listings in Cavite, Philippines
 * This is a utility function to populate sample data
 * Usage: import { createSampleCaviteListings } from './utils/firestoreUtils';
 *        await createSampleCaviteListings('YOUR_HOST_USER_ID');
 */
export const createSampleCaviteListings = async (hostId) => {
    if (!hostId) {
        console.error('Error: hostId is required');
        return { success: false, error: 'hostId is required' };
    }

    const sampleListings = [
        {
            title: "Modern 2BR Condo with Breathtaking Tagaytay View",
            description: "Experience the perfect getaway in this beautifully furnished 2-bedroom condo unit located in the heart of Tagaytay. Wake up to stunning views of Taal Lake and enjoy the cool mountain breeze. The unit features a fully equipped kitchen, comfortable living area, and two spacious bedrooms with premium bedding. Perfect for families or groups looking for a relaxing retreat. The building offers 24/7 security, free parking, and easy access to popular restaurants and tourist spots. Book now and create unforgettable memories!",
            category: "home",
            type: "entire_place",
            location: {
                locationName: "Tagaytay City, Cavite, Philippines",
                address: "Aguinaldo Highway, Tagaytay City",
                city: "Tagaytay City",
                province: "Cavite",
                country: "Philippines",
                lat: 14.1000,
                lng: 120.9333,
                zipCode: "4120"
            },
            pricePerNight: 3500,
            discount: 10,
            currency: "PHP",
            cleaningFee: 500,
            serviceFee: 350,
            guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 1,
            amenities: ["WiFi", "Kitchen", "Air Conditioning", "TV", "Free Parking", "Mountain View"],
            houseRules: ["No smoking", "No pets", "No parties or events", "Check-in is after 2PM", "Check-out is before 11AM"],
            checkInTime: "14:00",
            checkOutTime: "11:00",
            minimumStay: 2,
            maximumStay: 30,
            images: [
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop"
            ],
            isActive: true,
            status: "active",
            instantBook: true,
            availableDates: [],
            blockedDates: [],
            bookedDates: []
        },
        {
            title: "Luxurious Beachfront Villa with Private Pool in Cavite",
            description: "Indulge in luxury at this stunning beachfront villa featuring a private pool and direct beach access. This spacious 3-bedroom villa can accommodate up to 6 guests comfortably. The property boasts a fully equipped modern kitchen, elegant dining area, and a cozy living room with panoramic ocean views. Each bedroom is tastefully decorated with premium furnishings and en-suite bathrooms. The highlight is the private infinity pool overlooking the beach, perfect for relaxation. The villa also includes a barbecue area, outdoor dining space, and free WiFi throughout. Ideal for families or groups seeking a premium beachside experience. Book your dream vacation today!",
            category: "home",
            type: "entire_place",
            location: {
                locationName: "Naic, Cavite, Philippines",
                address: "Beach Road, Naic",
                city: "Naic",
                province: "Cavite",
                country: "Philippines",
                lat: 14.3167,
                lng: 120.7667,
                zipCode: "4110"
            },
            pricePerNight: 8500,
            discount: 15,
            currency: "PHP",
            cleaningFee: 1000,
            serviceFee: 850,
            guests: 6,
            bedrooms: 3,
            beds: 3,
            bathrooms: 2,
            amenities: ["WiFi", "Kitchen", "Pool", "Air Conditioning", "TV", "Free Parking", "Beach Access", "Washer", "Dryer"],
            houseRules: ["No smoking inside", "Pets allowed with prior approval", "No loud music after 10PM", "Check-in is after 3PM", "Check-out is before 12PM"],
            checkInTime: "15:00",
            checkOutTime: "12:00",
            minimumStay: 3,
            maximumStay: 60,
            images: [
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
                "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop"
            ],
            isActive: true,
            status: "active",
            instantBook: false,
            availableDates: [],
            blockedDates: [],
            bookedDates: []
        }
    ];

    const results = [];

    for (const listingData of sampleListings) {
        try {
            const result = await createListing(hostId, listingData);
            
            if (result.success) {
                console.log(`✅ Created listing: ${listingData.title} (ID: ${result.id})`);
                results.push({ success: true, id: result.id, title: listingData.title });
            } else {
                console.error(`❌ Error creating listing "${listingData.title}":`, result.error);
                results.push({ success: false, error: result.error, title: listingData.title });
            }
        } catch (error) {
            console.error(`❌ Error creating listing "${listingData.title}":`, error);
            results.push({ success: false, error: error.message, title: listingData.title });
        }
    }

    return results;
};

/**
 * Migrate existing listings to add top-level province field
 * This function updates all listings that don't have a top-level province field
 * by copying it from location.province
 */
export const migrateListingsProvince = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            return { success: false, error: 'User must be logged in' };
        }

        // Get active listings first (we have read permission for these)
        // Then try to get all listings owned by the current user (for inactive ones)
        const listingsRef = collection(db, 'listings');
        
        // Get active listings
        const activeQuery = query(
            listingsRef,
            where('isActive', '==', true),
            where('status', '==', 'active')
        );
        const activeSnapshot = await getDocs(activeQuery);
        
        // Get user's own listings (including inactive ones)
        const userListingsQuery = query(
            listingsRef,
            where('hostId', '==', user.uid)
        );
        const userListingsSnapshot = await getDocs(userListingsQuery);
        
        // Combine and deduplicate
        const allDocs = new Map();
        activeSnapshot.forEach((doc) => {
            allDocs.set(doc.id, doc);
        });
        userListingsSnapshot.forEach((doc) => {
            allDocs.set(doc.id, doc);
        });
        
        const querySnapshot = Array.from(allDocs.values());
        
        console.log(`Found ${querySnapshot.length} listings to check for migration`);
        
        const updates = [];
        let migratedCount = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const docRef = doc.ref;
            // Check if listing needs province field
            let provinceToSet = null;
            
            // Priority 1: Use existing top-level province if it exists
            if (data.province && data.province.trim()) {
                // Already has province, skip
                return;
            }
            
            // Priority 2: Use location.province if it exists
            if (data.location?.province && data.location.province.trim()) {
                provinceToSet = data.location.province.trim();
            }
            // Priority 3: Try to extract province from locationName or address
            else if (data.location?.locationName) {
                const locationName = data.location.locationName;
                // Try to extract province from location name (e.g., "Tagaytay, Cavite" or "Cavite, Philippines")
                const provinceMatch = locationName.match(/\b(Cavite|Metro Manila|Manila|Laguna|Batangas|Rizal|Quezon|Bulacan|Pampanga|Nueva Ecija|Tarlac|Zambales|Bataan|Aurora|Palawan|Mindoro|Romblon|Marinduque|Albay|Camarines|Sorsogon|Catanduanes|Masbate|Aklan|Antique|Capiz|Guimaras|Iloilo|Negros|Bohol|Cebu|Leyte|Samar|Biliran|Eastern Samar|Northern Samar|Western Samar|Surigao|Agusan|Dinagat|Davao|Compostela|Cotabato|Sarangani|South Cotabato|Sultan Kudarat|Lanao|Maguindanao|Sulu|Tawi-Tawi|Basilan|Zamboanga|Misamis|Bukidnon|Camiguin|Lanao del Norte|Lanao del Sur)\b/i);
                if (provinceMatch) {
                    provinceToSet = provinceMatch[1];
                }
            }
            // Priority 4: Try to extract from city if it's a known city in Cavite
            else if (data.location?.city) {
                const city = data.location.city.toLowerCase();
                // Tagaytay is in Cavite
                if (city.includes('tagaytay')) {
                    provinceToSet = 'Cavite';
                }
            }
            
            if (provinceToSet) {
                updates.push({
                    ref: docRef,
                    province: provinceToSet
                });
                migratedCount++;
                console.log(`Will migrate listing "${data.title}": setting province to "${provinceToSet}"`);
            } else {
                console.warn(`⚠️ Cannot determine province for listing "${data.title}" - location:`, data.location);
            }
        });
        
        if (updates.length > 0) {
            // Process updates with error handling
            let successful = 0;
            let failed = 0;
            
            for (const update of updates) {
                try {
                    await updateDoc(update.ref, {
                        province: update.province,
                        updatedAt: serverTimestamp(),
                    });
                    successful++;
                } catch (error) {
                    console.warn(`Failed to migrate listing ${update.ref.id}:`, error.message);
                    failed++;
                }
            }
            
            console.log(`✅ Successfully migrated ${successful} listings to include top-level province field`);
            if (failed > 0) {
                console.warn(`⚠️ Failed to migrate ${failed} listings (may be due to permissions)`);
            }
            console.log(`📊 Migration Summary: ${successful} successful, ${failed} failed, ${migratedCount - successful - failed} skipped`);
            return { success: true, migrated: successful, failed: failed };
        } else {
            console.log('ℹ️ No listings need migration (all listings already have the province field)');
            return { success: true, migrated: 0, failed: 0 };
        }
    } catch (error) {
        console.error('Error migrating listings province:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// ADMIN UTILITIES
// ==========================================

/**
 * Create or get admin account
 */
export const createOrGetAdmin = async (adminEmail = 'admin@biyahele.com') => {
    try {
        // Check if admin exists
        const usersRef = collection(db, 'users');
        const adminQuery = query(usersRef, where('role', '==', 'admin'), limit(1));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
            const adminDoc = adminSnapshot.docs[0];
            return { success: true, adminId: adminDoc.id, data: adminDoc.data() };
        }
        
        // Create admin account (you'll need to create this user in Firebase Auth first)
        // For now, we'll create a placeholder document
        // In production, you should create the user in Firebase Auth first, then create the document
        console.warn('Admin account not found. Please create an admin user in Firebase Auth first.');
        return { success: false, error: 'Admin account not found. Please create admin user in Firebase Auth.' };
    } catch (error) {
        console.error('Error creating/getting admin:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get admin wallet balance
 */
export const getAdminWallet = async () => {
    try {
        const usersRef = collection(db, 'users');
        const adminQuery = query(usersRef, where('role', '==', 'admin'), limit(1));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (adminSnapshot.empty) {
            return { success: false, error: 'Admin account not found' };
        }
        
        const adminDoc = adminSnapshot.docs[0];
        const adminData = adminDoc.data();
        const balance = adminData.walletBalance || 0;
        
        return { success: true, balance, adminId: adminDoc.id };
    } catch (error) {
        console.error('Error getting admin wallet:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// POINTS & REWARDS UTILITIES
// ==========================================

/**
 * Calculate host points based on:
 * - Active listings (10 points each)
 * - Reviews stars (2 points per star)
 * - First booking per listing (10 points each)
 * - 2 bookings in a single day (10 points)
 */
export const calculateHostPoints = async (hostId) => {
    try {
        let totalPoints = 0;
        
        // 1. Points for active/published listings (10 points each)
        const listingsResult = await getHostListings(hostId);
        if (listingsResult.success) {
            const activeListings = listingsResult.data.filter(
                l => l.isActive && l.status === 'active'
            );
            totalPoints += activeListings.length * 10;
        }
        
        // 2. Points for review stars (2 points per star)
        // Get all listings and calculate total stars from reviews
        if (listingsResult.success) {
            const listings = listingsResult.data;
            for (const listing of listings) {
                if (listing.stats?.rating && listing.stats?.reviewsCount) {
                    const totalStars = listing.stats.rating * listing.stats.reviewsCount;
                    totalPoints += Math.floor(totalStars) * 2;
                }
            }
        }
        
        // 3. Points for first booking per listing (10 points each)
        const bookingsResult = await getHostBookings(hostId);
        if (bookingsResult.success) {
            const bookings = bookingsResult.data.filter(
                b => (b.status === 'confirmed' || b.status === 'booked') && b.paymentStatus === 'paid'
            );
            
            // Track first booking per listing
            const firstBookings = new Set();
            for (const booking of bookings) {
                if (booking.listingId && !firstBookings.has(booking.listingId)) {
                    firstBookings.add(booking.listingId);
                    totalPoints += 10;
                }
            }
        }
        
        // 4. Points for 2 bookings in a single day (10 points per day)
        if (bookingsResult.success) {
            const bookings = bookingsResult.data.filter(
                b => (b.status === 'confirmed' || b.status === 'booked') && b.paymentStatus === 'paid'
            );
            
            // Group bookings by date
            const bookingsByDate = {};
            for (const booking of bookings) {
                let bookingDate = null;
                if (booking.createdAt?.toDate) {
                    bookingDate = booking.createdAt.toDate();
                } else if (booking.createdAt) {
                    bookingDate = new Date(booking.createdAt);
                } else if (booking.confirmedAt) {
                    bookingDate = new Date(booking.confirmedAt);
                }
                
                if (bookingDate) {
                    const dateKey = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    if (!bookingsByDate[dateKey]) {
                        bookingsByDate[dateKey] = 0;
                    }
                    bookingsByDate[dateKey]++;
                }
            }
            
            // Count days with 2+ bookings
            for (const date in bookingsByDate) {
                if (bookingsByDate[date] >= 2) {
                    totalPoints += 10;
                }
            }
        }
        
        return { success: true, points: totalPoints };
    } catch (error) {
        console.error('Error calculating host points:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get host points history - detailed breakdown of how points were earned
 */
export const getHostPointsHistory = async (hostId) => {
    try {
        const history = [];
        
        // 1. Points for active/published listings (10 points each)
        const listingsResult = await getHostListings(hostId);
        if (listingsResult.success) {
            const activeListings = listingsResult.data.filter(
                l => l.isActive && l.status === 'active'
            );
            for (const listing of activeListings) {
                history.push({
                    type: 'listing',
                    description: `Active listing: ${listing.title || 'Untitled'}`,
                    points: 10,
                    date: listing.publishedAt?.toDate ? listing.publishedAt.toDate() : (listing.createdAt?.toDate ? listing.createdAt.toDate() : new Date()),
                    criteria: 'For every listing'
                });
            }
        }
        
        // 2. Points for review stars (2 points per star)
        if (listingsResult.success) {
            const listings = listingsResult.data;
            for (const listing of listings) {
                if (listing.stats?.rating && listing.stats?.reviewsCount) {
                    const totalStars = Math.floor(listing.stats.rating * listing.stats.reviewsCount);
                    if (totalStars > 0) {
                        // Get reviews to get individual dates
                        try {
                            const reviewsSnapshot = await getDocs(collection(db, 'listings', listing.id, 'reviews'));
                            const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            for (const review of reviews) {
                                history.push({
                                    type: 'review',
                                    description: `${review.rating} star review for "${listing.title || 'Listing'}"`,
                                    points: review.rating * 2,
                                    date: review.createdAt?.toDate ? review.createdAt.toDate() : new Date(),
                                    criteria: 'For every star in the reviews'
                                });
                            }
                        } catch (e) {
                            // If we can't get individual reviews, create a summary entry
                            history.push({
                                type: 'review',
                                description: `${totalStars} total stars from reviews for "${listing.title || 'Listing'}"`,
                                points: totalStars * 2,
                                date: listing.updatedAt?.toDate ? listing.updatedAt.toDate() : new Date(),
                                criteria: 'For every star in the reviews'
                            });
                        }
                    }
                }
            }
        }
        
        // 3. Points for first booking per listing (10 points each)
        const bookingsResult = await getHostBookings(hostId);
        if (bookingsResult.success) {
            const bookings = bookingsResult.data.filter(
                b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid'
            );
            
            // Track first booking per listing
            const firstBookings = new Map();
            for (const booking of bookings) {
                if (booking.listingId && !firstBookings.has(booking.listingId)) {
                    firstBookings.set(booking.listingId, booking);
                }
            }
            
            // Add history entries for first bookings
            for (const [listingId, booking] of firstBookings.entries()) {
                const listingDoc = await getDoc(doc(db, 'listings', listingId));
                const listingTitle = listingDoc.exists() ? listingDoc.data().title : 'Listing';
                history.push({
                    type: 'first_booking',
                    description: `First booking for "${listingTitle}"`,
                    points: 10,
                    date: booking.confirmedAt?.toDate ? booking.confirmedAt.toDate() : (booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date()),
                    criteria: 'For every 1st booking in a listing'
                });
            }
        }
        
        // 4. Points for 2 bookings in a single day (10 points per day)
        if (bookingsResult.success) {
            const bookings = bookingsResult.data.filter(
                b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid'
            );
            
            // Group bookings by date
            const bookingsByDate = {};
            for (const booking of bookings) {
                let bookingDate = null;
                if (booking.createdAt?.toDate) {
                    bookingDate = booking.createdAt.toDate();
                } else if (booking.createdAt) {
                    bookingDate = new Date(booking.createdAt);
                } else if (booking.confirmedAt?.toDate) {
                    bookingDate = booking.confirmedAt.toDate();
                } else if (booking.confirmedAt) {
                    bookingDate = new Date(booking.confirmedAt);
                }
                
                if (bookingDate) {
                    const dateKey = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    if (!bookingsByDate[dateKey]) {
                        bookingsByDate[dateKey] = [];
                    }
                    bookingsByDate[dateKey].push(booking);
                }
            }
            
            // Add history entries for days with 2+ bookings
            for (const date in bookingsByDate) {
                if (bookingsByDate[date].length >= 2) {
                    const dateObj = new Date(date);
                    history.push({
                        type: 'multiple_bookings',
                        description: `Received ${bookingsByDate[date].length} bookings on ${dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                        points: 10,
                        date: dateObj,
                        criteria: 'Receive 2 bookings in a single day'
                    });
                }
            }
        }
        
        // Sort by date (newest first)
        history.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        return { success: true, history };
    } catch (error) {
        console.error('Error getting host points history:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get host points (from user document or calculate)
 */
export const getHostPoints = async (hostId) => {
    try {
        const userRef = doc(db, 'users', hostId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' };
        }
        
        const userData = userSnap.data();
        let points = userData.points || 0;
        
        // Recalculate points to ensure accuracy
        const calculated = await calculateHostPoints(hostId);
        if (calculated.success) {
            points = calculated.points;
            
            // Update user document with calculated points
            await updateDoc(userRef, {
                points: points,
                pointsUpdatedAt: serverTimestamp()
            });
        }
        
        return { success: true, points };
    } catch (error) {
        console.error('Error getting host points:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Redeem reward (deduct from admin wallet, add to host wallet)
 * @deprecated Use redeemRewardWithPayPal instead
 */
export const redeemReward = async (hostId, rewardPoints, rewardAmount) => {
    try {
        // Get admin account
        const adminResult = await getAdminWallet();
        if (!adminResult.success) {
            return { success: false, error: 'Admin account not found' };
        }
        
        const adminId = adminResult.adminId;
        const adminBalance = adminResult.balance;
        
        // Check if admin has enough balance
        if (adminBalance < rewardAmount) {
            return { success: false, error: 'Insufficient admin wallet balance' };
        }
        
        // Get host points
        const hostPointsResult = await getHostPoints(hostId);
        if (!hostPointsResult.success) {
            return { success: false, error: 'Failed to get host points' };
        }
        
        if (hostPointsResult.points < rewardPoints) {
            return { success: false, error: 'Insufficient points' };
        }
        
        // Deduct points from host
        const userRef = doc(db, 'users', hostId);
        await updateDoc(userRef, {
            points: hostPointsResult.points - rewardPoints,
            updatedAt: serverTimestamp()
        });
        
        // Deduct amount from admin wallet
        await updateUserWalletBalance(adminId, -rewardAmount);
        
        // Add amount to host wallet
        await updateUserWalletBalance(hostId, rewardAmount);
        
        // Record transaction for host
        await recordWalletTransaction({
            userId: hostId,
            type: 'reward',
            amount: rewardAmount,
            currency: 'PHP',
            meta: { pointsRedeemed: rewardPoints, rewardType: 'points_redeemed' }
        });
        
        // Record transaction for admin
        await recordWalletTransaction({
            userId: adminId,
            type: 'reward_payout',
            amount: -rewardAmount,
            currency: 'PHP',
            meta: { hostId: hostId, pointsRedeemed: rewardPoints }
        });
        
        return { success: true, newPoints: hostPointsResult.points - rewardPoints };
    } catch (error) {
        console.error('Error redeeming reward:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Redeem reward with PayPal Sandbox (deduct points, add money to wallet via PayPal)
 * This function checks if user has enough points and deducts them.
 * The actual PayPal payment should be handled in the component, then call completeRewardRedemption.
 */
export const redeemRewardWithPayPal = async (userId, rewardPoints, rewardAmount, isHost = false) => {
    try {
        // Get user points
        const pointsResult = isHost 
            ? await getHostPoints(userId)
            : await getGuestPoints(userId);
        
        if (!pointsResult.success) {
            return { success: false, error: 'Failed to get user points' };
        }
        
        if (pointsResult.points < rewardPoints) {
            return { success: false, error: 'Insufficient points' };
        }
        
        // Deduct points from user
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: pointsResult.points - rewardPoints,
            updatedAt: serverTimestamp()
        });
        
        return { 
            success: true, 
            newPoints: pointsResult.points - rewardPoints,
            pointsDeducted: true
        };
    } catch (error) {
        console.error('Error redeeming reward with PayPal:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Complete reward redemption after PayPal payment is successful
 * This adds the money to the user's wallet and records the transaction
 */
export const completeRewardRedemption = async (userId, rewardPoints, rewardAmount, paypalDetails) => {
    try {
        // Add amount to user wallet
        const walletResult = await updateUserWalletBalance(userId, rewardAmount);
        if (!walletResult.success) {
            return { success: false, error: 'Failed to update wallet balance' };
        }
        
        // Record transaction
        await recordWalletTransaction({
            userId: userId,
            type: 'reward',
            amount: rewardAmount,
            currency: 'PHP',
            meta: { 
                pointsRedeemed: rewardPoints, 
                rewardType: 'points_redeemed',
                orderId: paypalDetails?.id,
                paypalOrderId: paypalDetails?.id
            }
        });
        
        return { 
            success: true, 
            newBalance: walletResult.newBalance 
        };
    } catch (error) {
        console.error('Error completing reward redemption:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate guest points based on:
 * - Complete Their First Booking = 15 points
 * - Complete a Third Booking = 25 points
 * - Book a Stay 7+ Nights Long = 20 points
 * - Leave Review / Rate a listing = 10 points
 * - Upload a Profile Photo = 5 points
 */
export const calculateGuestPoints = async (guestId) => {
    try {
        let totalPoints = 0;
        
        // Get user document to check profile photo
        const userRef = doc(db, 'users', guestId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // 1. Points for uploading profile photo (5 points)
        if (userData.photoURL && userData.photoURL.trim() !== '') {
            totalPoints += 5;
        }
        
        // 2. Get guest bookings
        const bookingsResult = await getGuestBookings(guestId);
        if (bookingsResult.success) {
            const bookings = bookingsResult.data.filter(
                b => (b.status === 'confirmed' || b.status === 'booked') && b.paymentStatus === 'paid'
            );
            
            // Sort bookings by creation date
            bookings.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateA - dateB;
            });
            
            // Points for first booking (15 points)
            if (bookings.length >= 1) {
                totalPoints += 15;
            }
            
            // Points for third booking (25 points)
            if (bookings.length >= 3) {
                totalPoints += 25;
            }
            
            // Points for bookings 7+ nights long (20 points each)
            for (const booking of bookings) {
                const nights = booking.numberOfNights || 0;
                if (nights >= 7) {
                    totalPoints += 20;
                }
            }
        }
        
        // 3. Points for reviews (10 points per review)
        // Check if user has given reviews - we'll check listing stats for reviews
        // Since we don't have a direct reviews collection, we'll use guestProfile.reviewsGiven
        if (userData.guestProfile?.reviewsGiven) {
            totalPoints += userData.guestProfile.reviewsGiven * 10;
        }
        
        // Alternative: Count reviews by checking all listings for reviews from this guest
        // For now, we'll use the guestProfile.reviewsGiven field
        
        return { success: true, points: totalPoints };
    } catch (error) {
        console.error('Error calculating guest points:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get guest points (from user document or calculate)
 */
export const getGuestPoints = async (guestId) => {
    try {
        const userRef = doc(db, 'users', guestId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' };
        }
        
        const userData = userSnap.data();
        let points = userData.points || 0;
        
        // Recalculate points to ensure accuracy
        const calculated = await calculateGuestPoints(guestId);
        if (calculated.success) {
            points = calculated.points;
            
            // Update user document with calculated points
            await updateDoc(userRef, {
                points: points,
                pointsUpdatedAt: serverTimestamp()
            });
        }
        
        return { success: true, points };
    } catch (error) {
        console.error('Error getting guest points:', error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// REVIEWS OPERATIONS
// ==========================================

/**
 * Create a review for a listing
 */
export const createReview = async (listingId, bookingId, guestId, reviewData) => {
    try {
        const { rating, comment } = reviewData;
        
        if (!rating || rating < 1 || rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }
        
        if (!comment || comment.trim().length < 10) {
            return { success: false, error: 'Review comment must be at least 10 characters' };
        }
        
        // Get guest user data for name
        const guestDoc = await getDoc(doc(db, 'users', guestId));
        const guestData = guestDoc.exists() ? guestDoc.data() : {};
        const guestName = guestData.fullName || guestData.displayName || guestData.email?.split('@')[0] || 'Anonymous';
        
        // Create review document
        const reviewRef = doc(collection(db, 'listings', listingId, 'reviews'));
        const reviewDoc = {
            bookingId,
            guestId,
            guestName,
            rating: Number(rating),
            comment: comment.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await setDoc(reviewRef, reviewDoc);
        
        // Update listing stats and get hostId
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await getDoc(listingRef);
        
        let hostId = null;
        if (listingSnap.exists()) {
            const listingData = listingSnap.data();
            hostId = listingData.hostId || null;
            
            const currentRating = listingData.stats?.rating || 0;
            const currentCount = listingData.stats?.reviewsCount || 0;
            
            // Calculate new average rating
            const newCount = currentCount + 1;
            const newRating = ((currentRating * currentCount) + rating) / newCount;
            
            await updateDoc(listingRef, {
                'stats.rating': newRating,
                'stats.reviewsCount': newCount,
                updatedAt: serverTimestamp()
            });
        }
        
        // Update guest profile (increment reviewsGiven) and award points
        const guestRef = doc(db, 'users', guestId);
        const guestSnap = await getDoc(guestRef);
        if (guestSnap.exists()) {
            const currentReviewsGiven = guestSnap.data().guestProfile?.reviewsGiven || 0;
            await updateDoc(guestRef, {
                'guestProfile.reviewsGiven': currentReviewsGiven + 1,
                updatedAt: serverTimestamp()
            });
            
            // Award 10 points to guest for leaving a review
            // Recalculate guest points to include the new review
            const guestPointsResult = await calculateGuestPoints(guestId);
            if (guestPointsResult.success) {
                await updateDoc(guestRef, {
                    points: guestPointsResult.points,
                    pointsUpdatedAt: serverTimestamp()
                });
            }
        }
        
        // Award points to host (2 points per star)
        if (hostId) {
            const hostRef = doc(db, 'users', hostId);
            const hostSnap = await getDoc(hostRef);
            if (hostSnap.exists()) {
                // Award 2 points per star (rating 5 = 10 points, rating 4 = 8 points, etc.)
                const pointsToAward = rating * 2;
                
                // Recalculate host points to include the new review stars
                const hostPointsResult = await calculateHostPoints(hostId);
                if (hostPointsResult.success) {
                    await updateDoc(hostRef, {
                        points: hostPointsResult.points,
                        pointsUpdatedAt: serverTimestamp()
                    });
                }
            }
        }
        
        // Update booking to mark as reviewed
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, {
            reviewed: true,
            reviewedAt: serverTimestamp()
        });
        
        return { success: true, reviewId: reviewRef.id };
    } catch (error) {
        console.error('Error creating review:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get reviews for a listing
 */
export const getListingReviews = async (listingId, limitCount = 50) => {
    try {
        const reviewsRef = collection(db, 'listings', listingId, 'reviews');
        
        // Try with orderBy first, if it fails (e.g., no index), try without orderBy
        let querySnapshot;
        try {
            const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(limitCount));
            querySnapshot = await getDocs(q);
        } catch (orderByError) {
            // If orderBy fails (likely due to missing index), try without it
            console.warn('OrderBy failed, fetching without order:', orderByError);
            const q = query(reviewsRef, limit(limitCount));
            querySnapshot = await getDocs(q);
        }
        
        const reviews = [];
        querySnapshot.forEach((doc) => {
            const reviewData = doc.data();
            reviews.push({ 
                id: doc.id, 
                ...reviewData,
                // Ensure createdAt is properly handled
                createdAt: reviewData.createdAt || null
            });
        });
        
        // Sort manually if orderBy wasn't used
        if (reviews.length > 0 && reviews[0].createdAt) {
            reviews.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
                return dateB - dateA; // Most recent first
            });
        }
        
        return { success: true, data: reviews };
    } catch (error) {
        console.error('Error getting listing reviews:', error);
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Check if a booking has been reviewed
 */
export const hasBookingBeenReviewed = async (bookingId) => {
    try {
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (!bookingSnap.exists()) {
            return { success: false, reviewed: false };
        }
        
        const bookingData = bookingSnap.data();
        return { success: true, reviewed: bookingData.reviewed === true };
    } catch (error) {
        console.error('Error checking if booking reviewed:', error);
        return { success: false, reviewed: false };
    }
};

// ==========================================
// WISH UTILITIES
// ==========================================

/**
 * Create a new wish
 */
export const createWish = async (wishData) => {
    try {
        const wishDoc = createWishDocument({
            ...wishData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        const wishesRef = collection(db, 'wishes');
        const docRef = await addDoc(wishesRef, wishDoc);
        
        return { success: true, wishId: docRef.id };
    } catch (error) {
        console.error('Error creating wish:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all wishes for a user
 */
export const getUserWishes = async (userId) => {
    try {
        const wishesRef = collection(db, 'wishes');
        const q = query(
            wishesRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const wishes = [];
        
        querySnapshot.forEach((doc) => {
            const wishData = doc.data();
            wishes.push({
                id: doc.id,
                ...wishData,
                createdAt: wishData.createdAt?.toDate ? wishData.createdAt.toDate() : (wishData.createdAt ? new Date(wishData.createdAt) : new Date()),
                updatedAt: wishData.updatedAt?.toDate ? wishData.updatedAt.toDate() : (wishData.updatedAt ? new Date(wishData.updatedAt) : new Date())
            });
        });
        
        return { success: true, data: wishes };
    } catch (error) {
        console.error('Error getting user wishes:', error);
        // If orderBy fails (likely due to missing index), try without it
        if (error.code === 'failed-precondition') {
            try {
                const wishesRef = collection(db, 'wishes');
                const q = query(wishesRef, where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                const wishes = [];
                
                querySnapshot.forEach((doc) => {
                    const wishData = doc.data();
                    wishes.push({
                        id: doc.id,
                        ...wishData,
                        createdAt: wishData.createdAt?.toDate ? wishData.createdAt.toDate() : (wishData.createdAt ? new Date(wishData.createdAt) : new Date()),
                        updatedAt: wishData.updatedAt?.toDate ? wishData.updatedAt.toDate() : (wishData.updatedAt ? new Date(wishData.updatedAt) : new Date())
                    });
                });
                
                // Sort manually by createdAt
                wishes.sort((a, b) => b.createdAt - a.createdAt);
                
                return { success: true, data: wishes };
            } catch (retryError) {
                console.error('Error getting user wishes (retry):', retryError);
                return { success: false, error: retryError.message, data: [] };
            }
        }
        return { success: false, error: error.message, data: [] };
    }
};

/**
 * Get a wish by ID
 */
export const getWishById = async (wishId) => {
    try {
        const wishRef = doc(db, 'wishes', wishId);
        const wishSnap = await getDoc(wishRef);
        
        if (!wishSnap.exists()) {
            return { success: false, error: 'Wish not found' };
        }
        
        const wishData = wishSnap.data();
        return {
            success: true,
            data: {
                id: wishSnap.id,
                ...wishData,
                createdAt: wishData.createdAt?.toDate ? wishData.createdAt.toDate() : (wishData.createdAt ? new Date(wishData.createdAt) : new Date()),
                updatedAt: wishData.updatedAt?.toDate ? wishData.updatedAt.toDate() : (wishData.updatedAt ? new Date(wishData.updatedAt) : new Date())
            }
        };
    } catch (error) {
        console.error('Error getting wish:', error);
        return { success: false, error: error.message };
    }
};

