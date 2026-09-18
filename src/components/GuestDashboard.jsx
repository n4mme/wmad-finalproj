import React, { useState, useEffect } from "react";
import Header from './Header'; 
import ExperiencesPage from './ExperiencesPage';
import Wishlist from './Wishlist.jsx'; 
import Favorites from './Favorites';
import Profile from './Profile';
import AccountSettings from './AccountSettings';
import Trips from './Trips';
import Bookings from './Bookings';
import Messages from './Messages';
import Wallet from './Wallet';
import ListingDetailView from './ListingDetailView';
import CategoryHero from './CategoryHero';
import NavigationAndFilter from './NavigationAndFilter';
import { User as LucideUser, Globe, Briefcase, Gem, Utensils, MessageCircle, Monitor, Coffee, Car, Plane, Gift, Zap } from "lucide-react";

// Firebase imports
import { auth } from '../firebase';
import { getActiveListings, toggleFavorite, getUserFavorites, getGuestBookings, getListing } from '../utils/firestoreUtils';


// --- MOCK API DATA (PHP Rates) ---

// Mock Data for the Services Page (Moved to the top for consistency)
const servicesData = [
    {
        category: "For Tourists",
        tagline: "Experiences & Easy Planning",
        icon: Globe,
        color: "bg-indigo-50 border-indigo-200 text-indigo-800",
        headerColor: "text-indigo-600",
        items: [
            { name: "Ticket Booking Services", description: "Land tours, museums, and theme parks. Never miss an attraction.", icon: Utensils, price: "Starts at ₱800" }, 
            { name: "Photography / Souvenir Packages", description: "Capture memories with local photographers or custom print bundles.", icon: Zap, price: "Starts at ₱7,500" }, 
            { name: "Custom Itinerary Planning", description: "Mix and match stays, experiences, and local transport logistics.", icon: Car, price: "Custom Quote" },
            { name: "Local Interpreter / Translator", description: "On-call or scheduled language assistance for seamless communication.", icon: MessageCircle, price: "₱800/hr" }, 
        ],
    },
    {
        category: "For Business Travelers",
        tagline: "Productivity & Professional Comfort",
        icon: Briefcase,
        color: "bg-teal-50 border-teal-200 text-teal-800",
        headerColor: "text-teal-600",
        items: [
            { name: "Workspace Setup", description: "Dedicated desk, comfortable chair, and extra monitor upon request.", icon: Monitor, price: "₱750/day" }, 
            { name: "Coffee & Office Supply Delivery", description: "Partnered delivery from local cafés and office supply shops.", icon: Coffee, price: "Local Market Price" },
            { name: "Virtual Assistant / Errand Services", description: "Remote help with bookings, scheduling, and local administrative tasks.", icon: LucideUser, price: "₱1,200/hr" }, 
            { name: "Corporate Transport", description: "Chauffeur or reliable business-class rides to/from the airport and meetings.", icon: Plane, price: "Custom Quote" },
        ],
    },
];

const premiumAddons = {
    category: "Optional Premium Add-ons",
    tagline: "Elevate Your Stay – Customized Luxury",
    icon: Gem,
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    headerColor: "text-yellow-600",
    items: [
        { name: "Concierge / Personal Assistant", description: "One-on-one, end-to-end trip planning and execution.", icon: LucideUser, price: "₱20,000/day" }, 
        { name: "Private Chef / On-demand Dining", description: "Gourmet meals prepared in-room for executives or families.", icon: Utensils, price: "Starts at ₱6,000 (Chef Fee Only)" }, 
        { name: "In-room Massage / Spa", description: "Professional wellness services and relaxation on call.", icon: Zap, price: "₱2,800/session" }, 
        { name: "Event / Celebration Setup", description: "Perfect arrangements for birthdays, proposals, or anniversaries.", icon: Gift, price: "Custom Quote" },
    ]
}

// Mock Data for the Home/Dashboard Page (Expanded to 8 items for 2 full rows of 4)
const recommendedStays = [
    { id: 1, title: "Serene Beachfront Villa", location: "El Nido, Palawan", price: 250, rating: 4.9, image: "https://placehold.co/600x400/0D9488/FFFFFF?text=Beach+Villa", type: "Villa", isSuperHost: true, amenities: ["WiFi", "Pool", "Kitchen"], reviews: [{user: "Ana M.", rating: 5, comment: "Amazing sunset views!"}, {user: "Ramon T.", rating: 4, comment: "Great service, slightly small room."}] },
    { id: 2, title: "Cozy Mountain Cabin", location: "Baguio, Benguet", price: 120, rating: 4.8, image: "https://placehold.co/600x400/3B82F6/FFFFFF?text=Mountain+Cabin", type: "Cabin", isSuperHost: false, amenities: ["Fireplace", "Hot Water"], reviews: [{user: "Ben L.", rating: 5, comment: "Perfect escape from the heat."}, {user: "Carla D.", rating: 5, comment: "Very cozy and quiet."}] },
    { id: 3, title: "Modern City Loft", location: "BGC, Taguig", price: 180, rating: 4.7, image: "https://placehold.co/600x400/6D28D9/FFFFFF?text=City+Loft", type: "Apartment", isSuperHost: true, amenities: ["Gym", "Doorman", "Fast Internet"], reviews: [{user: "Dave J.", rating: 4, comment: "Central location, easy access."}, {user: "Eliza V.", rating: 5, comment: "Sleek and professional."}] },
    { id: 4, title: "Rustic Farm Stay", location: "Tagaytay, Cavite", price: 95, rating: 4.9, image: "https://placehold.co/600x400/16A34A/FFFFFF?text=Farm+Stay", type: "House", isSuperHost: false, amenities: ["Free Parking", "BBQ Grill"], reviews: [{user: "Fidel C.", rating: 5, comment: "Fresh air and beautiful garden."}, {user: "Gloria A.", rating: 5, comment: "Kids loved the animals."}] },
    // Additional items to fill two rows
    { id: 5, title: "Luxury Makati Condo", location: "Makati, NCR", price: 300, rating: 5.0, image: "https://placehold.co/600x400/F59E0B/FFFFFF?text=Luxury+Condo", type: "Condo", isSuperHost: true, amenities: ["Infinity Pool", "Spa"], reviews: [{user: "Hugo E.", rating: 5, comment: "Top-tier luxury experience."}, {user: "Irene B.", rating: 5, comment: "Best service in Manila."}] },
    { id: 6, title: "Intramuros Heritage Home", location: "Manila, NCR", price: 150, rating: 4.6, image: "https://placehold.co/600x400/0F766E/FFFFFF?text=Heritage+Home", type: "Bungalow", isSuperHost: false, amenities: ["Historic Tour", "Patio"], reviews: [{user: "Jose R.", rating: 4, comment: "Fascinating stay, right in history."}, {user: "Kate T.", rating: 5, comment: "Unique and charming."}] },
    { id: 7, title: "Surfer's Pad Siargao", location: "Siargao, Surigao del Norte", price: 110, rating: 4.9, image: "https://placehold.co/600x400/EF4444/FFFFFF?text=Surfer+Pad", type: "Studio", isSuperHost: true, amenities: ["Surfboard Rentals", "Beach Access"], reviews: [{user: "Liam P.", rating: 5, comment: "Steps from Cloud 9. Perfect."}, {user: "Mia S.", rating: 5, comment: "Vibrant community feel."}] },
    { id: 8, title: "Quiet Retreat Pampanga", location: "Angeles, Pampanga", price: 80, rating: 4.5, image: "https://placehold.co/600x400/3B0764/FFFFFF?text=Pampanga+Retreat", type: "Guest House", isSuperHost: false, amenities: ["Garden", "Outdoor Dining"], reviews: [{user: "Noel G.", rating: 4, comment: "Very relaxing and spacious."}, {user: "Opal K.", rating: 5, comment: "A true hidden gem."}] },
];


// --- SVG Icons (Only those needed by content components) ---
const HeartIcon = ({ isFavorite }) => (
    <svg
        className={`w-5 h-5 transition-all duration-200 ease-in-out pointer-events-none ${isFavorite ? "text-red-500" : "text-gray-700"} `}
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

const StarIcon = ({ className = "w-4 h-4 text-yellow-400" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ShareIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

// Share Button Component with Dropdown
const ShareButton = ({ listing, onClick }) => {
    const [showShareMenu, setShowShareMenu] = React.useState(false);
    const [copySuccess, setCopySuccess] = React.useState(false);

    const handleCopyLink = (e) => {
        e.stopPropagation();
        const listingUrl = `${window.location.origin}/listing/${listing.id}`;
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
        const listingUrl = encodeURIComponent(`${window.location.origin}/listing/${listing.id}`);
        const title = encodeURIComponent(listing.title || 'Check out this listing');
        
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${listingUrl}`,
            twitter: `https://twitter.com/intent/tweet?url=${listingUrl}&text=${title}`,
            whatsapp: `https://wa.me/?text=${title}%20${listingUrl}`,
            instagram: `https://www.instagram.com/` // Instagram doesn't have direct sharing URL
        };

        if (platform === 'instagram') {
            alert('Please share via Instagram app');
        } else {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu(!showShareMenu);
                }}
                className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110"
            >
                <ShareIcon className="w-5 h-5 text-gray-700" />
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
    );
};


// --- Service Card Components (From previous Services.jsx) ---

const ServiceCard = ({ name, description, icon: Icon, color, price }) => {
    const [status, setStatus] = useState('Request Service');
    
    const handleRequest = () => {
        setStatus('Requested! We will contact you.');
        console.log(`Service Requested: ${name}`);
        setTimeout(() => setStatus('Request Service'), 3000); 
    };

    const baseColor = color.includes('indigo') ? 'indigo' : 'teal';

    return (
        <div className={`p-4 rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.02] border-l-4 border-${baseColor}-400 bg-white`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-start space-x-4">
                    <Icon className={`w-6 h-6 text-${baseColor}-600 flex-shrink-0`} />
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                    </div>
            </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <p className={`font-bold text-sm text-${baseColor}-600`}>{price}</p>
                <button
                    onClick={handleRequest}
                    className={`text-sm px-4 py-2 rounded-full font-medium transition duration-200 
                        ${status === 'Request Service' 
                            ? `bg-${baseColor}-600 text-white hover:bg-${baseColor}-700`
                            : 'bg-green-100 text-green-700 cursor-not-allowed'
                        }`}
                    disabled={status !== 'Request Service'}
                >
                    {status}
                </button>
            </div>
        </div>
    );
};

const ServiceCategory = ({ category, tagline, items, icon: Icon, color, headerColor }) => (
    <div className={`p-6 md:p-8 rounded-2xl shadow-xl h-full border-t-8 ${color}`}>
        <div className="flex items-center space-x-3 mb-4">
            <Icon className={`w-8 h-8 ${headerColor}`} />
            <h2 className={`text-2xl font-extrabold ${headerColor}`}>{category}</h2>
        </div>
        <p className={`text-sm font-medium mb-6 ${headerColor}`}>{tagline}</p>
        
        <div className="space-y-4">
            {items.map((item, index) => (
                <ServiceCard 
                    key={index} 
                    name={item.name} 
                    description={item.description} 
                    icon={item.icon}
                    color={color}
                    price={item.price}
                />
            ))}
        </div>
    </div>
);


// --- SERVICES PAGE COMPONENT ---
const ServicesPage = ({ searchFilters, setSelectedListing }) => {
    const [services, setServices] = useState([]);
    const [recommendedServices, setRecommendedServices] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [hasSuccessfulBookings, setHasSuccessfulBookings] = useState(false);

    useEffect(() => {
        loadServices();
        loadFavorites();
        loadRecommendedServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        // Load listings with category 'service'
        const result = await getActiveListings({ limit: 50, category: 'service' });
        if (result.success) {
            setServices(result.data);
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

    const loadRecommendedServices = async () => {
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
                            console.log('Found province from booking:', provinceTrimmed, 'for service:', listingResult.data.title);
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

            // Get all service listings (no limit to ensure we get all matching listings)
            const allListingsResult = await getActiveListings({ category: 'service' });
            if (!allListingsResult.success) {
                console.error('Failed to load services');
                return;
            }

            console.log('Total service listings loaded:', allListingsResult.data.length);

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
                    console.log('✅ Matched service:', listing.title, 'province:', listingProvince, 'normalized:', normalizedProvince);
                }
                return matches;
            });

            console.log('Services matching provinces:', recommended.length);
            console.log('Sample matched services:', recommended.slice(0, 3).map(s => ({ title: s.title, province: s.province || s.location?.province })));

            // Exclude listings that user already booked
            const bookedListingIds = new Set(successfulBookings.map(b => b.listingId));
            const filteredRecommended = recommended.filter(listing => 
                !bookedListingIds.has(listing.id)
            );

            console.log('Recommended services (after excluding booked):', filteredRecommended.length, 'for provinces:', Array.from(provinces));
            setRecommendedServices(filteredRecommended);
        } catch (error) {
            console.error('Error loading recommended services:', error);
        }
    };

    const handleToggleFavorite = async (service) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to save favorites');
            return;
        }
        
        const listingSnapshot = {
            title: service.title,
            coverImage: service.coverImage || service.images?.[0],
            pricePerNight: service.pricePerNight,
            location: service.location?.city ? `${service.location.city}, ${service.location.province}` : '',
            rating: service.stats?.rating || 0
        };
        
        const result = await toggleFavorite(user.uid, service.id, listingSnapshot);
        if (result.success) {
            loadFavorites();
        }
    };

    // Filter services based on search criteria - Works with individual filters
    const filteredServices = services.filter(listing => {
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
                <CategoryHero 
                    category="service"
                    title="Service Listings"
                    subtitle="Tailored services for every traveler"
                />

                {/* Services Grid */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading services...</p>
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
                            
                            return hasSuccessfulBookings && recommendedServices.length > 0 && !hasActiveFilters;
                        })() && (
                            <div className="mb-8">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        Suggestions & Recommendations
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {recommendedServices.length} {recommendedServices.length === 1 ? 'service' : 'services'} found
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 gap-y-6 sm:gap-y-8 md:gap-y-10 mb-8">
                                    {recommendedServices.map((service) => (
                                        <ListingCard 
                                            key={service.id} 
                                            stay={service}
                                            onCardClick={(listing) => setSelectedListing && setSelectedListing(listing.id)}
                                            isFavorite={favoriteIds.has(service.id)}
                                            onToggleFavorite={handleToggleFavorite}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Service Listings Section */}
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Service Listings</h3>
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
                                    const displayServices = hasActiveFilters ? filteredServices : services;
                                    return `${displayServices.length} ${displayServices.length === 1 ? 'service' : 'services'} found`;
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
                            
                            // If filters are active, show filtered services, otherwise show all services
                            const displayServices = hasActiveFilters ? filteredServices : services;
                            
                            if (displayServices.length === 0) {
                                return (
                                    <div className="text-center py-20">
                                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 text-xl mb-2">No listing found</p>
                                        <p className="text-sm text-gray-500">Try adjusting your search filter or check back later for new listings</p>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 gap-y-6 sm:gap-y-8 md:gap-y-10 pb-12 md:pb-16">
                                    {displayServices.map((service) => (
                                        <ListingCard 
                                            key={service.id} 
                                            stay={service}
                                            onCardClick={(listing) => setSelectedListing && setSelectedListing(listing.id)}
                                            isFavorite={favoriteIds.has(service.id)}
                                            onToggleFavorite={handleToggleFavorite}
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
};


// --- Dashboard Content Components ---
const ListingCard = ({ stay, onCardClick, isFavorite, onToggleFavorite }) => {
    // Determine price display based on category
    const getPriceDisplay = () => {
        if (stay.category === 'home') {
            return `₱${(stay.pricePerNight || stay.price || 0).toLocaleString()} per night`;
        } else if (stay.category === 'experience') {
            return `₱${(stay.pricePerPerson || 0).toLocaleString()} per person`;
        } else if (stay.category === 'service') {
            return `₱${(stay.serviceRate || 0).toLocaleString()}`;
        }
        return `₱${(stay.pricePerNight || stay.price || 0).toLocaleString()}`;
    };
    
    return (
        <div className="group cursor-pointer" onClick={() => onCardClick(stay)}>
            <div className="relative mb-3">
                {/* Image Section */}
                <img 
                    src={stay.coverImage || stay.images?.[0] || stay.image || 'https://placehold.co/600x400/0D9488/FFFFFF?text=No+Image'} 
                    alt={stay.title} 
                    className="w-full aspect-[4/3] object-cover rounded-xl transform group-hover:opacity-95 transition duration-300" 
                />
                
                {/* Share and Favorite Icons */}
                <div className="absolute top-3 right-3 z-10 flex items-center space-x-2">
                    <ShareButton listing={stay} />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(stay);
                        }}
                        data-testid={`favorite-button-${stay.id}`}
                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 cursor-pointer"
                        type="button"
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <HeartIcon isFavorite={isFavorite} />
                    </button>
                </div>

                {/* Category Badge */}
                {stay.category && (
                    <span className="absolute top-3 left-3 bg-white text-xs font-semibold px-2 py-1 rounded-full shadow-md capitalize">
                        {stay.category}
                    </span>
                )}
            </div>

            {/* Content Section */}
            <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                    {/* Title and Location */}
                    <div className="leading-tight flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-1">
                            {stay.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                            {stay.location?.city ? `${stay.location.city}, ${stay.location.province}` : stay.location?.locationName || 'Location not specified'}
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <StarIcon className="w-4 h-4 text-gray-800" />
                        <span className="text-sm text-gray-800 font-medium">
                            {stay.stats?.rating || stay.rating || 'New'}
                        </span>
                    </div>
                </div>

                {/* Price Line */}
                <p className="mt-1 pt-1 text-sm">
                    <span className="font-semibold text-gray-900">
                        {getPriceDisplay()}
                    </span>
                </p>
            </div>
        </div>
    );
};

const ListingDetailModal = ({ stay, onClose }) => {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);

    if (!stay) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative grid grid-cols-1 lg:grid-cols-3">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-30 bg-white/70 rounded-full p-2">
                    <CloseIcon />
                </button>
                
                {/* Left Side: Details (Col-span-2 on large screens) */}
                <div className="lg:col-span-2 p-6 space-y-8">
                    
                    {/* 1. PHOTOS (Gallery) */}
                    <section className="relative">
                        <h2 className="text-3xl font-bold mb-4">{stay.title}</h2>
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden">
                            <img src={stay.image} alt={stay.title} className="col-span-2 row-span-2 object-cover h-full min-h-[300px]" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Kitchen" alt="gallery" className="rounded-lg object-cover h-full w-full" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Bedroom" alt="gallery" className="rounded-lg object-cover h-full w-full" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Exterior" alt="gallery" className="rounded-lg object-cover h-full w-full" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Bathroom" alt="gallery" className="rounded-lg object-cover h-full w-full" />
                        </div>
                    </section>
                    
                    {/* 2. AMENITIES */}
                    <section>
                        <h3 className="text-xl font-semibold mb-3 border-b pb-2">What this place offers</h3>
                        <div className="flex flex-wrap gap-4">
                            {stay.amenities.map((item) => (
                                <span key={item} className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
                                    <Zap className="w-4 h-4 text-teal-600"/>
                                    <span className="font-medium">{item}</span>
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* 3. REVIEWS */}
                    <section>
                        <div className="flex items-center space-x-3 mb-4">
                            <StarIcon className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-xl font-semibold">
                                {stay.rating} out of 5 stars ({stay.reviews.length} Reviews)
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stay.reviews.map((review, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <div className="flex items-center mb-2">
                                        <p className="font-bold text-sm">{review.user}</p>
                                        <div className="flex ml-4">
                                            {[...Array(review.rating)].map((_, i) => (<StarIcon key={i} className="w-4 h-4 text-yellow-500" />))}
                                            {[...Array(5 - review.rating)].map((_, i) => (<StarIcon key={i} className="w-4 h-4 text-gray-300" />))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    {/* 4. LOCATION (Map Placeholder) */}
                    <section>
                        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Where you'll be</h3>
                        <p className="text-gray-600 mb-4">{stay.location}</p>
                        
                        {/* Map Placeholder */}
                        <div className="bg-gray-200 h-64 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                            <p className="text-gray-500 text-lg font-medium">Map View Placeholder</p>
                        </div>
                    </section>

                </div>
                
                {/* Right Side: Booking Widget (Col-span-1 on large screens) */}
                <div className="lg:col-span-1 p-6 bg-gray-50 border-l sticky top-0 h-full">
                    <div className="sticky top-6 p-4 bg-white rounded-xl shadow-2xl border border-gray-200">
                        <div className="mb-4 flex justify-between items-baseline">
                            {/* Adjusted price display to use PHP currency symbol (₱) based on mock data names */}
                            <p className="text-3xl font-extrabold text-gray-900">₱{stay.price * 55}<span className="text-lg font-normal text-gray-500"> / night</span></p>
                            <div className="flex items-center text-sm text-gray-600">
                                <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                                {stay.rating} ({stay.reviews.length} reviews)
                            </div>
                        </div>

                        {/* 5. CALENDAR AVAILABILITY / Booking Form */}
                        <div className="border border-gray-300 rounded-xl mb-4 divide-y divide-gray-300">
                            {/* Dates */}
                            <div className="flex">
                                <label className="flex-1 p-3 cursor-pointer hover:bg-gray-100 rounded-tl-xl">
                                    <p className="text-xs font-bold text-gray-800">CHECK-IN</p>
                                    <input 
                                        type="date" 
                                        value={checkIn} 
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        className="w-full text-sm text-gray-700 bg-transparent border-none focus:ring-0" 
                                    />
                                </label>
                                <label className="flex-1 p-3 cursor-pointer hover:bg-gray-100 rounded-tr-xl border-l border-gray-300">
                                    <p className="text-xs font-bold text-gray-800">CHECK-OUT</p>
                                    <input 
                                        type="date" 
                                        value={checkOut} 
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        className="w-full text-sm text-gray-700 bg-transparent border-none focus:ring-0" 
                                    />
                                </label>
                            </div>
                            
                            {/* Guests */}
                            <label className="block p-3 hover:bg-gray-100 rounded-b-xl">
                                <p className="text-xs font-bold text-gray-800">GUESTS</p>
                                <select 
                                    value={guests} 
                                    onChange={(e) => setGuests(e.target.value)}
                                    className="w-full text-sm text-gray-700 bg-transparent border-none focus:ring-0 appearance-none pr-8"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>)}
                                </select>
                            </label>
                        </div>

                        <button 
                            className="w-full bg-teal-500 text-white font-bold py-3 rounded-xl hover:bg-teal-600 transition duration-150 shadow-md transform hover:scale-[1.01]"
                            onClick={() => console.log("Booking attempt for", stay.title)}
                        >
                            Reserve
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-2">You won't be charged yet</p>

                        {/* Price Details Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>₱{stay.price * 55} x 5 nights (mock)</span>
                                <span>₱{stay.price * 55 * 5}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Service fee</span>
                                <span>₱1,925 (mock)</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                                <span>Total before taxes</span>
                                <span>₱{stay.price * 55 * 5 + 1925}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardContent = ({ setSelectedListing, searchFilters }) => {
    const [listings, setListings] = useState([]);
    const [recommendedListings, setRecommendedListings] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [hasSuccessfulBookings, setHasSuccessfulBookings] = useState(false);
    
    useEffect(() => {
        loadListings();
        loadFavorites();
        loadRecommendedListings();
    }, []);
    
    const loadListings = async () => {
        setIsLoading(true);
        // Load only 'home' category listings for the Home page
        const result = await getActiveListings({ limit: 50, category: 'home' });
        if (result.success) {
            setListings(result.data);
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

    const loadRecommendedListings = async () => {
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
                            console.log('Found province from booking:', provinceTrimmed, 'for listing:', listingResult.data.title);
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

            // Get all home listings (no limit to ensure we get all matching listings)
            const allListingsResult = await getActiveListings({ category: 'home' });
            if (!allListingsResult.success) {
                console.error('Failed to load listings');
                return;
            }

            console.log('Total home listings loaded:', allListingsResult.data.length);
            console.log('All loaded listings:', allListingsResult.data.map(l => ({ 
                title: l.title, 
                province: l.province || l.location?.province || 'NO PROVINCE',
                hasProvince: !!l.province,
                hasLocationProvince: !!l.location?.province
            })));

            // Filter listings by provinces from bookings - match ANY province (case-insensitive)
            // Check both location.province and top-level province field
            const recommended = [];
            const notMatched = [];
            
            allListingsResult.data.forEach(listing => {
                // Check both top-level province and location.province
                const listingProvince = listing.province || listing.location?.province;
                if (!listingProvince) {
                    notMatched.push({ title: listing.title, reason: 'No province field found' });
                    return;
                }
                const normalizedProvince = listingProvince.toLowerCase().trim();
                
                // Check if listing province matches any of the booking provinces
                // Also check for partial matches (e.g., "Cavite" matches "Cavite Province")
                let matches = false;
                for (const bookingProvince of provinces) {
                    // Exact match
                    if (normalizedProvince === bookingProvince) {
                        matches = true;
                        break;
                    }
                    // Partial match - check if one contains the other
                    if (normalizedProvince.includes(bookingProvince) || bookingProvince.includes(normalizedProvince)) {
                        matches = true;
                        break;
                    }
                }
                
                if (matches) {
                    console.log('✅ Matched listing:', listing.title, 'province:', listingProvince, 'normalized:', normalizedProvince);
                    recommended.push(listing);
                } else {
                    notMatched.push({ 
                        title: listing.title, 
                        province: listingProvince, 
                        normalized: normalizedProvince,
                        reason: `Province "${normalizedProvince}" not in booking provinces: ${Array.from(provinces).join(', ')}`
                    });
                }
            });

            console.log('Listings matching provinces:', recommended.length);
            console.log('Matched listings:', recommended.map(l => ({ title: l.title, province: l.province || l.location?.province })));
            if (notMatched.length > 0) {
                console.log('Listings NOT matched:', notMatched);
            }

            // Exclude listings that user already booked
            const bookedListingIds = new Set(successfulBookings.map(b => b.listingId));
            const filteredRecommended = recommended.filter(listing => 
                !bookedListingIds.has(listing.id)
            );

            console.log('Recommended listings (after excluding booked):', filteredRecommended.length, 'for provinces:', Array.from(provinces));
            setRecommendedListings(filteredRecommended);
        } catch (error) {
            console.error('Error loading recommended listings:', error);
        }
    };
    
    const handleToggleFavorite = async (listing) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to save favorites');
            return;
        }
        
        const listingSnapshot = {
            title: listing.title,
            coverImage: listing.coverImage || listing.images?.[0],
            pricePerNight: listing.pricePerNight,
            location: listing.location?.city ? `${listing.location.city}, ${listing.location.province}` : '',
            rating: listing.stats?.rating || 0
        };
        
        const result = await toggleFavorite(user.uid, listing.id, listingSnapshot);
        if (result.success) {
            // Refresh favorites
            loadFavorites();
        }
    };
    
    // Filter listings based on search criteria - Works with individual filters
    const filteredListings = listings.filter(listing => {
        // Filter by location (Where) - Enhanced matching with locationName, city, province
        if (searchFilters.where && searchFilters.where.trim() !== '') {
            const searchLower = searchFilters.where.toLowerCase().trim();
            const locationName = (listing.location?.locationName || '').toLowerCase().trim();
            const city = (listing.location?.city || '').toLowerCase().trim();
            const province = (listing.location?.province || '').toLowerCase().trim();
            const fullLocation = city && province ? `${city}, ${province}` : '';
            
            // Match if search contains or equals: locationName, city name, province name, or full location
            const matchesLocationName = locationName && locationName.includes(searchLower);
            const matchesCity = city && city.includes(searchLower);
            const matchesProvince = province && province.includes(searchLower);
            const matchesFullLocation = fullLocation && fullLocation.includes(searchLower);
            
            if (!matchesLocationName && !matchesCity && !matchesProvince && !matchesFullLocation) return false;
        }
        
        // Filter by number of guests (Who) - Only if specified
        if (searchFilters.guests && searchFilters.guests > 0) {
            if (!listing.guests || listing.guests < searchFilters.guests) return false;
        }
        
        // Filter by date range (check-in to check-out) - Check all dates in range are available
        if (searchFilters.checkIn && searchFilters.checkIn.trim() !== '' && 
            searchFilters.checkOut && searchFilters.checkOut.trim() !== '') {
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
                // Check blocked dates
                if (listing.blockedDates && listing.blockedDates.includes(dateStr)) {
                    return false;
                }
                // Check booked dates
                if (listing.bookedDates && listing.bookedDates.includes(dateStr)) {
                    return false;
                }
                // If availableDates is specified, check if date is in the list
                if (listing.availableDates && listing.availableDates.length > 0) {
                    if (!listing.availableDates.includes(dateStr)) {
                        return false;
                    }
                }
            }
        } else if (searchFilters.checkIn && searchFilters.checkIn.trim() !== '') {
            // Fallback: Only check-in date specified (backward compatibility)
            if (listing.blockedDates && listing.blockedDates.includes(searchFilters.checkIn)) {
                return false;
            }
            if (listing.bookedDates && listing.bookedDates.includes(searchFilters.checkIn)) {
                return false;
            }
            if (listing.availableDates && listing.availableDates.length > 0) {
                if (!listing.availableDates.includes(searchFilters.checkIn)) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans pt-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Banner */}
                <CategoryHero 
                    category="home"
                    title="Home Listings"
                    subtitle="Find your perfect home away from home"
                />

            {isLoading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading listings...</p>
                </div>
            ) : (
                <>
                    {/* Suggestions & Recommendations Section - Only show if user has successful bookings AND no active filters */}
                    {(() => {
                        // Check if any filters are active
                        const hasActiveFilters = (
                            (searchFilters.where && searchFilters.where.trim() !== '') ||
                            (searchFilters.checkIn && searchFilters.checkIn.trim() !== '') ||
                            (searchFilters.checkOut && searchFilters.checkOut.trim() !== '') ||
                            (searchFilters.guests && searchFilters.guests > 1)
                        );
                        
                        return hasSuccessfulBookings && recommendedListings.length > 0 && !hasActiveFilters;
                    })() && (
                        <div className="mb-8">
                            <div className="mb-4">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    Suggestions & Recommendations
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {recommendedListings.length} {recommendedListings.length === 1 ? 'listing' : 'listings'} found
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 gap-y-6 sm:gap-y-8 md:gap-y-10 mb-8">
                                {recommendedListings.map((stay) => (
                                    <ListingCard 
                                        key={stay.id} 
                                        stay={stay} 
                                        onCardClick={(listing) => setSelectedListing(listing.id)}
                                        isFavorite={favoriteIds.has(stay.id)}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Home Listings Section */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Home Listings</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {(() => {
                                // Check if any filters are active
                                const hasActiveFilters = (
                                    (searchFilters.where && searchFilters.where.trim() !== '') ||
                                    (searchFilters.checkIn && searchFilters.checkIn.trim() !== '') ||
                                    (searchFilters.checkOut && searchFilters.checkOut.trim() !== '') ||
                                    (searchFilters.guests && searchFilters.guests > 1)
                                );
                                
                                // If filters are active, show filtered count, otherwise show all listings
                                const displayListings = hasActiveFilters ? filteredListings : listings;
                                return `${displayListings.length} ${displayListings.length === 1 ? 'listing' : 'listings'} found`;
                            })()}
                        </p>
                    </div>

                    {(() => {
                        // Check if any filters are active
                        const hasActiveFilters = (
                            (searchFilters.where && searchFilters.where.trim() !== '') ||
                            (searchFilters.checkIn && searchFilters.checkIn.trim() !== '') ||
                            (searchFilters.checkOut && searchFilters.checkOut.trim() !== '') ||
                            (searchFilters.guests && searchFilters.guests > 1)
                        );
                        
                        // If filters are active, show filtered listings, otherwise show all listings
                        const displayListings = hasActiveFilters ? filteredListings : listings;
                        
                        if (displayListings.length === 0) {
                            return (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 mb-2">No listing found</p>
                                    <p className="text-sm text-gray-500">Try adjusting your search filter or check back later for new listings</p>
                                </div>
                            );
                        }
                        
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 gap-y-6 sm:gap-y-8 md:gap-y-10 pb-12 md:pb-16">
                                {displayListings.map((stay) => (
                                    <ListingCard 
                                        key={stay.id} 
                                        stay={stay} 
                                        onCardClick={(listing) => setSelectedListing(listing.id)}
                                        isFavorite={favoriteIds.has(stay.id)}
                                        onToggleFavorite={handleToggleFavorite}
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
};


// --- Main Application Component (Handles Routing/Page Display) ---
// ⚠️ NOTE: This function is the GuestDashboard.jsx component itself in a React Router setup, 
// but based on your file name, it seems to be acting as the main App/Dashboard.
export default function GuestDashboard() {
    // State to handle which content component is currently displayed
    const [currentPage, setCurrentPage] = useState("Home");
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [searchFilters, setSearchFilters] = useState({
        where: '',
        checkIn: '',
        checkOut: '',
        guests: 1
    });
    const [pendingThreadId, setPendingThreadId] = useState(null);

    // Listen for navigation to Bookings page (e.g., after successful booking)
    useEffect(() => {
        const handleNavigateToBookings = () => {
            setCurrentPage("Bookings");
        };

        window.addEventListener('navigateToBookings', handleNavigateToBookings);
        
        return () => {
            window.removeEventListener('navigateToBookings', handleNavigateToBookings);
        };
    }, []);

    // Listen for navigation to Messages page (e.g., when clicking Contact Host)
    useEffect(() => {
        const handleNavigateToMessages = (event) => {
            const threadId = event.detail?.threadId || null;
            if (threadId) {
                setPendingThreadId(threadId);
            }
            setCurrentPage("Messages");
        };

        window.addEventListener('navigateToMessages', handleNavigateToMessages);
        
        return () => {
            window.removeEventListener('navigateToMessages', handleNavigateToMessages);
        };
    }, []);

    // Conditional rendering based on currentPage state
    const renderContent = () => {
        switch (currentPage) {
            case "Services":
                return <ServicesPage searchFilters={searchFilters} setSelectedListing={setSelectedListingId} />;
            case "Experiences":
                return <ExperiencesPage searchFilters={searchFilters} setSelectedListing={setSelectedListingId} />;
            case "Wishlist":
                return <Wishlist />;
            case "Favorites":
                return <Favorites setPage={setCurrentPage} />;
            case "Profile":
                return <Profile setPage={setCurrentPage} />;
            case "AccountSettings":
                return <AccountSettings setPage={setCurrentPage} />;
            case "Trips":
                return <Trips setPage={setCurrentPage} />;
            case "Bookings":
                return <Bookings />;
            case "Messages":
                return <Messages setPage={setCurrentPage} initialThreadId={pendingThreadId} onThreadDisplayed={() => setPendingThreadId(null)} />;
            case "Wallet":
                return <Wallet setPage={setCurrentPage} />;
            case "Home":
            default:
                return <DashboardContent setSelectedListing={setSelectedListingId} searchFilters={searchFilters} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <Header 
                currentPage={currentPage} 
                setPage={setCurrentPage} 
                userRole="guest" 
            />
            
            {/* Navigation and Filter Search - Only show on Home, Experiences, Services pages */}
            {(currentPage === "Home" || currentPage === "Experiences" || currentPage === "Services") && (
                <div className="bg-gradient-to-b from-teal-50 to-white">
                    <NavigationAndFilter 
                        currentPage={currentPage}
                        setPage={setCurrentPage}
                        searchFilters={searchFilters}
                        setSearchFilters={setSearchFilters}
                    />
                </div>
            )}
            
            {renderContent()}

            {/* Listing Detail View Modal */}
            {selectedListingId && (
                <ListingDetailView 
                    listingId={selectedListingId} 
                    onClose={() => setSelectedListingId(null)}
                    isGuestView={true}
                    showTopNav={false}
                />
            )}

            {/* Enhanced Footer - Responsive */}
            <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white mt-12 md:mt-16">
                <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                        {/* About Section */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">About BiyaHele</h3>
                            <p className="text-teal-100 text-sm leading-relaxed">
                                Your trusted platform for finding the perfect accommodation in the Philippines. 
                                From serene beaches to vibrant cities, we help you find your rest.
                            </p>
                        </div>
                        
                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Careers</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Press</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Blog</a></li>
                            </ul>
                        </div>
                        
                        {/* Support */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Help Center</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Safety Information</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Cancellation Options</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Contact Us</a></li>
                            </ul>
                        </div>
                        
                        {/* Hosting */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Hosting</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-teal-100 hover:text-white transition">List Your Property</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Host Resources</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Community Forum</a></li>
                                <li><a href="#" className="text-teal-100 hover:text-white transition">Hosting Responsibly</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="border-t border-teal-500 pt-6 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-teal-100 text-sm mb-4 md:mb-0">
                            &copy; 2025 BiyaHele. All rights reserved. Find your rest.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-teal-100 hover:text-white transition">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );  
}