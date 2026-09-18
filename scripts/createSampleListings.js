/**
 * Script to create 2 sample home listings in Cavite, Philippines
 * Run this script using Node.js or import it in your app
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../src/firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample listings data
const sampleListings = [
    {
        // Listing 1: Modern Condo in Tagaytay
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
        bookedDates: [],
        stats: {
            views: 0,
            favorites: 0,
            bookings: 0,
            rating: 0,
            reviewsCount: 0
        }
    },
    {
        // Listing 2: Beachfront Villa in Cavite
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
        bookedDates: [],
        stats: {
            views: 0,
            favorites: 0,
            bookings: 0,
            rating: 0,
            reviewsCount: 0
        }
    }
];

/**
 * Create sample listings in Firestore
 * Note: You need to provide a valid hostId (user UID)
 */
export const createSampleListings = async (hostId) => {
    if (!hostId) {
        console.error('Error: hostId is required');
        return { success: false, error: 'hostId is required' };
    }

    const results = [];

    for (const listingData of sampleListings) {
        try {
            const listingRef = doc(collection(db, 'listings'));
            const listingDoc = {
                id: listingRef.id,
                hostId: hostId,
                ...listingData,
                coverImage: listingData.images[0] || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                publishedAt: serverTimestamp()
            };

            await setDoc(listingRef, listingDoc);
            console.log(`✅ Created listing: ${listingData.title} (ID: ${listingRef.id})`);
            results.push({ success: true, id: listingRef.id, title: listingData.title });
        } catch (error) {
            console.error(`❌ Error creating listing "${listingData.title}":`, error);
            results.push({ success: false, error: error.message, title: listingData.title });
        }
    }

    return results;
};

// If running directly, you can use it like this:
// createSampleListings('YOUR_HOST_USER_ID_HERE').then(results => {
//     console.log('All listings created:', results);
// });

export default createSampleListings;

