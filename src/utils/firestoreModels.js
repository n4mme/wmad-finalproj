/**
 * Firestore Data Models for BiyaHele
 * 
 * Collections:
 * - /users: User profiles and authentication data
 * - /listings: Property listings (homes, experiences, services)
 * - /favorites: User-saved favorite listings
 * - /bookings: Reservation and booking transactions
 * - /messages: Guest-Host communications
 */

// ==========================================
// COLLECTION: /users
// ==========================================

/**
 * User Document Structure
 * Path: /users/{userId}
 */
export const createUserDocument = (userData) => ({
    uid: userData.uid,
    email: userData.email,
    fullName: userData.fullName || '',
    dateOfBirth: userData.dateOfBirth || null,
    mobileNumber: userData.mobileNumber || '',
    photoURL: userData.photoURL || null,
    role: userData.role, // 'guest' | 'host' | 'admin'
    emailVerified: userData.emailVerified || false,
    otpVerified: userData.otpVerified || false,
    points: userData.points || 0, // Host points for rewards
    walletBalance: userData.walletBalance || 0, // Wallet balance
    
    // Host-specific fields
    hostProfile: userData.role === 'host' ? {
        bio: '',
        languages: [],
        responseRate: 0,
        responseTime: 0,
        verified: false,
        superhost: false,
        totalListings: 0,
        totalBookings: 0,
        rating: 0,
        reviewsCount: 0,
    } : null,
    
    // Guest-specific fields
    guestProfile: userData.role === 'guest' ? {
        verified: false,
        totalBookings: 0,
        reviewsGiven: 0,
    } : null,
    
    // Timestamps
    createdAt: userData.createdAt || new Date(),
    updatedAt: new Date(),
});

// ==========================================
// COLLECTION: /listings
// ==========================================

/**
 * Listing Document Structure
 * Path: /listings/{listingId}
 */
export const createListingDocument = (listingData) => {
    const baseDoc = {
        // Basic Information
        id: listingData.id || '',
        hostId: listingData.hostId, // Required: User UID of the host
        title: listingData.title,
        description: listingData.description,
        category: listingData.category, // 'home' | 'experience' | 'service'
    };
    
    // Only include type field if it's provided (for homes)
    if (listingData.type) {
        baseDoc.type = listingData.type; // For homes: 'entire_place' | 'private_room' | 'shared_room' | 'apartment' | 'unique_space' | 'outdoor_space'
    }
    
    // Include specificCategory for experiences/services
    if (listingData.specificCategory) {
        baseDoc.specificCategory = listingData.specificCategory; // For experiences/services
    }
    
    return {
        ...baseDoc,
    
    // Location
    location: {
        locationName: listingData.location?.locationName || '', // New: unified location name
        address: listingData.location?.address || '',
        city: listingData.location?.city || '',
        province: listingData.location?.province || '',
        country: listingData.location?.country || 'Philippines',
        lat: listingData.location?.lat || 0,
        lng: listingData.location?.lng || 0,
        zipCode: listingData.location?.zipCode || '',
    },
    
    // Top-level province for easier querying (denormalized from location.province)
    province: listingData.location?.province || listingData.province || '',
    
    // Pricing (category-specific)
    pricePerNight: listingData.pricePerNight || 0, // For homes
    pricePerPerson: listingData.pricePerPerson || 0, // For experiences
    serviceRate: listingData.serviceRate || 0, // For services
    discount: listingData.discount || (typeof listingData.discount === 'object' ? listingData.discount : {
        name: '',
        percentage: typeof listingData.discount === 'number' ? listingData.discount : 0,
        startDate: null,
        endDate: null,
        description: ''
    }), // Discount object with name, percentage, date range, and description
    currency: listingData.currency || 'PHP',
    cleaningFee: listingData.cleaningFee || 0,
    serviceFee: listingData.serviceFee || 0,
    
    // Special Pricing (optional)
    specialRates: listingData.specialRates || {}, // { 'YYYY-MM-DD': price }
    
    // Property Details (for homes)
    guests: listingData.guests || 1,
    bedrooms: listingData.bedrooms || 1,
    beds: listingData.beds || 1,
    bathrooms: listingData.bathrooms || 1,
    
    // Experience Details
    duration: listingData.duration || 0, // Hours
    maxCapacity: listingData.maxCapacity || 0,
    whatsIncluded: listingData.whatsIncluded || '',
    requirementsRestrictions: listingData.requirementsRestrictions || '',
    
    // Features/Amenities (category-specific)
    amenities: listingData.amenities || [], // For homes
    experienceFeatures: listingData.experienceFeatures || [], // For experiences
    serviceFeatures: listingData.serviceFeatures || [], // For services
    
    // Images
    images: listingData.images || [], // Array of Firebase Storage URLs
    coverImage: listingData.coverImage || '', // Main display image
    
    // Availability
    isActive: listingData.isActive !== undefined ? listingData.isActive : false,
    status: listingData.status || 'draft', // 'draft' | 'active' | 'unlisted' | 'archived'
    instantBook: listingData.instantBook || false,
    
    // Draft step tracking (for resuming draft creation)
    lastStep: listingData.lastStep || null, // Step number where user left off (1-5)
    
    // Availability Calendar
    availableDates: listingData.availableDates || [], // ['YYYY-MM-DD']
    blockedDates: listingData.blockedDates || [], // ['YYYY-MM-DD']
    bookedDates: listingData.bookedDates || [], // ['YYYY-MM-DD']
    
    // Stays/Duration Restrictions
    minimumStay: listingData.minimumStay || 1,
    maximumStay: listingData.maximumStay || 365,
    
    // Rules (for homes)
    houseRules: listingData.houseRules || [],
    checkInTime: listingData.checkInTime || '14:00',
    checkOutTime: listingData.checkOutTime || '11:00',
    
    // Stats
    stats: {
        views: 0,
        favorites: 0,
        bookings: 0,
        rating: 0,
        reviewsCount: 0,
    },
    
    // Timestamps
    createdAt: listingData.createdAt || new Date(),
    updatedAt: new Date(),
    publishedAt: listingData.publishedAt || null,
    };
};

// ==========================================
// COLLECTION: /favorites
// ==========================================

/**
 * Favorite Document Structure
 * Path: /favorites/{favoriteId}
 */
export const createFavoriteDocument = (favoriteData) => ({
    userId: favoriteData.userId, // Required: User UID
    listingId: favoriteData.listingId, // Required: Listing ID
    
    // Cached listing data for faster display
    listingSnapshot: {
        title: favoriteData.listingSnapshot?.title || '',
        coverImage: favoriteData.listingSnapshot?.coverImage || '',
        pricePerNight: favoriteData.listingSnapshot?.pricePerNight || 0,
        location: favoriteData.listingSnapshot?.location || '',
        rating: favoriteData.listingSnapshot?.rating || 0,
    },
    
    // Timestamps
    createdAt: favoriteData.createdAt || new Date(),
});

// ==========================================
// COLLECTION: /bookings
// ==========================================

/**
 * Booking Document Structure
 * Path: /bookings/{bookingId}
 */
export const createBookingDocument = (bookingData) => ({
    // Parties involved
    guestId: bookingData.guestId, // Required: Guest User UID
    hostId: bookingData.hostId, // Required: Host User UID
    listingId: bookingData.listingId, // Required: Listing ID
    
    // Cached guest/listing info
    guestName: bookingData.guestName || '',
    listingTitle: bookingData.listingTitle || '',
    
    // Dates
    checkIn: bookingData.checkIn, // Date object or Timestamp
    checkOut: bookingData.checkOut, // Date object or Timestamp
    numberOfNights: bookingData.numberOfNights || 1,
    
    // Guests
    numberOfGuests: bookingData.numberOfGuests || 1,
    
    // Pricing
    pricePerNight: bookingData.pricePerNight || 0,
    totalNightsCost: bookingData.totalNightsCost || 0,
    cleaningFee: bookingData.cleaningFee || 0,
    serviceFee: bookingData.serviceFee || 0,
    totalPrice: bookingData.totalPrice || 0,
    currency: bookingData.currency || 'PHP',
    
    // Status
    status: bookingData.status || 'pending', 
    // 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress'
    
    // Payment
    paymentStatus: bookingData.paymentStatus || 'unpaid',
    // 'unpaid' | 'partial' | 'paid' | 'refunded'
    paymentMethod: bookingData.paymentMethod || null,
    
    // Special requests
    specialRequests: bookingData.specialRequests || '',
    
    // Cancellation
    cancellationReason: bookingData.cancellationReason || null,
    cancelledBy: bookingData.cancelledBy || null, // 'guest' | 'host' | 'admin'
    cancelledAt: bookingData.cancelledAt || null,
    
    // Timestamps
    createdAt: bookingData.createdAt || new Date(),
    updatedAt: new Date(),
    confirmedAt: bookingData.confirmedAt || null,
});

// ==========================================
// COLLECTION: /messages
// ==========================================

/**
 * Message Thread Document Structure
 * Path: /messages/{threadId}
 */
export const createMessageThreadDocument = (threadData) => ({
    participants: threadData.participants || [], // [guestId, hostId]
    guestId: threadData.guestId,
    hostId: threadData.hostId,
    listingId: threadData.listingId || null,
    bookingId: threadData.bookingId || null,
    
    // Last message preview
    lastMessage: threadData.lastMessage || {
        text: '',
        senderId: '',
        timestamp: new Date(),
    },
    
    // Unread counts
    unreadCount: {
        [threadData.guestId]: 0,
        [threadData.hostId]: 0,
    },
    
    // Timestamps
    createdAt: threadData.createdAt || new Date(),
    updatedAt: new Date(),
});

/**
 * Individual Message Structure
 * Path: /messages/{threadId}/messages/{messageId}
 */
export const createMessageDocument = (messageData) => ({
    senderId: messageData.senderId, // User UID
    senderName: messageData.senderName || '',
    text: messageData.text,
    read: messageData.read || false,
    
    // Timestamps
    createdAt: messageData.createdAt || new Date(),
});

/**
 * Coupon Document Structure
 * Path: /coupons/{couponId}
 */
export const createCouponDocument = (couponData) => ({
    hostId: couponData.hostId,
    code: couponData.code,
    type: couponData.type, // 'percentage' | 'fixed'
    value: couponData.value,
    usageLimitPerAccount: couponData.usageLimitPerAccount,
    minAmount: couponData.minAmount,
    description: couponData.description || '',
    validFrom: couponData.validFrom || new Date(),
    validTo: couponData.validTo || new Date(),
    isActive: couponData.isActive !== false,
    totalUsage: couponData.totalUsage || 0,
    
    // Timestamps
    createdAt: couponData.createdAt || new Date(),
    updatedAt: couponData.updatedAt || new Date(),
});

// ==========================================
// COLLECTION: /wishes
// ==========================================

/**
 * Wish Document Structure
 * Path: /wishes/{wishId}
 */
export const createWishDocument = (wishData) => ({
    userId: wishData.userId, // Required: Guest User UID
    wishText: wishData.wishText, // Required: The wish/suggestion text
    inspirationTags: wishData.inspirationTags || [], // Tags from inspiration buttons
    
    // Status tracking
    status: wishData.status || 'pending', // 'pending' | 'reviewed' | 'in_development' | 'completed'
    
    // Admin response (for future use)
    adminResponse: wishData.adminResponse || null,
    reviewedBy: wishData.reviewedBy || null, // Admin UID
    reviewedAt: wishData.reviewedAt || null,
    
    // Timestamps
    createdAt: wishData.createdAt || new Date(),
    updatedAt: wishData.updatedAt || new Date(),
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Generate a unique Favorite ID from userId and listingId
 */
export const generateFavoriteId = (userId, listingId) => {
    return `${userId}_${listingId}`;
};

/**
 * Check if a date is blocked
 */
export const isDateBlocked = (date, blockedDates = []) => {
    const dateString = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return blockedDates.includes(dateString);
};

/**
 * Calculate total booking cost
 */
export const calculateBookingCost = (pricePerNight, numberOfNights, cleaningFee = 0, serviceFee = 0) => {
    const nightsCost = pricePerNight * numberOfNights;
    const totalPrice = nightsCost + cleaningFee + serviceFee;
    
    return {
        totalNightsCost: nightsCost,
        cleaningFee,
        serviceFee,
        totalPrice,
    };
};

/**
 * Validate listing before publishing
 */
export const validateListingForPublish = (listing) => {
    const errors = [];
    
    // Common validations
    if (!listing.title || listing.title.trim().length < 10) {
        errors.push('Title must be at least 10 characters');
    }
    
    if (!listing.description || listing.description.trim().length < 50) {
        errors.push('Description must be at least 50 characters');
    }
    
    if (!listing.images || listing.images.length === 0) {
        errors.push('At least one image is required');
    }
    
    if (!listing.location?.locationName || listing.location.locationName.trim().length === 0) {
        errors.push('Location is required');
    }
    
    if (listing.location?.lat === undefined || listing.location?.lat === null || 
        listing.location?.lng === undefined || listing.location?.lng === null) {
        errors.push('Location coordinates are required');
    }
    
    if (!listing.category) {
        errors.push('Category is required');
    }
    
    // Category-specific validations
    if (listing.category === 'home') {
        if (!listing.pricePerNight || listing.pricePerNight <= 0) {
            errors.push('Price per night must be greater than 0');
        }
    } else if (listing.category === 'experience') {
        if (!listing.pricePerPerson || listing.pricePerPerson <= 0) {
            errors.push('Price per person must be greater than 0');
        }
        if (!listing.duration || listing.duration <= 0) {
            errors.push('Duration must be greater than 0');
        }
        if (!listing.specificCategory) {
            errors.push('Experience category is required');
        }
    } else if (listing.category === 'service') {
        if (!listing.serviceRate || listing.serviceRate <= 0) {
            errors.push('Service rate must be greater than 0');
        }
        if (!listing.specificCategory) {
            errors.push('Service category is required');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Format date range for booking
 */
export const formatDateRange = (checkIn, checkOut) => {
    const checkInDate = checkIn instanceof Date ? checkIn : checkIn.toDate();
    const checkOutDate = checkOut instanceof Date ? checkOut : checkOut.toDate();
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${checkInDate.toLocaleDateString('en-US', options)} - ${checkOutDate.toLocaleDateString('en-US', options)}`;
};

/**
 * Calculate number of nights between two dates
 */
export const calculateNights = (checkIn, checkOut) => {
    const checkInDate = checkIn instanceof Date ? checkIn : checkIn.toDate();
    const checkOutDate = checkOut instanceof Date ? checkOut : checkOut.toDate();
    
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

