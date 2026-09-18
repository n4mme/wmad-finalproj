import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit as firestoreLimit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Home, UserCheck, TrendingUp, DollarSign, PieChart, BarChart3, Download, Printer, Filter, X } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import TransactionHistory from './TransactionHistory';
import BestReviewsAnalytics from './BestReviewsAnalytics';
import ReportGeneration from './ReportGeneration';

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalHosts: 0,
        totalGuests: 0,
        totalListings: 0,
        platformRevenue: 0,
        grossRevenue: 0,
        hostPayouts: 0,
        serviceFees: 0,
        hostServiceFees: 0,
        paypalFees: 0,
        netRevenue: 0,
    });

    const [revenueBreakdown, setRevenueBreakdown] = useState([]);
    const [userDistribution, setUserDistribution] = useState([]);
    const [revenueTrends, setRevenueTrends] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load users (exclude admin accounts)
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsers = usersSnapshot.docs.map(doc => doc.data());
            const users = allUsers.filter(u => u.role !== 'admin'); // Exclude admin from total count
            const hosts = users.filter(u => u.role === 'host');
            const guests = users.filter(u => u.role === 'guest');

            // Load listings
            const listingsSnapshot = await getDocs(collection(db, 'listings'));
            const listings = listingsSnapshot.docs.map(doc => doc.data());

            // Load bookings
            const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Calculate revenue
            let platformRevenue = 0;
            let grossRevenue = 0;
            let hostPayouts = 0;
            let serviceFees = 0;
            let hostServiceFees = 0;
            let paypalFees = 0;
            let netRevenue = 0; // Total of Net Amount from Cash In Transactions

            bookings.forEach(booking => {
                if (booking.status === 'confirmed' || booking.status === 'completed') {
                    grossRevenue += booking.totalPrice || 0;
                    platformRevenue += booking.serviceFee || 0;
                    serviceFees += booking.serviceFee || 0;
                }
            });

            // Calculate Host Payouts and PayPal Fees from wallet transactions
            const walletTransactionsSnapshot = await getDocs(collection(db, 'walletTransactions'));
            const walletTransactions = walletTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Load user roles to identify guest vs host transactions
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

            // Process wallet transactions
            await Promise.all(
                walletTransactions.map(async (tx) => {
                    if (!tx.userId) return;
                    const userRole = await loadUserRole(tx.userId);

                    // Calculate Host Payouts from approved/completed cashout transactions
                    if (userRole === 'host' && tx.type === 'cashout' && (tx.status === 'approved' || tx.status === 'completed')) {
                        hostPayouts += tx.amount || 0;
                    }

                    // Calculate PayPal Fees, Net Revenue, and add to Gross Revenue from guest topup (Cash In) transactions
                    if (userRole === 'guest' && tx.type === 'topup') {
                        const amount = tx.amount || 0;
                        // Add full cash-in amount to Gross Revenue (before PayPal fees)
                        grossRevenue += amount;
                        // Calculate PayPal fees: 3.4% + ₱15
                        const paypalFee = (amount * 3.4 / 100) + 15;
                        paypalFees += paypalFee;
                        // Calculate Net Amount (Amount - PayPal Fees)
                        const netAmount = amount - paypalFee;
                        netRevenue += netAmount;
                    }

                    // Calculate host service fees from admin wallet transactions
                    if (tx.type === 'earning' && tx.meta?.feeType === 'host_service_fee') {
                        hostServiceFees += tx.amount || 0;
                    }
                })
            );

            // Calculate revenue breakdown - use actual Host Payouts from cashout transactions
            setRevenueBreakdown([
                { name: 'Service Fees', value: serviceFees },
                { name: 'Host Payouts', value: hostPayouts },
                { name: 'PayPal Fees', value: paypalFees },
            ]);

            // User distribution
            setUserDistribution([
                { name: 'Hosts', value: hosts.length },
                { name: 'Guests', value: guests.length },
                { name: 'Total Users', value: users.length },
            ]);

            // Revenue trends (last 30 days)
            const trends = generateRevenueTrends(bookings, walletTransactions);
            setRevenueTrends(trends);

            setStats({
                totalUsers: users.length,
                totalHosts: hosts.length,
                totalGuests: guests.length,
                totalListings: listings.length,
                platformRevenue,
                grossRevenue,
                hostPayouts,
                serviceFees,
                hostServiceFees,
                paypalFees,
                netRevenue,
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const generateRevenueTrends = (bookings, walletTransactions = []) => {
        const trends = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            let grossRevenue = 0;
            let hostPayouts = 0;
            let serviceFees = 0;

            bookings.forEach(booking => {
                const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
                if (bookingDate.toDateString() === date.toDateString() && 
                    (booking.status === 'confirmed' || booking.status === 'completed')) {
                    grossRevenue += booking.totalPrice || 0;
                    serviceFees += booking.serviceFee || 0;
                }
            });

            // Calculate host payouts from approved cashout transactions for this date
            walletTransactions.forEach(tx => {
                if (tx.type === 'cashout' && (tx.status === 'approved' || tx.status === 'completed')) {
                    const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                    if (txDate.toDateString() === date.toDateString()) {
                        hostPayouts += tx.amount || 0;
                    }
                }
            });

            trends.push({
                date: dateStr,
                'Gross Revenue': grossRevenue,
                'Host Payouts': hostPayouts,
                'Service Fees': serviceFees,
            });
        }
        return trends;
    };

    const COLORS = ['#14b8a6', '#0d9488', '#90EE90']; // Added light green for PayPal Fees

    return (
        <div className="space-y-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Users</p>
                            <p className="text-3xl font-bold text-teal-600">{stats.totalUsers}</p>
                        </div>
                        <Users className="w-12 h-12 text-teal-600 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Hosts</p>
                            <p className="text-3xl font-bold text-teal-600">{stats.totalHosts}</p>
                        </div>
                        <UserCheck className="w-12 h-12 text-teal-600 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Guests</p>
                            <p className="text-3xl font-bold text-teal-600">{stats.totalGuests}</p>
                        </div>
                        <Users className="w-12 h-12 text-teal-600 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Listings</p>
                            <p className="text-3xl font-bold text-teal-600">{stats.totalListings}</p>
                        </div>
                        <Home className="w-12 h-12 text-teal-600 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Platform Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₱{stats.platformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Service fees from bookings</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-teal-600 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Gross Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₱{stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Total from all bookings</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-teal-600 opacity-50" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Host Payouts</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₱{stats.hostPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Paid to hosts</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-teal-600 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Financial Breakdown</h2>
                        <p className="text-sm text-gray-600 mt-1">Detailed revenue and expense analysis</p>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <p className="text-sm text-gray-600">Service Fees</p>
                            <p className="text-lg font-bold text-gray-900">
                                ₱{stats.serviceFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Net Revenue</p>
                            <p className="text-lg font-bold text-gray-900">
                                ₱{stats.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Streams Panel */}
                    <div className="bg-green-50 rounded-lg shadow-md p-6 border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Streams</h3>
                        <p className="text-sm text-gray-600 mb-4">Platform income sources</p>
                        <div className="space-y-4">
                            {/* Service Fee */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-900">Service Fee</p>
                                    <p className="text-xs text-gray-600 mt-1">Platform revenue from bookings</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    ₱{stats.serviceFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            {/* Gross Revenue */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-900">Gross Revenue</p>
                                    <p className="text-xs text-gray-600 mt-1">Total from user payments</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    ₱{stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expenses & Costs Panel */}
                    <div className="bg-red-50 rounded-lg shadow-md p-6 border border-red-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Expenses & Costs</h3>
                        <p className="text-sm text-gray-600 mb-4">Platform operational costs</p>
                        <div className="space-y-4">
                            {/* Host Payouts */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-900">Host Payouts</p>
                                    <p className="text-xs text-gray-600 mt-1">Paid to property hosts</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    ₱{stats.hostPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            {/* PayPal Fees */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-gray-900">PayPal Fees (Host Cash-Out)</p>
                                    <p className="text-xs text-gray-600 mt-1">3.4% + ₱15 (host fees not included)</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900">
                                    ₱{stats.paypalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Breakdown</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Breakdown of Gross Revenue (Total Gross Revenue: ₱{stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </p>
                    <ResponsiveContainer width="100%" height={350}>
                        <RechartsPieChart>
                            <Pie
                                data={revenueBreakdown}
                                cx="50%"
                                cy="45%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {revenueBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                            <Legend 
                                verticalAlign="bottom" 
                                height={50}
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value, entry) => {
                                    // entry.payload contains the data for this legend item
                                    const amount = entry.payload?.value || 0;
                                    return `${value}: ₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                                }}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {/* User Distribution */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#14b8a6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Revenue Trends */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={revenueTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                        <Legend />
                        <Line type="monotone" dataKey="Gross Revenue" stroke="#14b8a6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Host Payouts" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Service Fees" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Transaction History */}
            <TransactionHistory />

            {/* Best Reviews Analytics */}
            <BestReviewsAnalytics />

            {/* Report Generation */}
            <ReportGeneration />
        </div>
    );
};

export default DashboardOverview;

