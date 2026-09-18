import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import BiyaHeleCombinedLogo from '../BiyaHeleCombinedLogo.png';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
// Note: html2pdf.js needs to be imported differently
let html2pdf;
try {
    html2pdf = require('html2pdf.js');
} catch (e) {
    html2pdf = null;
}

const FinancialReportModal = ({ dateRange, onClose }) => {
    const contentRef = useRef(null);
    const [financialData, setFinancialData] = useState({
        totalRevenue: 0,
        serviceFees: 0,
        paypalFees: 0,
        hostPayouts: 0,
        netProfit: 0,
        totalTransactions: 0,
        serviceFeeBreakdown: [],
        cashInTransactions: [],
        hostPayoutsList: [],
        bookingSummary: [],
    });

    useEffect(() => {
        loadFinancialData();
    }, [dateRange]);

    const loadFinancialData = async () => {
        try {
            let bookingsQuery;
            
            // Apply date range filter if provided
            if (dateRange.start && dateRange.end) {
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('createdAt', '>=', startDate),
                    where('createdAt', '<=', endDate)
                );
            } else {
                bookingsQuery = collection(db, 'bookings');
            }

            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load wallet transactions for host payouts and guest cash-ins
            let walletTransactionsQuery;
            if (dateRange.start && dateRange.end) {
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                walletTransactionsQuery = query(
                    collection(db, 'walletTransactions'),
                    where('createdAt', '>=', startDate),
                    where('createdAt', '<=', endDate)
                );
            } else {
                walletTransactionsQuery = collection(db, 'walletTransactions');
            }

            const walletTransactionsSnapshot = await getDocs(walletTransactionsQuery);
            const walletTransactions = walletTransactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let totalRevenue = 0;
            let serviceFees = 0;
            let paypalFees = 0;
            let hostPayouts = 0;
            const serviceFeeBreakdown = [];
            const cashInTransactions = [];
            const hostPayoutsList = [];
            const bookingSummary = [];

            // Process bookings for service fees and booking summary
            bookings.forEach(booking => {
                const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
                const totalPrice = booking.totalPrice || 0;
                const serviceFee = booking.serviceFee || 0;

                if (booking.status === 'confirmed' || booking.status === 'completed') {
                    totalRevenue += totalPrice;
                    serviceFees += serviceFee;

                    serviceFeeBreakdown.push({
                        date: bookingDate,
                        description: `Booking Admin Fee from ${booking.guestName || 'Guest'} – ${booking.listingTitle || 'Listing'} – ${booking.numberOfNights || 0} nights`,
                        amount: serviceFee,
                        status: 'Completed',
                    });

                    bookingSummary.push({
                        date: bookingDate,
                        guest: booking.guestName || 'Guest',
                        host: booking.hostId,
                        listingTitle: booking.listingTitle || 'Listing',
                        totalAmount: totalPrice,
                        serviceFee: serviceFee,
                        status: booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'refunded' ? 'Refunded' : booking.status === 'cancelled' ? 'Cancelled' : 'Completed',
                    });
                }
            });

            // Process wallet transactions for host payouts (cashout)
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
                    const txDate = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);

                    // Process host payouts (cashout transactions)
                    if (userRole === 'host' && tx.type === 'cashout') {
                        hostPayouts += tx.amount || 0;
                        hostPayoutsList.push({
                            date: txDate,
                            description: `PayPal payout to host – ${tx.meta?.paypalEmail || 'N/A'}`,
                            amount: tx.amount || 0,
                            status: tx.status === 'approved' || tx.status === 'completed' ? 'Completed' : 'Pending',
                        });
                    }

                    // Process guest cash-ins (topup transactions) - these are PayPal fees
                    if (userRole === 'guest' && tx.type === 'topup') {
                        const amount = tx.amount || 0;
                        const paypalFee = (amount * 3.4 / 100) + 15; // 3.4% + ₱15
                        const netAmount = amount - paypalFee;
                        paypalFees += paypalFee;

                        cashInTransactions.push({
                            date: txDate,
                            amount: amount,
                            paypalFees: paypalFee,
                            netAmount: netAmount,
                        });
                    }
                })
            );

            setFinancialData({
                totalRevenue,
                serviceFees,
                paypalFees,
                hostPayouts,
                netProfit: serviceFees - paypalFees, // Net Profit = Service Fees - PayPal Fees
                totalTransactions: bookings.length,
                serviceFeeBreakdown,
                cashInTransactions,
                hostPayoutsList,
                bookingSummary,
            });
        } catch (error) {
            console.error('Error loading financial data:', error);
        }
    };

    const handleDownloadPDF = async () => {
        if (!html2pdf) {
            alert('PDF generation library not available. Please install html2pdf.js');
            return;
        }
        const element = contentRef.current;
        
        if (!element) {
            alert('Content element not found');
            return;
        }
        
        // Get the scrollable parent container and modal container
        const scrollableParent = element.closest('.overflow-y-auto');
        const modalContainer = element.closest('.bg-white.rounded-lg');
        
        const originalStyles = {
            maxHeight: scrollableParent?.style.maxHeight,
            overflow: scrollableParent?.style.overflow,
            height: scrollableParent?.style.height,
            modalMaxHeight: modalContainer?.style.maxHeight
        };
        
        // Temporarily expand ALL containers to show all content
        if (scrollableParent) {
            scrollableParent.style.maxHeight = 'none';
            scrollableParent.style.overflow = 'visible';
            scrollableParent.style.height = 'auto';
        }
        if (modalContainer) {
            modalContainer.style.maxHeight = 'none';
        }
        
        // Force reflow and wait for layout to update
        void element.offsetHeight; // Force reflow
        
        // Scroll to ensure all content is in view
        if (scrollableParent) {
            scrollableParent.scrollTop = 0;
        }
        element.scrollTop = 0;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get all tables to verify content is present
        const tables = element.querySelectorAll('table');
        console.log(`Total tables to export: ${tables.length}`);
        
        // Calculate actual full height from the expanded element
        const fullHeight = element.scrollHeight || element.offsetHeight;
        const fullWidth = element.scrollWidth || element.offsetWidth;
        
        console.log(`Element dimensions - Width: ${fullWidth}, Height: ${fullHeight}`);
        
        // Don't limit height - let html2canvas capture everything
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: 'financial-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                width: fullWidth,
                // Don't set height - let it auto-calculate to capture all content
                windowWidth: fullWidth,
                // Don't limit windowHeight - let it capture full content
                scrollX: 0,
                scrollY: 0,
                allowTaint: true,
                backgroundColor: '#ffffff',
                removeContainer: false,
                onclone: (clonedDoc) => {
                    try {
                        // Ensure the cloned element also has no height restrictions
                        const clonedElement = clonedDoc.querySelector('[data-content-ref]') || 
                                             (clonedDoc.body && clonedDoc.body.firstElementChild) ||
                                             (clonedDoc.documentElement && clonedDoc.documentElement.firstElementChild);
                        if (clonedElement) {
                            clonedElement.style.height = 'auto';
                            clonedElement.style.maxHeight = 'none';
                            clonedElement.style.overflow = 'visible';
                        }
                        // Also ensure all tables and tbody have no restrictions
                        const clonedTables = clonedDoc.querySelectorAll('table');
                        clonedTables.forEach(table => {
                            table.style.height = 'auto';
                            table.style.maxHeight = 'none';
                        });
                        const clonedTbodies = clonedDoc.querySelectorAll('tbody');
                        clonedTbodies.forEach(tbody => {
                            tbody.style.height = 'auto';
                            tbody.style.maxHeight = 'none';
                        });
                    } catch (e) {
                        console.warn('Error in onclone callback:', e);
                    }
                }
            },
            jsPDF: { 
                unit: 'in', 
                format: 'a4', 
                orientation: 'landscape' 
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: ['tr', 'thead']
            }
        };
        
        try {
            // Generate PDF directly from the expanded element
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Restore original styles
            if (scrollableParent) {
                if (originalStyles.maxHeight) scrollableParent.style.maxHeight = originalStyles.maxHeight;
                else scrollableParent.style.removeProperty('max-height');
                if (originalStyles.overflow) scrollableParent.style.overflow = originalStyles.overflow;
                else scrollableParent.style.removeProperty('overflow');
                if (originalStyles.height) scrollableParent.style.height = originalStyles.height;
                else scrollableParent.style.removeProperty('height');
            }
            if (modalContainer && originalStyles.modalMaxHeight) {
                modalContainer.style.maxHeight = originalStyles.modalMaxHeight;
            } else if (modalContainer) {
                modalContainer.style.removeProperty('max-height');
            }
        }
    };

    const getPeriod = () => {
        if (dateRange.start && dateRange.end) {
            return `${new Date(dateRange.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(dateRange.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        return 'All Time – Present';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Financial Report</h2>
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

                <div ref={contentRef} data-content-ref className="p-8" style={{ width: '100%', overflow: 'visible', minHeight: '100%' }}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <img
                            src={BiyaHeleCombinedLogo}
                            alt="BiyaHele Logo"
                            className="h-12 w-auto"
                        />
                        <div className="text-right">
                            <h3 className="text-2xl font-bold text-gray-900">Financial Report</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Generated: {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Period: {getPeriod()}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-xl font-bold text-gray-900">
                                    ₱{financialData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Service Fees</p>
                                <p className="text-xl font-bold text-teal-600">
                                    ₱{financialData.serviceFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">PayPal Fees</p>
                                <p className="text-xl font-bold text-orange-600">
                                    ₱{financialData.paypalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Host Payouts</p>
                                <p className="text-xl font-bold text-blue-600">
                                    ₱{financialData.hostPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Net Profit</p>
                                <p className="text-xl font-bold text-green-600">
                                    ₱{financialData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Transactions</p>
                                <p className="text-xl font-bold text-gray-900">{financialData.totalTransactions}</p>
                            </div>
                        </div>
                    </div>

                    {/* Service Fees Breakdown */}
                    <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h4 className="text-lg font-semibold text-white bg-teal-600 px-4 py-2 rounded-t mb-0">Service Fees Breakdown</h4>
                        <div style={{ overflowX: 'visible', width: '100%' }}>
                            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', wordWrap: 'break-word' }}>
                            <thead>
                                <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '15%' }}>Date</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '50%' }}>Description</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '20%' }}>Amount</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '15%' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialData.serviceFeeBreakdown.map((item, index) => (
                                        <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.description}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Cash In Transactions */}
                    <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h4 className="text-lg font-semibold text-white bg-teal-600 px-4 py-2 rounded-t mb-0">Cash In Transactions</h4>
                        <div style={{ overflowX: 'visible', width: '100%' }}>
                            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', wordWrap: 'break-word' }}>
                            <thead>
                                <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '25%' }}>Date</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '25%' }}>Amount</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '25%' }}>PayPal Fees</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '25%' }}>Net Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialData.cashInTransactions.map((item, index) => (
                                        <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.paypalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Host Payouts */}
                    <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h4 className="text-lg font-semibold text-white bg-teal-600 px-4 py-2 rounded-t mb-0">Host Payouts</h4>
                        <div style={{ overflowX: 'visible', width: '100%' }}>
                            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', wordWrap: 'break-word' }}>
                            <thead>
                                <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '15%' }}>Date</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '50%' }}>Description</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '20%' }}>Amount</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '15%' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialData.hostPayoutsList.map((item, index) => (
                                        <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.description}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Booking Summary */}
                    <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
                        <h4 className="text-lg font-semibold text-white bg-teal-600 px-4 py-2 rounded-t mb-0">Booking Summary</h4>
                        <div style={{ overflowX: 'visible', width: '100%' }}>
                            <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto', width: '100%', wordWrap: 'break-word' }}>
                            <thead>
                                <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '10%', minWidth: '80px' }}>Date</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '18%', minWidth: '120px' }}>Guest</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '15%', minWidth: '100px' }}>Host</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '20%', minWidth: '150px' }}>Listing Title</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Total Amount</th>
                                        <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold" style={{ width: '12%', minWidth: '100px' }}>Service Fee</th>
                                        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold" style={{ width: '13%', minWidth: '90px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financialData.bookingSummary.map((item, index) => (
                                        <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                            {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.guest}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal', fontSize: '10px' }}>{item.host}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.listingTitle}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs text-right" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>₱{item.serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-xs" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{item.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialReportModal;

