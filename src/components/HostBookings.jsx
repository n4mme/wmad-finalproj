import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getHostBookings, getListing, approveCancellation, denyCancellation, calculateRefund, approveBooking, getBooking } from '../utils/firestoreUtils';
import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { MapPin, Calendar as CalendarIcon, Users, CreditCard, CheckCircle, XCircle, UserCircle, AlertCircle, Clock } from 'lucide-react';
import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init('F0NOLhwaqVJSlllOF');

const HostBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listingCache, setListingCache] = useState({});
    const [guestCache, setGuestCache] = useState({});
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showCancellationModal, setShowCancellationModal] = useState(false);
    const [cancellationAction, setCancellationAction] = useState(null); // 'approve' or 'deny'

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) {
            setBookings([]);
            setLoading(false);
            return;
        }
        
        const res = await getHostBookings(uid);
        const data = res.success ? res.data : [];
        // Show all bookings (confirmed, requesting_cancellation, cancelled, etc.)
        setBookings(data);
        
        // Preload listings and guests
        const uniqueListingIds = Array.from(new Set(data.map(b => b.listingId).filter(Boolean)));
        const uniqueGuestIds = Array.from(new Set(data.map(b => b.guestId).filter(Boolean)));
        
        const lcache = {};
        for (const lid of uniqueListingIds) {
            const lr = await getListing(lid);
            if (lr.success) lcache[lid] = lr.data;
        }
        setListingCache(lcache);
        
        const gcache = {};
        for (const gid of uniqueGuestIds) {
            try {
                const gdoc = await getDoc(doc(db, 'users', gid));
                if (gdoc.exists()) gcache[gid] = gdoc.data();
            } catch (e) {
                console.error('Error loading guest:', e);
            }
        }
        setGuestCache(gcache);
        setLoading(false);
    };

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

    const getStatusBadge = (booking) => {
        const status = booking.status;
        if (status === 'pending') {
            return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">Pending Approval</span>;
        } else if (status === 'confirmed' || status === 'booked') {
            return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Confirmed</span>;
        } else if (status === 'requesting_cancellation') {
            return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Requesting Cancellation</span>;
        } else if (status === 'cancelled') {
            return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Cancelled</span>;
        } else if (status === 'completed') {
            return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Completed</span>;
        }
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">{status}</span>;
    };

    const handleCancellationAction = (booking, action) => {
        setSelectedBooking(booking);
        setCancellationAction(action);
        setShowCancellationModal(true);
    };

    const sendCancellationEmail = async (guestEmail, guestName, bookingId, listingTitle, refundAmount, refundPolicy) => {
        try {
            if (!guestEmail) {
                console.warn('No guest email provided, skipping email');
                return;
            }

            const templateParams = {
                to_email: guestEmail,
                to_name: guestName || 'Guest',
                booking_id: bookingId,
                listing_title: listingTitle,
                refund_amount: refundAmount ? `₱${refundAmount.toLocaleString()}` : '₱0',
                refund_policy: refundPolicy === 'full_refund' ? 'Full Refund' : 
                              refundPolicy === 'partial_refund_20pct_deduction' ? 'Partial Refund (20% deduction)' : 
                              'No Refund',
            };

            console.log('Sending cancellation email with params:', templateParams);

            const response = await emailjs.send(
                'service_pj8jk8q', // Same service as OTP
                'template_cancellation', // EmailJS template ID
                templateParams
            );

            console.log('Cancellation email sent successfully:', response);
        } catch (error) {
            console.error('Error sending cancellation email:', error);
            console.error('Error details:', {
                status: error.status,
                text: error.text,
                message: error.message
            });
            // Don't fail the cancellation if email fails, but log it
        }
    };

    const handleApproveCancellation = async () => {
        if (!selectedBooking) return;
        
        try {
            // Calculate refund
            const cancellationRequestTime = selectedBooking.cancellationRequestedAt || selectedBooking.updatedAt;
            const refundInfo = calculateRefund(selectedBooking, cancellationRequestTime);
            
            // Approve cancellation
            const result = await approveCancellation(
                selectedBooking.id,
                refundInfo.amount,
                refundInfo.policy
            );
            
            if (result.success) {
                // Send email to guest
                const guest = guestCache[selectedBooking.guestId] || {};
                const listing = listingCache[selectedBooking.listingId] || {};
                
                // Try multiple email field names
                const guestEmail = guest.email || guest.userEmail || selectedBooking.guestEmail || '';
                const guestName = guest.fullName || guest.displayName || guest.name || selectedBooking.guestName || 'Guest';
                
                console.log('Guest data for email:', {
                    guestId: selectedBooking.guestId,
                    guest,
                    guestEmail,
                    guestName,
                    bookingId: selectedBooking.id
                });
                
                if (guestEmail) {
                    await sendCancellationEmail(
                        guestEmail,
                        guestName,
                        selectedBooking.id,
                        listing.title || selectedBooking.listingTitle || 'Listing',
                        refundInfo.amount,
                        refundInfo.policy
                    );
                } else {
                    console.warn('No email found for guest:', selectedBooking.guestId);
                    alert('Warning: Cancellation approved but could not send email (no guest email found).');
                }
                
                alert(`Cancellation approved. Refund: ₱${refundInfo.amount.toLocaleString()} (${refundInfo.policy})`);
                setShowCancellationModal(false);
                setSelectedBooking(null);
                loadBookings();
            } else {
                alert('Failed to approve cancellation: ' + result.error);
            }
        } catch (error) {
            console.error('Error approving cancellation:', error);
            alert('Failed to approve cancellation');
        }
    };

    const handleDenyCancellation = async (denialReason = '') => {
        if (!selectedBooking) return;
        
        try {
            const result = await denyCancellation(selectedBooking.id, denialReason);
            
            if (result.success) {
                alert('Cancellation request denied. Booking remains confirmed.');
                setShowCancellationModal(false);
                setSelectedBooking(null);
                loadBookings();
            } else {
                alert('Failed to deny cancellation: ' + result.error);
            }
        } catch (error) {
            console.error('Error denying cancellation:', error);
            alert('Failed to deny cancellation');
        }
    };

    // Send booking confirmation email after approval
    const sendBookingConfirmationEmail = async (bookingData) => {
        try {
            const guest = guestCache[bookingData.guestId] || {};
            const guestEmail = guest.email || guest.userEmail || bookingData.guestEmail || '';
            
            if (!guestEmail) {
                console.warn('No guest email available, skipping booking confirmation email');
                return { success: false, error: 'No guest email' };
            }

            const guestName = guest.fullName || guest.displayName || guest.name || bookingData.guestName || 'Guest';
            const guestText = bookingData.numberOfGuests === 1 ? 'Guest' : 'Guests';
            const nightText = bookingData.numberOfNights === 1 ? 'Night' : 'Nights';

            // Format dates
            let checkInDate = 'N/A';
            let checkOutDate = 'N/A';
            try {
                if (bookingData.checkIn) {
                    const checkIn = bookingData.checkIn.toDate ? bookingData.checkIn.toDate() : new Date(bookingData.checkIn);
                    checkInDate = checkIn.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                if (bookingData.checkOut) {
                    const checkOut = bookingData.checkOut.toDate ? bookingData.checkOut.toDate() : new Date(bookingData.checkOut);
                    checkOutDate = checkOut.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                }
            } catch (e) {
                console.warn('Error formatting dates:', e);
            }

            const templateParams = {
                to_email: guestEmail,
                to_name: guestName,
                booking_id: bookingData.id || 'N/A',
                listing_title: bookingData.listingTitle || 'N/A',
                location: bookingData.location?.locationName || bookingData.location?.city || 'Location not specified',
                check_in_date: checkInDate,
                check_out_date: checkOutDate,
                number_of_guests: (bookingData.numberOfGuests || 1).toString(),
                guest_text: guestText,
                number_of_nights: (bookingData.numberOfNights || 1).toString(),
                night_text: nightText,
                total_price: bookingData.totalPrice ? `₱${Number(bookingData.totalPrice).toLocaleString()}` : '₱0',
                payment_method: bookingData.paymentMethod || 'N/A',
                booking_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            };

            console.log('Sending booking confirmation email after approval:', templateParams);

            const response = await emailjs.send(
                'service_rd856gj',
                'booking_confirmation',
                templateParams,
                'UHPQ8D4gCNphfFPyn'
            );

            console.log('Booking confirmation email sent successfully!', response);
            return { success: true, response };
        } catch (error) {
            console.error('Error sending booking confirmation email:', error);
            return { success: false, error: error.message || 'Unknown error' };
        }
    };

    const handleApproveBooking = async (booking) => {
        if (!booking) return;
        
        try {
            // Approve the booking
            const result = await approveBooking(booking.id);
            
            if (result.success) {
                // Send confirmation email
                const emailResult = await sendBookingConfirmationEmail(booking);
                if (emailResult.success) {
                    console.log('✅ Booking approved and confirmation email sent');
                } else {
                    console.warn('⚠️ Booking approved but email failed:', emailResult.error);
                }
                
                alert('Booking approved! Confirmation email has been sent to the guest.');
                loadBookings(); // Reload to refresh the list
            } else {
                alert('Failed to approve booking: ' + result.error);
            }
        } catch (error) {
            console.error('Error approving booking:', error);
            alert('Failed to approve booking');
        }
    };

    // Count cancellation requests and pending approvals for notification badges
    const cancellationRequestCount = bookings.filter(b => b.status === 'requesting_cancellation').length;
    const pendingApprovalCount = bookings.filter(b => b.status === 'pending').length;

    if (loading) {
        return (
            <div className="p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Bookings</h2>
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-500">Loading bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold">Bookings</h2>
                <div className="flex gap-2">
                    {pendingApprovalCount > 0 && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {pendingApprovalCount} Pending Approval{pendingApprovalCount > 1 ? 's' : ''}
                        </span>
                    )}
                    {cancellationRequestCount > 0 && (
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {cancellationRequestCount} Cancellation Request{cancellationRequestCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <p className="text-gray-600">No bookings yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => {
                        const listing = listingCache[booking.listingId] || {};
                        const guest = guestCache[booking.guestId] || {};
                        const isCancellationRequest = booking.status === 'requesting_cancellation';
                        const isPending = booking.status === 'pending';
                        
                        return (
                            <div 
                                key={booking.id} 
                                className={`bg-white rounded-xl shadow-md border-2 p-4 sm:p-6 ${
                                    isPending ? 'border-orange-400 bg-orange-50' :
                                    isCancellationRequest ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                                {listing.title || booking.listingTitle || 'Listing'}
                                            </h3>
                                            {getStatusBadge(booking)}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <UserCircle className="w-4 h-4" />
                                                <span><strong>Guest:</strong> {guest.fullName || guest.email || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span><strong>Check-in:</strong> {formatDateOnly(booking.checkIn)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span><strong>Check-out:</strong> {formatDateOnly(booking.checkOut)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                <span><strong>Guests:</strong> {booking.numberOfGuests || booking.guests || 1}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                <span><strong>Total:</strong> ₱{(booking.totalPrice || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span><strong>Booking ID:</strong> {booking.id}</span>
                                            </div>
                                        </div>

                                        {isCancellationRequest && booking.cancellationReason && (
                                            <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                                                <p className="text-sm font-semibold text-yellow-800 mb-1">Cancellation Reason:</p>
                                                <p className="text-sm text-yellow-700">{booking.cancellationReason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {isPending && (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleApproveBooking(booking)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Approve Booking
                                            </button>
                                        </div>
                                    )}
                                    {isCancellationRequest && (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <button
                                                onClick={() => handleCancellationAction(booking, 'approve')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleCancellationAction(booking, 'deny')}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                Deny
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancellation Action Modal */}
            {showCancellationModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4">
                            {cancellationAction === 'approve' ? 'Approve Cancellation' : 'Deny Cancellation'}
                        </h3>
                        
                        {cancellationAction === 'approve' && (
                            <>
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-yellow-600 text-xl">⚠️</span>
                                        <p className="text-sm font-semibold text-yellow-800">Refund Policy</p>
                                    </div>
                                    <ul className="text-sm text-gray-700 space-y-2">
                                        <li className="flex items-center gap-2">
                                            <span className="text-green-600 font-bold">✓</span>
                                            <span>Within 24hrs: <strong>Full Refund - no deduction</strong></span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-orange-600 font-bold">!</span>
                                            <span>After 24hrs to 48hrs: <strong>Partial Refund with 20% deduction</strong></span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-600 font-bold">✗</span>
                                            <span>After 48hrs: <strong>Cancellation only - no refund</strong></span>
                                        </li>
                                    </ul>
                                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-yellow-200">
                                        Note: Refund Policies are based on time since booking was created.
                                    </p>
                                </div>
                                
                                {(() => {
                                    const cancellationRequestTime = selectedBooking.cancellationRequestedAt || selectedBooking.updatedAt;
                                    const refundInfo = calculateRefund(selectedBooking, cancellationRequestTime);
                                    return (
                                        <div className="mb-4 p-4 bg-teal-50 rounded-lg">
                                            <p className="text-sm font-semibold text-teal-800 mb-1">Calculated Refund:</p>
                                            <p className="text-lg font-bold text-teal-900">
                                                ₱{refundInfo.amount.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-teal-700 mt-1">
                                                Policy: {refundInfo.policy === 'full_refund' ? 'Full Refund' : 
                                                         refundInfo.policy === 'partial_refund_20pct_deduction' ? 'Partial Refund (20% deduction)' : 
                                                         'No Refund'}
                                            </p>
                                        </div>
                                    );
                                })()}
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCancellationModal(false);
                                            setSelectedBooking(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApproveCancellation}
                                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        Approve Cancellation
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {cancellationAction === 'deny' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Reason for Denial (Optional):
                                    </label>
                                    <textarea
                                        id="denialReason"
                                        rows="3"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Enter reason for denying cancellation..."
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowCancellationModal(false);
                                            setSelectedBooking(null);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason = document.getElementById('denialReason')?.value || '';
                                            handleDenyCancellation(reason);
                                        }}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        Deny Cancellation
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostBookings;

