import React, { useState, useEffect } from "react";
import { Search as LucideSearch, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

// Navigation Tabs Component with Animations
export const NavigationTabs = ({ currentPage, setPage }) => {
    const [activeTab, setActiveTab] = useState(currentPage);

    useEffect(() => {
        setActiveTab(currentPage);
    }, [currentPage]);

    const handleNavigation = (page) => {
        setActiveTab(page);
        setPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const tabs = [
        { id: "Home", label: "Homes", icon: "🏠" },
        { id: "Experiences", label: "Experiences", icon: "🎈" },
        { id: "Services", label: "Services", icon: "🛎️" }
    ];

    return (
        <div className="flex justify-center items-center mb-6">
            <nav className="flex space-x-2 sm:space-x-4 bg-white rounded-full shadow-lg p-1.5 border border-gray-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleNavigation(tab.id)}
                            className={`
                                relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm sm:text-base
                                transition-all duration-300 ease-in-out transform
                                ${isActive 
                                    ? 'bg-teal-500 text-white shadow-md scale-105 animate-bounce-in' 
                                    : 'text-gray-600 hover:text-teal-500 hover:bg-gray-50 hover:scale-105'
                                }
                            `}
                            style={{
                                animationDelay: `${tabs.indexOf(tab) * 0.1}s`
                            }}
                        >
                            <span className="flex items-center space-x-2">
                                <span className="text-lg sm:text-xl">{tab.icon}</span>
                                <span className="hidden sm:inline">{tab.label}</span>
                            </span>
                            {/* Animated underline for active tab */}
                            {isActive && (
                                <span 
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-pulse"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

// Filter Search Component with Date Range Picker
export const FilterSearch = ({ searchFilters, setSearchFilters, onSearch, listings = [] }) => {
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    
    // Date range picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tempCheckIn, setTempCheckIn] = useState(null);
    const [tempCheckOut, setTempCheckOut] = useState(null);
    
    // Popular locations for dropdown
    const popularLocations = [
        "Manila, Metro Manila",
        "Makati, Metro Manila",
        "BGC, Taguig",
        "Boracay, Aklan",
        "El Nido, Palawan",
        "Baguio, Benguet",
        "Cebu City, Cebu",
        "Siargao, Surigao del Norte",
        "Tagaytay, Cavite",
        "Vigan, Ilocos Sur"
    ];
    
    // Parse check-in and check-out from searchFilters
    const selectedCheckIn = searchFilters?.checkIn ? new Date(searchFilters.checkIn) : null;
    const selectedCheckOut = searchFilters?.checkOut ? new Date(searchFilters.checkOut) : null;

    // Handle location input with suggestions
    const handleLocationChange = (value) => {
        setSearchFilters({ ...searchFilters, where: value });
        
        if (value.trim().length > 0) {
            const filtered = popularLocations.filter(loc => 
                loc.toLowerCase().includes(value.toLowerCase())
            );
            setLocationSuggestions(filtered);
            setShowLocationDropdown(true);
        } else {
            setLocationSuggestions([]);
            setShowLocationDropdown(false);
        }
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch();
        }
    };
    
    // Date range helper functions
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
    
    const formatDateRange = () => {
        if (!selectedCheckIn || !selectedCheckOut) {
            return 'Select dates';
        }
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        const formatYear = (date) => {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric' 
            });
        };
        
        const checkInFormatted = formatDate(selectedCheckIn);
        const checkOutFormatted = formatDate(selectedCheckOut);
        const year = formatYear(selectedCheckOut);
        
        if (selectedCheckIn.getMonth() === selectedCheckOut.getMonth() && 
            selectedCheckIn.getFullYear() === selectedCheckOut.getFullYear()) {
            return `${checkInFormatted} - ${selectedCheckOut.getDate()}, ${year}`;
        } else {
            return `${checkInFormatted} - ${checkOutFormatted}, ${year}`;
        }
    };
    
    const handleDateClick = (date) => {
        if (isDatePast(date)) return;
        
        if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
            setTempCheckIn(date);
            setTempCheckOut(null);
        } else {
            if (date > tempCheckIn) {
                setTempCheckOut(date);
            } else {
                setTempCheckIn(date);
                setTempCheckOut(null);
            }
        }
    };
    
    const handleApplyDates = () => {
        if (tempCheckIn && tempCheckOut) {
            const checkInYear = tempCheckIn.getFullYear();
            const checkInMonth = String(tempCheckIn.getMonth() + 1).padStart(2, '0');
            const checkInDay = String(tempCheckIn.getDate()).padStart(2, '0');
            const checkInStr = `${checkInYear}-${checkInMonth}-${checkInDay}`;
            
            const checkOutYear = tempCheckOut.getFullYear();
            const checkOutMonth = String(tempCheckOut.getMonth() + 1).padStart(2, '0');
            const checkOutDay = String(tempCheckOut.getDate()).padStart(2, '0');
            const checkOutStr = `${checkOutYear}-${checkOutMonth}-${checkOutDay}`;
            
            setSearchFilters({ 
                ...searchFilters, 
                checkIn: checkInStr,
                checkOut: checkOutStr
            });
            setShowDatePicker(false);
            setTempCheckIn(null);
            setTempCheckOut(null);
        }
    };
    
    const handleClearDates = () => {
        setTempCheckIn(null);
        setTempCheckOut(null);
        setSearchFilters({ 
            ...searchFilters, 
            checkIn: '',
            checkOut: ''
        });
    };
    
    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
        const days = [];
        const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isPast = isDatePast(date);
            const isSelected = (tempCheckIn && date.toDateString() === tempCheckIn.toDateString()) || 
                              (tempCheckOut && date.toDateString() === tempCheckOut.toDateString());
            const isInRange = tempCheckIn && tempCheckOut && date > tempCheckIn && date < tempCheckOut;
            
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
                    onClick={() => handleDateClick(date)}
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
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold">{monthName}</h3>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
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

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center bg-white rounded-2xl shadow-xl border border-gray-200 p-2 sm:p-3 gap-2 sm:gap-0">
                {/* Where - Location Picker */}
                <div className="flex flex-col flex-1 justify-center px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-xl cursor-pointer transition relative w-full sm:w-auto">
                    <span className="text-xs font-bold text-gray-900 mb-1">Where</span>
                    <input
                        type="text"
                        value={searchFilters?.where || ''}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => {
                            if (searchFilters?.where) {
                                handleLocationChange(searchFilters.where);
                            } else {
                                setShowLocationDropdown(true);
                                setLocationSuggestions(popularLocations);
                            }
                        }}
                        onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                        placeholder="Search destinations"
                        className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 p-0 w-full placeholder-gray-400"
                    />
                    
                    {/* Location Dropdown */}
                    {showLocationDropdown && (locationSuggestions.length > 0 || popularLocations.length > 0) && (
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2 max-h-64 overflow-y-auto">
                            <p className="text-xs font-bold text-gray-500 px-4 py-2">Popular destinations</p>
                            {(locationSuggestions.length > 0 ? locationSuggestions : popularLocations).map((location, index) => (
                                <button
                                    key={index}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setSearchFilters({ ...searchFilters, where: location });
                                        setShowLocationDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                                >
                                    {location}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

                {/* Check-in & Check-out Date Range */}
                <div className="flex flex-col flex-1 justify-center px-3 sm:px-4 py-2 hover:bg-gray-100 rounded-xl cursor-pointer transition w-full sm:w-auto relative">
                    <span className="text-xs font-bold text-gray-900 mb-1">Check-in & Check-out</span>
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedCheckIn) setTempCheckIn(selectedCheckIn);
                            if (selectedCheckOut) setTempCheckOut(selectedCheckOut);
                            setShowDatePicker(!showDatePicker);
                        }}
                        className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 p-0 w-full text-left flex items-center justify-between"
                    >
                        <span className={selectedCheckIn && selectedCheckOut ? 'text-gray-900' : 'text-gray-400'}>
                            {formatDateRange()}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-gray-400 ml-2" />
                    </button>
                    
                    {/* Date Picker Modal */}
                    {showDatePicker && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDatePicker(false)}></div>
                            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                                {renderCalendar()}
                                {(tempCheckIn || tempCheckOut) && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                        <p className="font-semibold mb-1">Selected Dates:</p>
                                        <p>Check-in: {tempCheckIn ? tempCheckIn.toLocaleDateString() : 'Not selected'}</p>
                                        <p>Check-out: {tempCheckOut ? tempCheckOut.toLocaleDateString() : 'Not selected'}</p>
                                    </div>
                                )}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleClearDates}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApplyDates}
                                        disabled={!tempCheckIn || !tempCheckOut}
                                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                                    >
                                        Apply Dates
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

                {/* Who + Search Button */}
                <div className="flex items-center justify-between px-2 sm:px-3 py-1 flex-1 min-w-[140px] sm:min-w-[160px] w-full sm:w-auto">
                    <div className="flex flex-col justify-center px-2 sm:px-4">
                        <span className="text-xs font-bold text-gray-900 mb-1">Who</span>
                        <select
                            value={searchFilters?.guests || 1}
                            onChange={(e) => setSearchFilters({ ...searchFilters, guests: parseInt(e.target.value) })}
                            className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Button */}
                    <button 
                        onClick={handleSearch}
                        className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 sm:p-4 transition duration-150 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        <LucideSearch className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Combined Component
export default function NavigationAndFilter({ currentPage, setPage, searchFilters, setSearchFilters, onSearch }) {
    return (
        <div className="w-full py-6 sm:py-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <NavigationTabs currentPage={currentPage} setPage={setPage} />
                <FilterSearch 
                    searchFilters={searchFilters} 
                    setSearchFilters={setSearchFilters}
                    onSearch={onSearch}
                />
            </div>
        </div>
    );
}

