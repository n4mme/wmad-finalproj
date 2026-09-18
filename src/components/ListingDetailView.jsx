import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Star, Check, Wallet, AlertCircle, Gift, CreditCard, MessageCircle, User, ArrowLeft } from 'lucide-react';
import LocationMap from './LocationMap';
import { getListing, recordPayment, createBooking, updateListing, getUserWallet, updateUserWalletBalance, recordWalletTransaction, getUserData, getOrCreateMessageThread, sendMessage, getListingReviews, validateCouponForBooking, recordCouponUsage, getAdminWallet } from '../utils/firestoreUtils';
import { processPayPalPayout } from '../utils/paypalPayouts';
import { getAuth } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';
import Header from './Header';
import PayPalCheckout from './PayPalCheckout';

const ListingDetailView = ({ 
    listingId: propListingId, 
    onClose, 
    isGuestView = true, // true = Guest Dashboard, false = Landing Page
    onReserveClick = null, // Custom reserve handler for Landing Page
    showTopNav = true, // Whether to show navigation
    TopNavComponent = null // Custom navigation component
}) => {
    const { id: urlListingId } = useParams();
    const navigate = useNavigate();
    const listingId = propListingId || urlListingId; // Use prop if available, otherwise use URL param
    
    const [listing, setListing] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [hostData, setHostData] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [signInPromptType, setSignInPromptType] = useState('contact'); // 'contact' or 'reservation'
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const lastReviewsCountRef = useRef(0);
    
    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Reservation form state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedCheckIn, setSelectedCheckIn] = useState(null);
    const [selectedCheckOut, setSelectedCheckOut] = useState(null);
    const [selectedCheckInStr, setSelectedCheckInStr] = useState(null); // Store as string to avoid timezone issues
    const [selectedCheckOutStr, setSelectedCheckOutStr] = useState(null); // Store as string to avoid timezone issues
    const [tempCheckIn, setTempCheckIn] = useState(null);
    const [tempCheckOut, setTempCheckOut] = useState(null);
    const [guests, setGuests] = useState(1);
    
    // Booking completion state
    const [showBookingPanel, setShowBookingPanel] = useState(false);
    const [userWalletBalance, setUserWalletBalance] = useState(0);
    const [userPoints, setUserPoints] = useState(150); // Mock points, should fetch from Firestore
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponFeedback, setCouponFeedback] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [bookingCompleted, setBookingCompleted] = useState(false); // Track if booking was successfully completed
    const [serviceFees, setServiceFees] = useState({
        guestServiceFee: 14,
        hostServiceFee: 4,
        tax: 12,
        cleaningFee: 200,
        guestMinFee: 25,
        guestMaxFee: 1000,
    });
    const [paymentMethods, setPaymentMethods] = useState({
        eWalletPayment: true,
        paypalPayment: true,
    });
    
    // Function to send booking confirmation email
    const sendBookingConfirmationEmail = async (bookingData) => {
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                console.warn('No user email available, skipping booking confirmation email');
                return { success: false, error: 'No user email' };
            }

            console.log('Starting booking confirmation email process...', {
                userEmail: user.email,
                bookingId: bookingData.bookingId
            });

            // Get user's display name from Firestore
            let userName = user.displayName || 'Guest';
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userName = userData.displayName || userData.name || user.displayName || user.email?.split('@')[0] || 'Guest';
                }
            } catch (e) {
                console.warn('Could not fetch user data, using default name:', e);
            }

            const guestText = bookingData.guests === 1 ? 'Guest' : 'Guests';
            const nightText = bookingData.nights === 1 ? 'Night' : 'Nights';

            const templateParams = {
                to_email: user.email,
                to_name: userName,
                booking_id: bookingData.bookingId,
                listing_title: bookingData.listingTitle || 'N/A',
                location: bookingData.location || 'Location not specified',
                check_in_date: bookingData.checkIn || 'N/A',
                check_out_date: bookingData.checkOut || 'N/A',
                number_of_guests: bookingData.guests?.toString() || '1',
                guest_text: guestText,
                number_of_nights: bookingData.nights?.toString() || '1',
                night_text: nightText,
                total_price: bookingData.totalPrice ? `₱${Number(bookingData.totalPrice).toLocaleString()}` : '₱0',
                payment_method: bookingData.paymentMethod || 'N/A',
                booking_date: bookingData.bookingDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            };

            console.log('Sending booking confirmation email with params:', templateParams);
            console.log('Using Service ID: service_rd856gj, Template ID: booking_confirmation, Public Key: UHPQ8D4gCNphfFPyn');

            // Send email with public key as 4th parameter (like AuthPage does)
            const response = await emailjs.send(
                'service_rd856gj', // New EmailJS service ID for booking confirmation
                'booking_confirmation', // EmailJS template ID (shortened)
                templateParams,
                'UHPQ8D4gCNphfFPyn' // Public key passed as 4th parameter
            );

            console.log('Booking confirmation email sent successfully!', {
                status: response.status,
                text: response.text,
                response: response
            });
            
            return { success: true, response };
        } catch (error) {
            console.error('Error sending booking confirmation email:', error);
            console.error('Full error object:', error);
            console.error('Error details:', {
                status: error?.status,
                text: error?.text,
                message: error?.message,
                stack: error?.stack
            });
            
            // Show a user-friendly message (optional, can be removed if too verbose)
            if (error?.text) {
                console.error('EmailJS error text:', error.text);
            }
            
            return { success: false, error: error.message || 'Unknown error' };
        }
    };
    
    useEffect(() => {
        // Set up real-time listener for service fees so changes update automatically
        const feesDocRef = doc(db, 'settings', 'serviceFees');
        const unsubscribeFees = onSnapshot(
            feesDocRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setServiceFees(snapshot.data());
                }
            },
            (error) => {
                console.error('Error loading service fees:', error);
                // Use default values if loading fails
            }
        );

        // Set up real-time listener for payment methods
        const policiesDocRef = doc(db, 'settings', 'policies');
        const unsubscribePolicies = onSnapshot(
            policiesDocRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setPaymentMethods({
                        eWalletPayment: data.eWalletPayment !== undefined ? data.eWalletPayment : true,
                        paypalPayment: data.paypalPayment !== undefined ? data.paypalPayment : true,
                    });
                }
            },
            (error) => {
                console.error('Error loading payment methods:', error);
                // Use default values if loading fails
            }
        );

        // Cleanup listeners on unmount
        return () => {
            unsubscribeFees();
            unsubscribePolicies();
        };
    }, []);

    useEffect(() => {
        if (listingId) {
            loadListing();
        }
    }, [listingId]);
    

    useEffect(() => {
        if (listing?.hostId) {
            loadHostData();
        }
    }, [listing?.hostId]);
    
    useEffect(() => {
        if (listingId) {
            loadReviews();
            // Reset the ref when listingId changes
            lastReviewsCountRef.current = listing?.stats?.reviewsCount || 0;
        }
    }, [listingId]);
    
    useEffect(() => {
        // Reload reviews when listing stats change (e.g., after a new review is added)
        // Only reload if reviewsCount actually increased (new review added)
        const currentReviewsCount = listing?.stats?.reviewsCount || 0;
        if (listingId && currentReviewsCount > lastReviewsCountRef.current) {
            console.log('Reviews count changed, reloading reviews...', {
                previous: lastReviewsCountRef.current,
                current: currentReviewsCount
            });
            lastReviewsCountRef.current = currentReviewsCount;
            loadReviews();
        } else if (listingId && currentReviewsCount !== lastReviewsCountRef.current) {
            // Update ref even if count decreased (shouldn't happen, but just in case)
            lastReviewsCountRef.current = currentReviewsCount;
        }
    }, [listingId, listing?.stats?.reviewsCount]);
    
    const loadReviews = async () => {
        if (!listingId) {
            setReviewsLoading(false);
            return;
        }
        setReviewsLoading(true);
        try {
            const result = await getListingReviews(listingId);
            if (result.success && result.data) {
                console.log('Reviews loaded successfully:', result.data.length, result.data);
                setReviews(result.data);
            } else {
                console.error('Error loading reviews:', result.error);
                setReviews([]);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    // Ensure booking panel stays closed after booking is completed
    useEffect(() => {
        if (bookingCompleted && showBookingPanel) {
            setShowBookingPanel(false);
        }
    }, [bookingCompleted, showBookingPanel]);

    useEffect(() => {
        const loadWallet = async () => {
            try {
                const authInst = getAuth();
                const uid = authInst.currentUser?.uid;
                if (!uid) return;
                const res = await getUserWallet(uid);
                if (res.success) setUserWalletBalance(res.balance || 0);
            } catch (e) {
                console.error('Failed to load wallet balance', e);
            }
        };
        loadWallet();
    }, []);

    const loadServiceFees = async () => {
        try {
            const feesDoc = await getDoc(doc(db, 'settings', 'serviceFees'));
            if (feesDoc.exists()) {
                setServiceFees(feesDoc.data());
            }
        } catch (error) {
            console.error('Error loading service fees:', error);
            // Use default values if loading fails
        }
    };
    
    const loadListing = async () => {
        setIsLoading(true);
        const result = await getListing(listingId);
        if (result.success) {
            setListing(result.data);
        }
        setIsLoading(false);
    };

    const loadHostData = async () => {
        if (!listing?.hostId) return;
        const result = await getUserData(listing.hostId);
        if (result.success) {
            setHostData(result.data);
        }
    };

    const handleContactHost = async () => {
        const user = auth.currentUser;
        if (!user) {
            setSignInPromptType('contact');
            setShowSignInPrompt(true);
            return;
        }

        try {
            const guestId = user.uid;
            const hostId = listing?.hostId;
            if (!hostId) {
                alert('Host information not available');
                return;
            }

            // Get or create message thread
            const threadResult = await getOrCreateMessageThread(guestId, hostId, listingId);
            if (!threadResult.success) {
                alert('Failed to start conversation. Please try again.');
                return;
            }

            // Navigate to messages page using event system
            // Check if we're in guest dashboard or need to navigate
            if (isGuestView) {
                // Already in guest dashboard, just trigger navigation
                const event = new CustomEvent('navigateToMessages', { detail: { threadId: threadResult.threadId } });
                window.dispatchEvent(event);
                if (onClose) onClose(); // Close the listing detail view
            } else {
                // Not in guest dashboard, navigate first
                navigate('/guest-dashboard');
                setTimeout(() => {
                    const event = new CustomEvent('navigateToMessages', { detail: { threadId: threadResult.threadId } });
                    window.dispatchEvent(event);
                }, 300);
            }
        } catch (error) {
            console.error('Error contacting host:', error);
            alert('Failed to contact host. Please try again.');
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setShowImageModal(true);
    };
    
    if (!listingId || !listing) return null;
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white z-50 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }
    
    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek };
    };
    
    const isDateAvailable = (date) => {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return listing.availableDates?.includes(dateStr) || (!listing.blockedDates?.includes(dateStr) && !listing.bookedDates?.includes(dateStr));
    };
    
    const isDateBlocked = (date) => {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return listing.blockedDates?.includes(dateStr);
    };
    
    const isDateBooked = (date) => {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return listing.bookedDates?.includes(dateStr);
    };
    
    const isDatePast = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };
    
    // Format date range for display
    const formatDateRange = () => {
        if (!selectedCheckIn || !selectedCheckOut) {
            return null;
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
        const year = formatYear(selectedCheckOut); // Use check-out year (or check-in if same)
        
        // If same month, show: "Nov 13 - 15, 2025"
        // If different months, show: "Nov 13 - Dec 15, 2025"
        if (selectedCheckIn.getMonth() === selectedCheckOut.getMonth() && 
            selectedCheckIn.getFullYear() === selectedCheckOut.getFullYear()) {
            return `${checkInFormatted} - ${selectedCheckOut.getDate()}, ${year}`;
        } else {
            return `${checkInFormatted} - ${checkOutFormatted}, ${year}`;
        }
    };
    
    const getSpecialPrice = (date) => {
        // Use local date components to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return listing.specialRates && listing.specialRates[dateStr] ? listing.specialRates[dateStr] : null;
    };
    
    const hasSpecialPrice = (date) => {
        return getSpecialPrice(date) !== null;
    };
    
    const handleDateClick = (date) => {
        if (isDatePast(date) || isDateBlocked(date) || isDateBooked(date)) return;
        
        if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
            // Start new selection
            setTempCheckIn(date);
            setTempCheckOut(null);
        } else {
            // Complete selection
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
            setSelectedCheckIn(tempCheckIn);
            setSelectedCheckOut(tempCheckOut);
            // Also set the date strings directly to avoid timezone issues
            const checkInYear = tempCheckIn.getFullYear();
            const checkInMonth = String(tempCheckIn.getMonth() + 1).padStart(2, '0');
            const checkInDay = String(tempCheckIn.getDate()).padStart(2, '0');
            setSelectedCheckInStr(`${checkInYear}-${checkInMonth}-${checkInDay}`);
            
            const checkOutYear = tempCheckOut.getFullYear();
            const checkOutMonth = String(tempCheckOut.getMonth() + 1).padStart(2, '0');
            const checkOutDay = String(tempCheckOut.getDate()).padStart(2, '0');
            setSelectedCheckOutStr(`${checkOutYear}-${checkOutMonth}-${checkOutDay}`);
            setShowDatePicker(false);
        }
    };
    
    const handleClearDates = () => {
        setTempCheckIn(null);
        setTempCheckOut(null);
    };
    
    const handleClose = () => {
        if (onClose) {
            // Modal mode - use the provided onClose handler
            onClose();
        } else {
            // Standalone page mode - accessed via URL (shared link or direct navigation)
            // Navigate to ViewingPage so users can browse other listings
            navigate('/viewing');
        }
    };
    
    const handleReserve = () => {
        // If Landing Page (not guest view) and custom handler provided, use it
        if (!isGuestView && onReserveClick) {
            onReserveClick();
            return;
        }
        
        // Don't show booking panel if booking was already completed
        if (bookingCompleted) {
            return;
        }
        
        // Check if user selected dates
        if (!selectedCheckIn || !selectedCheckOut) {
            alert('Please select check-in and check-out dates');
            return;
        }
        
        // Check if user is authenticated - if not, show sign-in prompt
        const user = auth.currentUser;
        if (!user) {
            setSignInPromptType('reservation');
            setShowSignInPrompt(true);
            return;
        }
        
        // Show booking completion panel
        setShowBookingPanel(true);
    };

    // Calculate host and admin payouts based on new fee structure
    // Uses the service fee from price breakdown for accuracy
    const calculatePayouts = (totalPayment, breakdown) => {
        // Get service fee rates from settings
        const guestServiceFeeRate = (serviceFees.guestServiceFee || 14) / 100;
        const hostServiceFeeRate = (serviceFees.hostServiceFee || 4) / 100;
        
        // Booking Subtotal = Total Payment / (1 + guestServiceFeeRate)
        const bookingSubtotal = totalPayment / (1 + guestServiceFeeRate);
        
        // Use the service fee from price breakdown for accuracy
        // This is the Guest Service Fee shown in the price breakdown
        const serviceFee = breakdown?.serviceFee || (totalPayment - bookingSubtotal);
        
        // Host Service Fee = Booking Subtotal * hostServiceFeeRate
        const hostServiceFee = bookingSubtotal * hostServiceFeeRate;
        
        // Host Payout = Booking Subtotal * (1 - hostServiceFeeRate)
        const hostPayout = bookingSubtotal * (1 - hostServiceFeeRate);
        
        // Admin Payout = Service Fee (from breakdown) + Host Service Fee
        const adminPayout = serviceFee + hostServiceFee;
        
        console.log('Payout calculation details:', {
            totalPayment,
            breakdownSubtotal: breakdown?.subtotal,
            bookingSubtotal,
            serviceFeeFromBreakdown: breakdown?.serviceFee,
            serviceFee,
            hostServiceFee,
            guestServiceFeeRate: `${(serviceFees.guestServiceFee || 14)}%`,
            hostServiceFeeRate: `${(serviceFees.hostServiceFee || 4)}%`,
            hostServiceFeeCalculation: `${bookingSubtotal} * ${hostServiceFeeRate} = ${hostServiceFee}`,
            adminPayout,
            adminPayoutCalculation: `${serviceFee} + ${hostServiceFee} = ${adminPayout}`
        });
        
        return {
            bookingSubtotal,
            hostPayout,
            serviceFee, // This is the 14% service fee from price breakdown
            hostServiceFee,
            adminPayout
        };
    };

    const handlePaymentSuccess = async (paypalDetails) => {
        try {
            const couponValidation = await revalidateAppliedCoupon();
            if (!couponValidation.success) {
                if (couponValidation.error) {
                    alert(couponValidation.error);
                }
                return;
            }

            const total = calculateFinalTotal();
            const orderId = paypalDetails?.id;
            const userId = auth.currentUser?.uid || null;
            const hostId = listing?.hostId || null;
            await recordPayment({
                userId,
                hostId,
                listingId,
                amount: total,
                currency: 'PHP',
                orderId,
                paypalPayload: paypalDetails,
                bookingContext: {
                    checkIn: selectedCheckIn?.toISOString?.() || null,
                    checkOut: selectedCheckOut?.toISOString?.() || null,
                    guests,
                },
            });
            // Calculate breakdown for booking record
            const breakdown = calculatePriceBreakdown();
            const nights = breakdown ? breakdown.nights : Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
            const basePricePerNight = listing.pricePerNight || listing.pricePerPerson || listing.serviceRate || 0;
            
            // Create booking with proper field names - Status is 'pending' until host approves
            const bookingRes = await createBooking({
                listingId,
                hostId,
                guestId: userId,
                listingTitle: listing.title,
                category: listing.category,
                location: listing.location || null,
                guestName: auth.currentUser?.displayName || auth.currentUser?.email || 'Guest',
                checkIn: selectedCheckIn?.toISOString?.() || null,
                checkOut: selectedCheckOut?.toISOString?.() || null,
                numberOfNights: nights,
                numberOfGuests: guests,
                pricePerNight: basePricePerNight,
                totalNightsCost: breakdown ? breakdown.basePrice : total,
                cleaningFee: breakdown ? breakdown.cleaningFee : 200,
                serviceFee: breakdown ? breakdown.serviceFee : 0,
                totalPrice: total,
                currency: 'PHP',
                paymentStatus: 'paid',
                status: 'pending', // Changed to 'pending' - requires host approval
                paymentMethod: 'paypal',
                confirmedAt: null, // Will be set when host approves
            });

            // Mark nights as booked on listing
            // Use date strings directly from input to avoid timezone issues
            const datesToBook = [];
            
            // Use the stored date strings directly (YYYY-MM-DD format)
            const checkInStr = selectedCheckInStr || (selectedCheckIn ? 
                `${selectedCheckIn.getFullYear()}-${String(selectedCheckIn.getMonth() + 1).padStart(2, '0')}-${String(selectedCheckIn.getDate()).padStart(2, '0')}` : 
                null);
            const checkOutStr = selectedCheckOutStr || (selectedCheckOut ? 
                `${selectedCheckOut.getFullYear()}-${String(selectedCheckOut.getMonth() + 1).padStart(2, '0')}-${String(selectedCheckOut.getDate()).padStart(2, '0')}` : 
                null);
            
            if (!checkInStr || !checkOutStr) {
                console.error('Missing check-in or check-out date string');
                return;
            }
            
            // Parse dates for comparison (using local time to avoid timezone issues)
            const [checkInYear, checkInMonth, checkInDay] = checkInStr.split('-').map(Number);
            const [checkOutYear, checkOutMonth, checkOutDay] = checkOutStr.split('-').map(Number);
            const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
            const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
            
            // Include check-in date through check-out date (inclusive)
            const d = new Date(checkInDate);
            while (d <= checkOutDate) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                datesToBook.push(`${year}-${month}-${day}`);
                d.setDate(d.getDate() + 1);
            }
            console.log('Date range calculation (PayPal):', { 
                selectedCheckIn, 
                selectedCheckOut, 
                checkInStr, 
                checkOutStr,
                datesToBook 
            });
            const existing = Array.isArray(listing.bookedDates) ? listing.bookedDates : [];
            const merged = Array.from(new Set([...existing, ...datesToBook]));
            console.log('Updating listing bookedDates (PayPal):', { listingId, existing, datesToBook, merged });
            const updateResult = await updateListing(listingId, { bookedDates: merged });
            
            if (!updateResult.success) {
                console.error('Failed to update listing bookedDates:', updateResult.error);
                // Still continue with booking, but warn user
                alert('Warning: Booking submitted but calendar update failed. Please refresh the page.');
            } else {
                console.log('Listing bookedDates updated successfully');
            }

            // Update local listing state immediately to reflect booked dates in calendar
            setListing(prev => ({
                ...prev,
                bookedDates: merged
            }));

            // Calculate payouts using new fee structure
            // Use the service fee and subtotal from price breakdown for accuracy
            const payouts = calculatePayouts(total, breakdown);
            
            // Credit host wallet with calculated host payout
            try {
                if (hostId) {
                    console.log('Crediting host wallet:', { hostId, hostPayout: payouts.hostPayout, totalPayment: total });
                    const result = await updateUserWalletBalance(hostId, Number(payouts.hostPayout));
                    if (result.success) {
                        console.log('Host wallet updated successfully. New balance:', result.newBalance);
                        const txResult = await recordWalletTransaction({
                            userId: hostId,
                            type: 'earning',
                            amount: Number(payouts.hostPayout),
                            currency: 'PHP',
                            meta: { 
                                bookingId: bookingRes?.id, 
                                listingId, 
                                fromUser: userId, 
                                provider: 'paypal',
                                totalPayment: total,
                                bookingSubtotal: payouts.bookingSubtotal,
                                hostServiceFee: payouts.hostServiceFee
                            },
                        });
                        if (txResult.success) {
                            console.log('Host earning transaction recorded');
                        } else {
                            console.error('Failed to record transaction:', txResult.error);
                        }
                    } else {
                        console.error('Failed to update host wallet:', result.error);
                        alert('Warning: Payment successful but host wallet update failed. Please contact support.');
                    }
                } else {
                    console.warn('No hostId found for listing:', listingId);
                }
            } catch (e) {
                console.error('Host credit error:', e);
                alert('Warning: Payment successful but host wallet update failed. Please contact support.');
            }
            
            // Process admin payouts to biyahele@business.example.com
            // Service Fee from Guest PayPal + Host Service Fee from Host PayPal
            try {
                const adminEmail = 'biyahele@business.example.com';
                const guestPayPalEmail = 'guestuser@personal.example.com';
                const hostPayPalEmail = 'hostuser@personal.example.com';
                
                console.log('Processing admin payouts to PayPal:', {
                    adminEmail,
                    serviceFee: payouts.serviceFee,
                    hostServiceFee: payouts.hostServiceFee,
                    totalAdminPayout: payouts.adminPayout,
                    serviceFeeFrom: guestPayPalEmail,
                    hostServiceFeeFrom: hostPayPalEmail
                });
                
                // Get guest and host user data for metadata
                const guestData = await getUserData(userId);
                const hostData = hostId ? await getUserData(hostId) : { success: false };
                
                // Send Service Fee (from Guest PayPal account concept) to Admin PayPal
                const serviceFeePayoutResult = await processPayPalPayout(
                    adminEmail, 
                    payouts.serviceFee, 
                    'PHP', 
                    0
                );
                
                if (serviceFeePayoutResult.success) {
                    console.log('✅ Service Fee payout successful (from Guest):', {
                        payoutId: serviceFeePayoutResult.payoutId,
                        amount: payouts.serviceFee,
                        from: guestPayPalEmail,
                        to: adminEmail
                    });
                } else {
                    console.error('Service Fee payout failed:', serviceFeePayoutResult.error);
                }
                
                // Send Host Service Fee (from Host PayPal account concept) to Admin PayPal
                const hostServiceFeePayoutResult = await processPayPalPayout(
                    adminEmail, 
                    payouts.hostServiceFee, 
                    'PHP', 
                    0
                );
                
                if (hostServiceFeePayoutResult.success) {
                    console.log('✅ Host Service Fee payout successful (from Host):', {
                        payoutId: hostServiceFeePayoutResult.payoutId,
                        amount: payouts.hostServiceFee,
                        from: hostPayPalEmail,
                        to: adminEmail
                    });
                } else {
                    console.error('Host Service Fee payout failed:', hostServiceFeePayoutResult.error);
                }
                
                // Record admin payout transactions if both succeeded
                if (serviceFeePayoutResult.success && hostServiceFeePayoutResult.success) {
                    const adminWalletResult = await getAdminWallet();
                    if (adminWalletResult.success && adminWalletResult.adminId) {
                        // Record Service Fee transaction (from Guest)
                        await recordWalletTransaction({
                            userId: adminWalletResult.adminId,
                            type: 'earning',
                            amount: Number(payouts.serviceFee),
                            currency: 'PHP',
                            meta: {
                                bookingId: bookingRes?.id,
                                listingId,
                                fromUser: userId,
                                fromPayPalEmail: guestPayPalEmail,
                                provider: 'paypal',
                                feeType: 'service_fee',
                                totalPayment: total,
                                bookingSubtotal: payouts.bookingSubtotal,
                                paypalEmail: adminEmail,
                                paypalBatchId: serviceFeePayoutResult.payoutId,
                                paypalBatchStatus: serviceFeePayoutResult.batchStatus
                            },
                            status: 'completed'
                        });
                        
                        // Record Host Service Fee transaction (from Host)
                        await recordWalletTransaction({
                            userId: adminWalletResult.adminId,
                            type: 'earning',
                            amount: Number(payouts.hostServiceFee),
                            currency: 'PHP',
                            meta: {
                                bookingId: bookingRes?.id,
                                listingId,
                                fromUser: hostId,
                                fromPayPalEmail: hostPayPalEmail,
                                provider: 'paypal',
                                feeType: 'host_service_fee',
                                totalPayment: total,
                                bookingSubtotal: payouts.bookingSubtotal,
                                paypalEmail: adminEmail,
                                paypalBatchId: hostServiceFeePayoutResult.payoutId,
                                paypalBatchStatus: hostServiceFeePayoutResult.batchStatus
                            },
                            status: 'completed'
                        });
                        
                        console.log('✅ Admin payouts recorded:', {
                            serviceFee: payouts.serviceFee,
                            hostServiceFee: payouts.hostServiceFee,
                            total: payouts.adminPayout
                        });
                    }
                } else {
                    const errors = [];
                    if (!serviceFeePayoutResult.success) {
                        errors.push(`Service Fee: ${serviceFeePayoutResult.error}`);
                    }
                    if (!hostServiceFeePayoutResult.success) {
                        errors.push(`Host Service Fee: ${hostServiceFeePayoutResult.error}`);
                    }
                    console.error('Admin payouts partially failed:', errors);
                    alert(`Warning: Booking successful but some admin payouts failed. ${errors.join('; ')}. Please contact support.`);
                }
            } catch (adminPayoutError) {
                console.error('Error processing admin payouts:', adminPayoutError);
                // Don't block the booking if admin payout fails - log it for manual processing
                alert(`Warning: Booking successful but admin payouts failed. Please contact support.`);
            }
            
            // Reload listing to ensure all data is fresh
            await loadListing();

            if (appliedCoupon) {
                const usageResult = await recordCouponUsage(appliedCoupon.id, userId);
                if (!usageResult.success) {
                    console.warn('Failed to record coupon usage:', usageResult.error);
                }
            }
            
            // DO NOT send booking confirmation email here - it will be sent after host approval
            
            // Mark booking as completed and close panel
            setBookingCompleted(true);
            setShowBookingPanel(false);
            // Clear selected dates to prevent panel from showing again
            setSelectedCheckIn(null);
            setSelectedCheckOut(null);
            setSelectedCheckInStr(null);
            setSelectedCheckOutStr(null);
            setAppliedCoupon(null);
            setCouponCode('');
            setCouponFeedback('');
            
            // Show success modal - booking is pending approval
            const user = auth.currentUser;
            setBookingDetails({
                userEmail: user?.email || 'your email address',
                isPending: true // Flag to show pending message
            });
            setShowSuccessModal(true);
        } catch (e) {
            console.error('Payment handling error:', e);
            alert('Payment captured, but we could not finalize booking automatically. Please contact support.');
        }
    };
    
    const handleApplyCoupon = async () => {
        if (!listing?.hostId) {
            setCouponFeedback('Coupons are not available for this listing.');
            return;
        }

        const code = couponCode.trim().toUpperCase();
        if (!code) {
            setCouponFeedback('Enter a coupon code to apply.');
            setAppliedCoupon(null);
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            setCouponFeedback('Sign in to use a coupon.');
            setAppliedCoupon(null);
            return;
        }

        const amountBeforeCoupon = getAmountBeforeCoupon();
        if (amountBeforeCoupon <= 0) {
            setCouponFeedback('Select your stay details before applying a coupon.');
            setAppliedCoupon(null);
            return;
        }

        try {
            setApplyingCoupon(true);
            const result = await validateCouponForBooking(listing.hostId, code, user.uid, amountBeforeCoupon);
            if (result.success) {
                setAppliedCoupon(result.coupon);
                setCouponFeedback(
                    `Coupon applied! ${
                        result.coupon.type === 'percentage'
                            ? `${result.coupon.value}% off`
                            : `₱${Number(result.coupon.value || 0).toLocaleString()} off`
                    }.`
                );
                setCouponCode(code);
            } else {
                setAppliedCoupon(null);
                setCouponFeedback(result.error || 'Coupon is not valid for this booking.');
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            setAppliedCoupon(null);
            setCouponFeedback('Failed to apply coupon. Please try again.');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const revalidateAppliedCoupon = async () => {
        if (!appliedCoupon) {
            return { success: true };
        }

        const user = auth.currentUser;
        if (!user) {
            setCouponFeedback('Sign in to continue using the coupon.');
            setAppliedCoupon(null);
            return { success: false, error: 'Please sign in to continue.' };
        }

        const amountBeforeCoupon = getAmountBeforeCoupon();
        if (amountBeforeCoupon <= 0) {
            setAppliedCoupon(null);
            return { success: false, error: 'Select booking details before applying coupon.' };
        }

        try {
            const result = await validateCouponForBooking(
                listing.hostId,
                appliedCoupon.code,
                user.uid,
                amountBeforeCoupon
            );
            if (result.success) {
                setAppliedCoupon(result.coupon);
                return { success: true, coupon: result.coupon };
            } else {
                setAppliedCoupon(null);
                setCouponFeedback(result.error || 'Coupon is no longer valid.');
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setAppliedCoupon(null);
            setCouponFeedback('Failed to validate coupon.');
            return { success: false, error: error.message };
        }
    };
    
    const handleBookNow = async () => {
        try {
        const couponValidation = await revalidateAppliedCoupon();
        if (!couponValidation.success) {
            if (couponValidation.error) {
                alert(couponValidation.error);
            }
            return;
        }

        const totalCost = calculateFinalTotal();
        if (userWalletBalance < totalCost) {
                alert('Insufficient balance. Please add funds to your E-Wallet.');
            return;
        }
        
            const authInst = getAuth();
            const userId = authInst.currentUser?.uid;
            const hostId = listing?.hostId || null;
            if (!userId) {
                alert('Please sign in to continue.');
                return;
            }

            // Deduct from wallet
            await updateUserWalletBalance(userId, -Number(totalCost));
            await recordWalletTransaction({
                userId,
                type: 'payment',
                amount: Number(totalCost),
                currency: 'PHP',
                meta: {
                    listingId,
                    title: listing.title,
                    category: listing.category,
                    method: 'ewallet',
                },
            });

            // Calculate breakdown for booking record
            const breakdown = calculatePriceBreakdown();
            const nights = breakdown ? breakdown.nights : Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
            const basePricePerNight = listing.pricePerNight || listing.pricePerPerson || listing.serviceRate || 0;
            
            // Create booking document with proper field names - Status is 'pending' until host approves
            const bookingRes = await createBooking({
                listingId,
                hostId,
                guestId: userId,
                listingTitle: listing.title,
                category: listing.category,
                location: listing.location || null,
                guestName: authInst.currentUser?.displayName || authInst.currentUser?.email || 'Guest',
                checkIn: selectedCheckIn?.toISOString?.() || null,
                checkOut: selectedCheckOut?.toISOString?.() || null,
                numberOfNights: nights,
                numberOfGuests: guests,
                pricePerNight: basePricePerNight,
                totalNightsCost: breakdown ? breakdown.basePrice : totalCost,
                cleaningFee: breakdown ? breakdown.cleaningFee : 200,
                serviceFee: breakdown ? breakdown.serviceFee : 0,
                totalPrice: totalCost,
                currency: 'PHP',
                paymentStatus: 'paid',
                status: 'pending', // Changed to 'pending' - requires host approval
                paymentMethod: 'ewallet',
                confirmedAt: null, // Will be set when host approves
            });

            // Mark nights as booked
            // Use date strings directly from input to avoid timezone issues
            const datesToBook = [];
            
            // Use the stored date strings directly (YYYY-MM-DD format)
            const checkInStr = selectedCheckInStr || (selectedCheckIn ? 
                `${selectedCheckIn.getFullYear()}-${String(selectedCheckIn.getMonth() + 1).padStart(2, '0')}-${String(selectedCheckIn.getDate()).padStart(2, '0')}` : 
                null);
            const checkOutStr = selectedCheckOutStr || (selectedCheckOut ? 
                `${selectedCheckOut.getFullYear()}-${String(selectedCheckOut.getMonth() + 1).padStart(2, '0')}-${String(selectedCheckOut.getDate()).padStart(2, '0')}` : 
                null);
            
            if (!checkInStr || !checkOutStr) {
                console.error('Missing check-in or check-out date string');
                return;
            }
            
            // Parse dates for comparison (using local time to avoid timezone issues)
            const [checkInYear, checkInMonth, checkInDay] = checkInStr.split('-').map(Number);
            const [checkOutYear, checkOutMonth, checkOutDay] = checkOutStr.split('-').map(Number);
            const checkInDate = new Date(checkInYear, checkInMonth - 1, checkInDay);
            const checkOutDate = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
            
            // Include check-in date through check-out date (inclusive)
            const d = new Date(checkInDate);
            while (d <= checkOutDate) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                datesToBook.push(`${year}-${month}-${day}`);
                d.setDate(d.getDate() + 1);
            }
            console.log('Date range calculation (E-Wallet):', { 
                selectedCheckIn, 
                selectedCheckOut, 
                checkInStr, 
                checkOutStr,
                datesToBook 
            });
            const existing = Array.isArray(listing.bookedDates) ? listing.bookedDates : [];
            const merged = Array.from(new Set([...existing, ...datesToBook]));
            console.log('Updating listing bookedDates (E-Wallet):', { listingId, existing, datesToBook, merged });
            const updateResult = await updateListing(listingId, { bookedDates: merged });
            
            if (!updateResult.success) {
                console.error('Failed to update listing bookedDates:', updateResult.error);
                // Still continue with booking, but warn user
                alert('Warning: Booking submitted but calendar update failed. Please refresh the page.');
            } else {
                console.log('Listing bookedDates updated successfully');
            }

            // Update local listing state immediately to reflect booked dates in calendar
            setListing(prev => ({
                ...prev,
                bookedDates: merged
            }));

            // Calculate payouts using new fee structure
            // Use the service fee and subtotal from price breakdown for accuracy
            const payouts = calculatePayouts(totalCost, breakdown);
            
            // Credit host wallet for earning with calculated host payout
            try {
                if (hostId) {
                    console.log('Crediting host wallet (E-Wallet):', { hostId, hostPayout: payouts.hostPayout, totalPayment: totalCost });
                    const result = await updateUserWalletBalance(hostId, Number(payouts.hostPayout));
                    if (result.success) {
                        console.log('Host wallet updated successfully. New balance:', result.newBalance);
                        const txResult = await recordWalletTransaction({
                            userId: hostId,
                            type: 'earning',
                            amount: Number(payouts.hostPayout),
                            currency: 'PHP',
                            meta: { 
                                bookingId: bookingRes?.id, 
                                listingId, 
                                fromUser: userId, 
                                provider: 'ewallet',
                                totalPayment: totalCost,
                                bookingSubtotal: payouts.bookingSubtotal,
                                hostServiceFee: payouts.hostServiceFee
                            },
                        });
                        if (txResult.success) {
                            console.log('Host earning transaction recorded');
                        } else {
                            console.error('Failed to record transaction:', txResult.error);
                        }
                    } else {
                        console.error('Failed to update host wallet:', result.error);
                        alert('Warning: Booking successful but host wallet update failed. Please contact support.');
                    }
                } else {
                    console.warn('No hostId found for listing:', listingId);
                }
            } catch (e) {
                console.error('Host credit error (ewallet):', e);
                alert('Warning: Booking successful but host wallet update failed. Please contact support.');
            }
            
            // Process admin payouts to biyahele@business.example.com
            // Service Fee from Guest PayPal + Host Service Fee from Host PayPal
            try {
                const adminEmail = 'biyahele@business.example.com';
                const guestPayPalEmail = 'guestuser@personal.example.com';
                const hostPayPalEmail = 'hostuser@personal.example.com';
                
                console.log('Processing admin payouts to PayPal (E-Wallet):', {
                    adminEmail,
                    serviceFee: payouts.serviceFee,
                    hostServiceFee: payouts.hostServiceFee,
                    totalAdminPayout: payouts.adminPayout,
                    serviceFeeFrom: guestPayPalEmail,
                    hostServiceFeeFrom: hostPayPalEmail
                });
                
                // Get guest and host user data for metadata
                const guestData = await getUserData(userId);
                const hostData = hostId ? await getUserData(hostId) : { success: false };
                
                // Send Service Fee (from Guest PayPal account concept) to Admin PayPal
                const serviceFeePayoutResult = await processPayPalPayout(
                    adminEmail, 
                    payouts.serviceFee, 
                    'PHP', 
                    0
                );
                
                if (serviceFeePayoutResult.success) {
                    console.log('✅ Service Fee payout successful (from Guest):', {
                        payoutId: serviceFeePayoutResult.payoutId,
                        amount: payouts.serviceFee,
                        from: guestPayPalEmail,
                        to: adminEmail
                    });
                } else {
                    console.error('Service Fee payout failed:', serviceFeePayoutResult.error);
                }
                
                // Send Host Service Fee (from Host PayPal account concept) to Admin PayPal
                const hostServiceFeePayoutResult = await processPayPalPayout(
                    adminEmail, 
                    payouts.hostServiceFee, 
                    'PHP', 
                    0
                );
                
                if (hostServiceFeePayoutResult.success) {
                    console.log('✅ Host Service Fee payout successful (from Host):', {
                        payoutId: hostServiceFeePayoutResult.payoutId,
                        amount: payouts.hostServiceFee,
                        from: hostPayPalEmail,
                        to: adminEmail
                    });
                } else {
                    console.error('Host Service Fee payout failed:', hostServiceFeePayoutResult.error);
                }
                
                // Record admin payout transactions if both succeeded
                if (serviceFeePayoutResult.success && hostServiceFeePayoutResult.success) {
                    const adminWalletResult = await getAdminWallet();
                    if (adminWalletResult.success && adminWalletResult.adminId) {
                        // Record Service Fee transaction (from Guest)
                        await recordWalletTransaction({
                            userId: adminWalletResult.adminId,
                            type: 'earning',
                            amount: Number(payouts.serviceFee),
                            currency: 'PHP',
                            meta: {
                                bookingId: bookingRes?.id,
                                listingId,
                                fromUser: userId,
                                fromPayPalEmail: guestPayPalEmail,
                                provider: 'ewallet',
                                feeType: 'service_fee',
                                totalPayment: totalCost,
                                bookingSubtotal: payouts.bookingSubtotal,
                                paypalEmail: adminEmail,
                                paypalBatchId: serviceFeePayoutResult.payoutId,
                                paypalBatchStatus: serviceFeePayoutResult.batchStatus
                            },
                            status: 'completed'
                        });
                        
                        // Record Host Service Fee transaction (from Host)
                        await recordWalletTransaction({
                            userId: adminWalletResult.adminId,
                            type: 'earning',
                            amount: Number(payouts.hostServiceFee),
                            currency: 'PHP',
                            meta: {
                                bookingId: bookingRes?.id,
                                listingId,
                                fromUser: hostId,
                                fromPayPalEmail: hostPayPalEmail,
                                provider: 'ewallet',
                                feeType: 'host_service_fee',
                                totalPayment: totalCost,
                                bookingSubtotal: payouts.bookingSubtotal,
                                paypalEmail: adminEmail,
                                paypalBatchId: hostServiceFeePayoutResult.payoutId,
                                paypalBatchStatus: hostServiceFeePayoutResult.batchStatus
                            },
                            status: 'completed'
                        });
                        
                        console.log('✅ Admin payouts recorded (E-Wallet):', {
                            serviceFee: payouts.serviceFee,
                            hostServiceFee: payouts.hostServiceFee,
                            total: payouts.adminPayout
                        });
                    }
                } else {
                    const errors = [];
                    if (!serviceFeePayoutResult.success) {
                        errors.push(`Service Fee: ${serviceFeePayoutResult.error}`);
                    }
                    if (!hostServiceFeePayoutResult.success) {
                        errors.push(`Host Service Fee: ${hostServiceFeePayoutResult.error}`);
                    }
                    console.error('Admin payouts partially failed (E-Wallet):', errors);
                    alert(`Warning: Booking successful but some admin payouts failed. ${errors.join('; ')}. Please contact support.`);
                }
            } catch (adminPayoutError) {
                console.error('Error processing admin payouts (E-Wallet):', adminPayoutError);
                // Don't block the booking if admin payout fails - log it for manual processing
                alert(`Warning: Booking successful but admin payouts failed. Please contact support.`);
            }

            // Update local balance view
            setUserWalletBalance(prev => Math.max(0, prev - Number(totalCost)));

            // Reload listing to ensure all data is fresh
            await loadListing();

            if (appliedCoupon) {
                const usageResult = await recordCouponUsage(appliedCoupon.id, userId);
                if (!usageResult.success) {
                    console.warn('Failed to record coupon usage:', usageResult.error);
                }
            }

            // DO NOT send booking confirmation email here - it will be sent after host approval

            // Mark booking as completed and close panel
            setBookingCompleted(true);
            setShowBookingPanel(false);
            // Clear selected dates to prevent panel from showing again
            setSelectedCheckIn(null);
            setSelectedCheckOut(null);
            setSelectedCheckInStr(null);
            setSelectedCheckOutStr(null);
            setAppliedCoupon(null);
            setCouponCode('');
            setCouponFeedback('');
            
            // Show success modal - booking is pending approval
            const user = auth.currentUser;
            setBookingDetails({
                userEmail: user?.email || 'your email address',
                isPending: true // Flag to show pending message
            });
            setShowSuccessModal(true);
        } catch (err) {
            console.error('E-Wallet booking error:', err);
            alert('We could not complete your E-Wallet payment. Please try again.');
        }
    };
    
    // Calculate total price
    const calculateTotal = () => {
        if (!selectedCheckIn || !selectedCheckOut) return 0;
        
        const nights = Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
        let basePrice = 0;
        
        if (listing.category === 'home') {
            basePrice = listing.pricePerNight * nights;
        } else if (listing.category === 'experience') {
            basePrice = listing.pricePerPerson * guests;
        } else if (listing.category === 'service') {
            basePrice = listing.serviceRate;
        }
        
        // Apply discount if available and within date range
        const discount = listing.discount;
        if (discount && typeof discount === 'object' && discount.percentage > 0) {
            // Check if discount has date range and if booking dates fall within it
            const hasDateRange = discount.startDate && discount.endDate;
            const isWithinDiscountPeriod = !hasDateRange || (
                selectedCheckIn >= new Date(discount.startDate.seconds ? discount.startDate.seconds * 1000 : discount.startDate) &&
                selectedCheckOut <= new Date(discount.endDate.seconds ? discount.endDate.seconds * 1000 : discount.endDate)
            );
            
            if (isWithinDiscountPeriod) {
                basePrice = basePrice * (1 - discount.percentage / 100);
            }
        } else if (typeof discount === 'number' && discount > 0) {
            // Backward compatibility with old discount format
            basePrice = basePrice * (1 - discount / 100);
        }
        
        return basePrice;
    };
    
    // Calculate comprehensive price breakdown
    const calculatePriceBreakdown = (couponOverride = appliedCoupon) => {
        if (!selectedCheckIn || !selectedCheckOut) return null;
        
        const nights = Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
        const basePricePerNight = listing.pricePerNight || listing.pricePerPerson || listing.serviceRate || 0;
        
        // Calculate price considering special pricing for each night
        let totalNightsCost = 0;
        let currentDate = new Date(selectedCheckIn);
        for (let i = 0; i < nights; i++) {
            const specialPrice = getSpecialPrice(currentDate);
            const nightPrice = specialPrice !== null ? specialPrice : basePricePerNight;
            totalNightsCost += nightPrice;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const basePrice = totalNightsCost * guests;
        
        // Apply listing discount if available and within date range
        const discount = listing.discount;
        let discountedBase = basePrice;
        
        if (discount && typeof discount === 'object' && discount.percentage > 0) {
            // Check if discount has date range and if booking dates fall within it
            const hasDateRange = discount.startDate && discount.endDate;
            let isWithinDiscountPeriod = true;
            
            if (hasDateRange) {
                const discountStart = discount.startDate.seconds 
                    ? new Date(discount.startDate.seconds * 1000)
                    : new Date(discount.startDate);
                const discountEnd = discount.endDate.seconds 
                    ? new Date(discount.endDate.seconds * 1000)
                    : new Date(discount.endDate);
                
                isWithinDiscountPeriod = selectedCheckIn >= discountStart && selectedCheckOut <= discountEnd;
            }
            
            if (isWithinDiscountPeriod) {
                discountedBase = basePrice * (1 - discount.percentage / 100);
            }
        } else if (typeof discount === 'number' && discount > 0) {
            // Backward compatibility with old discount format
            discountedBase = basePrice * (1 - discount / 100);
        }
        
        // Fixed fees - use values from settings
        const cleaningFee = serviceFees.cleaningFee || 200;
        const serviceFeeRate = (serviceFees.guestServiceFee || 14) / 100; // Convert percentage to decimal
        const taxRate = (serviceFees.tax || 12) / 100; // Convert percentage to decimal
        
        const subtotal = discountedBase + cleaningFee;
        const serviceFee = subtotal * serviceFeeRate; // 14% of subtotal
        const tax = subtotal * taxRate; // 12% VAT
        
        // Calculate total before coupon discount
        const totalBeforeCoupon = subtotal + serviceFee + tax;
        
        // Coupon discount - apply to the TOTAL amount (including fees)
        let couponDiscount = 0;
        if (couponOverride) {
            if (couponOverride.type === 'fixed') {
                // Fixed amount discount - cap at total amount
                couponDiscount = Math.min(Number(couponOverride.value || 0), totalBeforeCoupon);
            } else if (couponOverride.type === 'percentage') {
                // Percentage discount - apply to the TOTAL
                couponDiscount = totalBeforeCoupon * (Number(couponOverride.value || 0) / 100);
            }
        }
        
        // Ensure coupon discount doesn't exceed the total
        couponDiscount = Math.min(couponDiscount, totalBeforeCoupon);
        
        const total = Math.max(0, totalBeforeCoupon - couponDiscount);
        
        return {
            nights,
            pricePerNight: basePricePerNight,
            basePrice,
            discountedBase,
            cleaningFee,
            serviceFee,
            tax,
            pointsDiscount: 0, // Points discount removed
            couponDiscount,
            subtotal,
            total: Math.max(0, total) // Ensure non-negative
        };
    };
    
    const calculateFinalTotal = () => {
        const breakdown = calculatePriceBreakdown();
        return breakdown ? breakdown.total : 0;
    };

    const getAmountBeforeCoupon = () => {
        const breakdown = calculatePriceBreakdown(null);
        if (!breakdown) return 0;
        return breakdown.subtotal + breakdown.serviceFee + breakdown.tax;
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
            const isBlocked = isDateBlocked(date);
            const isBooked = isDateBooked(date);
            const isAvailable = isDateAvailable(date) && !isPast;
            const specialPrice = getSpecialPrice(date);
            const isSpecialPriced = hasSpecialPrice(date);
            const isSelected = (tempCheckIn && date.toDateString() === tempCheckIn.toDateString()) || 
                              (tempCheckOut && date.toDateString() === tempCheckOut.toDateString());
            const isInRange = tempCheckIn && tempCheckOut && date > tempCheckIn && date < tempCheckOut;
            
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
                cursor = 'cursor-not-allowed';
            } else if (isSelected) {
                bgColor = 'bg-teal-600';
                textColor = 'text-white';
            } else if (isInRange) {
                bgColor = 'bg-teal-100';
                textColor = 'text-teal-900';
            } else if (isSpecialPriced && !isBlocked && !isBooked) {
                // Special pricing - show with distinct styling
                bgColor = 'bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100';
                borderColor = 'border-purple-300';
            }
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(date)}
                    disabled={isPast || isBlocked || isBooked}
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
                
                {/* Legend */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                        <span>Blocked</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-100 rounded mr-2"></div>
                        <span>Booked</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded mr-2"></div>
                        <span>Special Price</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                        <span>Past</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-teal-600 rounded mr-2"></div>
                        <span>Selected</span>
                    </div>
                </div>
            </div>
        );
    };
    
    const getFeaturesList = () => {
        if (listing.category === 'home') return listing.amenities || [];
        if (listing.category === 'experience') return listing.experienceFeatures || [];
        if (listing.category === 'service') return listing.serviceFeatures || [];
        return [];
    };
    
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-teal-50 z-50 overflow-y-scroll">
            {/* Header - For Guest View */}
            {isGuestView && (
                <Header 
                    currentPage="Home" 
                    setPage={() => {}} 
                    userRole="guest" 
                />
            )}
            
            {/* Header - For Viewing Page (not logged in) - Use TopNavComponent if provided, otherwise use default header */}
            {!isGuestView && showTopNav && TopNavComponent && (
                <TopNavComponent />
            )}
            
            {/* Header - For Viewing Page (not logged in) - Fallback when showTopNav is false */}
            {!isGuestView && !showTopNav && (
                <header className="bg-white sticky top-0 z-50 w-full border-b border-gray-200">
                    <div className="container mx-auto px-4 flex justify-between items-center py-2">
                        <h1 className="flex items-center min-w-[100px] cursor-pointer" onClick={() => navigate('/')}>
                            <img
                                src={BiyaHeleCombinedLogo}
                                alt="BiyaHele Logo"
                                className="h-10 sm:h-12 md:h-14 w-auto" 
                            />
                        </h1>
                        <div className="flex items-center space-x-4 min-w-[200px] justify-end">
                            <button 
                                onClick={() => navigate('/auth', { state: { defaultView: 'login' } })}
                                className="text-gray-700 hover:text-teal-500 font-medium whitespace-nowrap transition-colors"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/auth', { state: { defaultView: 'signup' } })}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </header>
            )}
            
            {/* Back Button - Only show when NOT accessed via shared link (when onClose is provided) */}
            {onClose && (
                <div className="px-3 sm:px-4 md:px-6 pt-3 pb-2">
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-sm sm:text-base font-medium">Back</span>
                    </button>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-16">
                {/* Listing Title and Location - Moved to main body */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        {listing.title}
                    </h1>
                    {listing.location?.locationName && (
                        <div className="flex items-center text-sm sm:text-base text-gray-600">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-teal-500 flex-shrink-0" />
                            <span>{listing.location.locationName}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Photos */}
                        <section>
                            <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden">
                                {listing.images && listing.images.length > 0 ? (
                                    <>
                                        <div className="col-span-2 row-span-2 cursor-pointer" onClick={() => handleImageClick(0)}>
                                            <img 
                                                src={listing.images[0]} 
                                                alt={listing.title} 
                                                className="w-full h-full object-cover min-h-[300px] hover:opacity-90 transition-opacity"
                                            />
                                        </div>
                                        {listing.images.slice(1, 5).map((img, idx) => (
                                            <div key={idx} className="cursor-pointer" onClick={() => handleImageClick(idx + 1)}>
                                                <img 
                                                    src={img} 
                                                    alt={`${listing.title} ${idx + 2}`}
                                                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                                />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="col-span-4 bg-gray-200 h-64 flex items-center justify-center">
                                        <p className="text-gray-500">No images available</p>
                                    </div>
                                )}
                            </div>
                        </section>
                        
                        {/* Availability Calendar */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Availability Calendar</h2>
                            {renderCalendar()}
                        </section>
                        
                        {/* Amenities/Features */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4">
                                {listing.category === 'home' ? 'Amenities' : 
                                 listing.category === 'experience' ? 'Experience Features' : 
                                 'Service Features'}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {getFeaturesList().map((feature, idx) => (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <Check className="w-5 h-5 text-teal-600" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {/* Location */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Location</h2>
                            <div className="flex items-center space-x-2 mb-4">
                                <MapPin className="w-5 h-5 text-gray-600" />
                                <p className="text-gray-700">{listing.location?.locationName}</p>
                            </div>
                            <LocationMap
                                lat={listing.location?.lat || 14.5995}
                                lng={listing.location?.lng || 120.9842}
                                height="300px"
                                interactive={true}
                                allowMarkerPlacement={false}
                            />
                        </section>
                        
                        {/* Description */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4">About this listing</h2>
                            <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                        </section>
                        
                        {/* Reviews Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center">
                                <Star className="w-6 h-6 text-yellow-500 mr-2 fill-current" />
                                Reviews
                                {listing.stats?.reviewsCount > 0 && (
                                    <span className="ml-2 text-lg font-normal text-gray-600">
                                        ({listing.stats.reviewsCount})
                                    </span>
                                )}
                            </h2>
                            
                            {listing.stats?.rating > 0 && (
                                <div className="mb-6 flex items-center gap-2">
                                    <div className="flex items-center">
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                        <span className="ml-1 text-xl font-bold text-gray-900">
                                            {listing.stats.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <span className="text-gray-600">out of 5</span>
                                </div>
                            )}
                            
                            {reviewsLoading ? (
                                <p className="text-gray-500">Loading reviews...</p>
                            ) : (listing.stats?.reviewsCount > 0 && reviews.length === 0) ? (
                                <p className="text-gray-500">Loading reviews...</p>
                            ) : (listing.stats?.reviewsCount === 0 || (!listing.stats?.reviewsCount && reviews.length === 0)) ? (
                                <p className="text-gray-500">No reviews yet. Be the first to review this listing!</p>
                            ) : reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review) => {
                                        const reviewDate = review.createdAt?.toDate 
                                            ? review.createdAt.toDate() 
                                            : review.createdAt 
                                                ? new Date(review.createdAt) 
                                                : null;
                                        
                                        return (
                                            <div 
                                                key={review.id} 
                                                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-6 h-6 text-teal-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 text-lg mb-1">
                                                            {review.guestName || 'Anonymous'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="flex items-center gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`w-4 h-4 ${
                                                                            star <= review.rating
                                                                                ? 'text-yellow-500 fill-current'
                                                                                : 'text-gray-300'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {review.rating ? review.rating.toFixed(1) : '0.0'}
                                                            </span>
                                                        </div>
                                                        {reviewDate && (
                                                            <p className="text-sm text-gray-500">
                                                                {reviewDate.toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'long', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="pl-16">
                                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                        {review.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </section>

                        {/* Meet your Host */}
                        {hostData && listing.hostId && (
                            <section className="border-t pt-8">
                                <h2 className="text-2xl font-bold mb-6">Meet your Host</h2>
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Left Side - Host Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="flex-shrink-0">
                                                    {hostData.photoURL ? (
                                                        <img 
                                                            src={hostData.photoURL} 
                                                            alt={hostData.fullName || 'Host'} 
                                                            className="w-20 h-20 rounded-full object-cover border-2 border-teal-200"
                                                        />
                                                    ) : (
                                                        <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center border-2 border-teal-200">
                                                            <User className="w-10 h-10 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {hostData.fullName || 'Host'}
                                                    </h3>
                                                    <p className="text-gray-600 mb-3">Host</p>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Reviews</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {hostData.hostProfile?.reviewsCount || 0}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Rating</p>
                                                            <p className="font-semibold text-gray-900 flex items-center">
                                                                <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                                                                {hostData.hostProfile?.rating?.toFixed(1) || 'New'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Experience</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {hostData.hostProfile?.totalBookings ? 
                                                                    `${Math.ceil((new Date() - new Date(hostData.createdAt?.toDate?.() || hostData.createdAt || Date.now())).getTime() / (1000 * 60 * 60 * 24 * 365))} years` : 
                                                                    'New'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side - Additional Info & Contact Button */}
                                        <div className="md:w-64 flex flex-col justify-between">
                                            <div className="mb-4">
                                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Response Rate:</strong> {hostData.hostProfile?.responseRate || 0}%
                                                    </p>
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        <strong>Response Time:</strong> {hostData.hostProfile?.responseTime ? `${hostData.hostProfile.responseTime} hours` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={handleContactHost}
                                                    className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-teal-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                    Contact Host
                                                </button>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    Always communicate through the platform to protect your booking and payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                    
                    {/* Right Column - Sticky Reservation Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 border-2 border-teal-200 rounded-2xl shadow-2xl p-6 bg-gradient-to-br from-white via-teal-50/30 to-white hover:shadow-3xl transition-shadow">
                            <div className="mb-6 pb-4 border-b-2 border-teal-100">
                                <div className="flex items-baseline justify-between mb-2">
                                    <div>
                                        <span className="text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                                            ₱{listing.category === 'home' ? listing.pricePerNight?.toLocaleString() :
                                               listing.category === 'experience' ? listing.pricePerPerson?.toLocaleString() :
                                               listing.serviceRate?.toLocaleString()}
                                        </span>
                                        <span className="text-gray-600 ml-2 font-semibold">
                                            {listing.category === 'home' ? '/ night' :
                                             listing.category === 'experience' ? '/ person' :
                                             listing.category === 'service' ? '/ service rate' :
                                             ''}
                                        </span>
                                    </div>
                                    {listing.discount > 0 && (
                                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                            {listing.discount}% off
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Date Selection */}
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-left hover:border-gray-400 transition-colors"
                                >
                                    <p className="text-xs font-semibold text-gray-600 mb-1">CHECK-IN & CHECK-OUT</p>
                                    <p className="text-sm text-gray-900">
                                        {formatDateRange() || 'Select your Check-in & Check-out dates'}
                                    </p>
                                </button>
                                
                                {/* Floating Date Picker */}
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
                                                onClick={handleClearDates}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={handleApplyDates}
                                                disabled={!tempCheckIn || !tempCheckOut}
                                                data-testid="apply-dates-button"
                                                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 transition-colors"
                                            >
                                                Apply Dates
                                            </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Guests */}
                            {(listing.category === 'home' || listing.category === 'experience') && (
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold mb-2">GUESTS</label>
                                    <select
                                        value={guests}
                                        onChange={(e) => setGuests(parseInt(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    >
                                        {[...Array(listing.guests || listing.maxCapacity || 8)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} {i === 0 ? 'guest' : 'guests'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* Reserve Button */}
                            <button
                                onClick={handleReserve}
                                data-testid="listing-reserve-button"
                                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-teal-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl mb-4"
                            >
                                {!isGuestView ? 'Reserve Now' : 'Reserve'}
                            </button>
                            
                            <p className="text-center text-xs text-gray-600 mb-4 font-medium">
                                {isGuestView ? "You won't be charged yet" : "Sign in required to continue"}
                            </p>
                            
                            {/* Price Breakdown */}
                            {selectedCheckIn && selectedCheckOut && (
                                <div className="border-t pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total</span>
                                        <span className="font-semibold">₱{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Booking Completion Panel */}
            {showBookingPanel && selectedCheckIn && selectedCheckOut && !bookingCompleted && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6 rounded-t-3xl z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2">Complete Your Booking</h2>
                                    <h3 className="text-lg font-semibold opacity-90">{listing.title}</h3>
                                    <div className="flex items-center mt-2 text-sm opacity-80">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span>{listing.location?.locationName || 'Location not specified'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBookingPanel(false)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Booking Details */}
                            <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-5 rounded-xl border-2 border-teal-200">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
                                    Booking Details
                                </h4>
                                
                                {/* Date Range Picker - Single Input */}
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-600 mb-2">CHECK-IN & CHECK-OUT</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="w-full border-2 border-teal-300 rounded-lg p-3 text-left hover:border-teal-400 transition-colors bg-white"
                                    >
                                        <p className="text-sm text-gray-900">
                                            {formatDateRange() || 'Select your Check-in & Check-out dates'}
                                        </p>
                                    </button>
                                    
                                    {/* Floating Date Picker - Same as outside */}
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
                                
                                <div className="mt-4">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">NUMBER OF GUESTS</label>
                                    <select
                                        value={guests}
                                        onChange={(e) => setGuests(parseInt(e.target.value))}
                                        className="w-full p-2 border-2 border-teal-300 rounded-lg text-sm font-medium"
                                    >
                                        {[...Array(listing.guests || listing.maxCapacity || 8)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Payment Method - moved under price breakdown (see below) */}
                            
                            {/* Coupon Code */}
                            <div className="border-2 border-orange-200 bg-orange-50 p-5 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                                    <Gift className="w-5 h-5 mr-2 text-orange-600" />
                                    Have a Coupon Code?
                                </h4>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase();
                                        setCouponCode(value);
                                        if (!value) {
                                            setAppliedCoupon(null);
                                            setCouponFeedback('');
                                        }
                                    }}
                                        placeholder="Enter Coupon Code (e.g., COUPON50)"
                                        className="flex-1 p-3 border-2 border-orange-300 rounded-lg text-sm font-medium uppercase"
                                    />
                                    <button
                                    type="button"
                                    onClick={handleApplyCoupon}
                                    disabled={applyingCoupon}
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                    {applyingCoupon ? 'Applying...' : 'Apply'}
                                    </button>
                                </div>
                                {couponFeedback && (
                                    <p className={`text-xs font-semibold ${appliedCoupon ? 'text-green-600' : 'text-red-600'}`}>
                                        {couponFeedback}
                                    </p>
                                )}
                                <p className="text-xs text-gray-600 italic mt-2">
                                    💡 <strong>Tip:</strong> Check with your host for special discount codes.
                                </p>
                            </div>
                            
                            {/* Price Breakdown */}
                            {(() => {
                                const breakdown = calculatePriceBreakdown();
                                if (!breakdown) return null;
                                
                                return (
                                    <div className="border-2 border-teal-200 p-5 rounded-xl bg-gradient-to-br from-gray-50 to-teal-50">
                                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Price Breakdown</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    ₱{breakdown.pricePerNight.toLocaleString()} × {breakdown.nights} {breakdown.nights === 1 ? 'night' : 'nights'} × {guests} {guests === 1 ? 'guest' : 'guests'}
                                                </span>
                                                <span className="font-semibold">₱{breakdown.basePrice.toLocaleString()}</span>
                                            </div>
                                            {(() => {
                                                const discount = listing.discount;
                                                const discountPercentage = discount && typeof discount === 'object' 
                                                    ? discount.percentage 
                                                    : (typeof discount === 'number' ? discount : 0);
                                                const discountName = discount && typeof discount === 'object' && discount.name 
                                                    ? discount.name 
                                                    : 'Listing Discount';
                                                
                                                if (discountPercentage > 0 && breakdown.basePrice > breakdown.discountedBase) {
                                                    return (
                                                        <div className="flex justify-between text-sm text-green-600">
                                                            <span>{discountName} ({discountPercentage}%)</span>
                                                            <span className="font-semibold">-₱{(breakdown.basePrice - breakdown.discountedBase).toLocaleString()}</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700">Cleaning Fee</span>
                                                <span className="font-semibold">₱{breakdown.cleaningFee.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700">Service Fee ({serviceFees.guestServiceFee || 14}%)</span>
                                                <span className="font-semibold">₱{breakdown.serviceFee.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700">Tax (VAT {serviceFees.tax || 12}%)</span>
                                                <span className="font-semibold">₱{breakdown.tax.toLocaleString()}</span>
                                            </div>
                                            {breakdown.couponDiscount > 0 && (
                                                <div className="flex justify-between text-sm text-orange-600">
                                                    <span>Coupon Discount</span>
                                                    <span className="font-semibold">-₱{breakdown.couponDiscount.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="border-t-2 border-gray-300 pt-3 mt-3">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-lg text-gray-900">Total Price</span>
                                                    <span className="font-bold text-2xl text-teal-600">₱{breakdown.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            {/* Payment Methods (under Price Breakdown) */}
                            {(() => {
                                const breakdown = calculatePriceBreakdown();
                                if (!breakdown) return null;
                                const total = breakdown.total;
                                const description = `${listing.title} — ${listing.category === 'home' ? 'Stay' : listing.category === 'experience' ? 'Experience' : 'Service'} booking`;
                                return (
                                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                                            <Wallet className="w-5 h-5 mr-2 text-teal-600" /> Payment Methods
                                        </h4>
                                        
                                        {/* E-Wallet Payment */}
                                        {paymentMethods.eWalletPayment && (
                                            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border-2 border-teal-200 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <CreditCard className="w-6 h-6 text-teal-600 mr-3" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900">E-Wallet</p>
                                                            <p className="text-sm text-gray-600">Available balance</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-teal-600">₱{userWalletBalance.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-xs text-gray-500">Use your E-Wallet to pay instantly if funds are sufficient.</div>
                                            </div>
                                        )}

                                        {/* PayPal Payment */}
                                        {paymentMethods.paypalPayment && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 mb-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900">PayPal</p>
                                                            <p className="text-sm text-gray-600">Secure payment via PayPal</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <PayPalCheckout
                                                    amount={total}
                                                    description={description}
                                                    onApprove={handlePaymentSuccess}
                                                    onError={(err) => {
                                                        console.error('PayPal payment error:', err);
                                                        alert('PayPal payment failed. Please try again.');
                                                    }}
                                                    disabled={!selectedCheckIn || !selectedCheckOut}
                                                />
                                            </div>
                                        )}

                                        {/* Warning if no payment methods available */}
                                        {!paymentMethods.eWalletPayment && !paymentMethods.paypalPayment && (
                                            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                                                <p className="text-sm text-red-600 font-semibold">
                                                    No payment methods are currently available. Please contact support.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            
                            {/* Refund Policy */}
                            <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-xl">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                                    Refund Policy
                                </h4>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex items-start">
                                        <span className="text-green-600 font-bold mr-2">✓</span>
                                        <p><strong>Within 24hrs:</strong> Full Refund – no deduction</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-orange-600 font-bold mr-2">!</span>
                                        <p><strong>After 24hrs to 48hrs:</strong> Partial Refund with 20% deduction</p>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-red-600 font-bold mr-2">✗</span>
                                        <p><strong>After 48hrs:</strong> Cancellation only – no refund</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 italic mt-3 bg-white p-2 rounded border border-amber-200">
                                    <strong>Note:</strong> Refund Policies are based on time since host confirmation.
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowBookingPanel(false)}
                                    className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                {(() => {
                                    const totalCost = calculateFinalTotal();
                                    const hasInsufficientBalance = userWalletBalance < totalCost;
                                    
                                    return (
                                        <button
                                            onClick={handleBookNow}
                                            disabled={hasInsufficientBalance}
                                            data-testid="book-now-button"
                                            className={`flex-1 py-4 font-bold rounded-xl transition-all ${
                                                hasInsufficientBalance
                                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transform hover:scale-[1.02]'
                                            }`}
                                        >
                                            {hasInsufficientBalance ? 'Insufficient Balance' : 'Book Now'}
                                        </button>
                                    );
                                })()}
                            </div>
                            
                            {/* Insufficient Balance Warning */}
                            {(() => {
                                const totalCost = calculateFinalTotal();
                                const hasInsufficientBalance = userWalletBalance < totalCost;
                                
                                if (!hasInsufficientBalance) return null;
                                
                                return (
                                    <div className="bg-red-50 border-2 border-red-300 p-4 rounded-xl flex items-start">
                                        <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-bold text-red-900 mb-1">Insufficient Wallet Balance</p>
                                            <p className="text-sm text-red-700">
                                                You need ₱{(totalCost - userWalletBalance).toLocaleString()} more to complete this booking.
                                                Please add funds to your wallet.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Success Modal */}
            {showSuccessModal && bookingDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-3xl">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <Check className="w-8 h-8 mr-3 bg-white text-green-600 rounded-full p-1" />
                                    <h2 className="text-2xl font-bold">Booking Complete!</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        if (onClose) onClose(); else navigate(-1);
                                    }}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="text-center space-y-4">
                                {bookingDetails.isPending ? (
                                    <>
                                        <p className="text-gray-700 text-lg">
                                            Your booking request has been submitted! Payment has been processed and your booking is now{' '}
                                            <span className="font-semibold text-orange-600">waiting for host approval</span>.
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            The host will review your booking request. Once approved, a confirmation email will be sent to{' '}
                                            <span className="font-semibold text-teal-600">{bookingDetails.userEmail}</span>.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-gray-700 text-lg">
                                        Your booking is complete! We've just sent a detailed confirmation email to{' '}
                                        <span className="font-semibold text-teal-600">{bookingDetails.userEmail}</span>.
                                        Please check your inbox (and spam folder) for the complete details.
                                    </p>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        if (onClose) onClose(); else navigate(-1);
                                    }}
                                    data-testid="booking-proceed-button"
                                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-xl hover:from-teal-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg"
                                >
                                    Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal Viewer */}
            {showImageModal && listing.images && listing.images.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
                    <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : listing.images.length - 1));
                            }}
                            className="absolute left-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImageIndex((prev) => (prev < listing.images.length - 1 ? prev + 1 : 0));
                            }}
                            className="absolute right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <img
                            src={listing.images[selectedImageIndex]}
                            alt={`${listing.title} ${selectedImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-lg">
                            {selectedImageIndex + 1} / {listing.images.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Sign In Prompt Modal */}
            {showSignInPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[90] flex justify-center items-center p-4" onClick={() => setShowSignInPrompt(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
                                {signInPromptType === 'reservation' ? (
                                    <CalendarIcon className="h-8 w-8 text-teal-600" />
                                ) : (
                                <MessageCircle className="h-8 w-8 text-teal-600" />
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {signInPromptType === 'reservation' ? 'Sign in to continue' : 'Sign in to contact host'}
                            </h3>
                            <p className="text-gray-600">
                                {signInPromptType === 'reservation' 
                                    ? 'Create an account or sign in to complete your reservation and manage your bookings'
                                    : 'Create an account or sign in to message the host and book this listing'}
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowSignInPrompt(false);
                                        navigate('/auth', { state: { defaultView: 'login' } });
                                    }}
                                    data-testid="signin-prompt-button"
                                    className="w-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-500 hover:to-blue-600 transform hover:scale-105 transition-all"
                                >
                                    Sign In
                                </button>
                            <button
                                onClick={() => {
                                    setShowSignInPrompt(false);
                                    navigate('/auth', { state: { defaultView: 'signup' } });
                                }}
                                className="w-full border-2 border-teal-500 text-teal-500 font-bold py-3 px-4 rounded-lg hover:bg-teal-50 transition-all"
                            >
                                Create Account
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setShowSignInPrompt(false)}
                            className="mt-4 w-full text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListingDetailView;

