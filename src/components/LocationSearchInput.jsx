import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

/**
 * Search locations using Nominatim API with Philippines prioritization
 * Returns locations with name, address, lat, and lng
 */
const mockSearchLocations = async (query) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        // Try Philippines-specific search first
        const phResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Philippines&countrycodes=ph&limit=10&addressdetails=1`
        );
        const phData = await phResponse.json();

        // Also try general search with Philippines filter
        const generalResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=5&addressdetails=1`
        );
        const generalData = await generalResponse.json();

        // Combine and deduplicate results
        const allResults = [...phData, ...generalData];
        const uniqueResults = Array.from(
            new Map(allResults.map(item => [item.place_id, item])).values()
        );

        // Format results
        const formattedResults = uniqueResults.slice(0, 10).map(result => {
            const address = result.address || {};
            const locationName = [
                address.road || address.street,
                address.suburb || address.neighbourhood,
                address.city || address.town || address.municipality,
                address.province || address.state,
                'Philippines'
            ].filter(Boolean).join(', ') || result.display_name;

            return {
                name: locationName,
                address: result.display_name,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            };
        });

        return formattedResults;
    } catch (error) {
        console.error('Location search error:', error);
        // Fallback to mock data if API fails
        const mockLocations = [
            { name: 'El Nido, Palawan', address: 'El Nido, Palawan, Philippines', lat: 11.1953, lng: 119.4056 },
            { name: 'Boracay, Aklan', address: 'Boracay Island, Malay, Aklan, Philippines', lat: 11.9674, lng: 121.9248 },
            { name: 'BGC, Taguig', address: 'Bonifacio Global City, Taguig, Metro Manila, Philippines', lat: 14.5547, lng: 121.0244 },
            { name: 'Makati City', address: 'Makati, Metro Manila, Philippines', lat: 14.5547, lng: 121.0244 },
            { name: 'Baguio City', address: 'Baguio, Benguet, Philippines', lat: 16.4023, lng: 120.5960 },
            { name: 'Cebu City', address: 'Cebu City, Cebu, Philippines', lat: 10.3157, lng: 123.8854 },
            { name: 'Davao City', address: 'Davao City, Davao del Sur, Philippines', lat: 7.1907, lng: 125.4553 },
            { name: 'Siargao, Surigao del Norte', address: 'Siargao Island, Surigao del Norte, Philippines', lat: 9.8563, lng: 126.0603 },
            { name: 'Tagaytay City', address: 'Tagaytay, Cavite, Philippines', lat: 14.1000, lng: 120.9333 },
            { name: 'Manila', address: 'Manila, Metro Manila, Philippines', lat: 14.5995, lng: 120.9842 },
        ];
        
        const queryLower = query.toLowerCase();
        return mockLocations.filter(location => 
            location.name.toLowerCase().includes(queryLower) ||
            location.address.toLowerCase().includes(queryLower)
        ).slice(0, 10);
    }
};

/**
 * LocationSearchInput Component
 * A responsive location search input with autocomplete and current location support
 */
const LocationSearchInput = ({ onLocationSelect, placeholder = "Search for a location...", value = '' }) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const searchTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Sync with external value prop
    useEffect(() => {
        if (value !== undefined && value !== query) {
            setQuery(value);
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced search function
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const searchResults = await mockSearchLocations(query);
                setResults(searchResults);
                setShowResults(searchResults.length > 0);
            } catch (error) {
                console.error('Location search error:', error);
                setResults([]);
                setShowResults(false);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
    };

    const handleLocationSelect = (location) => {
        setQuery(location.name);
        setShowResults(false);
        setResults([]);
        
        // Call the parent's onLocationSelect with required data
        if (onLocationSelect) {
            onLocationSelect({
                name: location.name,
                address: location.address,
                lat: location.lat,
                lng: location.lng
            });
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // Reverse geocode to get location name
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                    .then(res => res.json())
                    .then(data => {
                        const address = data.address || {};
                        const locationName = [
                            address.road || address.street,
                            address.suburb || address.neighbourhood,
                            address.city || address.town || address.municipality,
                            address.province || address.state,
                            'Philippines'
                        ].filter(Boolean).join(', ') || 'Current Location';
                        
                        setQuery(locationName);
                        setIsGettingLocation(false);
                        
                        if (onLocationSelect) {
                            onLocationSelect({
                                name: locationName,
                                address: locationName,
                                lat: latitude,
                                lng: longitude
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Reverse geocoding error:', error);
                        setQuery('Current Location');
                        setIsGettingLocation(false);
                        
                        if (onLocationSelect) {
                            onLocationSelect({
                                name: 'Current Location',
                                address: 'Current Location',
                                lat: latitude,
                                lng: longitude
                            });
                        }
                    });
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to retrieve your location. Please enable location services or search manually.');
                setIsGettingLocation(false);
            }
        );
    };

    return (
        <div 
            ref={containerRef}
            className="w-full max-w-lg mx-auto relative"
        >
            {/* Search Input Container */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) {
                            setShowResults(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm sm:text-base"
                />
                {isSearching && (
                    <div className="absolute inset-y-0 right-20 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isGettingLocation}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-600 hover:text-teal-700 disabled:text-gray-400 transition-colors"
                    title="Use current location"
                >
                    {isGettingLocation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
                    ) : (
                        <Navigation className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Dropdown Results */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((location, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleLocationSelect(location)}
                            className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-teal-50"
                        >
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                        {location.name}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                                        {location.address}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {showResults && results.length === 0 && query.trim().length >= 2 && !isSearching && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <p className="text-sm text-gray-500 text-center">No locations found</p>
                </div>
            )}
        </div>
    );
};

export default LocationSearchInput;

