import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { auth } from '../firebase';
import { getActiveListings, toggleFavorite, getUserFavorites, getGuestBookings, getListing } from '../utils/firestoreUtils';
import CategoryHero from './CategoryHero';

// --- Experience Card Component (Consistent with Home Listings) ---
const ExperienceCard = ({ experience, isFavorite, onToggleFavorite, onClick }) => {
    const [showShareMenu, setShowShareMenu] = React.useState(false);
    const [copySuccess, setCopySuccess] = React.useState(false);

    const HeartIcon = ({ isFavorite, onClick }) => (
        <svg
            onClick={onClick}
            className={`w-5 h-5 cursor-pointer transition-all duration-200 ease-in-out ${isFavorite ? "text-red-500" : "text-gray-700"} `}
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
            />
        </svg>
    );

    const ShareIcon = () => (
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );

    const StarIcon = () => (
        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    const handleCopyLink = (e) => {
        e.stopPropagation();
        const listingUrl = `${window.location.origin}/listing/${experience.id}`;
        navigator.clipboard.writeText(listingUrl).then(() => {
            setCopySuccess(true);
            setTimeout(() => {
                setCopySuccess(false);
                setShowShareMenu(false);
            }, 2000);
        });
    };

    const handleShare = (platform, e) => {
        e.stopPropagation();
        const listingUrl = encodeURIComponent(`${window.location.origin}/listing/${experience.id}`);
        const title = encodeURIComponent(experience.title || 'Check out this experience');
        
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${listingUrl}`,
            twitter: `https://twitter.com/intent/tweet?url=${listingUrl}&text=${title}`,
            whatsapp: `https://wa.me/?text=${title}%20${listingUrl}`,
            instagram: `https://www.instagram.com/`
        };

        if (platform === 'instagram') {
            alert('Please share via Instagram app');
        } else {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    return (
        <div className="group cursor-pointer" onClick={() => onClick && onClick(experience)}>
            <div className="relative mb-3">
                <img 
                    src={experience.coverImage || experience.images?.[0] || 'https://placehold.co/600x400/06B6D4/FFFFFF?text=Experience'} 
                    alt={experience.title} 
                    className="w-full aspect-[4/3] object-cover rounded-xl transform group-hover:opacity-95 transition duration-300" 
                />
                
                {/* Share and Favorite Icons */}
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowShareMenu(!showShareMenu);
                            }}
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
                        >
                            <ShareIcon />
                        </button>

                        {showShareMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">
                                        {copySuccess ? '✓ Copied!' : 'Copy Link'}
                                    </span>
                                </button>
                                <button
                                    onClick={(e) => handleShare('facebook', e)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                                </button>
                                <button
                                    onClick={(e) => handleShare('twitter', e)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                                </button>
                                <button
                                    onClick={(e) => handleShare('whatsapp', e)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                                </button>
                                <button
                                    onClick={(e) => handleShare('instagram', e)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Instagram</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(experience);
                        }}
                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
                    >
                        <HeartIcon
                            isFavorite={isFavorite}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </button>
                </div>

                {experience.category && (
                    <span className="absolute top-3 left-3 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md capitalize">
                        Experience
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <div className="leading-tight flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-1">
                            {experience.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                            {experience.location?.city ? `${experience.location.city}, ${experience.location.province}` : experience.location?.locationName || 'Location not specified'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <StarIcon />
                        <span className="text-sm text-gray-800 font-medium">
                            {experience.stats?.rating || experience.rating || 'New'}
                        </span>
                    </div>
                </div>

                <p className="mt-1 pt-1 text-sm">
                    <span className="font-semibold text-gray-900">
                        ₱{(experience.pricePerPerson || experience.pricePerNight || experience.price || 0).toLocaleString()}
                    </span> 
                    <span className="text-gray-500"> per person</span>
                </p>
            </div>
        </div>
    );
};

// --- Main ExperiencesPage Component ---
export default function ExperiencesPage({ searchFilters, setSelectedListing }) {
    const [experiences, setExperiences] = useState([]);
    const [recommendedExperiences, setRecommendedExperiences] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [hasSuccessfulBookings, setHasSuccessfulBookings] = useState(false);

    useEffect(() => {
        loadExperiences();
        loadFavorites();
        loadRecommendedExperiences();
    }, []);

    const loadExperiences = async () => {
        setIsLoading(true);
        // Load listings with category 'experience'
        const result = await getActiveListings({ limit: 50, category: 'experience' });
        if (result.success) {
            setExperiences(result.data);
        }
        setIsLoading(false);
    };

    const loadFavorites = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        const result = await getUserFavorites(user.uid);
        if (result.success) {
            const favIds = new Set(result.data.map(fav => fav.listingId));
            setFavoriteIds(favIds);
        }
    };

    const loadRecommendedExperiences = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Get user's successful bookings (confirmed/paid)
            const bookingsResult = await getGuestBookings(user.uid);
            if (!bookingsResult.success) return;

            const successfulBookings = bookingsResult.data.filter(b => 
                (b.status === 'confirmed' || b.status === 'booked') && 
                b.paymentStatus === 'paid' &&
                b.listingId
            );

            if (successfulBookings.length === 0) {
                setHasSuccessfulBookings(false);
                return;
            }

            setHasSuccessfulBookings(true);

            // Get provinces from successful bookings (normalize for case-insensitive matching)
            const provinces = new Set();
            const provinceMap = new Map(); // Store original -> normalized mapping
            
            for (const booking of successfulBookings) {
                try {
                    const listingResult = await getListing(booking.listingId);
                    if (listingResult.success) {
                        // Check both top-level province and location.province
                        const province = listingResult.data.province || listingResult.data.location?.province;
                        if (province) {
                            const provinceTrimmed = province.trim();
                            const normalized = provinceTrimmed.toLowerCase().trim();
                            provinces.add(normalized);
                            provinceMap.set(normalized, provinceTrimmed); // Store original for display
                            console.log('Found province from booking:', provinceTrimmed, 'for experience:', listingResult.data.title);
                        }
                    }
                } catch (error) {
                    console.error('Error loading listing for recommendation:', error);
                }
            }

            console.log('Provinces from bookings (normalized):', Array.from(provinces));
            console.log('Provinces from bookings (original):', Array.from(provinceMap.values()));

            if (provinces.size === 0) {
                console.log('No provinces found in bookings');
                return;
            }

            // Get all experience listings (no limit to ensure we get all matching listings)
            const allListingsResult = await getActiveListings({ category: 'experience' });
            if (!allListingsResult.success) {
                console.error('Failed to load experiences');
                return;
            }

            console.log('Total experience listings loaded:', allListingsResult.data.length);

            // Filter listings by provinces from bookings - match ANY province (case-insensitive)
            // Check both location.province and top-level province field
            const recommended = allListingsResult.data.filter(listing => {
                // Check both top-level province and location.province
                const listingProvince = listing.province || listing.location?.province;
                if (!listingProvince) {
                    return false;
                }
                const normalizedProvince = listingProvince.toLowerCase().trim();
                // Check if listing province matches any of the booking provinces
                const matches = provinces.has(normalizedProvince);
                if (matches) {
                    console.log('✅ Matched experience:', listing.title, 'province:', listingProvince, 'normalized:', normalizedProvince);
                }
                return matches;
            });

            console.log('Experiences matching provinces:', recommended.length);
            console.log('Sample matched experiences:', recommended.slice(0, 3).map(e => ({ title: e.title, province: e.province || e.location?.province })));

            // Exclude listings that user already booked
            const bookedListingIds = new Set(successfulBookings.map(b => b.listingId));
            const filteredRecommended = recommended.filter(listing => 
                !bookedListingIds.has(listing.id)
            );

            console.log('Recommended experiences (after excluding booked):', filteredRecommended.length, 'for provinces:', Array.from(provinces));
            setRecommendedExperiences(filteredRecommended);
        } catch (error) {
            console.error('Error loading recommended experiences:', error);
        }
    };
    
    const handleToggleFavorite = async (experience) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to save favorites');
            return;
        }
        
        const listingSnapshot = {
            title: experience.title,
            coverImage: experience.coverImage || experience.images?.[0],
            pricePerNight: experience.pricePerNight,
            location: experience.location?.city ? `${experience.location.city}, ${experience.location.province}` : '',
            rating: experience.stats?.rating || 0
        };
        
        const result = await toggleFavorite(user.uid, experience.id, listingSnapshot);
        if (result.success) {
            loadFavorites();
        }
    };

    // Filter experiences based on search criteria - Works with individual filters
    const filteredExperiences = experiences.filter(listing => {
        // Filter by location (Where) - Enhanced matching
        if (searchFilters?.where && searchFilters.where.trim() !== '') {
            const searchLower = searchFilters.where.toLowerCase().trim();
            const locationName = (listing.location?.locationName || '').toLowerCase().trim();
            const city = (listing.location?.city || '').toLowerCase().trim();
            const province = (listing.location?.province || '').toLowerCase().trim();
            const fullLocation = city && province ? `${city}, ${province}` : '';
            
            const matchesLocationName = locationName && locationName.includes(searchLower);
            const matchesCity = city && city.includes(searchLower);
            const matchesProvince = province && province.includes(searchLower);
            const matchesFullLocation = fullLocation && fullLocation.includes(searchLower);
            
            if (!matchesLocationName && !matchesCity && !matchesProvince && !matchesFullLocation) return false;
        }
        
        // Filter by number of guests (Who) - Only if specified
        if (searchFilters?.guests && searchFilters.guests > 0) {
            if (!listing.guests || listing.guests < searchFilters.guests) return false;
        }
        
        // Filter by date range (check-in to check-out) - Check all dates in range are available
        if (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '' && 
            searchFilters?.checkOut && searchFilters.checkOut.trim() !== '') {
            // Generate all dates from check-in to check-out (inclusive)
            const datesToCheck = [];
            const checkInDate = new Date(searchFilters.checkIn);
            const checkOutDate = new Date(searchFilters.checkOut);
            
            // Validate date range
            if (checkOutDate <= checkInDate) return false;
            
            // Generate date strings for all dates in range
            const d = new Date(checkInDate);
            while (d <= checkOutDate) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                datesToCheck.push(`${year}-${month}-${day}`);
                d.setDate(d.getDate() + 1);
            }
            
            // Check if all dates in range are available
            for (const dateStr of datesToCheck) {
                if (listing.blockedDates && listing.blockedDates.includes(dateStr)) {
                    return false;
                }
                if (listing.bookedDates && listing.bookedDates.includes(dateStr)) {
                    return false;
                }
            }
        } else if (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '') {
            // Fallback: Only check-in date specified (backward compatibility)
            if (listing.blockedDates && listing.blockedDates.includes(searchFilters.checkIn)) {
                return false;
            }
            if (listing.bookedDates && listing.bookedDates.includes(searchFilters.checkIn)) {
                return false;
            }
        }
        
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero Banner */}
                <div id="hero-experiences">
                    <CategoryHero 
                        category="experience"
                        title="Experience Listings"
                        subtitle="Discover unique experiences and adventures"
                    />
                </div>

                {/* Experiences Grid */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading experiences...</p>
                    </div>
                ) : (
                    <>
                        {/* Suggestions & Recommendations Section - Only show if user has successful bookings AND no active filters */}
                        {(() => {
                            // Check if any filters are active
                            const hasActiveFilters = (
                                (searchFilters?.where && searchFilters.where.trim() !== '') ||
                                (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '') ||
                                (searchFilters?.checkOut && searchFilters.checkOut.trim() !== '') ||
                                (searchFilters?.guests && searchFilters.guests > 1)
                            );
                            
                            return hasSuccessfulBookings && recommendedExperiences.length > 0 && !hasActiveFilters;
                        })() && (
                            <div className="mb-8">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Suggestions & Recommendations
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {recommendedExperiences.length} {recommendedExperiences.length === 1 ? 'experience' : 'experiences'} found
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 mb-8">
                                    {recommendedExperiences.map((experience) => (
                                        <ExperienceCard 
                                            key={experience.id} 
                                            experience={experience}
                                            isFavorite={favoriteIds.has(experience.id)}
                                            onToggleFavorite={handleToggleFavorite}
                                            onClick={(exp) => setSelectedListing && setSelectedListing(exp.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience Listings Section */}
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Experience Listings</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {(() => {
                                    // Check if any filters are active
                                    const hasActiveFilters = (
                                        (searchFilters?.where && searchFilters.where.trim() !== '') ||
                                        (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '') ||
                                        (searchFilters?.checkOut && searchFilters.checkOut.trim() !== '') ||
                                        (searchFilters?.guests && searchFilters.guests > 1)
                                    );
                                    
                                    // If filters are active, show filtered count, otherwise show all listings
                                    const displayExperiences = hasActiveFilters ? filteredExperiences : experiences;
                                    return `${displayExperiences.length} ${displayExperiences.length === 1 ? 'experience' : 'experiences'} found`;
                                })()}
                            </p>
                        </div>

                        {(() => {
                            // Check if any filters are active
                            const hasActiveFilters = (
                                (searchFilters?.where && searchFilters.where.trim() !== '') ||
                                (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '') ||
                                (searchFilters?.checkOut && searchFilters.checkOut.trim() !== '') ||
                                (searchFilters?.guests && searchFilters.guests > 1)
                            );
                            
                            // If filters are active, show filtered experiences, otherwise show all experiences
                            const displayExperiences = hasActiveFilters ? filteredExperiences : experiences;
                            
                            if (displayExperiences.length === 0) {
                                return (
                                    <div className="text-center py-20">
                                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-xl mb-2">No listing found</p>
                                        <p className="text-sm text-gray-500">Try adjusting your search filter or check back later for new listings</p>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-16">
                                    {displayExperiences.map((experience) => (
                                        <ExperienceCard 
                                            key={experience.id} 
                                            experience={experience}
                                            isFavorite={favoriteIds.has(experience.id)}
                                            onToggleFavorite={handleToggleFavorite}
                                            onClick={(exp) => setSelectedListing && setSelectedListing(exp.id)}
                                        />
                                    ))}
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}