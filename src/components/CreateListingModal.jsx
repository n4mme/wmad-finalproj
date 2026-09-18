import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
    createListing, 
    updateListing, 
    publishListing,
    getListing 
} from '../utils/firestoreUtils';
import { 
    uploadListingImages, 
    deleteListingImage,
    createImagePreview 
} from '../utils/storageUtils';
import LocationMap from './LocationMap';
import LocationSearchInput from './LocationSearchInput';
import 'leaflet/dist/leaflet.css';
import { 
    Wifi, Home, Car, Waves, Wind, Tv, Utensils, Trash2, 
    Flame, Users, MapPin, Camera, Calendar, DollarSign,
    Truck, UtensilsCrossed, Heart, Shield, Award, FileText,
    Globe, Zap, School, Briefcase, Sparkles, Check, X,
    ChevronLeft, ChevronRight
} from 'lucide-react';

// SVG Icons
const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UploadIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// Amenity Icons Map for Homes
const amenityIcons = {
    'WiFi': Wifi,
    'Kitchen': Utensils,
    'Free Parking': Car,
    'Pool': Waves,
    'Air Conditioning': Wind,
    'Heating': Flame,
    'TV': Tv,
    'Washer': Sparkles,
    'Dryer': Sparkles,
    'Hot Tub': Waves,
    'Gym': Heart,
    'Beach Access': MapPin,
    'Mountain View': MapPin,
    'City View': MapPin,
    'Pet Friendly': Heart,
};

// Experience Feature Icons
const experienceFeatureIcons = {
    'Transportation included': Truck,
    'Equipment provided': Briefcase,
    'Small Group(8max)': Users,
    'Food & drinks included': UtensilsCrossed,
    'Professional guide': Award,
    'Insurance coverage': Shield,
    'Photos included': Camera,
    'Certificate provided': Award,
    'Multi-language support': Globe,
    'Accessibility friendly': Heart,
    'Weather guarantee': Shield,
    'Educational / Cultural Insights': School,
};

// Service Feature Icons
const serviceFeatureIcons = {
    'Licensed & Bonded': Award,
    'Fully insured': Shield,
    'Background Checked': Check,
    'Professional Equipments': Briefcase,
    'All supplies included': Briefcase,
    'Eco-friendly products': Heart,
    'Pet friendly cleaning': Heart,
    'Same-day service': Zap,
    'Deep cleaning available': Sparkles,
    'Recurring service': Calendar,
    'Satisfaction Guarantee': Award,
    'Free re-clean if needed': Check,
};


const CreateListingModal = ({ isOpen, onClose, listingId = null, onSuccess }) => {
    const [listingCategory, setListingCategory] = useState('home'); // home, experience, service
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');
    const [tempListingId, setTempListingId] = useState(listingId);
    
    // Update tempListingId when listingId prop changes
    useEffect(() => {
        if (listingId) {
            setTempListingId(listingId);
        } else {
            setTempListingId(null);
        }
    }, [listingId]);
    
    // Location autocomplete
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    
    // Discount date picker state
    const [discountDatePickerMonth, setDiscountDatePickerMonth] = useState(new Date());
    const [showDiscountDatePicker, setShowDiscountDatePicker] = useState(false);
    const [tempDiscountStartDate, setTempDiscountStartDate] = useState(null);
    const [tempDiscountEndDate, setTempDiscountEndDate] = useState(null);
    
    // Form state - unified for all categories
    const [formData, setFormData] = useState({
        // Step 1: Category-specific type
        category: 'home',
        specificCategory: '', // For experiences and services
        type: 'entire_place', // For homes
        
        // Location (common)
        locationName: '',
        lat: 14.5995, // Default: Manila
        lng: 120.9842,
        
        // Title and Description (common)
        title: '',
        description: '',
        
        // Details (category-specific)
        // Homes
        guests: 1,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        amenities: [],
        
        // Experiences
        pricePerPerson: 0,
        duration: 0,
        maxCapacity: 1,
        whatsIncluded: '',
        requirementsRestrictions: '',
        experienceFeatures: [],
        
        // Services
        serviceRate: 0,
        serviceFeatures: [],
        
        // Common - Discount structure
        discount: {
            name: '',
            percentage: 0,
            startDate: null,
            endDate: null,
            description: ''
        },
        
        // Photos (common)
        images: [],
        imageFiles: [],
        imagePreviews: [],
        
        // Pricing
        pricePerNight: 0, // For homes
        
        // House Rules (homes)
        houseRules: [],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        minimumStay: 1,
        maximumStay: 365,
        
        // Availability Calendar
        availableDates: [],
        blockedDates: [],
        bookedDates: [],
    });
    
    // Calculate total steps based on category
    const getTotalSteps = () => {
        return 5; // Consistent steps: Category/Type, Location+Title+Desc, Details/Pricing, Photos, Availability+Review
    };
    
    const totalSteps = getTotalSteps();
    
    // Load existing listing if editing
    useEffect(() => {
        if (listingId && isOpen) {
            // Don't reset step here - let loadListing handle it based on saved lastStep
            loadListing(listingId);
        } else if (isOpen && !listingId) {
            // Reset to step 1 when opening a new listing (not a draft)
            setCurrentStep(1);
            setTempListingId(null);
        }
    }, [listingId, isOpen]);
    
    const loadListing = async (id) => {
        setIsLoading(true);
        try {
            const result = await getListing(id);
            if (result.success) {
                const listing = result.data;
                setListingCategory(listing.category || 'home');
                
                // Restore the step where the user left off (for drafts)
                // Check if it's a draft and has a lastStep saved
                const savedStep = listing.lastStep;
                const isDraft = listing.status === 'draft';
                
                // Debug logging
                console.log('Loading listing:', {
                    id,
                    status: listing.status,
                    lastStep: savedStep,
                    isDraft,
                    hasLastStep: !!savedStep,
                    allListingData: listing
                });
                
                // Set form data first
                setFormData({
                category: listing.category || 'home',
                specificCategory: listing.specificCategory || '',
                type: listing.type || 'entire_place',
                locationName: listing.location?.locationName || '',
                lat: listing.location?.lat || 14.5995,
                lng: listing.location?.lng || 120.9842,
                title: listing.title || '',
                description: listing.description || '',
                guests: listing.guests || 1,
                bedrooms: listing.bedrooms || 1,
                beds: listing.beds || 1,
                bathrooms: listing.bathrooms || 1,
                amenities: listing.amenities || [],
                pricePerPerson: listing.pricePerPerson || 0,
                duration: listing.duration || 0,
                maxCapacity: listing.maxCapacity || 1,
                whatsIncluded: listing.whatsIncluded || '',
                requirementsRestrictions: listing.requirementsRestrictions || '',
                experienceFeatures: listing.experienceFeatures || [],
                serviceRate: listing.serviceRate || 0,
                serviceFeatures: listing.serviceFeatures || [],
                discount: (() => {
                    const disc = listing.discount;
                    if (disc && typeof disc === 'object') {
                        // Convert Firestore timestamps to Date objects if needed
                        return {
                            name: disc.name || '',
                            percentage: disc.percentage || 0,
                            startDate: disc.startDate 
                                ? (disc.startDate.seconds ? new Date(disc.startDate.seconds * 1000) : new Date(disc.startDate))
                                : null,
                            endDate: disc.endDate 
                                ? (disc.endDate.seconds ? new Date(disc.endDate.seconds * 1000) : new Date(disc.endDate))
                                : null,
                            description: disc.description || ''
                        };
                    }
                    // Backward compatibility
                    return {
                        name: '',
                        percentage: typeof disc === 'number' ? disc : 0,
                        startDate: null,
                        endDate: null,
                        description: ''
                    };
                })(),
                images: listing.images || [],
                imageFiles: [],
                imagePreviews: listing.images || [],
                pricePerNight: listing.pricePerNight || 0,
                houseRules: listing.houseRules || [],
                checkInTime: listing.checkInTime || '14:00',
                checkOutTime: listing.checkOutTime || '11:00',
                minimumStay: listing.minimumStay || 1,
                maximumStay: listing.maximumStay || 365,
                availableDates: listing.availableDates || [],
                blockedDates: listing.blockedDates || [],
                bookedDates: listing.bookedDates || [],
                });
                setTempListingId(id);
                
                // Set the step AFTER form data is loaded
                // Restore the step where the user left off (for drafts)
                const stepToRestore = Number(savedStep);
                if (isDraft && !isNaN(stepToRestore) && stepToRestore >= 1 && stepToRestore <= 5) {
                    // Ensure the step is within valid range
                    console.log('✅ Restoring to step:', stepToRestore);
                    setCurrentStep(stepToRestore);
                } else {
                    // Reset to step 1 for published listings or if no valid lastStep
                    console.log('⚠️ Resetting to step 1. Reason:', {
                        isDraft,
                        savedStep,
                        stepToRestore,
                        isValid: !isNaN(stepToRestore) && stepToRestore >= 1 && stepToRestore <= 5
                    });
                    setCurrentStep(1);
                }
            } else {
                console.error('Failed to load listing:', result.error);
                setCurrentStep(1);
            }
        } catch (error) {
            console.error('Error loading listing:', error);
            setCurrentStep(1);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle input change
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };
    
    // Handle category selection
    const handleCategorySelect = (category) => {
        setListingCategory(category);
        setFormData(prev => ({ ...prev, category }));
    };
    
    // Handle amenity/feature toggle
    const toggleArrayItem = (field, item) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter(i => i !== item)
                : [...prev[field], item]
        }));
    };
    
    // Handle location autocomplete with enhanced Philippines prioritization
    const handleLocationSearch = (searchText) => {
        handleInputChange('locationName', searchText);
        
        // Start suggestions from 2 characters for better UX
        if (searchText.length < 2) {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
            return;
        }
        
        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce API calls - wait 300ms after user stops typing
        const timeout = setTimeout(() => {
            performLocationSearch(searchText);
        }, 300);
        
        setSearchTimeout(timeout);
    };
    
    // Actual location search with API call
    const performLocationSearch = async (searchText) => {
        setIsGeocodingLocation(true);
        
        try {
            // Fetch multiple result sets for better coverage
            const searches = [
                // Primary search: exact query + Philippines
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}, Philippines&countrycodes=ph&limit=10&addressdetails=1`),
                // Secondary search: query without Philippines for flexibility
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&countrycodes=ph&limit=5&addressdetails=1`)
            ];
            
            const responses = await Promise.all(searches);
            const results = await Promise.all(responses.map(r => r.json()));
            
            // Combine and deduplicate results
            const allResults = [...results[0], ...results[1]];
            const uniqueResults = Array.from(
                new Map(allResults.map(item => [item.place_id, item])).values()
            );
            
            // Sort by relevance and prioritize major cities/tourist destinations
            const priorityLocations = [
                'manila', 'palawan', 'el nido', 'coron', 'puerto princesa',
                'boracay', 'cebu', 'baguio', 'davao', 'makati', 'taguig', 'bgc',
                'tagaytay', 'batangas', 'vigan', 'siargao', 'bohol', 'panglao'
            ];
            
            const sortedResults = uniqueResults.sort((a, b) => {
                const aLower = a.display_name.toLowerCase();
                const bLower = b.display_name.toLowerCase();
                const searchLower = searchText.toLowerCase();
                
                // Boost exact matches
                const aExact = aLower.includes(searchLower) ? 1000 : 0;
                const bExact = bLower.includes(searchLower) ? 1000 : 0;
                
                // Boost priority locations
                const aPriority = priorityLocations.some(loc => aLower.includes(loc)) ? 100 : 0;
                const bPriority = priorityLocations.some(loc => bLower.includes(loc)) ? 100 : 0;
                
                // Boost by importance (OSM importance score)
                const aImportance = (a.importance || 0) * 10;
                const bImportance = (b.importance || 0) * 10;
                
                return (bExact + bPriority + bImportance) - (aExact + aPriority + aImportance);
            });
            
            // Take top 10 results
            const topResults = sortedResults.slice(0, 10);
            
            // Format results with better display names
            const formattedResults = topResults.map(result => ({
                ...result,
                formattedName: formatLocationName(result)
            }));
            
            setLocationSuggestions(formattedResults);
            setShowLocationSuggestions(formattedResults.length > 0);
        } catch (err) {
            console.error('Location search error:', err);
            setLocationSuggestions([]);
        } finally {
            setIsGeocodingLocation(false);
        }
    };
    
    // Format location name for consistent display
    const formatLocationName = (location) => {
        const address = location.address || {};
        const parts = [];
        
        // Build a clean, hierarchical location string
        if (address.amenity || address.tourism || address.building) {
            parts.push(address.amenity || address.tourism || address.building);
        }
        
        if (address.road || address.street) {
            parts.push(address.road || address.street);
        }
        
        if (address.suburb || address.neighbourhood) {
            parts.push(address.suburb || address.neighbourhood);
        }
        
        if (address.city || address.town || address.municipality) {
            parts.push(address.city || address.town || address.municipality);
        }
        
        if (address.province || address.state) {
            parts.push(address.province || address.state);
        }
        
        // Always include Philippines
        parts.push('Philippines');
        
        // Remove duplicates and join
        const uniqueParts = [...new Set(parts)];
        return uniqueParts.join(', ');
    };
    
    const handleLocationSelect = (suggestion) => {
        const formattedName = suggestion.formattedName || suggestion.display_name;
        handleInputChange('locationName', formattedName);
        handleInputChange('lat', parseFloat(suggestion.lat));
        handleInputChange('lng', parseFloat(suggestion.lon));
        setShowLocationSuggestions(false);
        setLocationSuggestions([]);
    };
    
    // Handle map click with reverse geocoding
    const handleMapLocationSelect = async (latitude, longitude) => {
        handleInputChange('lat', latitude);
        handleInputChange('lng', longitude);
        
        // Reverse geocode to get location name
        setIsGeocodingLocation(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            if (data && data.address) {
                const formattedName = formatLocationName(data);
                handleInputChange('locationName', formattedName);
            }
        } catch (err) {
            console.error('Reverse geocoding error:', err);
        } finally {
            setIsGeocodingLocation(false);
        }
    };
    
    // Handle image upload
    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        const previews = await Promise.all(files.map(file => createImagePreview(file)));
        
        setFormData(prev => ({
            ...prev,
            imageFiles: [...prev.imageFiles, ...files],
            imagePreviews: [...prev.imagePreviews, ...previews]
        }));
    };
    
    const handleImageRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
            images: prev.images.filter((_, i) => i !== index)
        }));
    };
    
    // Availability calendar - toggle date status
    const toggleDateStatus = (date, status) => {
        const dateStr = date.toISOString().split('T')[0];
        
        // Remove from all arrays first
        const newData = {
            availableDates: formData.availableDates.filter(d => d !== dateStr),
            blockedDates: formData.blockedDates.filter(d => d !== dateStr),
            bookedDates: formData.bookedDates.filter(d => d !== dateStr),
        };
        
        // Add to appropriate array
        if (status === 'available') newData.availableDates.push(dateStr);
        else if (status === 'blocked') newData.blockedDates.push(dateStr);
        else if (status === 'booked') newData.bookedDates.push(dateStr);
        
        setFormData(prev => ({ ...prev, ...newData }));
    };
    
    // Discount date picker helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };
    
    const isDatePast = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };
    
    const handleDiscountDateClick = (date) => {
        if (isDatePast(date)) return;
        
        if (!tempDiscountStartDate || (tempDiscountStartDate && tempDiscountEndDate)) {
            // Start new selection
            setTempDiscountStartDate(date);
            setTempDiscountEndDate(null);
        } else if (date > tempDiscountStartDate) {
            // Set end date
            setTempDiscountEndDate(date);
        } else if (date < tempDiscountStartDate) {
            // Reset and start new selection
            setTempDiscountStartDate(date);
            setTempDiscountEndDate(null);
        }
    };
    
    const handleApplyDiscountDates = () => {
        if (tempDiscountStartDate && tempDiscountEndDate) {
            setFormData(prev => ({
                ...prev,
                discount: {
                    ...prev.discount,
                    startDate: tempDiscountStartDate,
                    endDate: tempDiscountEndDate
                }
            }));
            setShowDiscountDatePicker(false);
        }
    };
    
    const handleClearDiscountDates = () => {
        setTempDiscountStartDate(null);
        setTempDiscountEndDate(null);
        setFormData(prev => ({
            ...prev,
            discount: {
                ...prev.discount,
                startDate: null,
                endDate: null
            }
        }));
    };
    
    const formatDiscountDateRange = () => {
        if (formData.discount.startDate && formData.discount.endDate) {
            return `${formData.discount.startDate.toLocaleDateString()} - ${formData.discount.endDate.toLocaleDateString()}`;
        }
        return 'Select date range';
    };
    
    // Render discount calendar
    const renderDiscountCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(discountDatePickerMonth);
        const days = [];
        const monthName = discountDatePickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(discountDatePickerMonth.getFullYear(), discountDatePickerMonth.getMonth(), day);
            const isPast = isDatePast(date);
            const isSelected = (tempDiscountStartDate && date.toDateString() === tempDiscountStartDate.toDateString()) || 
                              (tempDiscountEndDate && date.toDateString() === tempDiscountEndDate.toDateString());
            const isInRange = tempDiscountStartDate && tempDiscountEndDate && date > tempDiscountStartDate && date < tempDiscountEndDate;
            
            let bgColor = 'bg-white hover:bg-gray-100';
            let textColor = 'text-gray-900';
            let cursor = 'cursor-pointer';
            
            if (isPast) {
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-400';
                cursor = 'cursor-not-allowed';
            } else if (isSelected) {
                bgColor = 'bg-teal-600';
                textColor = 'text-white';
            } else if (isInRange) {
                bgColor = 'bg-teal-100';
                textColor = 'text-teal-900';
            }
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDiscountDateClick(date)}
                    disabled={isPast}
                    className={`p-2 text-sm rounded-lg border-2 border-transparent ${bgColor} ${textColor} ${cursor} transition-all`}
                >
                    <div className="font-medium">{day}</div>
                </button>
            );
        }
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setDiscountDatePickerMonth(new Date(discountDatePickerMonth.getFullYear(), discountDatePickerMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold">{monthName}</h3>
                    <button
                        onClick={() => setDiscountDatePickerMonth(new Date(discountDatePickerMonth.getFullYear(), discountDatePickerMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-xs font-semibold text-center text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };
    
    // Save as draft
    const handleSaveAndExit = async () => {
        setIsSaving(true);
        setError('');
        
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('You must be logged in to create a listing');
                setIsSaving(false);
                return;
            }
            
            // Require title before saving as draft
            if (!formData.title || formData.title.trim() === '') {
                setError('Title is required to save as draft. Please add a title to identify your draft listing.');
                setIsSaving(false);
                return;
            }
            
            // Upload images if any
            let imageUrls = [...formData.images];
            if (formData.imageFiles.length > 0) {
                const listingIdForImages = tempListingId || `temp_${user.uid}_${Date.now()}`;
                const uploadResult = await uploadListingImages(listingIdForImages, formData.imageFiles);
                if (uploadResult.success) {
                    imageUrls = [...imageUrls, ...uploadResult.uploadedImages.map(img => img.url)];
                }
            }
            
            const listingData = prepareListingData(imageUrls);
            listingData.isActive = false;
            listingData.status = 'draft';
            listingData.lastStep = currentStep; // Save the current step
            
            // Debug logging
            console.log('Saving draft at step:', currentStep, 'Listing ID:', tempListingId);
            console.log('Draft data to save:', { ...listingData, lastStep: currentStep });
            
            let result;
            if (tempListingId) {
                result = await updateListing(tempListingId, listingData);
                if (result.success) {
                    console.log('Draft updated successfully with lastStep:', currentStep);
                    alert('Draft saved successfully!');
                    onClose();
                    if (onSuccess) onSuccess();
                } else {
                    console.error('Failed to update draft:', result.error);
                }
            } else {
                result = await createListing(user.uid, listingData);
                if (result.success) {
                    setTempListingId(result.id);
                    console.log('Draft created successfully with lastStep:', currentStep, 'New ID:', result.id);
                    alert('Draft saved successfully!');
                    onClose();
                    if (onSuccess) onSuccess();
                } else {
                    console.error('Failed to create draft:', result.error);
                }
            }
            
            if (!result.success) {
                setError(result.error || 'Failed to save draft');
            }
        } catch (err) {
            console.error('Error saving draft:', err);
            setError('Failed to save draft: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Prepare listing data based on category
    const prepareListingData = (imageUrls) => {
        // Prepare discount with proper date handling
        const discountData = {
            name: formData.discount.name || '',
            percentage: formData.discount.percentage || 0,
            startDate: formData.discount.startDate || null,
            endDate: formData.discount.endDate || null,
            description: formData.discount.description || ''
        };
        
        const baseData = {
            category: listingCategory,
            title: formData.title,
            description: formData.description,
            location: {
                locationName: formData.locationName,
                lat: formData.lat,
                lng: formData.lng,
                country: 'Philippines',
            },
            images: imageUrls,
            coverImage: imageUrls[0] || '',
            discount: discountData,
            availableDates: formData.availableDates,
            blockedDates: formData.blockedDates,
            bookedDates: formData.bookedDates,
        };
        
        if (listingCategory === 'home') {
            return {
                ...baseData,
                type: formData.type,
                guests: formData.guests,
                bedrooms: formData.bedrooms,
                beds: formData.beds,
                bathrooms: formData.bathrooms,
                amenities: formData.amenities,
                pricePerNight: formData.pricePerNight,
                houseRules: formData.houseRules,
                checkInTime: formData.checkInTime,
                checkOutTime: formData.checkOutTime,
                minimumStay: formData.minimumStay,
                maximumStay: formData.maximumStay,
            };
        } else if (listingCategory === 'experience') {
            return {
                ...baseData,
                specificCategory: formData.specificCategory,
                pricePerPerson: formData.pricePerPerson,
                duration: formData.duration,
                maxCapacity: formData.maxCapacity,
                whatsIncluded: formData.whatsIncluded,
                requirementsRestrictions: formData.requirementsRestrictions,
                experienceFeatures: formData.experienceFeatures,
            };
        } else if (listingCategory === 'service') {
            return {
                ...baseData,
                specificCategory: formData.specificCategory,
                serviceRate: formData.serviceRate,
                whatsIncluded: formData.whatsIncluded,
                requirementsRestrictions: formData.requirementsRestrictions,
                serviceFeatures: formData.serviceFeatures,
            };
        }
        
        return baseData;
    };
    
    // Publish listing
    const handlePublish = async () => {
        setIsPublishing(true);
        setError('');
        
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('You must be logged in to publish a listing');
                setIsPublishing(false);
                return;
            }
            
            // Upload images
            let imageUrls = [...formData.images];
            if (formData.imageFiles.length > 0) {
                const listingIdForImages = tempListingId || `temp_${user.uid}_${Date.now()}`;
                const uploadResult = await uploadListingImages(listingIdForImages, formData.imageFiles);
                
                if (uploadResult.uploadedImages && uploadResult.uploadedImages.length > 0) {
                    imageUrls = [...imageUrls, ...uploadResult.uploadedImages.map(img => img.url)];
                }
                
                if (!uploadResult.success && imageUrls.length === 0) {
                    setError('Failed to upload images. At least one image is required.');
                    setIsPublishing(false);
                    return;
                }
            }
            
            const listingData = prepareListingData(imageUrls);
            
            let finalListingId = tempListingId;
            
            if (tempListingId) {
                const updateResult = await updateListing(tempListingId, listingData);
                if (!updateResult.success) {
                    setError(updateResult.error || 'Failed to update listing');
                    setIsSaving(false);
                    return;
                }
            } else {
                const createResult = await createListing(user.uid, listingData);
                if (!createResult.success) {
                    setError(createResult.error || 'Failed to create listing');
                    setIsSaving(false);
                    return;
                }
                finalListingId = createResult.id;
            }
            
            // Publish
            const publishResult = await publishListing(finalListingId);
            
            if (publishResult.success) {
                alert('Listing published successfully!');
                onClose();
                if (onSuccess) onSuccess();
            } else {
                if (publishResult.errors && publishResult.errors.length > 0) {
                    setError('Please fix the following:\n' + publishResult.errors.join('\n'));
                } else {
                    setError(publishResult.error || 'Failed to publish listing');
                }
            }
        } catch (err) {
            console.error('Error publishing listing:', err);
            setError('Failed to publish listing: ' + err.message);
        } finally {
            setIsPublishing(false);
        }
    };
    
    // Validation functions for each step
    const validateStep = (step) => {
        switch (step) {
            case 1:
                // Step 1: Category and Type must be selected
                if (!listingCategory) {
                    setError('Please select a category');
                    return false;
                }
                if (listingCategory === 'home' && !formData.type) {
                    setError('Please select a home type');
                    return false;
                }
                if (listingCategory === 'experience' && !formData.specificCategory) {
                    setError('Please select an experience category');
                    return false;
                }
                if (listingCategory === 'service' && !formData.specificCategory) {
                    setError('Please select a service category');
                    return false;
                }
                return true;
            
            case 2:
                // Step 2: Location, Title, Description
                if (!formData.locationName || formData.locationName.trim() === '') {
                    setError('Location is required');
                    return false;
                }
                if (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) {
                    setError('Please select a valid location on the map');
                    return false;
                }
                if (!formData.title || formData.title.trim() === '' || formData.title.length < 10) {
                    setError('Title is required and must be at least 10 characters');
                    return false;
                }
                if (!formData.description || formData.description.trim() === '' || formData.description.length < 10) {
                    setError('Description is required and must be at least 10 characters');
                    return false;
                }
                return true;
            
            case 3:
                // Step 3: Pricing & Details (category-specific)
                if (listingCategory === 'home') {
                    if (!formData.pricePerNight || formData.pricePerNight <= 0) {
                        setError('Price per night is required');
                        return false;
                    }
                    if (!formData.guests || formData.guests <= 0) {
                        setError('Number of guests is required');
                        return false;
                    }
                    if (!formData.bedrooms || formData.bedrooms <= 0) {
                        setError('Number of bedrooms is required');
                        return false;
                    }
                    if (!formData.beds || formData.beds <= 0) {
                        setError('Number of beds is required');
                        return false;
                    }
                    if (!formData.bathrooms || formData.bathrooms <= 0) {
                        setError('Number of bathrooms is required');
                        return false;
                    }
                    if (!formData.amenities || formData.amenities.length < 2) {
                        setError('At least 2 amenities are required');
                        return false;
                    }
                } else if (listingCategory === 'experience') {
                    if (!formData.pricePerPerson || formData.pricePerPerson <= 0) {
                        setError('Price per person is required');
                        return false;
                    }
                    if (!formData.duration || formData.duration <= 0) {
                        setError('Duration is required');
                        return false;
                    }
                    if (!formData.maxCapacity || formData.maxCapacity <= 0) {
                        setError('Maximum capacity is required');
                        return false;
                    }
                    if (!formData.whatsIncluded || formData.whatsIncluded.trim() === '') {
                        setError('What\'s included is required');
                        return false;
                    }
                    if (!formData.requirementsRestrictions || formData.requirementsRestrictions.trim() === '') {
                        setError('Requirements & restrictions is required');
                        return false;
                    }
                    if (!formData.experienceFeatures || formData.experienceFeatures.length < 2) {
                        setError('At least 2 experience features are required');
                        return false;
                    }
                } else if (listingCategory === 'service') {
                    if (!formData.serviceRate || formData.serviceRate <= 0) {
                        setError('Service rate is required');
                        return false;
                    }
                    if (!formData.whatsIncluded || formData.whatsIncluded.trim() === '') {
                        setError('What\'s included is required');
                        return false;
                    }
                    if (!formData.requirementsRestrictions || formData.requirementsRestrictions.trim() === '') {
                        setError('Requirements & restrictions is required');
                        return false;
                    }
                    if (!formData.serviceFeatures || formData.serviceFeatures.length < 2) {
                        setError('At least 2 service features are required');
                        return false;
                    }
                }
                return true;
            
            case 4:
                // Step 4: Photos
                const totalImages = (formData.images?.length || 0) + (formData.imageFiles?.length || 0);
                if (totalImages < 4) {
                    setError('At least 4 photos are required');
                    return false;
                }
                return true;
            
            case 5:
                // Step 5: Availability (optional, no validation needed)
                return true;
            
            default:
                return true;
        }
    };

    // Navigation with validation
    const handleNext = () => {
        // Validate current step before proceeding
        if (!validateStep(currentStep)) {
            return;
        }
        
        setError(''); // Clear any previous errors
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    if (!isOpen) return null;
    
    // Render step content based on category and step
    const renderStepContent = () => {
        // Step 1: Category and Type Selection
        if (currentStep === 1) {
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-center">What type of listing is this?</h3>
                    
                    {/* Category Tabs */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleCategorySelect('home')}
                            className={`flex-1 py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                                listingCategory === 'home'
                                    ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white border-teal-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            🏠 Homes
                        </button>
                        <button
                            onClick={() => handleCategorySelect('experience')}
                            className={`flex-1 py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                                listingCategory === 'experience'
                                    ? 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-600 text-white border-rose-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            🎈 Experiences
                        </button>
                        <button
                            onClick={() => handleCategorySelect('service')}
                            className={`flex-1 py-4 px-6 rounded-lg border-2 font-semibold transition-all ${
                                listingCategory === 'service'
                                    ? 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            🛎️ Services
                        </button>
                    </div>
                    
                    {/* Category-specific type selection */}
                    {listingCategory === 'home' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Type of Home</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="entire_place">Entire Place</option>
                                <option value="private_room">Private Room</option>
                                <option value="shared_room">Shared Room</option>
                                <option value="apartment">Apartment</option>
                                <option value="unique_space">Unique Space</option>
                                <option value="outdoor_space">Outdoor Space</option>
                            </select>
                        </div>
                    )}
                    
                    {listingCategory === 'experience' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Experience Category</label>
                            <select
                                value={formData.specificCategory}
                                onChange={(e) => handleInputChange('specificCategory', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">Select category...</option>
                                <option value="food_tour">Food Tour</option>
                                <option value="city_tour">City Tour</option>
                                <option value="adventure">Adventure</option>
                                <option value="cultural">Cultural</option>
                                <option value="wellness">Wellness</option>
                                <option value="entertainment">Entertainment</option>
                            </select>
                        </div>
                    )}
                    
                    {listingCategory === 'service' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Service Category</label>
                            <select
                                value={formData.specificCategory}
                                onChange={(e) => handleInputChange('specificCategory', e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Select category...</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="cooking">Cooking</option>
                                <option value="transportation">Transportation</option>
                                <option value="personal_care">Personal Care</option>
                                <option value="education">Education</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>
                    )}
                </div>
            );
        }
        
        // Step 2: Location, Title, Description
        if (currentStep === 2) {
            return (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Location & Basic Info</h3>
                    
                    {/* Location Input with Autocomplete - Using LocationSearchInput Component */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Location * 
                            <span className="text-xs text-gray-500 font-normal ml-2">
                                (Type at least 2 characters or use current location)
                            </span>
                        </label>
                        <LocationSearchInput
                            value={formData.locationName}
                            onLocationSelect={(location) => {
                                handleInputChange('locationName', location.name);
                                handleInputChange('lat', location.lat);
                                handleInputChange('lng', location.lng);
                            }}
                            placeholder="e.g., El Nido, Palawan or BGC, Taguig or Boracay..."
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Search by city, province, landmark, or address. Click on a suggestion, use current location, or use the map below.
                        </p>
                    </div>
                    
                    {/* Interactive Map */}
                    <div className="relative" style={{ zIndex: 1 }}>
                        <label className="block text-sm font-medium mb-2">
                            📍 Interactive Map
                            {(formData.lat !== 0 && formData.lng !== 0) && <span className="text-green-600 text-xs ml-2">✓ Location set</span>}
                        </label>
                        <LocationMap
                            lat={formData.lat}
                            lng={formData.lng}
                            onLocationSelect={handleMapLocationSelect}
                            height="300px"
                            interactive={true}
                            allowMarkerPlacement={true}
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            💡 <strong>Click on the map</strong> to set or fine-tune your exact location. The address will be automatically detected.
                        </p>
                        {isGeocodingLocation && formData.lat !== 14.5995 && formData.lng !== 120.9842 && (
                            <p className="text-xs text-teal-600 mt-1 animate-pulse">
                                🔄 Fetching address for map location...
                            </p>
                        )}
                    </div>
                    
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Listing Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g., Cozy Beachfront Villa in El Nido"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your listing in detail..."
                            rows={6}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
                    </div>
                </div>
            );
        }
        
        // Step 3: Pricing & Details (category-specific)
        if (currentStep === 3) {
            if (listingCategory === 'home') {
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold">Property Details & Pricing</h3>
                        
                        {/* Property Details Grid - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Guests</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.guests}
                                    onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Bedrooms</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Beds</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.beds}
                                    onChange={(e) => handleInputChange('beds', parseInt(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Bathrooms</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={formData.bathrooms}
                                    onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                        
                        {/* Amenities with Icons - Responsive */}
                        <div>
                            <h4 className="text-base sm:text-lg font-semibold mb-3">Amenities</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {Object.keys(amenityIcons).map(amenity => {
                                    const Icon = amenityIcons[amenity];
                                    return (
                                        <label
                                            key={amenity}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                formData.amenities.includes(amenity)
                                                    ? 'bg-teal-50 border-teal-500'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.amenities.includes(amenity)}
                                                onChange={() => toggleArrayItem('amenities', amenity)}
                                                className="sr-only"
                                            />
                                            <Icon className="w-5 h-5 mr-2 text-teal-600" />
                                            <span className="text-sm">{amenity}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Pricing - Responsive */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-2">Price Per Night (₱) *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.pricePerNight}
                                onChange={(e) => handleInputChange('pricePerNight', parseFloat(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        
                        {/* Discount Section */}
                        <div className="space-y-4 border-t pt-4 mt-4">
                            <h4 className="text-base sm:text-lg font-semibold">Discount (Optional)</h4>
                            
                            {/* Discount Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Xmas Sale, Early bird, Summer Sale"
                                    value={formData.discount.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, name: e.target.value }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            
                            {/* Discount Percentage */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discount.percentage}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, percentage: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">This percentage will be deducted from the final price</p>
                            </div>
                            
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Date Range</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempDiscountStartDate(formData.discount.startDate);
                                        setTempDiscountEndDate(formData.discount.endDate);
                                        setShowDiscountDatePicker(true);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-teal-500 focus:ring-2 focus:ring-teal-500 flex items-center justify-between"
                                >
                                    <span className="text-gray-700">{formatDiscountDateRange()}</span>
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                </button>
                                
                                {/* Date Picker Modal */}
                                {showDiscountDatePicker && (
                                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowDiscountDatePicker(false)}></div>
                                        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                                            {renderDiscountCalendar()}
                                            {(tempDiscountStartDate || tempDiscountEndDate) && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                                    <p className="font-semibold mb-1">Selected Dates:</p>
                                                    <p>Start: {tempDiscountStartDate ? tempDiscountStartDate.toLocaleDateString() : 'Not selected'}</p>
                                                    <p>End: {tempDiscountEndDate ? tempDiscountEndDate.toLocaleDateString() : 'Not selected'}</p>
                                                </div>
                                            )}
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleClearDiscountDates}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleApplyDiscountDates}
                                                    disabled={!tempDiscountStartDate || !tempDiscountEndDate}
                                                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                                                >
                                                    Apply Dates
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Discount Description */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Description</label>
                                <textarea
                                    value={formData.discount.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, description: e.target.value }
                                    }))}
                                    placeholder="Describe the discount offer..."
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                );
            } else if (listingCategory === 'experience') {
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold">Pricing & Details</h3>
                        
                        {/* Pricing Grid - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-2">Price per Person (₱) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.pricePerPerson}
                                    onChange={(e) => handleInputChange('pricePerPerson', parseFloat(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Duration (hours) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.duration}
                                    onChange={(e) => handleInputChange('duration', parseFloat(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Max Capacity (people) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maxCapacity}
                                    onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                        
                        {/* Discount Section */}
                        <div className="space-y-4 border-t pt-4 mt-4">
                            <h4 className="text-base sm:text-lg font-semibold">Discount (Optional)</h4>
                            
                            {/* Discount Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Xmas Sale, Early bird, Summer Sale"
                                    value={formData.discount.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, name: e.target.value }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            
                            {/* Discount Percentage */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discount.percentage}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, percentage: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">This percentage will be deducted from the final price</p>
                            </div>
                            
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Date Range</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempDiscountStartDate(formData.discount.startDate);
                                        setTempDiscountEndDate(formData.discount.endDate);
                                        setShowDiscountDatePicker(true);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-rose-500 focus:ring-2 focus:ring-rose-500 flex items-center justify-between"
                                >
                                    <span className="text-gray-700">{formatDiscountDateRange()}</span>
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                </button>
                                
                                {/* Date Picker Modal */}
                                {showDiscountDatePicker && (
                                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowDiscountDatePicker(false)}></div>
                                        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                                            {renderDiscountCalendar()}
                                            {(tempDiscountStartDate || tempDiscountEndDate) && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                                    <p className="font-semibold mb-1">Selected Dates:</p>
                                                    <p>Start: {tempDiscountStartDate ? tempDiscountStartDate.toLocaleDateString() : 'Not selected'}</p>
                                                    <p>End: {tempDiscountEndDate ? tempDiscountEndDate.toLocaleDateString() : 'Not selected'}</p>
                                                </div>
                                            )}
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleClearDiscountDates}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleApplyDiscountDates}
                                                    disabled={!tempDiscountStartDate || !tempDiscountEndDate}
                                                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 transition-colors"
                                                >
                                                    Apply Dates
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Discount Description */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Description</label>
                                <textarea
                                    value={formData.discount.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, description: e.target.value }
                                    }))}
                                    placeholder="Describe the discount offer..."
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                        
                        {/* What's Included */}
                        <div>
                            <label className="block text-sm font-medium mb-2">What's Included</label>
                            <textarea
                                value={formData.whatsIncluded}
                                onChange={(e) => handleInputChange('whatsIncluded', e.target.value)}
                                placeholder="List what's included in this experience..."
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        
                        {/* Requirements & Restrictions */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Requirements & Restrictions</label>
                            <textarea
                                value={formData.requirementsRestrictions}
                                onChange={(e) => handleInputChange('requirementsRestrictions', e.target.value)}
                                placeholder="Any requirements or restrictions for participants..."
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                            />
                        </div>
                        
                        {/* Experience Features - Responsive */}
                        <div>
                            <h4 className="text-base sm:text-lg font-semibold mb-3">Experience Features</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {Object.keys(experienceFeatureIcons).map(feature => {
                                    const Icon = experienceFeatureIcons[feature];
                                    return (
                                        <label
                                            key={feature}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                formData.experienceFeatures.includes(feature)
                                                    ? 'bg-rose-50 border-rose-500'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.experienceFeatures.includes(feature)}
                                                onChange={() => toggleArrayItem('experienceFeatures', feature)}
                                                className="sr-only"
                                            />
                                            <Icon className="w-5 h-5 mr-2 text-rose-600" />
                                            <span className="text-sm">{feature}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            } else if (listingCategory === 'service') {
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold">Pricing & Details</h3>
                        
                        {/* Service Pricing - Responsive */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-2">Service Rate (₱) *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.serviceRate}
                                onChange={(e) => handleInputChange('serviceRate', parseFloat(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        
                        {/* Discount Section */}
                        <div className="space-y-4 border-t pt-4 mt-4">
                            <h4 className="text-base sm:text-lg font-semibold">Discount (Optional)</h4>
                            
                            {/* Discount Name */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Xmas Sale, Early bird, Summer Sale"
                                    value={formData.discount.name}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, name: e.target.value }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            
                            {/* Discount Percentage */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discount.percentage}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, percentage: parseFloat(e.target.value) || 0 }
                                    }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">This percentage will be deducted from the final price</p>
                            </div>
                            
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Date Range</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTempDiscountStartDate(formData.discount.startDate);
                                        setTempDiscountEndDate(formData.discount.endDate);
                                        setShowDiscountDatePicker(true);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-purple-500 focus:ring-2 focus:ring-purple-500 flex items-center justify-between"
                                >
                                    <span className="text-gray-700">{formatDiscountDateRange()}</span>
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                </button>
                                
                                {/* Date Picker Modal */}
                                {showDiscountDatePicker && (
                                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowDiscountDatePicker(false)}></div>
                                        <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                                            {renderDiscountCalendar()}
                                            {(tempDiscountStartDate || tempDiscountEndDate) && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                                    <p className="font-semibold mb-1">Selected Dates:</p>
                                                    <p>Start: {tempDiscountStartDate ? tempDiscountStartDate.toLocaleDateString() : 'Not selected'}</p>
                                                    <p>End: {tempDiscountEndDate ? tempDiscountEndDate.toLocaleDateString() : 'Not selected'}</p>
                                                </div>
                                            )}
                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleClearDiscountDates}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleApplyDiscountDates}
                                                    disabled={!tempDiscountStartDate || !tempDiscountEndDate}
                                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                                                >
                                                    Apply Dates
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Discount Description */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Description</label>
                                <textarea
                                    value={formData.discount.description}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        discount: { ...prev.discount, description: e.target.value }
                                    }))}
                                    placeholder="Describe the discount offer..."
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                        
                        {/* What's Included */}
                        <div>
                            <label className="block text-sm font-medium mb-2">What's Included</label>
                            <textarea
                                value={formData.whatsIncluded}
                                onChange={(e) => handleInputChange('whatsIncluded', e.target.value)}
                                placeholder="List what's included in this service..."
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        
                        {/* Requirements & Restrictions */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Requirements & Restrictions</label>
                            <textarea
                                value={formData.requirementsRestrictions}
                                onChange={(e) => handleInputChange('requirementsRestrictions', e.target.value)}
                                placeholder="Any requirements or restrictions for clients..."
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        
                        {/* Service Features - Responsive */}
                        <div>
                            <h4 className="text-base sm:text-lg font-semibold mb-3">Service Features</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {Object.keys(serviceFeatureIcons).map(feature => {
                                    const Icon = serviceFeatureIcons[feature];
                                    return (
                                        <label
                                            key={feature}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                formData.serviceFeatures.includes(feature)
                                                    ? 'bg-purple-50 border-purple-500'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.serviceFeatures.includes(feature)}
                                                onChange={() => toggleArrayItem('serviceFeatures', feature)}
                                                className="sr-only"
                                            />
                                            <Icon className="w-5 h-5 mr-2 text-purple-600" />
                                            <span className="text-sm">{feature}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            }
        }
        
        // Step 4: Photos
        if (currentStep === 4) {
            return (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Photos</h3>
                    <p className="text-gray-600">Upload at least 4 photos of your listing</p>
                    
                    {/* Image Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            id="image-upload"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <UploadIcon />
                            <p className="mt-2 text-sm text-gray-600">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </label>
                    </div>
                    
                    {/* Image Previews */}
                    {formData.imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {formData.imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => handleImageRemove(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-2 left-2 bg-teal-600 text-white text-xs px-2 py-1 rounded">
                                            Cover Photo
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        
        // Step 5: Availability Calendar & Review
        if (currentStep === 5) {
            // Simple calendar for now - can be enhanced later
            const validationChecks = [
                { label: 'Title (at least 10 characters)', valid: formData.title && formData.title.trim().length >= 10 },
                { label: 'Description (at least 10 characters)', valid: formData.description && formData.description.trim().length >= 10 },
                { label: 'At least 4 images', valid: ((formData.images?.length || 0) + (formData.imagePreviews?.length || 0)) >= 4 },
                { label: 'Valid location', valid: formData.locationName && formData.locationName.length > 0 },
                { label: 'Category selected', valid: !!listingCategory },
            ];
            
            // Add category-specific validations
            if (listingCategory === 'home') {
                validationChecks.push({ label: 'Price per night set', valid: formData.pricePerNight > 0 });
                validationChecks.push({ label: 'At least 2 amenities selected', valid: (formData.amenities?.length || 0) >= 2 });
            } else if (listingCategory === 'experience') {
                validationChecks.push({ label: 'Price per person set', valid: formData.pricePerPerson > 0 });
                validationChecks.push({ label: 'Duration set', valid: formData.duration > 0 });
                validationChecks.push({ label: 'Experience category selected', valid: !!formData.specificCategory });
                validationChecks.push({ label: 'What\'s included filled', valid: !!(formData.whatsIncluded && formData.whatsIncluded.trim()) });
                validationChecks.push({ label: 'Requirements & restrictions filled', valid: !!(formData.requirementsRestrictions && formData.requirementsRestrictions.trim()) });
                validationChecks.push({ label: 'At least 2 experience features selected', valid: (formData.experienceFeatures?.length || 0) >= 2 });
            } else if (listingCategory === 'service') {
                validationChecks.push({ label: 'Service rate set', valid: formData.serviceRate > 0 });
                validationChecks.push({ label: 'Service category selected', valid: !!formData.specificCategory });
                validationChecks.push({ label: 'What\'s included filled', valid: !!(formData.whatsIncluded && formData.whatsIncluded.trim()) });
                validationChecks.push({ label: 'Requirements & restrictions filled', valid: !!(formData.requirementsRestrictions && formData.requirementsRestrictions.trim()) });
                validationChecks.push({ label: 'At least 2 service features selected', valid: (formData.serviceFeatures?.length || 0) >= 2 });
            }
            
            const allValid = validationChecks.every(check => check.valid);
            
            return (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold">Availability Calendar & Review</h3>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-900">
                            📅 <strong>Availability Calendar:</strong> You can manage your availability calendar after publishing from the Calendar & Pricing page in your host dashboard.
                        </p>
                    </div>
                    
                    {/* Requirements Checklist */}
                    <div className={`${allValid ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'} border-2 p-4 rounded-lg`}>
                        <p className={`font-medium mb-3 ${allValid ? 'text-teal-900' : 'text-amber-900'}`}>
                            {allValid ? '✓ Ready to publish!' : '⚠ Requirements Checklist'}
                        </p>
                        <div className="space-y-2">
                            {validationChecks.map((check, idx) => (
                                <div key={idx} className="flex items-center text-sm">
                                    <span className={`mr-2 ${check.valid ? 'text-green-600' : 'text-red-600'}`}>
                                        {check.valid ? '✓' : '✗'}
                                    </span>
                                    <span className={check.valid ? 'text-gray-700' : 'text-red-700 font-medium'}>
                                        {check.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {!allValid && (
                            <p className="text-xs text-amber-700 mt-3">
                                Please go back and complete all required fields before publishing.
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        
        return null;
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
                {/* Header - Responsive */}
                <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-2">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">
                            {listingId ? 'Edit Listing' : 'Create New Listing'}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500">Step {currentStep} of {totalSteps}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
                    >
                        <CloseIcon />
                    </button>
                </div>
                
                {/* Progress Bar - Responsive */}
                <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
                
                {/* Error Display - At the top, always visible */}
                {error && (
                    <div className="mx-4 sm:mx-6 mt-4 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex-shrink-0">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm sm:text-base font-medium text-red-800">
                                    {error}
                                </p>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                                <button
                                    onClick={() => setError('')}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Content - Scrollable - Responsive */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    <pre className="whitespace-pre-wrap text-sm font-sans">{error}</pre>
                                </div>
                            )}
                            {renderStepContent()}
                        </>
                    )}
                </div>
                
                {/* Footer - Responsive */}
                <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 flex-shrink-0">
                    <button
                        onClick={handleSaveAndExit}
                        disabled={isSaving || isPublishing}
                        className="text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-2 sm:order-1"
                    >
                        {isSaving ? 'Saving...' : 'Save & Exit'}
                    </button>
                    
                    <div className="flex space-x-2 sm:space-x-3 order-1 sm:order-2">
                        {currentStep > 1 && (
                            <button
                                onClick={handlePrevious}
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base font-medium"
                            >
                                Previous
                            </button>
                        )}
                        
                        {currentStep < totalSteps ? (
                            <button
                                onClick={handleNext}
                                disabled={isSaving || isPublishing}
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={isSaving || isPublishing}
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                            >
                                {isPublishing ? 'Publishing...' : 'Publish Listing'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateListingModal;
