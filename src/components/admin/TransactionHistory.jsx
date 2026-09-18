import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit as firestoreLimit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Filter, Printer, X } from 'lucide-react';
import PrintTransactionModal from './PrintTransactionModal';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [accountFilter, setAccountFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const itemsPerPage = 5;

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, accountFilter, statusFilter]);

    const loadTransactions = async () => {
        try {
            const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Also load wallet transactions
            const walletTransactionsSnapshot = await getDocs(collection(db, 'walletTransactions'));
            const walletTransactions = walletTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Combine and format transactions
            const allTransactions = [];

            // Add booking transactions
            bookings.forEach(booking => {
                // Guest transaction (payment) - REMOVED: Only show refund and cash-in for guests
                // Guest payment transactions are no longer shown in admin transaction history

                // Admin transaction (service fee from guest) - keep this
                if (booking.status === 'confirmed' || booking.status === 'completed') {
                    // Admin transaction (service fee from guest)
                    allTransactions.push({
                        id: `booking-${booking.id}-admin`,
                        date: booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt),
                        description: `Service Fee (Guest) from ${booking.listingTitle || 'Listing'}`,
                        account: 'admin',
                        type: 'service_fee',
                        status: 'completed',
                        amount: booking.serviceFee || 0,
                        isPositive: true,
                        feeType: 'service_fee', // Mark as guest service fee
                    });
                }
                // Note: Host earning transactions from bookings are NOT shown in admin transaction history
                // Only host cashout transactions (PayPal payouts) are shown
                // Guest payment transactions are NOT shown - only refund and cash-in transactions
            });

            // Add wallet transactions
            // For hosts, only show cashout transactions (pending and approved)
            // For guests, only show refund and topup (cash-in) transactions
            // For admin, show all transactions
            const usersMap = new Map();
            const loadUserRole = async (userId) => {
                if (usersMap.has(userId)) {
                    return usersMap.get(userId);
                }
                try {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        usersMap.set(userId, role);
                        return role;
                    }
                } catch (e) {
                    console.error('Error loading user role:', e);
                }
                return null;
            };

            await Promise.all(
                walletTransactions.map(async (tx) => {
                    if (!tx.userId) return;

                    const userRole = await loadUserRole(tx.userId);
                    
                    // Determine account type
                    let accountType = 'guest';
                    if (userRole === 'host') {
                        accountType = 'host';
                    } else if (userRole === 'admin') {
                        accountType = 'admin';
                    }

                    // For host transactions, only include cashout types
                    if (accountType === 'host' && tx.type !== 'cashout') {
                        return; // Skip non-cashout transactions for hosts
                    }

                    // For guests, only include refund and topup (cash-in) transactions
                    if (accountType === 'guest' && tx.type !== 'refund' && tx.type !== 'topup') {
                        return; // Skip non-refund and non-topup transactions for guests
                    }

                    // For admin, include all transaction types
                    // For guest, only refund and topup are included above

                    // Get listing title for refund transactions and host service fee transactions
                    let listingTitle = null;
                    if (tx.type === 'refund' && tx.meta?.listingTitle) {
                        listingTitle = tx.meta.listingTitle;
                    } else if ((tx.type === 'refund' || tx.meta?.feeType === 'host_service_fee') && tx.meta?.listingId) {
                        try {
                            const listingDoc = await getDoc(doc(db, 'listings', tx.meta.listingId));
                            if (listingDoc.exists()) {
                                listingTitle = listingDoc.data().title;
                            }
                        } catch (e) {
                            console.error('Error loading listing title:', e);
                        }
                    } else if (tx.meta?.listingTitle) {
                        listingTitle = tx.meta.listingTitle;
                    }

                    // Create description for host service fee transactions
                    let description = tx.description || tx.type;
                    if (accountType === 'admin' && tx.meta?.feeType === 'host_service_fee') {
                        description = `Host Service Fee from ${listingTitle || 'Listing'}`;
                    } else if (accountType === 'admin' && tx.meta?.feeType === 'service_fee') {
                        description = `Service Fee from ${listingTitle || 'Listing'}`;
                    }

                    allTransactions.push({
                        id: `wallet-${tx.id}`,
                        date: tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt),
                        description: description,
                        account: accountType,
                        type: tx.type,
                        status: tx.status || 'completed',
                        amount: tx.amount || 0,
                        isPositive: ['topup', 'earning', 'refund'].includes(tx.type),
                        isCashout: tx.type === 'cashout',
                        listingTitle: listingTitle, // Store listing title for refunds and service fees
                        feeType: tx.meta?.feeType, // Store fee type for better identification
                    });
                })
            );

            // Sort by date (newest first)
            allTransactions.sort((a, b) => b.date - a.date);
            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        if (accountFilter !== 'all') {
            filtered = filtered.filter(tx => tx.account === accountFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(tx => {
                // Normalize status for filtering
                let normalizedStatus = tx.status;
                
                // Map 'approved' to 'completed' for display purposes
                if (normalizedStatus === 'approved') {
                    normalizedStatus = 'completed';
                }
                // Map 'rejected' to 'cancelled' for filtering (both should show when filtering for cancelled)
                if (normalizedStatus === 'rejected') {
                    normalizedStatus = 'cancelled';
                }
                
                return normalizedStatus === statusFilter;
            });
        }

        setFilteredTransactions(filtered);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setAccountFilter('all');
        setStatusFilter('all');
    };

    const getStatusColor = (status) => {
        // Handle both 'cancelled' and old 'rejected' statuses
        const normalizedStatus = status === 'rejected' ? 'cancelled' : status;
        switch (normalizedStatus) {
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'cancelled':
                return 'text-red-600 bg-red-50';
            case 'pending':
                return 'text-yellow-600 bg-yellow-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusDisplay = (status) => {
        // Convert 'rejected' to 'Cancelled' for display
        if (status === 'rejected') {
            return 'Cancelled';
        }
        // Handle other statuses
        if (status === 'approved') {
            return 'Completed';
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">{filteredTransactions.length}</span> / {transactions.length} transactions
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <X className="w-4 h-4" />
                        <span>Clear Filters</span>
                    </button>
                    <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print Transaction</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                    <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="all">All</option>
                        <option value="guest">Guests</option>
                        <option value="host">Hosts</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="all">All</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </p>
                {currentTransactions.map((tx) => {
                    // For host cashout transactions, format differently
                    const isHostCashout = tx.account === 'host' && tx.isCashout;
                    
                    // For guest transactions (refund and cash-in)
                    const isGuestRefund = tx.account === 'guest' && tx.type === 'refund';
                    const isGuestCashIn = tx.account === 'guest' && tx.type === 'topup';
                    
                    // Check if this is a Host Service Fee transaction
                    const isHostServiceFee = tx.account === 'admin' && tx.feeType === 'host_service_fee';
                    
                    let description = tx.description;
                    if (isHostCashout) {
                        description = tx.status === 'approved' || tx.status === 'completed' 
                            ? 'PayPal payout to host – Amount of cashout'
                            : 'Pending PayPal payout to host – Amount to cashout';
                    } else if (isGuestRefund) {
                        // Format: "Booking Refund – {Title of the listing}"
                        const listingTitle = tx.listingTitle || 'Listing';
                        description = `Booking Refund – ${listingTitle}`;
                    } else if (isGuestCashIn) {
                        // Format: "Cash In Tracking – Amount of Cash-in"
                        description = `Cash In Tracking – ₱${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    } else if (isHostServiceFee) {
                        // Ensure Host Service Fee has clear identifier
                        const listingTitle = tx.listingTitle || 'Listing';
                        description = `Host Service Fee from ${listingTitle}`;
                    }

                    return (
                        <div
                            key={tx.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">{description}</p>
                                        {isHostServiceFee && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                Host Service Fee
                                            </span>
                                        )}
                                    </div>
                                    {/* Date below title for guest transactions */}
                                    {(isGuestRefund || isGuestCashIn) && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {tx.date.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    )}
                                    {/* Date for non-guest transactions (host cashout, admin, etc.) */}
                                    {!isGuestRefund && !isGuestCashIn && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {tx.date.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`text-lg font-bold ${
                                            isHostCashout && tx.status === 'pending'
                                                ? 'text-yellow-600'
                                                : isHostCashout && (tx.status === 'approved' || tx.status === 'completed')
                                                ? 'text-green-600'
                                                : (isGuestRefund || isGuestCashIn)
                                                ? 'text-red-600'
                                                : tx.status === 'pending'
                                                ? 'text-yellow-600'
                                                : tx.isPositive
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {isHostCashout ? '' : (isGuestRefund || isGuestCashIn ? '-' : (tx.isPositive ? '+' : '-'))}₱{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        {isHostCashout && ' (PayPal)'}
                                    </p>
                                    {/* Status below amount - show "Completed" for guest transactions */}
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(tx.status)}`}
                                    >
                                        {(isGuestRefund || isGuestCashIn) ? 'Completed' : getStatusDisplay(tx.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {isPrintModalOpen && (
                <PrintTransactionModal
                    transactions={filteredTransactions}
                    accountFilter={accountFilter}
                    statusFilter={statusFilter}
                    onClose={() => setIsPrintModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TransactionHistory;

