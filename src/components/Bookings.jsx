import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getGuestBookings, getListing, cancelBooking, updateListing, updateUserWalletBalance, recordWalletTransaction, requestCancellation, createReview, hasBookingBeenReviewed } from '../utils/firestoreUtils';
import { MapPin, Calendar as CalendarIcon, Users, CreditCard, CheckCircle, FileText, MessageCircle, XCircle, UserCircle, Share2, Eye, Download, Clock, Star } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listingCache, setListingCache] = useState({});
    const [hostCache, setHostCache] = useState({});
    const [cancelId, setCancelId] = useState(null);
    const [showShareMenu, setShowShareMenu] = useState(null);
    const [reviewBookingId, setReviewBookingId] = useState(null);
    const [sortFilter, setSortFilter] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [bookingReviewed, setBookingReviewed] = useState({}); // Track which bookings have been reviewed
    const navigate = useNavigate();
    
    const isBookingCompleted = (booking) => {
        if (!booking.checkOut) return false;
        let checkOutDate;
        if (typeof booking.checkOut === 'string') {
            checkOutDate = new Date(booking.checkOut);
        } else if (booking.checkOut.toDate) {
            checkOutDate = booking.checkOut.toDate();
        } else {
            checkOutDate = booking.checkOut;
        }
        checkOutDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return checkOutDate < now;
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const auth = getAuth();
            const uid = auth.currentUser?.uid;
            if (!uid) {
                setBookings([]);
                setLoading(false);
                return;
            }
            const res = await getGuestBookings(uid);
            const data = res.success ? res.data : [];
            // Filter confirmed/paid bookings, pending bookings, cancellation requests, and canceled bookings
            const confirmedBookings = data.filter(b => 
                (b.status === 'confirmed' || b.status === 'booked' || b.status === 'pending' || b.status === 'requesting_cancellation' || b.status === 'completed' || b.status === 'cancelled') && 
                b.paymentStatus === 'paid'
            );
            
            // Sort bookings: completed first (past check-out), then upcoming
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            const sortedBookings = confirmedBookings.sort((a, b) => {
                // Get check-out dates
                let aCheckOut, bCheckOut;
                if (typeof a.checkOut === 'string') aCheckOut = new Date(a.checkOut);
                else if (a.checkOut?.toDate) aCheckOut = a.checkOut.toDate();
                else aCheckOut = a.checkOut;
                
                if (typeof b.checkOut === 'string') bCheckOut = new Date(b.checkOut);
                else if (b.checkOut?.toDate) bCheckOut = b.checkOut.toDate();
                else bCheckOut = b.checkOut;
                
                aCheckOut.setHours(0, 0, 0, 0);
                bCheckOut.setHours(0, 0, 0, 0);
                
                const aIsCompleted = aCheckOut < now;
                const bIsCompleted = bCheckOut < now;
                
                // Completed bookings first, then by check-out date (most recent first)
                if (aIsCompleted && !bIsCompleted) return -1;
                if (!aIsCompleted && bIsCompleted) return 1;
                
                // Both same type, sort by check-out date
                return bCheckOut - aCheckOut;
            });
            
            setBookings(sortedBookings);
            
            // Check which bookings have been reviewed
            const reviewedMap = {};
            for (const booking of sortedBookings) {
                if (isBookingCompleted(booking)) {
                    const reviewedResult = await hasBookingBeenReviewed(booking.id);
                    if (reviewedResult.success) {
                        reviewedMap[booking.id] = reviewedResult.reviewed;
                    }
                }
            }
            setBookingReviewed(reviewedMap);
            
            // Preload listings
            const uniqueListingIds = Array.from(new Set(confirmedBookings.map(b => b.listingId).filter(Boolean)));
            const cache = {};
            for (const lid of uniqueListingIds) {
                const lr = await getListing(lid);
                if (lr.success) cache[lid] = lr.data;
            }
            setListingCache(cache);
            
            // Preload hosts
            const uniqueHostIds = Array.from(new Set(confirmedBookings.map(b => b.hostId).filter(Boolean)));
            const hcache = {};
            for (const hid of uniqueHostIds) {
                try {
                    const hdoc = await getDoc(doc(db, 'users', hid));
                    if (hdoc.exists()) hcache[hid] = hdoc.data();
                } catch (e) {
                    console.error('Error loading host:', e);
                }
            }
            setHostCache(hcache);
            setLoading(false);
        };
        load();
    }, []);

    const formatDateOnly = (dateValue) => {
        if (!dateValue) return '—';
        try {
            let d;
            if (typeof dateValue === 'string') {
                d = new Date(dateValue);
            } else if (dateValue.toDate) {
                d = dateValue.toDate();
            } else {
                d = dateValue;
            }
            return d.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
        } catch {
            return '—';
        }
    };
    
    const getFilteredBookings = () => {
        if (sortFilter === 'all') return bookings;
        if (sortFilter === 'completed') {
            return bookings.filter(b => isBookingCompleted(b) && b.status !== 'cancelled');
        }
        if (sortFilter === 'upcoming') {
            return bookings.filter(b => !isBookingCompleted(b) && b.status !== 'cancelled');
        }
        if (sortFilter === 'cancelled') {
            return bookings.filter(b => b.status === 'cancelled');
        }
        return bookings;
    };

    const dateArray = (startIso, endIso) => {
        if (!startIso || !endIso) return [];
        const dates = [];
        let d;
        if (typeof startIso === 'string') {
            d = new Date(startIso);
        } else if (startIso.toDate) {
            d = startIso.toDate();
        } else {
            d = startIso;
        }
        // Normalize to midnight to avoid time component issues
        d.setHours(0, 0, 0, 0);
        
        let end;
        if (typeof endIso === 'string') {
            end = new Date(endIso);
        } else if (endIso.toDate) {
            end = endIso.toDate();
        } else {
            end = endIso;
        }
        // Normalize to midnight
        end.setHours(0, 0, 0, 0);
        
        // Include check-in date through check-out date (inclusive)
        while (d <= end) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${day}`);
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    const handleRequestCancellation = async (b, cancellationReason = '') => {
        try {
            const result = await requestCancellation(b.id, cancellationReason);
            if (result.success) {
                alert('Cancellation request submitted. The host will review your request.');
                // Reload bookings
                const auth = getAuth();
                const uid = auth.currentUser?.uid;
                if (uid) {
                    const res = await getGuestBookings(uid);
                    const data = res.success ? res.data : [];
                    const confirmedBookings = data.filter(booking => 
                        (booking.status === 'confirmed' || booking.status === 'booked' || booking.status === 'requesting_cancellation' || booking.status === 'completed' || booking.status === 'cancelled') && 
                        booking.paymentStatus === 'paid'
                    );
                    setBookings(confirmedBookings);
                }
            } else {
                alert('Failed to request cancellation: ' + result.error);
            }
        } catch (e) {
            console.error('Cancel request error', e);
            alert('Unable to request cancellation.');
        }
    };

    // Keep old handleCancel for backwards compatibility (but it shouldn't be used)
    const handleCancel = async (b) => {
        try {
            // Refund calculation based on time since confirmation
            let baseTime;
            if (b.confirmedAt) {
                if (b.confirmedAt.toDate) baseTime = b.confirmedAt.toDate();
                else if (typeof b.confirmedAt === 'string') baseTime = new Date(b.confirmedAt);
                else baseTime = b.confirmedAt;
            } else if (b.createdAt) {
                if (b.createdAt.toDate) baseTime = b.createdAt.toDate();
                else if (typeof b.createdAt === 'string') baseTime = new Date(b.createdAt);
                else baseTime = b.createdAt;
            } else {
                baseTime = new Date();
            }
            const hours = (Date.now() - baseTime.getTime()) / (1000 * 60 * 60);
            let refundRate = 0;
            if (hours <= 24) refundRate = 1;
            else if (hours <= 48) refundRate = 0.8; // 20% deduction
            else refundRate = 0; // no refund

            const refundAmount = Math.round((b.totalPrice || 0) * refundRate);

            // Deduct refund from host wallet (host received the payment, so refund comes from host)
            // This should happen for ALL refunds, regardless of payment method
            if (refundAmount > 0 && b.hostId) {
                try {
                    console.log('Deducting refund from host wallet:', { hostId: b.hostId, refundAmount, totalPrice: b.totalPrice, refundRate });
                    const result = await updateUserWalletBalance(b.hostId, -refundAmount);
                    if (result.success) {
                        console.log('Refund deducted from host wallet successfully. New balance:', result.newBalance);
                        const txResult = await recordWalletTransaction({
                            userId: b.hostId,
                            type: 'refund',
                            amount: -refundAmount,
                            currency: 'PHP',
                            meta: { bookingId: b.id, listingId: b.listingId, toUser: b.guestId, reason: 'Booking cancellation refund' },
                        });
                        if (txResult.success) {
                            console.log('Host refund transaction recorded');
                        } else {
                            console.error('Failed to record host refund transaction:', txResult.error);
                        }
                    } else {
                        console.error('Failed to deduct refund from host wallet:', result.error);
                        alert('Warning: Refund processed but host wallet deduction failed. Please contact support.');
                    }
                } catch (e) {
                    console.error('Error deducting refund from host wallet:', e);
                    alert('Warning: Refund processed but host wallet deduction failed. Please contact support.');
                }
            } else if (refundAmount > 0 && !b.hostId) {
                console.warn('Cannot deduct refund: No hostId found for booking:', b.id);
            }

            // If paid with ewallet, credit refund to guest
            if ((b.paymentMethod || '').toLowerCase() === 'ewallet' && refundAmount > 0) {
                const auth = getAuth();
                const uid = auth.currentUser?.uid;
                if (uid) {
                    await updateUserWalletBalance(uid, refundAmount);
                    await recordWalletTransaction({ 
                        userId: uid, 
                        type: 'refund', 
                        amount: refundAmount, 
                        currency: 'PHP', 
                        meta: { bookingId: b.id, listingTitle: b.listingTitle } 
                    });
                }
            }

            // Free up dates on listing - remove booked dates
            if (b.listingId) {
                const lr = await getListing(b.listingId);
                if (lr.success) {
                    // Normalize dates to ensure proper matching
                    const oldDates = dateArray(b.checkIn, b.checkOut).map(dateStr => {
                        // Ensure format is YYYY-MM-DD
                        return dateStr;
                    });
                    const existing = Array.isArray(lr.data.bookedDates) ? lr.data.bookedDates : [];
                    const filtered = existing.filter(d => !oldDates.includes(d));
                    console.log('Removing booked dates on cancel:', { listingId: b.listingId, oldDates, existing, filtered });
                    const updateResult = await updateListing(b.listingId, { bookedDates: filtered });
                    if (updateResult.success) {
                        console.log('Booked dates removed successfully');
                    } else {
                        console.error('Failed to remove booked dates:', updateResult.error);
                    }
                }
            }

            await cancelBooking(b.id, 'guest', 'Guest cancelled');
            alert(`Reservation cancelled. Refund: ₱${refundAmount.toLocaleString()}`);
            setCancelId(null);
            // Reload bookings
            const auth = getAuth();
            const uid = auth.currentUser?.uid;
            if (uid) {
                const res = await getGuestBookings(uid);
                const data = res.success ? res.data : [];
                const confirmedBookings = data.filter(b => (b.status === 'confirmed' || b.status === 'booked' || b.status === 'requesting_cancellation' || b.status === 'completed' || b.status === 'cancelled') && b.paymentStatus === 'paid');
                setBookings(confirmedBookings);
            }
        } catch (e) {
            console.error('Cancel error', e);
            alert('Unable to cancel reservation.');
        }
    };

    const handleShare = (booking, platform) => {
        const listing = listingCache[booking.listingId] || {};
        const listingUrl = `${window.location.origin}/listing/${booking.listingId}`;
        const title = encodeURIComponent(listing.title || booking.listingTitle || 'Check out this booking');
        
        if (platform === 'copy') {
            navigator.clipboard.writeText(listingUrl).then(() => {
                alert('Link copied to clipboard!');
                setShowShareMenu(null);
            });
        } else {
            const urls = {
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
                twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(listingUrl)}&text=${title}`,
                whatsapp: `https://wa.me/?text=${title}%20${encodeURIComponent(listingUrl)}`,
            };

            if (platform === 'instagram') {
                alert('Please share via Instagram app');
            } else {
                window.open(urls[platform], '_blank', 'width=600,height=400');
            }
            setShowShareMenu(null);
        }
    };

    const handleDownloadReceipt = (booking) => {
        const listing = listingCache[booking.listingId] || {};
        const host = hostCache[booking.hostId] || {};
        const auth = getAuth();
        const user = auth.currentUser;
        
        // Calculate nights
        let nights = booking.numberOfNights;
        if (!nights && booking.checkIn && booking.checkOut) {
            let checkInDate, checkOutDate;
            if (typeof booking.checkIn === 'string') checkInDate = new Date(booking.checkIn);
            else if (booking.checkIn.toDate) checkInDate = booking.checkIn.toDate();
            else checkInDate = booking.checkIn;
            if (typeof booking.checkOut === 'string') checkOutDate = new Date(booking.checkOut);
            else if (booking.checkOut.toDate) checkOutDate = booking.checkOut.toDate();
            else checkOutDate = booking.checkOut;
            nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000*60*60*24)));
        }

        // Get booking date
        let bookingDate;
        if (booking.createdAt) {
            if (booking.createdAt.toDate) bookingDate = booking.createdAt.toDate();
            else if (typeof booking.createdAt === 'string') bookingDate = new Date(booking.createdAt);
            else bookingDate = booking.createdAt;
        } else {
            bookingDate = new Date();
        }

        // Create receipt HTML
        const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Booking Receipt - ${booking.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #14b8a6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #14b8a6;
            margin: 0;
            font-size: 28px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: bold;
            font-size: 16px;
            color: #14b8a6;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #e5e7eb;
        }
        .detail-label {
            font-weight: 600;
            color: #666;
        }
        .detail-value {
            color: #333;
        }
        .spacer {
            height: 20px;
        }
        .total {
            font-size: 20px;
            font-weight: bold;
            color: #14b8a6;
            text-align: right;
            margin-top: 10px;
        }
        .thank-you {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #666;
            font-style: italic;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Booking Receipt</h1>
    </div>

    <div class="section">
        <div class="detail-row">
            <span class="detail-label">Booking ID:</span>
            <span class="detail-value">${booking.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Listing Title:</span>
            <span class="detail-value">${listing.title || booking.listingTitle || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${listing.location?.address || listing.location?.locationName || listing.location?.city || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Host Name:</span>
            <span class="detail-value">${host.fullName || host.email || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Guest Name:</span>
            <span class="detail-value">${user?.displayName || user?.email || 'Guest'}</span>
        </div>
    </div>

    <div class="spacer"></div>

    <div class="section">
        <div class="section-title">Trip Details</div>
        <div class="detail-row">
            <span class="detail-label">Check-in Date:</span>
            <span class="detail-value">${formatDateOnly(booking.checkIn)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Check-out Date:</span>
            <span class="detail-value">${formatDateOnly(booking.checkOut)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Number of Guests:</span>
            <span class="detail-value">${booking.numberOfGuests || booking.guests || 1}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Number of Nights:</span>
            <span class="detail-value">${nights}</span>
        </div>
    </div>

    <div class="spacer"></div>

    <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">₱${(booking.totalPrice || 0).toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${(booking.paymentMethod || 'paypal').toLowerCase() === 'paypal' ? 'PayPal' : 'E-Wallet'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Booking Date:</span>
            <span class="detail-value">${bookingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    </div>

    <div class="thank-you">
        <p style="font-size: 18px; font-weight: bold; color: #14b8a6; margin-bottom: 10px;">Thank you for choosing BiyaHele!</p>
        <p>We hope you have an amazing and memorable experience. Safe travels and enjoy your stay!</p>
        <p style="margin-top: 15px; font-size: 14px;">For any inquiries or support, please contact us through our platform.</p>
    </div>
</body>
</html>
        `;

        // Create blob and download
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Booking_Receipt_${booking.id}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center text-gray-500">Loading your bookings...</div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="max-w-5xl mx-auto p-4 sm:p-6">
                <div className="bg-white border rounded-2xl shadow-sm p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No bookings yet</h2>
                    <p className="text-gray-600">When you book a stay, it will appear here.</p>
                </div>
            </div>
        );
    }

    const filteredBookings = getFilteredBookings();
    const completedCount = bookings.filter(b => isBookingCompleted(b) && b.status !== 'cancelled').length;
    const upcomingCount = bookings.filter(b => !isBookingCompleted(b) && b.status !== 'cancelled').length;
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Your Bookings</h1>
                
                {/* Sort/Filter Buttons */}
                {bookings.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSortFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                sortFilter === 'all'
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500'
                            }`}
                        >
                            All ({bookings.length})
                        </button>
                        <button
                            onClick={() => setSortFilter('upcoming')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                sortFilter === 'upcoming'
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500'
                            }`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                        <button
                            onClick={() => setSortFilter('completed')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                sortFilter === 'completed'
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-teal-500'
                            }`}
                        >
                            Completed ({completedCount})
                        </button>
                        <button
                            onClick={() => setSortFilter('cancelled')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                sortFilter === 'cancelled'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500'
                            }`}
                        >
                            Cancelled ({cancelledCount})
                        </button>
                    </div>
                )}
            </div>
            {filteredBookings.map((b) => {
                const listing = listingCache[b.listingId] || {};
                const host = hostCache[b.hostId] || {};
                const images = listing.images || [];
                const primaryImage = images[0] || listing.coverImage;
                const locationName = listing.location?.locationName || listing.location?.city || 'Location not specified';
                const hostName = host.fullName || host.email || 'Host';
                
                // Calculate nights
                let nights = b.numberOfNights;
                if (!nights && b.checkIn && b.checkOut) {
                    let checkInDate, checkOutDate;
                    if (typeof b.checkIn === 'string') checkInDate = new Date(b.checkIn);
                    else if (b.checkIn.toDate) checkInDate = b.checkIn.toDate();
                    else checkInDate = b.checkIn;
                    if (typeof b.checkOut === 'string') checkOutDate = new Date(b.checkOut);
                    else if (b.checkOut.toDate) checkOutDate = b.checkOut.toDate();
                    else checkOutDate = b.checkOut;
                    nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000*60*60*24)));
                }

                return (
                    <div key={b.id} className="bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        {/* Landscape Image Section */}
                        <div className="w-full h-64 md:h-80 relative overflow-hidden">
                            {primaryImage ? (
                                <img 
                                    src={primaryImage} 
                                    alt={listing.title || b.listingTitle} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                        <p>No Image</p>
                                    </div>
                                </div>
                            )}
                            {/* Booking Status Badge */}
                            <div className="absolute top-4 right-4">
                                {b.status === 'cancelled' ? (
                                    <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Cancelled
                                    </span>
                                ) : b.status === 'pending' ? (
                                    <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        Waiting for Approval
                                    </span>
                                ) : b.status === 'requesting_cancellation' ? (
                                    <span className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        Requesting for Cancellation
                                    </span>
                                ) : isBookingCompleted(b) ? (
                                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Completed
                                    </span>
                                ) : (
                                    <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Confirmed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="p-6">
                            {/* Main Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{listing.title || b.listingTitle || 'Booked Listing'}</h2>
                                        <div className="flex items-center text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 mr-1 text-teal-600" />
                                            <span>{locationName}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center text-gray-700">
                                        <UserCircle className="w-5 h-5 mr-2 text-teal-600" />
                                        <span className="font-medium">Host: </span>
                                        <span className="ml-1">{hostName}</span>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-teal-600" />
                                        <div>
                                            <div className="text-sm">
                                                <span className="font-medium">Check-in: </span>
                                                <span>{formatDateOnly(b.checkIn)}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium">Check-out: </span>
                                                <span>{formatDateOnly(b.checkOut)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <Users className="w-5 h-5 mr-2 text-teal-600" />
                                        <span className="font-medium">Guests: </span>
                                        <span className="ml-1">{b.numberOfGuests || b.guests || 1}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="text-sm text-gray-600 mb-1">Booking ID</div>
                                        <div className="font-mono text-lg font-bold text-gray-900">{b.id.slice(0, 12)}...</div>
                                    </div>

                                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                        <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                                        <div className="text-2xl font-bold text-teal-600">₱{(b.totalPrice || 0).toLocaleString()}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            Paid via {(b.paymentMethod || 'paypal').toLowerCase() === 'paypal' ? 'PayPal' : 'E-Wallet'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t">
                                <button
                                    onClick={() => navigate(`/listing/${b.listingId}`)}
                                    className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Listing
                                </button>

                                <button
                                    onClick={() => navigate('/messages')}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message Host
                                </button>

                                <button
                                    onClick={() => setShowShareMenu(showShareMenu === b.id ? null : b.id)}
                                    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Trip
                                </button>

                                <button
                                    onClick={() => handleDownloadReceipt(b)}
                                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Receipt
                                </button>

                                {!isBookingCompleted(b) && b.status !== 'pending' && b.status !== 'requesting_cancellation' && b.status !== 'cancelled' && (
                                    <button
                                        onClick={() => setCancelId(b.id)}
                                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Request Cancellation
                                    </button>
                                )}
                                
                                {isBookingCompleted(b) && !bookingReviewed[b.id] && (
                                    <button
                                        onClick={() => setReviewBookingId(b.id)}
                                        className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        <Star className="w-4 h-4 mr-2" />
                                        Review or Rate
                                    </button>
                                )}
                                
                                {isBookingCompleted(b) && bookingReviewed[b.id] && (
                                    <span className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Reviewed
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {/* Share Trip Modal */}
            {showShareMenu && (() => {
                const b = bookings.find(x => x.id === showShareMenu);
                if (!b) return null;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowShareMenu(null)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4 text-center">Share Trip</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleShare(b, 'copy')}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition-colors flex items-center"
                                >
                                    <span className="text-xl mr-3">📋</span>
                                    <span>Copy Link</span>
                                </button>
                                <button
                                    onClick={() => handleShare(b, 'facebook')}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg text-gray-700 font-medium transition-colors flex items-center"
                                >
                                    <span className="text-xl mr-3">📘</span>
                                    <span>Share on Facebook</span>
                                </button>
                                <button
                                    onClick={() => handleShare(b, 'twitter')}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg text-gray-700 font-medium transition-colors flex items-center"
                                >
                                    <span className="text-xl mr-3">🐦</span>
                                    <span>Share on Twitter</span>
                                </button>
                                <button
                                    onClick={() => handleShare(b, 'whatsapp')}
                                    className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg text-gray-700 font-medium transition-colors flex items-center"
                                >
                                    <span className="text-xl mr-3">💬</span>
                                    <span>Share on WhatsApp</span>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowShareMenu(null)}
                                className="mt-4 w-full py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Cancel Modal */}
            {cancelId && (() => {
                const b = bookings.find(x => x.id === cancelId);
                if (!b) return null;
                let baseTime;
                if (b.confirmedAt) {
                    if (b.confirmedAt.toDate) baseTime = b.confirmedAt.toDate();
                    else if (typeof b.confirmedAt === 'string') baseTime = new Date(b.confirmedAt);
                    else baseTime = b.confirmedAt;
                } else if (b.createdAt) {
                    if (b.createdAt.toDate) baseTime = b.createdAt.toDate();
                    else if (typeof b.createdAt === 'string') baseTime = new Date(b.createdAt);
                    else baseTime = b.createdAt;
                } else {
                    baseTime = new Date();
                }
                const hours = (Date.now() - baseTime.getTime()) / (1000 * 60 * 60);
                let refundRate = 0;
                if (hours <= 24) refundRate = 1;
                else if (hours <= 48) refundRate = 0.8;
                else refundRate = 0;
                const refundAmount = Math.round((b.totalPrice || 0) * refundRate);
                
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setCancelId(null)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Request Cancellation</h3>
                            <p className="text-sm text-gray-700 mb-4">
                                Your cancellation request will be sent to the host for review. The host will verify and process your request according to our refund policy.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Cancellation (Optional):
                                </label>
                                <textarea
                                    id="cancellationReason"
                                    rows="3"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter your reason for cancellation..."
                                />
                            </div>
                            <p className="text-xs text-gray-600 mb-4">
                                <strong>Refund Policy:</strong><br/>
                                • Within 24hrs before check-in: Full Refund<br/>
                                • 24-48hrs before check-in: Partial Refund (20% deduction)<br/>
                                • Less than 24hrs before check-in: No Refund
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setCancelId(null)} className="flex-1 py-2 border rounded hover:bg-gray-50 transition-colors">Keep Reservation</button>
                                <button 
                                    onClick={() => {
                                        const reason = document.getElementById('cancellationReason')?.value || '';
                                        handleRequestCancellation(b, reason);
                                        setCancelId(null);
                                    }} 
                                    className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Request Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            
            {/* Review Modal */}
            {reviewBookingId && (() => {
                const b = bookings.find(x => x.id === reviewBookingId);
                if (!b) return null;
                const listing = listingCache[b.listingId] || {};
                
                const handleSubmitReview = async () => {
                    if (reviewRating === 0) {
                        setReviewError('Please select a rating');
                        return;
                    }
                    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
                        setReviewError('Please write a review (at least 10 characters)');
                        return;
                    }
                    
                    setIsSubmittingReview(true);
                    setReviewError('');
                    
                    const auth = getAuth();
                    const uid = auth.currentUser?.uid;
                    if (!uid) {
                        setReviewError('You must be logged in to submit a review');
                        setIsSubmittingReview(false);
                        return;
                    }
                    
                    const result = await createReview(
                        b.listingId,
                        b.id,
                        uid,
                        {
                            rating: reviewRating,
                            comment: reviewComment.trim()
                        }
                    );
                    
                    if (result.success) {
                        alert('Thank you for your review!');
                        setReviewBookingId(null);
                        setReviewRating(0);
                        setReviewComment('');
                        setBookingReviewed(prev => ({ ...prev, [b.id]: true }));
                        // Reload bookings to refresh the list
                        const res = await getGuestBookings(uid);
                        const data = res.success ? res.data : [];
                    const confirmedBookings = data.filter(booking => 
                        (booking.status === 'confirmed' || booking.status === 'booked' || booking.status === 'pending' || booking.status === 'requesting_cancellation' || booking.status === 'completed') && 
                        booking.paymentStatus === 'paid'
                    );
                        
                        // Sort bookings again
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const sortedBookings = confirmedBookings.sort((a, b) => {
                            let aCheckOut, bCheckOut;
                            if (typeof a.checkOut === 'string') aCheckOut = new Date(a.checkOut);
                            else if (a.checkOut?.toDate) aCheckOut = a.checkOut.toDate();
                            else aCheckOut = a.checkOut;
                            
                            if (typeof b.checkOut === 'string') bCheckOut = new Date(b.checkOut);
                            else if (b.checkOut?.toDate) bCheckOut = b.checkOut.toDate();
                            else bCheckOut = b.checkOut;
                            
                            aCheckOut.setHours(0, 0, 0, 0);
                            bCheckOut.setHours(0, 0, 0, 0);
                            
                            const aIsCompleted = aCheckOut < now;
                            const bIsCompleted = bCheckOut < now;
                            
                            if (aIsCompleted && !bIsCompleted) return -1;
                            if (!aIsCompleted && bIsCompleted) return 1;
                            
                            return bCheckOut - aCheckOut;
                        });
                        
                        setBookings(sortedBookings);
                    } else {
                        setReviewError(result.error || 'Failed to submit review');
                    }
                    
                    setIsSubmittingReview(false);
                };
                
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => {
                            setReviewBookingId(null);
                            setReviewRating(0);
                            setReviewComment('');
                            setReviewError('');
                        }}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold mb-4 text-center">Write a Review</h3>
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                {listing.title || b.listingTitle}
                            </p>
                            
                            {reviewError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {reviewError}
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Rating *
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className={`p-2 rounded-lg transition-all ${
                                                reviewRating >= star
                                                    ? 'bg-yellow-100 text-yellow-500'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                                {reviewRating > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {reviewRating === 5 ? 'Excellent' : 
                                         reviewRating === 4 ? 'Very Good' :
                                         reviewRating === 3 ? 'Good' :
                                         reviewRating === 2 ? 'Fair' : 'Poor'}
                                    </p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Your Review *
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => {
                                        setReviewComment(e.target.value);
                                        setReviewError('');
                                    }}
                                    rows="5"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="Share your experience... (minimum 10 characters)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {reviewComment.length}/10 characters minimum
                                </p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setReviewBookingId(null);
                                        setReviewRating(0);
                                        setReviewComment('');
                                        setReviewError('');
                                    }}
                                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={isSubmittingReview}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={isSubmittingReview || reviewRating === 0 || reviewComment.trim().length < 10}
                                    className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Bookings;
