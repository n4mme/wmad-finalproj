import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import BiyaHeleCombinedLogo from '../BiyaHeleCombinedLogo.png';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
// Note: html2pdf.js needs to be imported differently
let html2pdf;
try {
    html2pdf = require('html2pdf.js');
} catch (e) {
    html2pdf = null;
}

const ListingPerformanceReportModal = ({ onClose }) => {
    const contentRef = useRef(null);
    const [listings, setListings] = useState([]);
    const [summary, setSummary] = useState({
        totalListings: 0,
        activeListings: 0,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
    });
    const [topListings, setTopListings] = useState([]);

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            const listingsSnapshot = await getDocs(collection(db, 'listings'));
            const listingsData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // All listings are considered active
            const activeListings = listingsData;

            // Load bookings for each listing
            const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let totalRevenue = 0;
            let totalBookings = 0;
            let totalRating = 0;
            let ratingCount = 0;

            const listingsWithStats = await Promise.all(
                listingsData.map(async (listing) => {
                    const listingBookings = bookings.filter(b => b.listingId === listing.id);
                    const confirmedBookings = listingBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
                    const revenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
                    totalRevenue += revenue;
                    totalBookings += confirmedBookings.length;

                    // Load reviews
                    try {
                        const reviewsSnapshot = await getDocs(collection(db, 'listings', listing.id, 'reviews'));
                        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
                        const avgRating = reviews.length > 0
                            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                            : 0;
                        if (avgRating > 0) {
                            totalRating += avgRating;
                            ratingCount++;
                        }
                        return {
                            ...listing,
                            bookings: confirmedBookings.length,
                            revenue,
                            rating: avgRating,
                            reviewCount: reviews.length,
                        };
                    } catch (error) {
                        return {
                            ...listing,
                            bookings: confirmedBookings.length,
                            revenue,
                            rating: 0,
                            reviewCount: 0,
                        };
                    }
                })
            );

            // Get top performing listings
            const top = listingsWithStats
                .filter(l => l.revenue > 0)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);

            // Load host names for top listings
            const topWithHosts = await Promise.all(
                top.map(async (listing) => {
                    try {
                        const hostDoc = await getDoc(doc(db, 'users', listing.hostId));
                        const hostData = hostDoc.data();
                        return {
                            ...listing,
                            hostName: hostData?.fullName || 'Unknown',
                        };
                    } catch (error) {
                        return {
                            ...listing,
                            hostName: 'Unknown',
                        };
                    }
                })
            );

            setTopListings(topWithHosts);
            setSummary({
                totalListings: listingsData.length,
                activeListings: activeListings.length,
                totalBookings,
                totalRevenue,
                averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
            });
            setListings(listingsWithStats);
        } catch (error) {
            console.error('Error loading listings:', error);
        }
    };

    const handleDownloadPDF = () => {
        if (!html2pdf) {
            alert('PDF generation library not available. Please install html2pdf.js');
            return;
        }
        const element = contentRef.current;
        const opt = {
            margin: 1,
            filename: 'listing-performance-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        };
        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Listing Performance Report</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div ref={contentRef} className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <img
                            src={BiyaHeleCombinedLogo}
                            alt="BiyaHele Logo"
                            className="h-12 w-auto"
                        />
                        <div className="text-right">
                            <h3 className="text-2xl font-bold text-gray-900">Listing Performance Report</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Generated: {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Period: All Time – Present
                            </p>
                        </div>
                    </div>

                    {/* Listing Performance Summary */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Listing Performance Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total Listings</p>
                                <p className="text-xl font-bold text-gray-900">{summary.totalListings}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Listings</p>
                                <p className="text-xl font-bold text-teal-600">{summary.activeListings}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Bookings</p>
                                <p className="text-xl font-bold text-blue-600">{summary.totalBookings}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-xl font-bold text-green-600">
                                    ₱{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Average Rating</p>
                                <p className="text-xl font-bold text-yellow-600">{summary.averageRating.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Performing Listings */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Listings</h4>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Listing Title</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Host</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Category</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Bookings</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Revenue</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topListings.map((listing) => (
                                    <tr key={listing.id}>
                                        <td className="border border-gray-300 px-4 py-2 text-sm">{listing.title || 'Untitled'}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm">{listing.hostName}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm capitalize">{listing.category || 'N/A'}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-right">{listing.bookings}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                                            ₱{listing.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm text-right">
                                            {listing.rating > 0 ? listing.rating.toFixed(1) : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingPerformanceReportModal;

