import React, { useState, useEffect } from 'react';
import Header from './Header';
import CreateListingModal from './CreateListingModal';
import Wallet from './Wallet';
import AccountSettings from './AccountSettings';
import HostBookings from './HostBookings';
import Messages from './Messages';
import HostRulesCompliance from './HostRulesCompliance';
import { auth } from '../firebase';
import { TicketPercent, Tag as TagIcon, CheckCircle2, BarChart3, AlertTriangle, Pencil, Trash2, CalendarRange, Percent, CircleDollarSign, Plus } from 'lucide-react';
import { getHostListings, updateListing, getHostStats, getHostBookings, clearAllBookedDates, getUnreadMessageCount, createSampleCaviteListings, migrateListingsProvince, getHostPoints, getHostPointsHistory, redeemRewardWithPayPal, completeRewardRedemption, getWalletTransactions, createCoupon, updateCoupon, deleteCoupon, getHostCoupons, getUserData, updateHostRulesAccepted } from '../utils/firestoreUtils';

// --- SVG Icons ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ListingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MessagesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const CouponsIcon = () => <TicketPercent className="h-6 w-6" />;
const PaymentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const RewardsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
const BookingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;


// --- Sidebar Component - Responsive ---
const Sidebar = ({ activeView, setActiveView, onSignOut, isMobileMenuOpen, setMobileMenuOpen, cancellationRequestCount = 0, unreadMessageCount = 0 }) => {
    const navItems = [
        { name: 'Dashboard', view: 'Dashboard', icon: <DashboardIcon />, action: () => { setActiveView('Dashboard'); setMobileMenuOpen(false); } },
        { name: 'Listings', view: 'Listings', icon: <ListingsIcon />, action: () => { setActiveView('Listings'); setMobileMenuOpen(false); } },
        { name: 'Bookings', view: 'Bookings', icon: <BookingsIcon />, action: () => { setActiveView('Bookings'); setMobileMenuOpen(false); }, badge: cancellationRequestCount },
        { name: 'Calendar & Pricing', view: 'Calendar', icon: <CalendarIcon />, action: () => { setActiveView('Calendar'); setMobileMenuOpen(false); } },
        { name: 'Messages', view: 'Messages', icon: <MessagesIcon />, action: () => { setActiveView('Messages'); setMobileMenuOpen(false); }, badge: unreadMessageCount },
        { name: 'Coupons', view: 'Coupons', icon: <CouponsIcon />, action: () => { setActiveView('Coupons'); setMobileMenuOpen(false); } },
        { name: 'Payments & Earnings', view: 'Payments', icon: <PaymentsIcon />, action: () => { setActiveView('Payments'); setMobileMenuOpen(false); } },
        { name: 'Points & Rewards', view: 'Rewards', icon: <RewardsIcon />, action: () => { setActiveView('Rewards'); setMobileMenuOpen(false); } },
    ];
    
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block bg-white w-64 min-h-screen border-r border-gray-200 flex-shrink-0 shadow-sm">
                <nav className="p-4">
                    <ul className="space-y-1">
                        {navItems.map(item => (
                            <li key={item.name}>
                                <button 
                                    onClick={item.action}
                                    data-testid={`host-sidebar-${item.view.toLowerCase()}`}
                                    className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg font-semibold transition-colors relative ${
                                        activeView === item.view
                                            ? 'bg-teal-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
                    <div
                        className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="p-4">
                <ul className="space-y-1">
                    {navItems.map(item => (
                        <li key={item.name}>
                            <button 
                                onClick={item.action}
                                data-testid={`host-mobile-${item.view.toLowerCase()}`}
                                className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg font-semibold transition-colors relative ${
                                                activeView === item.view
                                        ? 'bg-teal-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
                </div>
            )}
        </>
    );
};

// --- Dashboard View Component ---
const DashboardView = ({ setActiveView }) => {
    const [stats, setStats] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    
    React.useEffect(() => {
        loadDashboardStats();
    }, []);
    
    const loadDashboardStats = async () => {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setError('You must be logged in');
            setIsLoading(false);
            return;
        }
        
        const result = await getHostStats(user.uid);
        if (result.success) {
            setStats(result.data);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };
    
    if (isLoading) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
                {/* Quick Stats Cards */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold text-teal-600">₱{stats?.totalEarnings?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <p className="text-sm text-gray-500">Active Listings</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.activeListings || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.confirmedBookings || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <p className="text-sm text-gray-500">Total Listings</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats?.totalListings || 0}</p>
                </div>
            </div>
            
            {/* Today & Upcoming - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Today's Check-ins</h3>
                    {stats?.todayBookings?.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                            {stats.todayBookings.map((booking, i) => {
                                // Helper function to safely format dates
                                const formatDate = (dateValue) => {
                                    if (!dateValue) return '—';
                                    try {
                                        let date;
                                        if (dateValue.toDate) {
                                            // Firestore Timestamp
                                            date = dateValue.toDate();
                                        } else if (dateValue.seconds) {
                                            // Firestore Timestamp object
                                            date = new Date(dateValue.seconds * 1000);
                                        } else if (typeof dateValue === 'string') {
                                            date = new Date(dateValue);
                                        } else {
                                            date = dateValue;
                                        }
                                        
                                        if (isNaN(date.getTime())) return '—';
                                        return date.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        });
                                    } catch {
                                        return '—';
                                    }
                                };
                                
                                return (
                                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-semibold">{booking.guestName}</p>
                                                <p className="text-sm text-gray-500">{booking.listingTitle}</p>
                                            </div>
                                            <span className="text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full text-sm">
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                                            <div className="flex items-center gap-1">
                                                <CalendarRange className="w-3 h-3" />
                                                <span><strong>Check-in:</strong> {formatDate(booking.checkIn)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CalendarRange className="w-3 h-3" />
                                                <span><strong>Check-out:</strong> {formatDate(booking.checkOut)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No check-ins today</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Upcoming Bookings</h3>
                    {stats?.upcomingBookings?.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                            {stats.upcomingBookings.map((booking, i) => {
                                // Helper function to safely format dates
                                const formatDate = (dateValue) => {
                                    if (!dateValue) return '—';
                                    try {
                                        let date;
                                        if (dateValue.toDate) {
                                            // Firestore Timestamp
                                            date = dateValue.toDate();
                                        } else if (dateValue.seconds) {
                                            // Firestore Timestamp object
                                            date = new Date(dateValue.seconds * 1000);
                                        } else if (typeof dateValue === 'string') {
                                            date = new Date(dateValue);
                                        } else {
                                            date = dateValue;
                                        }
                                        
                                        if (isNaN(date.getTime())) return '—';
                                        return date.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        });
                                    } catch {
                                        return '—';
                                    }
                                };
                                
                                return (
                                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-semibold">{booking.guestName}</p>
                                                <p className="text-sm text-gray-500">{booking.listingTitle}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                                            <div className="flex items-center gap-1">
                                                <CalendarRange className="w-3 h-3" />
                                                <span><strong>Check-in:</strong> {formatDate(booking.checkIn)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CalendarRange className="w-3 h-3" />
                                                <span><strong>Check-out:</strong> {formatDate(booking.checkOut)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No upcoming bookings</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Listings View Component ---
const ListingsView = ({ setActiveView, onEditListing }) => {
    const [listings, setListings] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [isCreatingSamples, setIsCreatingSamples] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState('all'); // 'all', 'home', 'experience', 'service'
    const [viewMode, setViewMode] = React.useState('published'); // 'published' or 'drafts'
    
    React.useEffect(() => {
        loadListings();
    }, []);
    
    const loadListings = async () => {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setError('You must be logged in');
            setIsLoading(false);
            return;
        }
        
        const result = await getHostListings(user.uid);
        if (result.success) {
            setListings(result.data);
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };
    
    const handleToggleActive = async (listingId, currentStatus) => {
        const newStatus = !currentStatus;
        const result = await updateListing(listingId, { 
            isActive: newStatus,
            status: newStatus ? 'active' : 'unlisted'
        });
        
        if (result.success) {
            // Refresh listings
            loadListings();
        } else {
            alert('Failed to update listing status');
        }
    };
    
    // Helper function to get price display
    const getPriceDisplay = (listing) => {
        if (listing.category === 'home') {
            return `₱${(listing.pricePerNight || 0).toLocaleString()}/night`;
        } else if (listing.category === 'experience') {
            return `₱${(listing.pricePerPerson || 0).toLocaleString()}/person`;
        } else if (listing.category === 'service') {
            return `₱${(listing.serviceRate || 0).toLocaleString()}/service`;
        }
        return `₱${(listing.pricePerNight || 0).toLocaleString()}/night`;
    };
    
    // Separate published listings and drafts
    const publishedListings = listings.filter(l => l.status !== 'draft');
    const draftListings = listings.filter(l => l.status === 'draft');
    
    // Get current listings based on view mode
    const currentListings = viewMode === 'drafts' ? draftListings : publishedListings;
    
    // Group all listings by category (for button counts) - only for published
    const allHomeListings = publishedListings.filter(l => l.category === 'home');
    const allExperienceListings = publishedListings.filter(l => l.category === 'experience');
    const allServiceListings = publishedListings.filter(l => l.category === 'service');
    
    // Group drafts by category (for button counts)
    const draftHomeListings = draftListings.filter(l => l.category === 'home');
    const draftExperienceListings = draftListings.filter(l => l.category === 'experience');
    const draftServiceListings = draftListings.filter(l => l.category === 'service');
    
    // Filter listings based on selected category and view mode
    const filteredListings = React.useMemo(() => {
        if (selectedCategory === 'all') {
            return currentListings;
        }
        return currentListings.filter(l => l.category === selectedCategory);
    }, [currentListings, selectedCategory]);
    
    // Group filtered listings by category for display
    const homeListings = filteredListings.filter(l => l.category === 'home');
    const experienceListings = filteredListings.filter(l => l.category === 'experience');
    const serviceListings = filteredListings.filter(l => l.category === 'service');
    
    const renderListingsGroup = (categoryListings, categoryTitle, categoryIcon) => {
        if (categoryListings.length === 0) return null;
    
        const isDraftView = viewMode === 'drafts';
    
    return (
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">{categoryIcon}</span>
                    {categoryTitle} ({categoryListings.length})
                </h3>
                
                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-6 font-semibold text-gray-600">Listing Name</th>
                                <th className="text-left py-3 px-6 font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-6 font-semibold text-gray-600">Price</th>
                                {!isDraftView && (
                                    <th className="text-left py-3 px-6 font-semibold text-gray-600">Active</th>
                                )}
                                <th className="py-3 px-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {categoryListings.map(listing => (
                                <tr key={listing.id}>
                                    <td className="py-4 px-6 font-medium">{listing.title || 'Untitled Draft'}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 text-sm rounded-full ${
                                            listing.status === 'active' ? 'bg-green-100 text-green-700' : 
                                            listing.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">{getPriceDisplay(listing)}</td>
                                    {!isDraftView && (
                                        <td className="py-4 px-6">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={listing.isActive}
                                                    onChange={() => handleToggleActive(listing.id, listing.isActive)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                            </label>
                                        </td>
                                    )}
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            onClick={() => onEditListing(listing.id)}
                                            className="text-teal-600 hover:underline font-semibold"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {categoryListings.map(listing => (
                        <div key={listing.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">{listing.title || 'Untitled Draft'}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{listing.category}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    listing.status === 'active' ? 'bg-green-100 text-green-700' : 
                                    listing.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-gray-700 font-medium">{getPriceDisplay(listing)}</p>
                                {!isDraftView && (
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={listing.isActive}
                                                onChange={() => handleToggleActive(listing.id, listing.isActive)}
                                            />
                                            <div className={`w-11 h-6 rounded-full shadow-inner transition ${
                                                listing.isActive ? 'bg-teal-500' : 'bg-gray-300'
                                            }`}></div>
                                            <div className={`absolute w-4 h-4 bg-white rounded-full shadow top-1 transition ${
                                                listing.isActive ? 'left-6' : 'left-1'
                                            }`}></div>
                                        </div>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {listing.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                )}
                            </div>
                            <button 
                                onClick={() => onEditListing(listing.id)}
                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                Edit Listing
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    const handleCreateSampleListings = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in first!');
            return;
        }

        if (!window.confirm('This will create 2 sample home listings in Cavite. Continue?')) {
            return;
        }

        setIsCreatingSamples(true);
        try {
            const results = await createSampleCaviteListings(user.uid);
            console.log('Results:', results);
            
            const successCount = results.filter(r => r.success).length;
            if (successCount === 2) {
                alert('✅ Successfully created 2 sample listings!');
                loadListings(); // Refresh the listings
            } else {
                alert(`⚠️ Created ${successCount} out of 2 listings. Check console for details.`);
                loadListings();
            }
        } catch (error) {
            console.error('Error creating sample listings:', error);
            alert('❌ Error creating listings: ' + error.message);
        } finally {
            setIsCreatingSamples(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Your Listings</h2>
            </div>
            
            {/* View Mode Toggle: Published vs Drafts */}
            <div className="mb-6 flex gap-3">
                <button
                    onClick={() => {
                        setViewMode('published');
                        setSelectedCategory('all');
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        viewMode === 'published'
                            ? 'bg-teal-600 text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                    }`}
                >
                    Published ({publishedListings.length})
                </button>
                <button
                    onClick={() => {
                        setViewMode('drafts');
                        setSelectedCategory('all');
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        viewMode === 'drafts'
                            ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-yellow-500 hover:text-yellow-600'
                    }`}
                >
                    Drafts ({draftListings.length})
                </button>
            </div>
            
            {/* Category Filter Buttons */}
            {!isLoading && currentListings.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-3">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedCategory === 'all'
                                ? viewMode === 'drafts' 
                                    ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                                    : 'bg-teal-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                        }`}
                    >
                        All ({currentListings.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('home')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedCategory === 'home'
                                ? viewMode === 'drafts'
                                    ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                                    : 'bg-teal-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                        }`}
                    >
                        Homes ({viewMode === 'drafts' ? draftHomeListings.length : allHomeListings.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('experience')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedCategory === 'experience'
                                ? viewMode === 'drafts'
                                    ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                                    : 'bg-teal-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                        }`}
                    >
                        Experiences ({viewMode === 'drafts' ? draftExperienceListings.length : allExperienceListings.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('service')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            selectedCategory === 'service'
                                ? viewMode === 'drafts'
                                    ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                                    : 'bg-teal-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                        }`}
                    >
                        Services ({viewMode === 'drafts' ? draftServiceListings.length : allServiceListings.length})
                    </button>
                </div>
            )}
            
            {isLoading ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-500">Loading listings...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            ) : currentListings.length === 0 ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-600 mb-4">
                        {viewMode === 'drafts' 
                            ? "You don't have any drafts yet." 
                            : "You haven't created any listings yet."}
                    </p>
                    <p className="text-sm text-gray-500">
                        {viewMode === 'drafts'
                            ? 'Save a listing as draft to see it here!'
                            : 'Click "+ Create New Listing" in the header to get started!'}
                    </p>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-600 mb-4">No {selectedCategory === 'home' ? 'Homes' : selectedCategory === 'experience' ? 'Experiences' : 'Services'} listings found.</p>
                </div>
            ) : selectedCategory === 'all' ? (
                <div className="space-y-6">
                    {/* Render listings grouped by category when "All" is selected */}
                    {renderListingsGroup(homeListings, 'Homes', '🏠')}
                    {renderListingsGroup(experienceListings, 'Experiences', '🎈')}
                    {renderListingsGroup(serviceListings, 'Services', '🛎️')}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Render filtered listings when a specific category is selected */}
                    {selectedCategory === 'home' && renderListingsGroup(homeListings, 'Homes', '🏠')}
                    {selectedCategory === 'experience' && renderListingsGroup(experienceListings, 'Experiences', '🎈')}
                    {selectedCategory === 'service' && renderListingsGroup(serviceListings, 'Services', '🛎️')}
                </div>
            )}
        </div>
    );
};

// --- Calendar & Pricing View ---
const CalendarView = () => {
    const [listings, setListings] = React.useState([]);
    const [selectedListing, setSelectedListing] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    
    // Multi-select states
    const [selectedDates, setSelectedDates] = React.useState([]);
    const [calendarMode, setCalendarMode] = React.useState('block'); // 'block', 'special', 'booked', or 'unbook'
    const [specialPriceInput, setSpecialPriceInput] = React.useState('');
    
    React.useEffect(() => {
        loadListings();
    }, []);
    
    const loadListings = async () => {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }
        
        const result = await getHostListings(user.uid);
        if (result.success) {
            setListings(result.data);
            if (result.data.length > 0) {
                // If a listing is already selected, update it with fresh data
                setSelectedListing(prev => {
                    if (prev) {
                        const updatedListing = result.data.find(l => l.id === prev.id);
                        if (updatedListing) {
                            return updatedListing;
                        }
                    }
                    // If no selected listing or it no longer exists, select first one
                    return result.data[0];
                });
            }
        }
        setIsLoading(false);
    };
    
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
    
    const isDateBooked = (date) => {
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return selectedListing?.bookedDates?.includes(dateStr);
    };
    
    const isDateBlocked = (date) => {
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return selectedListing?.blockedDates?.includes(dateStr);
    };
    
    const hasSpecialPrice = (date) => {
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return selectedListing?.specialRates && selectedListing.specialRates[dateStr];
    };
    
    const getSpecialPrice = (date) => {
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return selectedListing?.specialRates && selectedListing.specialRates[dateStr] ? selectedListing.specialRates[dateStr] : null;
    };
    
    const getDateStatus = (date) => {
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (selectedListing?.blockedDates?.includes(dateStr)) return 'blocked';
        if (selectedListing?.bookedDates?.includes(dateStr)) return 'booked';
        if (selectedListing?.specialRates && selectedListing.specialRates[dateStr]) return 'special';
        return 'available';
    };
    
    const handleDateClick = (date) => {
        if (isDatePast(date)) return;
        
        // Use local date components to avoid timezone issues (matching guest calendar)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // In unbook mode, allow clicking on booked dates
        if (calendarMode === 'unbook') {
            if (isDateBooked(date)) {
                setSelectedDates(prev => {
                    if (prev.includes(dateStr)) {
                        return prev.filter(d => d !== dateStr);
                    } else {
                        return [...prev, dateStr];
                    }
                });
            }
        } else {
            // For other modes, don't allow clicking on blocked or booked dates
            if (isDateBlocked(date) || isDateBooked(date)) return;
            
            setSelectedDates(prev => {
                if (prev.includes(dateStr)) {
                    return prev.filter(d => d !== dateStr);
                } else {
                    return [...prev, dateStr];
                }
            });
        }
    };
    
    const handleApplyBlockDates = async () => {
        if (!selectedListing || selectedDates.length === 0) return;
        
        const updatedBlockedDates = [...new Set([...(selectedListing.blockedDates || []), ...selectedDates])];
        const result = await updateListing(selectedListing.id, {
            blockedDates: updatedBlockedDates
        });
        
        if (result.success) {
            alert(`${selectedDates.length} date(s) have been blocked successfully!`);
            setSelectedDates([]);
            loadListings();
        } else {
            alert('Failed to block dates');
        }
    };
    
    const handleApplySpecialPrice = async () => {
        if (!selectedListing || selectedDates.length === 0 || !specialPriceInput) return;
        
        const updatedSpecialRates = { ...(selectedListing.specialRates || {}) };
        selectedDates.forEach(date => {
            updatedSpecialRates[date] = parseFloat(specialPriceInput);
        });
        
        const result = await updateListing(selectedListing.id, {
            specialRates: updatedSpecialRates
        });
        
        if (result.success) {
            alert(`Special price ₱${specialPriceInput} set for ${selectedDates.length} date(s)!`);
            setSelectedDates([]);
            setSpecialPriceInput('');
            loadListings();
        } else {
            alert('Failed to set special pricing');
        }
    };

    const handleMarkBookedDates = async () => {
        if (!selectedListing || selectedDates.length === 0) return;
        
        const existingBookedDates = selectedListing.bookedDates || [];
        const updatedBookedDates = [...new Set([...existingBookedDates, ...selectedDates])];
        
        const result = await updateListing(selectedListing.id, {
            bookedDates: updatedBookedDates
        });
        
        if (result.success) {
            alert(`${selectedDates.length} date(s) marked as booked successfully!`);
            setSelectedDates([]);
            // Update the selected listing state immediately
            setSelectedListing(prev => ({
                ...prev,
                bookedDates: updatedBookedDates
            }));
            // Reload listings to refresh the calendar
            await loadListings();
        } else {
            alert('Failed to mark dates as booked');
        }
    };

    const handleUnbookDates = async () => {
        if (!selectedListing || selectedDates.length === 0) return;
        
        const existingBookedDates = selectedListing.bookedDates || [];
        const updatedBookedDates = existingBookedDates.filter(d => !selectedDates.includes(d));
        
        const result = await updateListing(selectedListing.id, {
            bookedDates: updatedBookedDates
        });
        
        if (result.success) {
            alert(`${selectedDates.length} date(s) unbooked successfully!`);
            setSelectedDates([]);
            // Update the selected listing state immediately
            setSelectedListing(prev => ({
                ...prev,
                bookedDates: updatedBookedDates
            }));
            // Reload listings to refresh the calendar
            await loadListings();
        } else {
            alert('Failed to unbook dates');
        }
    };

    const handleClearAllBookedDates = async () => {
        if (!selectedListing) return;
        
        if (!window.confirm('Are you sure you want to clear ALL booked dates for this listing? This action cannot be undone.')) {
            return;
        }
        
        const result = await updateListing(selectedListing.id, {
            bookedDates: []
        });
        
        if (result.success) {
            alert('All booked dates have been cleared for this listing!');
            // Update the selected listing state immediately
            setSelectedListing(prev => ({
                ...prev,
                bookedDates: []
            }));
            // Reload listings to refresh the calendar
            await loadListings();
        } else {
            alert('Failed to clear booked dates');
        }
    };

    const handleClearAllListingsBookedDates = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert('❌ You must be logged in to clear booked dates');
            return;
        }
        
        if (!window.confirm('⚠️ WARNING: This will clear ALL booked dates from ALL YOUR listings. This action cannot be undone. Are you absolutely sure?')) {
            return;
        }
        
        if (!window.confirm('This is your last chance. Click OK to proceed with clearing all booked dates from your listings.')) {
            return;
        }
        
        try {
            const result = await clearAllBookedDates(user.uid);
            if (result.success) {
                alert(`✅ ${result.message || 'All booked dates have been cleared from your listings!'}`);
                // Reload listings to refresh the calendar
                await loadListings();
            } else {
                alert('❌ Failed to clear booked dates: ' + result.error);
            }
        } catch (error) {
            console.error('Error clearing all booked dates:', error);
            alert('❌ An error occurred while clearing booked dates');
        }
    };
    
    const handleUnblockDate = async (date) => {
        if (!selectedListing) return;
        
        const updatedBlockedDates = selectedListing.blockedDates.filter(d => d !== date);
        const result = await updateListing(selectedListing.id, {
            blockedDates: updatedBlockedDates
        });
        
        if (result.success) {
            loadListings();
        }
    };
    
    const handleRemoveSpecialRate = async (date) => {
        if (!selectedListing) return;
        
        const updatedSpecialRates = { ...(selectedListing.specialRates || {}) };
        delete updatedSpecialRates[date];
        
        const result = await updateListing(selectedListing.id, {
            specialRates: updatedSpecialRates
        });
        
        if (result.success) {
            loadListings();
        }
    };
    
    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
        const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Add day name headers
        dayNames.forEach(day => {
            days.push(
                <div key={`header-${day}`} className="text-center font-semibold text-gray-700 p-2 text-sm">
                    {day}
                </div>
            );
        });
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            // Use local date components to avoid timezone issues (matching guest calendar)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayStr}`;
            
            const isPast = isDatePast(date);
            const isBlocked = isDateBlocked(date);
            const isBooked = isDateBooked(date);
            const isSpecialPriced = hasSpecialPrice(date);
            const isSelected = selectedDates.includes(dateStr);
            const isToday = date.toDateString() === today.toDateString();
            const specialPrice = getSpecialPrice(date);
            
            let bgColor = 'bg-white hover:bg-gray-100';
            let textColor = 'text-gray-900';
            let cursor = 'cursor-pointer';
            let borderColor = 'border-transparent';
            
            if (isPast) {
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-400';
                cursor = 'cursor-not-allowed';
            } else if (isBlocked) {
                bgColor = 'bg-red-100';
                textColor = 'text-red-600';
                cursor = 'cursor-not-allowed';
            } else if (isBooked) {
                bgColor = 'bg-orange-100';
                textColor = 'text-orange-600';
                // Allow clicking on booked dates only in unbook mode
                if (calendarMode !== 'unbook') {
                    cursor = 'cursor-not-allowed';
                }
            } else if (isSelected) {
                if (calendarMode === 'block') {
                    bgColor = 'bg-red-200 hover:bg-red-300';
                    borderColor = 'border-red-400';
                } else if (calendarMode === 'special') {
                    bgColor = 'bg-teal-200 hover:bg-teal-300';
                    borderColor = 'border-teal-400';
                } else if (calendarMode === 'booked') {
                    bgColor = 'bg-orange-200 hover:bg-orange-300';
                    borderColor = 'border-orange-400';
                } else if (calendarMode === 'unbook') {
                    bgColor = 'bg-orange-200 hover:bg-orange-300';
                    borderColor = 'border-orange-400';
                }
                textColor = 'text-gray-900 font-bold';
            } else if (isSpecialPriced && !isBlocked && !isBooked) {
                bgColor = 'bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100';
                borderColor = 'border-purple-300';
            }
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(date)}
                    disabled={isPast || (isBlocked && calendarMode !== 'unbook') || (isBooked && calendarMode !== 'unbook')}
                    className={`p-2 text-sm rounded-lg border-2 ${borderColor} ${bgColor} ${textColor} ${cursor} transition-all relative`}
                >
                    <div className="font-medium">{day}</div>
                    {isSpecialPriced && !isBlocked && !isBooked && !isPast && (
                        <div className="text-[9px] font-bold text-purple-600 mt-0.5">
                            ₱{specialPrice}
                        </div>
                    )}
                </button>
            );
        }
        
        return (
            <div>
                {/* Month Navigation - Responsive */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm sm:text-base"
                    >
                        <span className="hidden sm:inline">&larr; Previous</span>
                        <span className="sm:hidden">&larr;</span>
                    </button>
                    <h4 className="text-base sm:text-lg md:text-xl font-bold">{monthYear}</h4>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm sm:text-base"
                    >
                        <span className="hidden sm:inline">Next &rarr;</span>
                        <span className="sm:hidden">&rarr;</span>
                    </button>
                </div>
                
                {/* Calendar Grid - Responsive */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days}
                </div>
            </div>
        );
    };
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Calendar & Pricing</h2>
            
            {isLoading ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-500">Loading...</p>
                </div>
            ) : listings.length === 0 ? (
                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-600">No listings available. Create a listing first.</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {/* Listing Selector with Category Filter */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <label className="block text-sm font-medium mb-2">Select Listing</label>
                        <select
                            value={selectedListing?.id || ''}
                            onChange={(e) => {
                                setSelectedListing(listings.find(l => l.id === e.target.value));
                                setSelectedDates([]);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">-- Select a listing --</option>
                            
                            {/* Homes Category */}
                            {listings.filter(l => l.category === 'home').length > 0 && (
                                <optgroup label="🏠 Homes">
                                    {listings.filter(l => l.category === 'home').map(listing => (
                                        <option key={listing.id} value={listing.id}>
                                            {listing.title} - ₱{(listing.pricePerNight || 0).toLocaleString()}/night
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            
                            {/* Experiences Category */}
                            {listings.filter(l => l.category === 'experience').length > 0 && (
                                <optgroup label="🎈 Experiences">
                                    {listings.filter(l => l.category === 'experience').map(listing => (
                                        <option key={listing.id} value={listing.id}>
                                            {listing.title} - ₱{(listing.pricePerPerson || 0).toLocaleString()}/person
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            
                            {/* Services Category */}
                            {listings.filter(l => l.category === 'service').length > 0 && (
                                <optgroup label="🛎️ Services">
                                    {listings.filter(l => l.category === 'service').map(listing => (
                                <option key={listing.id} value={listing.id}>
                                            {listing.title} - ₱{(listing.serviceRate || 0).toLocaleString()}/service
                                </option>
                            ))}
                                </optgroup>
                            )}
                        </select>
                    </div>
                    
                    {/* Calendar Mode Selector */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                        <h3 className="font-bold text-lg mb-4">Select Calendar Mode</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                                onClick={() => {
                                    setCalendarMode('block');
                                    setSelectedDates([]);
                                }}
                                className={`py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                                    calendarMode === 'block'
                                        ? 'bg-red-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400'
                                }`}
                            >
                                🚫 Block
                            </button>
                            <button
                                onClick={() => {
                                    setCalendarMode('special');
                                    setSelectedDates([]);
                                }}
                                className={`py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                                    calendarMode === 'special'
                                        ? 'bg-teal-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-400'
                                }`}
                            >
                                💰 Special Price
                            </button>
                            <button
                                onClick={() => {
                                    setCalendarMode('booked');
                                    setSelectedDates([]);
                                }}
                                className={`py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                                    calendarMode === 'booked'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                                }`}
                            >
                                📅 Mark Booked
                            </button>
                            <button
                                onClick={() => {
                                    setCalendarMode('unbook');
                                    setSelectedDates([]);
                                }}
                                className={`py-3 px-4 rounded-lg font-semibold transition-all text-sm ${
                                    calendarMode === 'unbook'
                                        ? 'bg-orange-600 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400'
                                }`}
                            >
                                ✅ Unbook Dates
                            </button>
                        </div>
                    </div>
                    
                    {/* Interactive Calendar */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">
                                {calendarMode === 'block' ? 'Select Dates to Block' : 
                                 calendarMode === 'special' ? 'Select Dates for Special Pricing' :
                                 calendarMode === 'booked' ? 'Select Dates to Mark as Booked' :
                                 calendarMode === 'unbook' ? 'Select Dates to Unbook' :
                                 'Select Dates'}
                            </h3>
                            {selectedDates.length > 0 && (
                                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                    {selectedDates.length} date(s) selected
                                </span>
                            )}
                        </div>
                        
                        {/* Legend - Matching Guest Calendar */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                                <span className="text-red-600">Blocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                                <span className="text-orange-600">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-300 rounded"></div>
                                <span className="text-purple-600">Special Pricing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                                <span>Available</span>
                            </div>
                        </div>
                        
                        {/* Clear Booked Dates Buttons */}
                        <div className="mb-4 flex flex-wrap gap-3">
                            {selectedListing?.bookedDates && selectedListing.bookedDates.length > 0 && (
                                <button
                                    onClick={handleClearAllBookedDates}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    🗑️ Clear Booked Dates for This Listing
                                </button>
                            )}
                            <button
                                onClick={handleClearAllListingsBookedDates}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                🗑️ Clear ALL Booked Dates (All Listings)
                            </button>
                        </div>
                        
                        {renderCalendar()}
                        
                        {/* Action Buttons */}
                        {selectedDates.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                {calendarMode === 'block' ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Block <span className="font-bold">{selectedDates.length}</span> selected date(s)?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setSelectedDates([])}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApplyBlockDates}
                                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Block Dates
                                            </button>
                                        </div>
                                    </div>
                                ) : calendarMode === 'special' ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-700">
                                            Set special price for <span className="font-bold">{selectedDates.length}</span> selected date(s)
                                        </p>
                                        <div className="flex gap-3">
                            <input
                                                type="number"
                                                value={specialPriceInput}
                                                onChange={(e) => setSpecialPriceInput(e.target.value)}
                                                placeholder="Enter price (₱)"
                                                min="0"
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                                                onClick={() => {
                                                    setSelectedDates([]);
                                                    setSpecialPriceInput('');
                                                }}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApplySpecialPrice}
                                                disabled={!specialPriceInput}
                                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300"
                                            >
                                                Apply Price
                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Base price: ₱{selectedListing?.pricePerNight || selectedListing?.pricePerPerson || selectedListing?.serviceRate || 0}/night
                                        </p>
                                    </div>
                                ) : calendarMode === 'booked' ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Mark <span className="font-bold">{selectedDates.length}</span> selected date(s) as booked?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setSelectedDates([])}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleMarkBookedDates}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Mark as Booked
                                            </button>
                                        </div>
                                    </div>
                                ) : calendarMode === 'unbook' ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Unbook <span className="font-bold">{selectedDates.length}</span> selected date(s)?
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setSelectedDates([])}
                                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUnbookDates}
                                                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                            >
                                                Unbook Dates
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                        </div>
                        
                    {/* Blocked Dates Summary */}
                        {selectedListing?.blockedDates?.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <h3 className="font-bold text-lg mb-4">Blocked Dates ({selectedListing.blockedDates.length})</h3>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {selectedListing.blockedDates.sort().map((date, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                                            <span className="text-sm">{date}</span>
                                            <button
                                                onClick={() => handleUnblockDate(date)}
                                            className="text-red-600 hover:text-red-800 font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    
                    {/* Special Rates Summary */}
                    {selectedListing?.specialRates && Object.keys(selectedListing.specialRates).length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <h3 className="font-bold text-lg mb-4">Special Pricing ({Object.keys(selectedListing.specialRates).length})</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {Object.entries(selectedListing.specialRates).sort(([a], [b]) => a.localeCompare(b)).map(([date, price]) => (
                                        <div key={date} className="flex items-center justify-between bg-teal-50 border border-teal-200 px-4 py-2 rounded-lg">
                                        <span className="text-sm font-medium">{date}</span>
                                            <div className="flex items-center gap-4">
                                            <span className="font-bold text-teal-700">₱{price}</span>
                                                <button
                                                    onClick={() => handleRemoveSpecialRate(date)}
                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};

const MessagesView = ({ setActiveView }) => (
    <Messages setPage={setActiveView} />
);

const CouponModal = ({ isOpen, onClose, onSubmit, isSaving, initialData }) => {
    const [form, setForm] = useState({
        code: initialData?.code || '',
        type: initialData?.type || 'percentage',
        value: initialData?.value?.toString() || '',
        usageLimitPerAccount: initialData?.usageLimitPerAccount?.toString() || '',
        description: initialData?.description || '',
        minAmount: initialData?.minAmount?.toString() || '',
        validFrom: initialData?.validFrom || null,
        validTo: initialData?.validTo || null,
    });
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(initialData?.validFrom || new Date());
    const [tempRange, setTempRange] = useState({
        start: initialData?.validFrom || new Date(),
        end: initialData?.validTo || new Date(),
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                code: initialData?.code || '',
                type: initialData?.type || 'percentage',
                value: initialData?.value?.toString() || '',
                usageLimitPerAccount: initialData?.usageLimitPerAccount?.toString() || '',
                description: initialData?.description || '',
                minAmount: initialData?.minAmount?.toString() || '',
                validFrom: initialData?.validFrom || null,
                validTo: initialData?.validTo || null,
            });
            setTempRange({
                start: initialData?.validFrom || new Date(),
                end: initialData?.validTo || new Date(),
            });
            setCalendarMonth(initialData?.validFrom || new Date());
            setError('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) {
        return null;
    }

    const formatRangeLabel = () => {
        if (!form.validFrom || !form.validTo) return 'Select validity dates';
        return `${form.validFrom.toLocaleDateString()} - ${form.validTo.toLocaleDateString()}`;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const handleDateClick = (date) => {
        const { start, end } = tempRange;
        if (!start || (start && end)) {
            setTempRange({ start: date, end: null });
        } else if (date < start) {
            setTempRange({ start: date, end: null });
        } else {
            setTempRange({ start, end: date });
        }
    };

    const applyDateRange = () => {
        if (!tempRange.start || !tempRange.end) {
            setError('Please select a valid start and end date.');
            return;
        }
        setForm((prev) => ({
            ...prev,
            validFrom: tempRange.start,
            validTo: tempRange.end,
        }));
        setShowDatePicker(false);
    };

    const clearDateRange = () => {
        setTempRange({ start: null, end: null });
        setForm((prev) => ({ ...prev, validFrom: null, validTo: null }));
    };

    const renderDatePicker = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(calendarMonth);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells = [];
        dayNames.forEach((day) => {
            cells.push(
                <div key={`header-${day}`} className="text-center font-semibold text-gray-700 text-xs py-1">
                    {day}
                </div>
            );
        });

        for (let i = 0; i < startingDayOfWeek; i++) {
            cells.push(<div key={`empty-${i}`} className="py-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const isPast = date < today;
            const isSelectedStart = tempRange.start && date.toDateString() === tempRange.start.toDateString();
            const isSelectedEnd = tempRange.end && date.toDateString() === tempRange.end.toDateString();
            const isInRange =
                tempRange.start &&
                tempRange.end &&
                date > tempRange.start &&
                date < tempRange.end;

            let bgClass = 'bg-white';
            if (isSelectedStart || isSelectedEnd) {
                bgClass = 'bg-teal-600 text-white';
            } else if (isInRange) {
                bgClass = 'bg-teal-100 text-teal-700';
            }

            cells.push(
                <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => handleDateClick(date)}
                    className={`py-2 rounded-lg text-sm transition ${bgClass} ${
                        isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-teal-50'
                    }`}
                >
                    {day}
                </button>
            );
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowDatePicker(false)} />
                <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() =>
                                setCalendarMonth(
                                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                                )
                            }
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                        >
                            Prev
                        </button>
                        <h3 className="font-semibold text-gray-800">
                            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            type="button"
                            onClick={() =>
                                setCalendarMonth(
                                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                                )
                            }
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                        >
                            Next
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">{cells}</div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div>
                            <p className="font-medium text-gray-700">
                                Start:{' '}
                                {tempRange.start ? tempRange.start.toLocaleDateString() : '—'}
                            </p>
                            <p className="font-medium text-gray-700">
                                End:{' '}
                                {tempRange.end ? tempRange.end.toLocaleDateString() : '—'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={clearDateRange}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={applyDateRange}
                                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.code.trim()) {
            setError('Coupon name is required.');
            return;
        }
        if (!form.value || Number(form.value) <= 0) {
            setError('Enter a valid discount value.');
            return;
        }
        if (form.type === 'percentage' && Number(form.value) > 100) {
            setError('Percentage discount cannot exceed 100%.');
            return;
        }
        if (!form.usageLimitPerAccount || Number(form.usageLimitPerAccount) <= 0) {
            setError('Usage limit per account must be at least 1.');
            return;
        }
        if (!form.minAmount || Number(form.minAmount) < 0) {
            setError('Minimum amount must be zero or greater.');
            return;
        }
        if (!form.validFrom || !form.validTo) {
            setError('Please select coupon validity dates.');
            return;
        }
        if (form.validTo < form.validFrom) {
            setError('Validity end date must be after the start date.');
            return;
        }

        const submission = {
            code: form.code.trim().toUpperCase(),
            type: form.type,
            value: Number(form.value),
            usageLimitPerAccount: Number(form.usageLimitPerAccount),
            description: form.description?.trim() || '',
            minAmount: Number(form.minAmount),
            validFrom: form.validFrom,
            validTo: form.validTo,
            isActive: true,
        };

        const result = await onSubmit(submission);
        if (!result.success) {
            setError(result.error || 'Failed to save coupon.');
        }
    };

    const isEditing = Boolean(initialData);

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditing
                                    ? 'Update the coupon details and availability.'
                                    : 'Define discounts that guests can apply to their bookings.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <TagIcon className="w-4 h-4" /> Coupon Name
                            </label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                                }
                                placeholder="EX: SUMMER2025"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 uppercase"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                        value: '',
                                    }))
                                }
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                required
                            >
                                <option value="percentage">Percentage Discount</option>
                                <option value="fixed">Fixed Amount Discount</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                {form.type === 'percentage' ? <Percent className="w-4 h-4" /> : <CircleDollarSign className="w-4 h-4" />}
                                {form.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₱)'}
                            </label>
                            <input
                                type="number"
                                value={form.value}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, value: e.target.value }))
                                }
                                min="0"
                                max={form.type === 'percentage' ? '100' : undefined}
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Usage Limit per Account</label>
                            <input
                                type="number"
                                value={form.usageLimitPerAccount}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, usageLimitPerAccount: e.target.value }))
                                }
                                min="1"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Minimum Amount (₱)</label>
                            <input
                                type="number"
                                value={form.minAmount}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, minAmount: e.target.value }))
                                }
                                min="0"
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <CalendarRange className="w-4 h-4" /> Validity
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowDatePicker(true)}
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-left hover:border-teal-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                            >
                                {formatRangeLabel()}
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">Description (optional)</label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                                rows={3}
                                placeholder="Notes or conditions for this coupon..."
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:bg-gray-300"
                        >
                            {isSaving ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
            {showDatePicker && renderDatePicker()}
        </>
    );
};

const CouponsView = () => {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const loadCoupons = async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('You must be logged in to manage coupons.');
                setIsLoading(false);
                return;
            }
            const result = await getHostCoupons(user.uid);
            if (result.success) {
                setCoupons(result.data || []);
            } else {
                setError(result.error || 'Failed to load coupons.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load coupons.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const stats = React.useMemo(() => {
        const total = coupons.length;
        const active = coupons.filter((c) => c.isCurrentlyActive).length;
        const totalUsage = coupons.reduce((sum, c) => sum + Number(c.totalUsage || 0), 0);
        const expired = coupons.filter((c) => !c.isCurrentlyActive).length;
        return { total, active, totalUsage, expired };
    }, [coupons]);

    const handleOpenModal = (coupon = null) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCoupon(null);
    };

    const handleSubmitCoupon = async (payload) => {
        try {
            setIsSaving(true);
            const user = auth.currentUser;
            if (!user) {
                setIsSaving(false);
                return { success: false, error: 'You must be logged in.' };
            }
            let result;
            if (editingCoupon) {
                result = await updateCoupon(editingCoupon.id, user.uid, payload);
                if (result.success) {
                    alert('Coupon updated successfully.');
                }
            } else {
                result = await createCoupon(user.uid, payload);
                if (result.success) {
                    alert('Coupon created successfully.');
                }
            }
            if (result.success) {
                handleCloseModal();
                await loadCoupons();
            }
            return result;
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        const confirmation = window.confirm('Delete this coupon? This action cannot be undone.');
        if (!confirmation) return;
        try {
            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in.');
                return;
            }
            const result = await deleteCoupon(couponId, user.uid);
            if (result.success) {
                alert('Coupon deleted.');
                loadCoupons();
            } else {
                alert(result.error || 'Failed to delete coupon.');
            }
        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to delete coupon.');
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Coupon Management</h2>
                    <p className="text-sm text-gray-600">Make and handle sales coupons for bookings.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-full">
                        <TicketPercent className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Total Coupons</p>
                        <h3 className="text-2xl font-bold text-teal-600">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-full">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Active Coupons</p>
                        <h3 className="text-2xl font-bold text-teal-600">{stats.active}</h3>
                    </div>
                </div>
                <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-full">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Total Usage</p>
                        <h3 className="text-2xl font-bold text-teal-600">{stats.totalUsage}</h3>
                    </div>
                </div>
                <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-500 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Expired Coupons</p>
                        <h3 className="text-2xl font-bold text-red-500">{stats.expired}</h3>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500">
                    Loading coupons...
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                    {error}
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Coupons Yet</h3>
                    <p className="text-gray-600">Create your first coupon to offer special deals to your guests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {coupons.map((coupon) => {
                        const valueLabel =
                            coupon.type === 'percentage'
                                ? `${coupon.value}%`
                                : `₱${Number(coupon.value || 0).toLocaleString()}`;
                        const status = coupon.isCurrentlyActive ? 'Active' : 'Expired';
                        return (
                            <div
                                key={coupon.id}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 flex-1 text-sm">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Coupon Name</p>
                                            <p className="font-semibold text-gray-900">{coupon.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Type</p>
                                            <p className="font-semibold text-gray-900">
                                                {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Value</p>
                                            <p className="font-semibold text-teal-600">{valueLabel}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Usage</p>
                                            <p className="font-semibold text-gray-900">
                                                {coupon.totalUsage || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Valid Until</p>
                                            <p className="font-semibold text-gray-900">{formatDate(coupon.validTo)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">Status</p>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                                    coupon.isCurrentlyActive
                                                        ? 'bg-teal-100 text-teal-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}
                                            >
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(coupon)}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-teal-600"
                                            title="Edit coupon"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                            className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CouponModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitCoupon}
                isSaving={isSaving}
                initialData={editingCoupon}
            />
        </div>
    );
};

const PaymentsView = () => (
    <div className="p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Payments & Earnings</h2>
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
            <p className="text-gray-600">Track your earnings and payment history.</p>
        </div>
    </div>
);

const SettingsView = () => (
    <div className="p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Profile & Settings</h2>
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
            <p className="text-gray-600">Manage your host profile and account settings.</p>
        </div>
    </div>
);

// Points History Panel Component
const PointsHistoryPanel = ({ hostId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (hostId) {
            loadHistory();
        }
    }, [hostId]);

    const loadHistory = async () => {
        if (!hostId) return;
        setLoading(true);
        try {
            const result = await getHostPointsHistory(hostId);
            if (result.success) {
                setHistory(result.history);
            }
        } catch (error) {
            console.error('Error loading points history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';
        try {
            let date;
            if (dateValue instanceof Date) {
                date = dateValue;
            } else if (dateValue.toDate) {
                date = dateValue.toDate();
            } else if (dateValue.seconds) {
                date = new Date(dateValue.seconds * 1000);
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
            } else {
                date = new Date(dateValue);
            }
            
            if (isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '—';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'listing':
                return '🏠';
            case 'review':
                return '⭐';
            case 'first_booking':
                return '🎯';
            case 'multiple_bookings':
                return '📅';
            default:
                return '📝';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'listing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'review':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'first_booking':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'multiple_bookings':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Loading points history...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No points history yet. Start earning points by creating listings and getting bookings!</p>
            </div>
        );
    }

    return (
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {history.map((item, index) => (
                <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getTypeColor(item.type)} hover:shadow-md transition-all`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="text-2xl">{getTypeIcon(item.type)}</div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 mb-1">{item.description}</p>
                                <p className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">Criteria:</span> {item.criteria}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-teal-600">+{item.points} pts</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RewardsView = () => {
    const [activeSection, setActiveSection] = useState('earn'); // 'earn', 'marketplace', or 'transactions'
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(null); // Track which reward is being redeemed
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    
    useEffect(() => {
        loadPoints();
        if (activeSection === 'transactions') {
            loadTransactions();
        }
    }, [activeSection]);
    
    const loadPoints = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        setLoading(true);
        const result = await getHostPoints(user.uid);
        if (result.success) {
            setPoints(result.points);
        }
        setLoading(false);
    };
    
    const loadTransactions = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        setLoadingTransactions(true);
        try {
            const result = await getWalletTransactions(user.uid, 100);
            if (result.success) {
                // Filter only reward transactions
                const rewardTransactions = result.data.filter(tx => 
                    tx.type === 'reward' && tx.meta?.rewardType === 'points_redeemed'
                );
                setTransactions(rewardTransactions);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };
    
    const handleRedeem = async (rewardPoints, rewardAmount) => {
        const user = auth.currentUser;
        if (!user) return;
        
        if (points < rewardPoints) {
            alert('Insufficient points!');
            return;
        }
        
        if (!window.confirm(`Redeem ${rewardPoints} points for ₱${rewardAmount}?`)) {
            return;
        }
        
        setRedeeming(rewardPoints);
        try {
            // Deduct points
            const deductResult = await redeemRewardWithPayPal(user.uid, rewardPoints, rewardAmount, true);
            
            if (!deductResult.success) {
                alert('Failed to redeem reward: ' + deductResult.error);
                setRedeeming(null);
                return;
            }
            
            // Update points immediately
            setPoints(deductResult.newPoints);
            
            // Add money to wallet directly (no PayPal needed)
            const completeResult = await completeRewardRedemption(
                user.uid, 
                rewardPoints, 
                rewardAmount, 
                { id: `reward_${Date.now()}` } // Mock PayPal details since we're not using PayPal
            );
            
            if (completeResult.success) {
                alert(`You Successfully Redeem the Rewards and it is added to your wallet.`);
                // Reload transactions if we're on that tab
                if (activeSection === 'transactions') {
                    loadTransactions();
                }
            } else {
                alert('Failed to add money to wallet: ' + completeResult.error);
            }
        } catch (error) {
            console.error('Error redeeming reward:', error);
            alert('An error occurred. Please contact support.');
        } finally {
            setRedeeming(null);
        }
    };
    
    const rewards = [
        { points: 100, amount: 99 },
        { points: 300, amount: 320 },
        { points: 500, amount: 550 }
    ];
    
    const earnPointsCriteria = [
        { 
            icon: '🏠', 
            title: 'For every listing', 
            points: '+10 pts',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'from-blue-50 to-cyan-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-600'
        },
        { 
            icon: '⭐', 
            title: 'For every star in the reviews', 
            points: '+2 pts',
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-50 to-orange-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-600'
        },
        { 
            icon: '🎯', 
            title: 'For every 1st booking in a listing', 
            points: '+10 pts',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-600'
        },
        { 
            icon: '📅', 
            title: 'Receive 2 bookings in a single day', 
            points: '+10 pts',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-600'
        }
    ];
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            {/* Plain Title */}
            <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                    Points and Rewards
                </h1>
            </div>
            
            {/* Points Status Bar - Teal Blue with Gradient */}
            <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 rounded-xl p-6 mb-6 shadow-lg relative overflow-hidden">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-teal-500/20 animate-pulse"></div>
                
                <div className="flex items-center justify-between text-white relative z-10">
                    <div>
                        <p className="text-sm opacity-90 mb-1">Your Points</p>
                        <h3 className="text-4xl font-bold animate-pulse">
                            {loading ? '...' : points.toLocaleString()}
                        </h3>
                    </div>
                    <div className="text-6xl opacity-30 animate-bounce">⭐</div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden relative z-10">
                    <div 
                        className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Tab Buttons with Animation */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveSection('earn')}
                    className={`relative flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                        activeSection === 'earn'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <span className={`transition-transform duration-300 ${activeSection === 'earn' ? 'rotate-12 scale-110' : ''}`}>
                            🎯
                        </span>
                        How to Earn Points
                    </span>
                    {activeSection === 'earn' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl animate-pulse opacity-50"></div>
                    )}
                </button>
                
                <button
                    onClick={() => setActiveSection('marketplace')}
                    className={`relative flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                        activeSection === 'marketplace'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <span className={`transition-transform duration-300 ${activeSection === 'marketplace' ? 'rotate-12 scale-110' : ''}`}>
                            🛒
                        </span>
                        Points Marketplace
                    </span>
                    {activeSection === 'marketplace' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl animate-pulse opacity-50"></div>
                    )}
                </button>
                
                <button
                    onClick={() => setActiveSection('transactions')}
                    className={`relative flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                        activeSection === 'transactions'
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <span className={`transition-transform duration-300 ${activeSection === 'transactions' ? 'rotate-12 scale-110' : ''}`}>
                            📋
                        </span>
                        Points Transaction
                    </span>
                    {activeSection === 'transactions' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl animate-pulse opacity-50"></div>
                    )}
                </button>
            </div>
            
            {/* How to Earn Points Section */}
            {activeSection === 'earn' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl animate-bounce">📋</span>
                        How to Earn Points
                    </h3>
                    <div className="space-y-4">
                        {earnPointsCriteria.map((criterion, index) => (
                            <div 
                                key={index}
                                className={`flex items-center justify-between p-5 bg-gradient-to-r ${criterion.bgColor} rounded-xl border-2 ${criterion.borderColor} hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-slideIn`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 bg-gradient-to-r ${criterion.color} text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md animate-pulse`}>
                                        {criterion.icon}
                                    </div>
                                    <span className="text-gray-700 font-semibold text-lg">{criterion.title}</span>
                                </div>
                                <span className={`${criterion.textColor} font-bold text-xl animate-bounce`}>
                                    {criterion.points}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Points History Section - Below How to Earn Points */}
            {activeSection === 'earn' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn mt-6">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Points History
                    </h3>
                    <PointsHistoryPanel hostId={auth.currentUser?.uid} />
                </div>
            )}
            
            {/* Points Marketplace Section */}
            {activeSection === 'marketplace' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl animate-bounce">💰</span>
                        Available Rewards
                    </h3>
                    <div className="space-y-4">
                        {rewards.map((reward, index) => (
                            <div 
                                key={index}
                                className={`flex items-center justify-between p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl animate-slideIn`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg animate-pulse">
                                        {reward.points}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-gray-800">
                                            {reward.points} Points
                                        </p>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                            ₱{reward.amount}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRedeem(reward.points, reward.amount)}
                                    disabled={points < reward.points || redeeming === reward.points}
                                    className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                                        points >= reward.points && redeeming !== reward.points
                                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 transform hover:scale-110 shadow-lg hover:shadow-xl animate-pulse'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {redeeming === reward.points ? 'Redeeming...' : 'Redeem'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Points Transaction Section */}
            {activeSection === 'transactions' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-2xl animate-bounce">📋</span>
                        Points Transaction History
                    </h3>
                    {loadingTransactions ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No reward transactions yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx, index) => {
                                // Format date
                                const formatDate = (dateValue) => {
                                    if (!dateValue) return '—';
                                    try {
                                        let date;
                                        if (dateValue.toDate) {
                                            date = dateValue.toDate();
                                        } else if (dateValue.seconds) {
                                            date = new Date(dateValue.seconds * 1000);
                                        } else if (typeof dateValue === 'string') {
                                            date = new Date(dateValue);
                                        } else {
                                            date = dateValue;
                                        }
                                        
                                        if (isNaN(date.getTime())) return '—';
                                        return date.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        });
                                    } catch {
                                        return '—';
                                    }
                                };
                                
                                const pointsRedeemed = tx.meta?.pointsRedeemed || 0;
                                const amountAdded = tx.amount || 0;
                                
                                return (
                                    <div 
                                        key={tx.id || index}
                                        className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    ⭐
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">Reward Redemption</p>
                                                    <p className="text-sm text-gray-600">{formatDate(tx.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="ml-16 space-y-1">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Points Deducted:</span> <span className="text-red-600">-{pointsRedeemed} pts</span>
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-semibold">Amount Added to Wallet:</span> <span className="text-green-600">+₱{amountAdded.toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
            
            {/* Add custom animations via style tag */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                
                .animate-slideIn {
                    animation: slideIn 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
};

// --- Main HostPage Component ---
export default function HostPage({ onSignOut }) {
    const [activeView, setActiveView] = useState('Dashboard');
    const [showCreateListingModal, setShowCreateListingModal] = useState(false);
    const [editingListingId, setEditingListingId] = useState(null);
    
    const [cancellationRequestCount, setCancellationRequestCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [showHostRulesModal, setShowHostRulesModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isCheckingRules, setIsCheckingRules] = useState(true);
    
    useEffect(() => {
        checkHostRulesAcceptance();
        loadCancellationRequestCount();
        loadUnreadMessageCount();
        // Refresh count every 30 seconds
        const interval = setInterval(() => {
            loadCancellationRequestCount();
            loadUnreadMessageCount();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkHostRulesAcceptance = async () => {
        const user = auth.currentUser;
        if (!user) {
            setIsCheckingRules(false);
            return;
        }

        try {
            const result = await getUserData(user.uid);
            if (result.success) {
                setUserData(result.data);
                // Show modal if host hasn't accepted rules yet
                if (result.data.role === 'host' && !result.data.hostRulesAccepted) {
                    setShowHostRulesModal(true);
                }
            }
        } catch (error) {
            console.error('Error checking host rules acceptance:', error);
        } finally {
            setIsCheckingRules(false);
        }
    };

    const handleAcceptRules = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const result = await updateHostRulesAccepted(user.uid, true);
        if (result.success) {
            setShowHostRulesModal(false);
            // Update local userData
            setUserData(prev => ({ ...prev, hostRulesAccepted: true }));
        } else {
            alert('Failed to accept rules. Please try again.');
        }
    };

    const handleDeclineRules = () => {
        if (window.confirm('You must accept the Host Rules & Compliance to use the platform. Would you like to sign out?')) {
            onSignOut();
        }
    };

    const loadUnreadMessageCount = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        const result = await getUnreadMessageCount(user.uid);
        if (result.success) {
            setUnreadMessageCount(result.count || 0);
        }
    };
    
    const loadCancellationRequestCount = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        const result = await getHostBookings(user.uid);
        if (result.success) {
            const count = result.data.filter(b => b.status === 'requesting_cancellation').length;
            setCancellationRequestCount(count);
        }
    };
    
    const renderView = () => {
        switch (activeView) {
            case 'Dashboard':
                return <DashboardView setActiveView={setActiveView} />;
            case 'Listings':
                return <ListingsView setActiveView={setActiveView} onEditListing={handleEditListing} />;
            case 'Bookings':
                return <HostBookings />;
            case 'Calendar':
                return <CalendarView />;
            case 'Messages':
                return <MessagesView setActiveView={setActiveView} />;
            case 'Coupons':
                return <CouponsView />;
            case 'Payments':
                return <PaymentsView />;
            case 'Settings':
                return <SettingsView />;
            case 'Rewards':
                return <RewardsView />;
            case 'Wallet':
                return <Wallet setPage={setActiveView} />;
            case 'AccountSettings':
                return <AccountSettings setPage={setActiveView} />;
            default:
                return <DashboardView setActiveView={setActiveView} />;
        }
    }

    const handleCreateListing = () => {
        console.log("Create Listing clicked");
        setEditingListingId(null);
        setShowCreateListingModal(true);
    };
    
    const handleEditListing = (listingId) => {
        setEditingListingId(listingId);
        setShowCreateListingModal(true);
    };
    
    const handleCloseModal = () => {
        setShowCreateListingModal(false);
        setEditingListingId(null);
    };
    
    const handleModalSuccess = () => {
        // Refresh listings view
        setActiveView('Listings');
    };

    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="bg-gray-50 font-sans min-h-screen">
            {/* Global Header */}
            <Header 
                currentPage="Host" 
                setPage={setActiveView} 
                userRole="host" 
                onCreateListing={handleCreateListing}
            />
            
            {/* Mobile Menu Button - Only visible on mobile */}
            <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden fixed bottom-6 left-6 z-40 bg-teal-500 text-white p-4 rounded-full shadow-2xl hover:bg-teal-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            
            {/* Main Content Area with Sidebar - Responsive */}
            <div className="flex">
                <Sidebar 
                    activeView={activeView} 
                    setActiveView={setActiveView} 
                    onSignOut={onSignOut}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    cancellationRequestCount={cancellationRequestCount}
                    unreadMessageCount={unreadMessageCount}
                />
                <main className="flex-1 min-h-screen w-full lg:w-auto">
                    {renderView()}
                </main>
            </div>
            
            {/* Create/Edit Listing Modal */}
            <CreateListingModal
                isOpen={showCreateListingModal}
                onClose={handleCloseModal}
                listingId={editingListingId}
                onSuccess={handleModalSuccess}
            />

            {/* Host Rules & Compliance Modal */}
            {!isCheckingRules && (
                <HostRulesCompliance
                    isOpen={showHostRulesModal}
                    onAccept={handleAcceptRules}
                    onDecline={handleDeclineRules}
                    fullName={userData?.fullName || ''}
                />
            )}
        </div>
    );
}
