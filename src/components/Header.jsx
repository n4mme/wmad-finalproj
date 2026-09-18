import React, { useState, useEffect } from "react";
import { User as LucideUser, Heart, Plane, MessageCircle, UserCircle, Wallet as WalletIcon, Star, Settings, LogOut, Sparkles } from "lucide-react";
// 🚀 NEW IMPORT: Import Firebase auth functions
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import { getUnreadMessageCount } from '../utils/firestoreUtils';
// 🎯 ASSUMED: This now points to your new, combined logo image file (e.g., BiyaHeleCombinedLogo.png)
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png' 

// --- Main Header Component ---
export default function Header({ currentPage, setPage, userRole, onCreateListing }) {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    
    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
        };
        loadUserData();
    }, []);

    // Load unread message count
    useEffect(() => {
        const loadUnreadCount = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const result = await getUnreadMessageCount(user.uid);
                if (result.success) {
                    setUnreadMessageCount(result.count || 0);
                }
            }
        };
        loadUnreadCount();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleNavigation = (destination) => {
        setPage(destination);
        setMobileMenuOpen(false); // Close mobile menu on navigation
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    // 🚀 FIREBASE INTEGRATION: Updated handleSignOut to use Firebase auth.
    const handleSignOut = async () => {
        setMenuOpen(false);
        const auth = getAuth(); // Get the Firebase Auth instance

        try {
            await signOut(auth); // Call the Firebase signOut function
            console.log("Firebase User signed out successfully. Redirecting to Auth Page.");

            // Redirect to the Auth page after successful sign out
            window.location.href = '/auth';
        } catch (error) {
            console.error("Firebase Sign Out Error:", error.message);
            // Redirect to Auth page even on error
            window.location.href = '/auth';
        }
    };

    const headerClasses = `
        bg-white sticky top-0 z-50 w-full border-b border-gray-200 
        transition-all duration-300 ease-in-out
    `;

    const containerPaddingClasses = `
        container mx-auto px-4 flex justify-between items-center relative
        transition-all duration-300 ease-in-out py-2
    `;

    return (
        <header className={headerClasses}>
            <div className={containerPaddingClasses}>

                {/* Logo - MODIFIED FOR COMBINED IMAGE */}
                <h1 className="flex items-center min-w-[80px] md:min-w-[100px] cursor-pointer relative z-20" onClick={() => handleNavigation("Home")}>
                    <img
                        src={BiyaHeleCombinedLogo}
                        alt="BiyaHele Logo"
                        className="h-10 sm:h-12 md:h-14 w-auto" 
                    />
                </h1>
                {/* END OF MODIFIED LOGO SECTION */}

                {/* Mobile Hamburger Menu Button - Shows on small screens */}
                <button
                    onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden relative z-20 p-2 text-gray-600 hover:text-teal-500"
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>


                {/* --- RIGHT SIDE: User Actions (Stays on the right) --- DESKTOP ONLY */}
                <div className="hidden lg:flex items-center space-x-4 min-w-[200px] justify-end relative z-20">
                    {/* Role-based Navigation */}
                    {userRole === 'host' ? (
                        <>
                            {/* Create Listing Button for Hosts */}
                            {onCreateListing && (
                                <button 
                                    onClick={onCreateListing}
                                    data-testid="header-create-listing-button"
                                    className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg relative z-20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="whitespace-nowrap">Create Listing</span>
                                </button>
                            )}
                        </>
                    ) : null}

                    {/* User Menu Button - Combined burger menu + avatar */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!isMenuOpen)}
                            className="flex items-center space-x-2 border border-gray-300 rounded-full hover:shadow-md transition-all py-2 px-2 pr-3"
                        >
                            {/* Burger Icon */}
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            {/* User Avatar Circle */}
                            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                                {userData?.photoURL ? (
                                    <img src={userData.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                                ) : (
                                    <span className="text-sm font-bold text-white">{getInitial(userData?.fullName)}</span>
                                )}
                            </div>
                        </button>

                        {/* Updated Burger Menu Panel */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                                {/* User Info Section */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="font-semibold text-gray-900">{userData?.fullName || 'User'}</p>
                                    <p className="text-sm text-gray-600 truncate">{userData?.email}</p>
                                </div>

                                {/* Menu Categories - Different for host vs guest */}
                                <div className="py-2">
                                    {userRole === 'host' ? (
                                        <>
                                            {/* Host Menu - Only Wallet, Settings, Sign Out */}
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Wallet"); }} 
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <WalletIcon className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Wallet</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("AccountSettings"); }} 
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Settings className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Settings</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Guest Menu - Full menu */}
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Favorites"); }} 
                                                data-testid="header-menu-favorites"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Heart className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Favorites</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Wishlist"); }} 
                                                data-testid="header-menu-wishlist"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Sparkles className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Wishlist</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Bookings"); }} 
                                                data-testid="header-menu-bookings"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Plane className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Bookings</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Messages"); }} 
                                                data-testid="header-menu-messages"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors relative"
                                            >
                                                <MessageCircle className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Messages</span>
                                                {unreadMessageCount > 0 && (
                                                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                                    </span>
                                                )}
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Profile"); }} 
                                                data-testid="header-menu-profile"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <UserCircle className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Profile</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("Wallet"); }} 
                                                data-testid="header-menu-wallet"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <WalletIcon className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Wallet</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => { setMenuOpen(false); handleNavigation("AccountSettings"); }} 
                                                data-testid="header-menu-settings"
                                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Settings className="w-5 h-5 mr-3 text-gray-600" />
                                                <span>Settings</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Sign Out Button */}
                                <div className="border-t border-gray-200 pt-2">
                                    <button
                                        onClick={handleSignOut}
                                        data-testid="header-menu-signout"
                                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
                    <div 
                        className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto"
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

                        {/* User Info */}
                        <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center">
                                    {userData?.photoURL ? (
                                        <img src={userData.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                                    ) : (
                                        <span className="text-lg font-bold text-white">{getInitial(userData?.fullName)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{userData?.fullName || 'User'}</p>
                                    <p className="text-sm text-gray-600">{userData?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links - Guest View */}
                        {userRole !== 'host' && (
                            <div className="p-4 border-b">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Explore</h3>
                                <button
                                    onClick={() => handleNavigation("Home")}
                                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
                                        currentPage === "Home" ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    🏠 Homes
                                </button>
                                <button
                                    onClick={() => handleNavigation("Experiences")}
                                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
                                        currentPage === "Experiences" ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    🎈 Experiences
                                </button>
                                <button
                                    onClick={() => handleNavigation("Services")}
                                    className={`w-full text-left px-4 py-3 rounded-lg ${
                                        currentPage === "Services" ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    🛎️ Services
                                </button>
                            </div>
                        )}

                        {/* Create Listing - Host View */}
                        {userRole === 'host' && onCreateListing && (
                            <div className="p-4 border-b">
                                <button 
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        onCreateListing();
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-3 rounded-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>Create Listing</span>
                                </button>
                            </div>
                        )}

                        {/* User Menu Items */}
                        <div className="p-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Your Account</h3>
                            {userRole === 'host' ? (
                                <>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Wallet"); }} 
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <WalletIcon className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Wallet</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("AccountSettings"); }} 
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Settings className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Settings</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Favorites"); }} 
                                        data-testid="mobile-menu-favorites"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <Heart className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Favorites</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Wishlist"); }} 
                                        data-testid="mobile-menu-wishlist"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <Sparkles className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Wishlist</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Bookings"); }} 
                                        data-testid="mobile-menu-bookings"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <Plane className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Bookings</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Messages"); }} 
                                        data-testid="mobile-menu-messages"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2 relative"
                                    >
                                        <MessageCircle className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Messages</span>
                                        {unreadMessageCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Profile"); }} 
                                        data-testid="mobile-menu-profile"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <UserCircle className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Profile</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("Wallet"); }} 
                                        data-testid="mobile-menu-wallet"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mb-2"
                                    >
                                        <WalletIcon className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Wallet</span>
                                    </button>
                                    <button 
                                        onClick={() => { setMobileMenuOpen(false); handleNavigation("AccountSettings"); }} 
                                        data-testid="mobile-menu-settings"
                                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Settings className="w-5 h-5 mr-3 text-gray-600" />
                                        <span>Settings</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Sign Out */}
                        <div className="p-4 border-t">
                            <button
                                onClick={handleSignOut}
                                data-testid="mobile-menu-signout"
                                className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                            >
                                <LogOut className="w-5 h-5 mr-3" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}