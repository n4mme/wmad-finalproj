import React, { useState, useRef } from 'react';
import { X, Download } from 'lucide-react';
import BiyaHeleCombinedLogo from '../BiyaHeleCombinedLogo.png';
// Note: html2pdf.js needs to be imported differently
// For now, we'll use a placeholder - you may need to install jspdf and html2canvas separately
let html2pdf;
try {
    html2pdf = require('html2pdf.js');
} catch (e) {
    html2pdf = null;
}

const PrintTransactionModal = ({ transactions, accountFilter, statusFilter, onClose }) => {
    const contentRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const calculateSummary = () => {
        let totalInflow = 0;
        let totalOutflow = 0;
        let guestTransactions = 0;
        let hostTransactions = 0;
        let adminTransactions = 0;

        transactions.forEach(tx => {
            if (tx.isPositive) {
                totalInflow += tx.amount;
            } else {
                totalOutflow += tx.amount;
            }

            if (tx.account === 'guest') guestTransactions++;
            if (tx.account === 'host') hostTransactions++;
            if (tx.account === 'admin') adminTransactions++;
        });

        return {
            totalInflow,
            totalOutflow,
            netFlow: totalInflow - totalOutflow,
            guestTransactions,
            hostTransactions,
            adminTransactions,
            totalTransactions: transactions.length,
        };
    };

    const calculateStatusBreakdown = () => {
        const completed = transactions.filter(tx => tx.status === 'completed');
        const cancelled = transactions.filter(tx => tx.status === 'cancelled');
        const pending = transactions.filter(tx => tx.status === 'pending');

        return {
            completed: {
                count: completed.length,
                amount: completed.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
            },
            cancelled: {
                count: cancelled.length,
                amount: cancelled.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
            },
            pending: {
                count: pending.length,
                amount: pending.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
            },
        };
    };

    const getDateRange = () => {
        if (transactions.length === 0) return 'N/A';
        const dates = transactions.map(tx => tx.date).sort((a, b) => a - b);
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        return `${firstDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    };

    const summary = calculateSummary();
    const statusBreakdown = calculateStatusBreakdown();
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

    const handleDownloadPDF = () => {
        if (!html2pdf) {
            alert('PDF generation library not available. Please install html2pdf.js');
            return;
        }
        const element = contentRef.current;
        const opt = {
            margin: 1,
            filename: 'transaction-history-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        };
        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Transaction History Report</h2>
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
                            <h3 className="text-2xl font-bold text-gray-900">Transaction History Report</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Generated: {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>

                    {/* Period */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Period:</span> {getDateRange()}
                        </p>
                    </div>

                    {/* Transaction Summary */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total Inflow</p>
                                <p className="text-xl font-bold text-green-600">
                                    ₱{summary.totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Outflow</p>
                                <p className="text-xl font-bold text-red-600">
                                    ₱{summary.totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Net Flow</p>
                                <p className="text-xl font-bold text-gray-900">
                                    ₱{summary.netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Transactions</p>
                                <p className="text-xl font-bold text-gray-900">{summary.totalTransactions}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                                <p className="text-sm text-gray-600">Guest Transactions</p>
                                <p className="text-lg font-semibold text-gray-900">{summary.guestTransactions}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Host Transactions</p>
                                <p className="text-lg font-semibold text-gray-900">{summary.hostTransactions}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Admin Transactions</p>
                                <p className="text-lg font-semibold text-gray-900">{summary.adminTransactions}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                <span className="font-semibold">Account Filter:</span> {accountFilter === 'all' ? 'All' : accountFilter.charAt(0).toUpperCase() + accountFilter.slice(1)} only
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                <span className="font-semibold">Status Filter:</span> {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} only
                            </p>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-lg font-semibold text-green-600">{statusBreakdown.completed.count}</p>
                                <p className="text-sm text-gray-500">
                                    ₱{statusBreakdown.completed.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Cancelled</p>
                                <p className="text-lg font-semibold text-red-600">{statusBreakdown.cancelled.count}</p>
                                <p className="text-sm text-gray-500">
                                    ₱{statusBreakdown.cancelled.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-lg font-semibold text-yellow-600">{statusBreakdown.pending.count}</p>
                                <p className="text-sm text-gray-500">
                                    ₱{statusBreakdown.pending.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Transactions */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Transactions</h4>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Date</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Description</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Account</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Type</th>
                                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
                                    <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="border border-gray-300 px-4 py-2 text-sm">
                                            {tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm">{tx.description}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm capitalize">{tx.account}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm capitalize">{tx.type.replace('_', ' ')}</td>
                                        <td className="border border-gray-300 px-4 py-2 text-sm capitalize">{tx.status}</td>
                                        <td className={`border border-gray-300 px-4 py-2 text-sm text-right font-semibold ${
                                            tx.status === 'pending' ? 'text-yellow-600' : tx.isPositive ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {tx.isPositive ? '+' : '-'}₱{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrintTransactionModal;

