import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import {
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from './firebase';

import GuestDashboard from './components/GuestDashboard.jsx';
import HostPage from './components/HostPage.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminSetup from './components/AdminSetup.jsx';
import Wishlist from './components/Wishlist.jsx';
import BiyaHeleCombinedLogo from './components/BiyaHeleCombinedLogo.png';
import AuthPage from './components/AuthPage.jsx';
import LandingPage from './components/LandingPage.jsx';
import ViewingPage from './components/ViewingPage.jsx';
import { LandingHeader } from './components/ViewingPage.jsx';
import ListingDetailView from './components/ListingDetailView.jsx';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Bookings from './components/Bookings.jsx';
import { migrateListingsProvince } from './utils/firestoreUtils';

// Splash Screen
const SplashScreen = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-sans animate-pulse">
        <img src={BiyaHeleCombinedLogo} alt="BiyaHele Logo" className="h-[150px] w-auto" />
        <p className="text-gray-500 mt-4">Loading your journey...</p>
    </div>
);

// Guest Routes
const GuestRoutes = ({ onSignOut }) => {
    const navigate = useNavigate();
    const handleNavigation = (destination) => {
        const path = destination === 'Home' ? '/' : `/${destination.toLowerCase()}`;
        navigate(path);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    return (
        <GuestDashboard onSignOut={onSignOut} currentPage="Home" setPage={handleNavigation}>
            <Routes>
                <Route path="/" element={<div>Guest Home/Listing Content</div>} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<div>User Profile Page</div>} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/payments" element={<div>User Payments Page</div>} />
                <Route path="/accountsettings" element={<div>Account Settings Page</div>} />
                <Route path="/experiences" element={<div>Experiences Page</div>} />
                <Route path="/services" element={<div>Services Page</div>} />
            </Routes>
        </GuestDashboard>
    );
};

// Main App
function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingAuth, setIsProcessingAuth] = useState(false);

    const handleSignOut = async () => {
        setIsProcessingAuth(true);
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Sign-out error:", err);
        }
    };

    // Expose migration function globally for browser console access
    useEffect(() => {
        window.migrateListingsProvince = migrateListingsProvince;
        window.migrateProvince = migrateListingsProvince; // Shorter alias
        console.log('✅ Migration function available! Use: await window.migrateListingsProvince() or await window.migrateProvince()');
        return () => {
            // Keep it available even on unmount for console access
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("🔐 Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");
            setIsProcessingAuth(true);
            if (user) {
                // Check Firestore for email verification (OTP verification)
                const userDoc = await getDoc(doc(db, "users", user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log("📧 Email verified (Firestore):", userData.emailVerified);
                    console.log("🔑 OTP verified:", userData.otpVerified);
                    
                    if (userData.emailVerified || userData.otpVerified) {
                        console.log("👤 User role:", userData.role);
                        // Update last login timestamp
                        try {
                            await updateDoc(doc(db, "users", user.uid), {
                                lastLogin: serverTimestamp()
                            });
                        } catch (error) {
                            console.error("Error updating last login:", error);
                        }
                        setUserRole(userData.role);
                        setUser(user);
                        console.log("🎉 User authenticated successfully!");
                    } else {
                        console.log("❌ Email/OTP not verified, signing out");
                        await signOut(auth);
                        setUser(null);
                        setUserRole(null);
                    }
                } else {
                    console.log("⚠️ User document not found, creating default guest role");
                    await setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        email: user.email,
                        role: "guest",
                        emailVerified: true,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    });
                    setUserRole("guest");
                    setUser(user);
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setIsProcessingAuth(false);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    if (isLoading || isProcessingAuth) return <SplashScreen />;

    const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'test'; // sandbox client id recommended via env

    return (
        <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'PHP' }}>
        <BrowserRouter>
            <Routes>
                {user ? (
                    userRole === "admin" ? (
                        <>
                            <Route path="/listing/:id" element={<ListingDetailView isGuestView={false} showTopNav={true} />} />
                            <Route path="/*" element={<AdminDashboard onSignOut={handleSignOut} />} />
                        </>
                    ) : userRole === "host" ? (
                        <>
                            <Route path="/listing/:id" element={<ListingDetailView isGuestView={false} showTopNav={true} />} />
                            <Route path="/*" element={<HostPage onSignOut={handleSignOut} />} />
                        </>
                    ) : (
                        <>
                            <Route path="/listing/:id" element={<ListingDetailView isGuestView={true} showTopNav={true} />} />
                            <Route path="/*" element={<GuestRoutes onSignOut={handleSignOut} />} />
                        </>
                    )
                ) : (
                    <>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/viewing" element={<ViewingPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/admin-setup" element={<AdminSetup />} />
                        <Route path="/listing/:id" element={<ListingDetailView isGuestView={false} showTopNav={true} TopNavComponent={LandingHeader} />} />
                        <Route path="/*" element={<LandingPage />} />
                    </>
                )}
            </Routes>
        </BrowserRouter>
        </PayPalScriptProvider>
    );

}

export default App;
