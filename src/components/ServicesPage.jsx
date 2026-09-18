import React, { useState, useEffect } from 'react';
import { Globe, Briefcase, Gem, User, Utensils, MessageCircle, Monitor, Coffee, Car, Plane, Gift, Zap, Search, Calendar } from 'lucide-react';
import { auth } from '../firebase';
import { getActiveListings, toggleFavorite, getUserFavorites } from '../utils/firestoreUtils';

// --- Header Subcomponents ---



// --- Service Data (UPDATED TO PHP RATES) ---
const servicesData = [
  {
    category: "For Tourists",
    tagline: "Experiences & Easy Planning",
    icon: Globe,
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
    headerColor: "text-indigo-600",
    items: [
      { name: "Ticket Booking Services", description: "Land tours, museums, and theme parks. Never miss an attraction.", icon: Utensils, price: "Starts at ₱800" }, // Updated from $25
      { name: "Photography / Souvenir Packages", description: "Capture memories with local photographers or custom print bundles.", icon: Zap, price: "Starts at ₱7,500" }, // Updated from $150
      { name: "Custom Itinerary Planning", description: "Mix and match stays, experiences, and local transport logistics.", icon: Car, price: "Custom Quote" },
      { name: "Local Interpreter / Translator", description: "On-call or scheduled language assistance for seamless communication.", icon: MessageCircle, price: "₱800/hr" }, // Updated from $20/hr
    ],
  },
  {
    category: "For Business Travelers",
    tagline: "Productivity & Professional Comfort",
    icon: Briefcase,
    color: "bg-teal-50 border-teal-200 text-teal-800",
    headerColor: "text-teal-600",
    items: [
      { name: "Workspace Setup", description: "Dedicated desk, comfortable chair, and extra monitor upon request.", icon: Monitor, price: "₱750/day" }, // Updated from $15/day
      { name: "Coffee & Office Supply Delivery", description: "Partnered delivery from local cafés and office supply shops.", icon: Coffee, price: "Local Market Price" },
      { name: "Virtual Assistant / Errand Services", description: "Remote help with bookings, scheduling, and local administrative tasks.", icon: User, price: "₱1,200/hr" }, // Updated from $30/hr
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
        { name: "Concierge / Personal Assistant", description: "One-on-one, end-to-end trip planning and execution.", icon: User, price: "₱20,000/day" }, // Updated from $500/day
        { name: "Private Chef / On-demand Dining", description: "Gourmet meals prepared in-room for executives or families.", icon: Utensils, price: "Starts at ₱6,000 (Chef Fee Only)" }, // Updated from $200
        { name: "In-room Massage / Spa", description: "Professional wellness services and relaxation on call.", icon: Zap, price: "₱2,800/session" }, // Updated from $90/session
        { name: "Event / Celebration Setup", description: "Perfect arrangements for birthdays, proposals, or anniversaries.", icon: Gift, price: "Custom Quote" },
    ]
}

// --- Reusable Components ---

// Reusable Card Component with functional CTA
const ServiceCard = ({ name, description, icon: Icon, color, price }) => {
    // State to handle the "booking" functionality simulation
    const [status, setStatus] = useState('Request Service');
    
    const handleRequest = () => {
        setStatus('Requested! We will contact you.');
        console.log(`Service Requested: ${name}`);
        setTimeout(() => setStatus('Request Service'), 3000); // Reset after 3 seconds
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

// Component to render a full category section (Tourist or Business)
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



// --- Service Card Component (for Firestore Listings) ---
const ServiceListingCard = ({ service, isFavorite, onToggleFavorite, onClick }) => {
    const HeartIcon = ({ isFavorite, onClick }) => (
        <svg
            onClick={onClick}
            className={`w-6 h-6 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-110 ${isFavorite ? "text-red-500" : "text-white"} `}
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
            />
        </svg>
    );

    const StarIcon = () => (
        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    return (
        <div className="group cursor-pointer" onClick={() => onClick && onClick(service)}>
            <div className="relative mb-3">
                <img 
                    src={service.coverImage || service.images?.[0] || 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Service'} 
                    alt={service.title} 
                    className="w-full aspect-[4/3] object-cover rounded-xl transform group-hover:opacity-95 transition duration-300" 
                />
                
                <div className="absolute top-3 right-3 z-10">
                    <HeartIcon
                        isFavorite={isFavorite}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(service);
                        }}
                    />
                </div>

                {service.category && (
                    <span className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md capitalize">
                        Service
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <div className="leading-tight flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-1">
                            {service.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                            {service.location?.city ? `${service.location.city}, ${service.location.province}` : service.location?.locationName || 'Location not specified'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <StarIcon />
                        <span className="text-sm text-gray-800 font-medium">
                            {service.stats?.rating || service.rating || 'New'}
                        </span>
                    </div>
                </div>

                <p className="mt-1 pt-1 text-sm">
                    <span className="font-semibold text-gray-900">
                        ₱{(service.serviceRate || service.pricePerNight || service.price || 0).toLocaleString()}
                    </span> 
                    <span className="text-gray-500"> per service</span>
                </p>
            </div>
        </div>
    );
};

// Main Application Component
const App = ({ searchFilters, setSelectedListing }) => {
  const [services, setServices] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
    loadFavorites();
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

  const handleToggleFavorite = async (service) => {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to save favorites');
        return;
    }
    
    const listingSnapshot = {
        title: service.title,
        coverImage: service.coverImage || service.images?.[0],
        pricePerNight: service.serviceRate || 0,
        location: service.location?.city ? `${service.location.city}, ${service.location.province}` : '',
        rating: service.stats?.rating || 0
    };
    
    const result = await toggleFavorite(user.uid, service.id, listingSnapshot);
    if (result.success) {
        loadFavorites();
    }
  };

  // Filter services based on search criteria
  const filteredServices = services.filter(listing => {
    if (searchFilters?.where) {
        const searchLower = searchFilters.where.toLowerCase();
        const matchesLocation = 
            listing.location?.city?.toLowerCase().includes(searchLower) ||
            listing.location?.province?.toLowerCase().includes(searchLower) ||
            listing.location?.locationName?.toLowerCase().includes(searchLower) ||
            listing.title?.toLowerCase().includes(searchLower);
        if (!matchesLocation) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* 2. Main Content: FIX APPLIED - Added mt-20 to clear the fixed header. */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-20 pt-20">
        
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden h-[280px] flex items-center justify-center text-center text-white p-4 mb-8">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600 animate-gradient-xy"></div>
          <div className="absolute inset-0 bg-black opacity-20 z-10"></div>
          
          <div className="relative z-20 text-white">
              <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Service Listings</h1>
              <p className="mt-2 text-lg drop-shadow-md">Discover professional services for your needs</p>
          </div>
        </div>

        {/* Service Listings Section */}
        {isLoading ? (
          <div className="text-center py-12">
              <p className="text-gray-500">Loading services...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Available Services</h3>
              <p className="text-sm text-gray-600 mt-1">
                  {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-16 mb-16">
              {filteredServices.map((service) => (
                  <ServiceListingCard 
                      key={service.id} 
                      service={service}
                      isFavorite={favoriteIds.has(service.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={(srv) => setSelectedListing && setSelectedListing(srv.id)}
                  />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 mb-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-xl mb-2">No services available yet</p>
              <p className="text-sm text-gray-500">Check back soon for professional services!</p>
          </div>
        )}

        {/* Main Title Section: ADJUSTMENT - Removed redundant pt-10, as the parent mt-20 handles spacing. */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Our <span className="text-indigo-600">Tailored Services</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            We move beyond standard amenities to offer services specifically designed for your travel purpose.
          </p>
        </header>

        {/* Primary Service Categories (Tourist & Business) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          {servicesData.map((data, index) => (
            <ServiceCategory 
              key={index} 
              category={data.category} 
              tagline={data.tagline} 
              items={data.items} 
              icon={data.icon} 
              color={data.color}
              headerColor={data.headerColor}
            />
          ))}
        </section>

        {/* Premium Add-ons Section */}
        <section className={`p-8 md:p-12 rounded-2xl shadow-2xl ${premiumAddons.color} border-t-8 border-yellow-400`}>
          <div className="text-center">
            <premiumAddons.icon className={`w-10 h-10 inline-block mb-3 ${premiumAddons.headerColor}`} />
            <h2 className={`text-3xl font-extrabold tracking-tight ${premiumAddons.headerColor}`}>
              {premiumAddons.category}
            </h2>
            <p className="mt-2 text-lg text-gray-700">
              {premiumAddons.tagline}
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {premiumAddons.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md">
                    <item.icon className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};



export default App;
