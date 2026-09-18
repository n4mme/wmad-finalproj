import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import ExperiencesPage from './ExperiencesPage';
import ListingDetailView from './ListingDetailView';
import CategoryHero from './CategoryHero';
import NavigationAndFilter from './NavigationAndFilter';
import { User as LucideUser, Globe, Briefcase, Gem, Utensils, MessageCircle, Monitor, Coffee, Car, Plane, Gift, Zap, Search as LucideSearch } from "lucide-react";
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';

// Firebase imports
import { getActiveListings } from '../utils/firestoreUtils';


// --- MOCK API DATA (PHP Rates) ---

// Mock Data for the Services Page
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


// --- SVG Icons ---
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


// --- Landing Page Header Component (Simplified - No Navigation/Filter) ---
export const LandingHeader = () => {
    const navigate = useNavigate();

    const handleAuthNavigation = (view) => {
        navigate('/auth', { state: { defaultView: view } });
    }

    return (
        <header className="bg-white sticky top-0 z-50 w-full border-b border-gray-200">
            <div className="container mx-auto px-4 flex justify-between items-center py-2">
                {/* Logo */}
                <h1 className="flex items-center min-w-[100px] cursor-pointer" onClick={() => window.location.href = '/'}>
                    <img
                        src={BiyaHeleCombinedLogo}
                        alt="BiyaHele Logo"
                        className="h-10 sm:h-12 md:h-14 w-auto" 
                    />
                </h1>

                {/* --- RIGHT SIDE: Auth Buttons --- */}
                <div className="flex items-center space-x-4 min-w-[200px] justify-end">
                    <button 
                        onClick={() => handleAuthNavigation('login')}
                        className="text-gray-700 hover:text-teal-500 font-medium whitespace-nowrap transition-colors"
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => handleAuthNavigation('signup')}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </header>
    );
};


// --- Service Card Components ---
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
const ServicesPage = ({ searchFilters, onListingClick, onShowSignInPrompt }) => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setIsLoading(true);
        const result = await getActiveListings({ limit: 50, category: 'service' });
        if (result.success) {
            setServices(result.data);
        }
        setIsLoading(false);
    };

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
        
        // Filter by check-in date - Only if specified
        if (searchFilters?.checkIn && searchFilters.checkIn.trim() !== '') {
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
                <div id="hero-services">
                    <CategoryHero 
                        category="service"
                        title="Service Listings"
                        subtitle="Tailored services for every traveler"
                    />
                </div>

                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Service Listings</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading services...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-20">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-xl mb-2">No listing found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search filter or check back later for new listings</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-16">
                        {filteredServices.map((service) => (
                            <ListingCard 
                                key={service.id} 
                                stay={service}
                                onCardClick={(listing) => onListingClick && onListingClick(listing.id)}
                                onToggleFavorite={() => onShowSignInPrompt && onShowSignInPrompt()}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Sign In Prompt Panel ---
const SignInPromptPanel = ({ onClose, onSignIn, onCreateAccount, isReservation = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
                    {isReservation ? (
                        <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                        </svg>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h3>
                <p className="text-gray-600">
                    {isReservation 
                        ? "Create an account or sign in to complete your reservation and manage your bookings"
                        : "Save your favorite properties and access them anytime"}
                </p>
            </div>
            
            <div className="space-y-3">
                <button
                    onClick={onSignIn}
                    className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-500 hover:to-blue-600 transform hover:scale-105 transition-all"
                >
                    Sign In
                </button>
                <button
                    onClick={onCreateAccount}
                    className="w-full border-2 border-teal-500 text-teal-500 font-bold py-3 px-4 rounded-lg hover:bg-teal-50 transition-all"
                >
                    Create Account
                </button>
            </div>
            
            <button
                onClick={onClose}
                className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
                Maybe later
            </button>
        </div>
    </div>
);


// --- Dashboard Content Components ---
const ListingCard = ({ stay, onCardClick, onToggleFavorite }) => {
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
                        className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 cursor-pointer"
                        type="button"
                        aria-label="Add to favorites"
                    >
                        <HeartIcon isFavorite={false} />
                    </button>
                </div>

                {/* Category Badge */}
                {stay.category && (
                    <span className="absolute top-3 left-3 bg-white text-xs font-semibold px-2 py-1 rounded-full shadow-md capitalize">
                        {stay.category}
                    </span>
                )}
            </div>

            {/* Content Section - Responsive padding */}
            <div className="p-3 sm:p-4 space-y-1">
                <div className="flex justify-between items-start gap-2">
                    {/* Title and Location */}
                    <div className="leading-tight flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-1">
                            {stay.title}
                        </h3>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-1">
                            {stay.location?.city ? `${stay.location.city}, ${stay.location.province}` : stay.location?.locationName || 'Location not specified'}
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-800" />
                        <span className="text-xs sm:text-sm text-gray-800 font-medium">
                            {stay.stats?.rating || stay.rating || 'New'}
                        </span>
                    </div>
                </div>

                {/* Price Line - Category-specific pricing */}
                <p className="mt-1 pt-1 text-xs sm:text-sm">
                    <span className="font-semibold text-gray-900">
                        ₱{(stay.category === 'home' ? stay.pricePerNight : 
                           stay.category === 'experience' ? stay.pricePerPerson : 
                           stay.category === 'service' ? stay.serviceRate : 
                           stay.pricePerNight || stay.price || 0)?.toLocaleString()}
                    </span> 
                    <span className="text-gray-500">
                        {stay.category === 'home' ? ' per night' : 
                         stay.category === 'experience' ? ' per person' : 
                         stay.category === 'service' ? ' service rate' : 
                         ' per night'}
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-y-auto relative grid grid-cols-1 lg:grid-cols-3">
                
                {/* Close Button - Mobile friendly */}
                <button onClick={onClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-500 hover:text-gray-800 z-30 bg-white/90 sm:bg-white/70 rounded-full p-2 shadow-lg">
                    <CloseIcon />
                </button>
                
                {/* Left Side: Details - Responsive padding */}
                <div className="lg:col-span-2 p-4 sm:p-6 space-y-6 sm:space-y-8">
                    
                    {/* PHOTOS - Responsive */}
                    <section className="relative">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{stay.title}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl overflow-hidden">
                            <img src={stay.image || stay.coverImage || stay.images?.[0]} alt={stay.title} className="col-span-2 row-span-2 object-cover h-full min-h-[200px] sm:min-h-[300px]" loading="lazy" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Kitchen" alt="gallery" className="rounded-lg object-cover h-full w-full" loading="lazy" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Bedroom" alt="gallery" className="rounded-lg object-cover h-full w-full" loading="lazy" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Exterior" alt="gallery" className="rounded-lg object-cover h-full w-full" loading="lazy" />
                            <img src="https://placehold.co/400x300/CCCCCC/666666?text=Bathroom" alt="gallery" className="rounded-lg object-cover h-full w-full" loading="lazy" />
                        </div>
                    </section>
                    
                    {/* AMENITIES - Responsive */}
                    <section>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 border-b pb-2">What this place offers</h3>
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                            {stay.amenities && stay.amenities.map((item) => (
                                <span key={item} className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm">
                                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600"/>
                                    <span className="font-medium">{item}</span>
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* REVIEWS */}
                    {stay.reviews && stay.reviews.length > 0 && (
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
                    )}
                    
                    {/* LOCATION */}
                    <section>
                        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Where you'll be</h3>
                        <p className="text-gray-600 mb-4">
                            {stay.location?.city ? `${stay.location.city}, ${stay.location.province}` : stay.location?.locationName || 'Location not specified'}
                        </p>
                        
                        {/* Map Placeholder */}
                        <div className="bg-gray-200 h-64 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                            <p className="text-gray-500 text-lg font-medium">Map View Placeholder</p>
                        </div>
                    </section>

                </div>
                
                {/* Right Side: Booking Widget - Responsive */}
                <div className="lg:col-span-1 p-4 sm:p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l sticky bottom-0 lg:top-0 h-auto lg:h-full">
                    <div className="lg:sticky lg:top-6 p-3 sm:p-4 bg-white rounded-xl shadow-2xl border border-gray-200">
                        <div className="mb-3 sm:mb-4 flex justify-between items-baseline">
                            <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                                ₱{(stay.pricePerNight || stay.price)?.toLocaleString()}
                                <span className="text-sm sm:text-base lg:text-lg font-normal text-gray-500"> / night</span>
                            </p>
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mr-1" />
                                {stay.stats?.rating || stay.rating || 'New'}
                            </div>
                        </div>

                        {/* Booking Form */}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardContent = ({ setSelectedStay, searchFilters, onShowSignInPrompt, setSelectedListingId }) => {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        loadListings();
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
    
    const handleToggleFavorite = (listing) => {
        // Show sign-in prompt for unauthenticated users
        onShowSignInPrompt();
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
        <div className="min-h-screen bg-gray-50 font-sans pt-20 sm:pt-24 md:pt-28 lg:pt-32">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Hero Banner */}
                <div id="hero-home">
                    <CategoryHero 
                        category="home"
                        title="Home Listings"
                        subtitle="Find your perfect home away from home"
                    />
                </div>

                <div className="mb-4 md:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Home Listings</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
                    </p>
                </div>
            
            {isLoading ? (
                <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 text-sm sm:text-base">Loading listings...</p>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">No listing found</p>
                    <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search filter or check back later for new listings</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 pb-12 md:pb-16">
                    {filteredListings.map((stay) => (
                        <ListingCard 
                            key={stay.id} 
                            stay={stay} 
                            onCardClick={(listing) => setSelectedListingId(listing.id)}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}
            </div>
        </div>
    );
};


// --- Main Viewing Page Component (formerly LandingPage) ---
export default function ViewingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    const [currentPage, setCurrentPage] = useState(state.category || "Home");
    const [selectedStay, setSelectedStay] = useState(null);
    const [searchFilters, setSearchFilters] = useState({
        where: '',
        checkIn: '',
        guests: 1
    });
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [showReservationPrompt, setShowReservationPrompt] = useState(false);
    
    // Scroll to hero section when navigating from landing page
    useEffect(() => {
        if (state.scrollToHero && state.category) {
            // Wait for page to render, then scroll to hero section
            setTimeout(() => {
                // Map category names to hero IDs
                const categoryMap = {
                    'Home': 'hero-home',
                    'Experiences': 'hero-experiences',
                    'Services': 'hero-services'
                };
                const heroId = categoryMap[state.category] || `hero-${state.category.toLowerCase()}`;
                const heroElement = document.getElementById(heroId);
                if (heroElement) {
                    heroElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500); // Increased delay to ensure page is fully rendered
        }
    }, [state.scrollToHero, state.category]);

    const handleSignIn = () => {
        setShowSignInPrompt(false);
        setShowReservationPrompt(false);
        navigate('/auth', { state: { defaultView: 'login' } });
    };

    const handleCreateAccount = () => {
        setShowSignInPrompt(false);
        setShowReservationPrompt(false);
        navigate('/auth', { state: { defaultView: 'signup' } });
    };

    // Conditional rendering based on currentPage state
    const renderContent = () => {
        switch (currentPage) {
            case "Services":
                return <ServicesPage 
                    searchFilters={searchFilters} 
                    onListingClick={setSelectedListingId}
                    onShowSignInPrompt={() => setShowSignInPrompt(true)}
                />;
            case "Experiences":
                return <ExperiencesPage searchFilters={searchFilters} />;
            case "Home":
            default:
                return <DashboardContent 
                    setSelectedStay={setSelectedStay} 
                    searchFilters={searchFilters}
                    onShowSignInPrompt={() => setShowSignInPrompt(true)}
                    setSelectedListingId={setSelectedListingId}
                />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <LandingHeader />
            
            {/* Navigation and Filter Search */}
            <div className="bg-gradient-to-b from-teal-50 to-white">
                <NavigationAndFilter 
                currentPage={currentPage} 
                setPage={setCurrentPage}
                searchFilters={searchFilters}
                setSearchFilters={setSearchFilters}
            />
            </div>
            
            {renderContent()}

            {/* Enhanced Footer */}
            <footer className="bg-gradient-to-r from-teal-600 to-teal-700 text-white mt-16">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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

            {selectedStay && <ListingDetailModal stay={selectedStay} onClose={() => setSelectedStay(null)} />}
            {/* Listing Detail View */}
            {selectedListingId && (
                <ListingDetailView 
                    listingId={selectedListingId}
                    onClose={() => setSelectedListingId(null)}
                    isGuestView={false}
                    onReserveClick={() => {
                        setShowReservationPrompt(true);
                    }}
                    showTopNav={false}
                />
            )}
            
            {/* Reservation Sign-In Prompt */}
            {showReservationPrompt && (
                <SignInPromptPanel
                    onClose={() => setShowReservationPrompt(false)}
                    onSignIn={handleSignIn}
                    onCreateAccount={handleCreateAccount}
                    isReservation={true}
                />
            )}
            
            {/* Favorite Sign-In Prompt */}
            {showSignInPrompt && (
                <SignInPromptPanel
                    onClose={() => setShowSignInPrompt(false)}
                    onSignIn={handleSignIn}
                    onCreateAccount={handleCreateAccount}
                    isReservation={false}
                />
            )}
        </div>
    );  
}

