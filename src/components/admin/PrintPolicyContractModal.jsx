import React, { useState, useRef } from 'react';
import { X, Download } from 'lucide-react';
import BiyaHeleCombinedLogo from '../BiyaHeleCombinedLogo.png';
let html2pdf;
try {
    html2pdf = require('html2pdf.js');
} catch (e) {
    html2pdf = null;
}

const PrintPolicyContractModal = ({ isOpen, onClose, policies }) => {
    const contentRef = useRef(null);
    const [generatedDate] = useState(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }));

    if (!isOpen) return null;

    const handleDownloadPDF = () => {
        if (!html2pdf) {
            alert('PDF generation library not available. Please install html2pdf.js');
            return;
        }

        const element = contentRef.current;
        const opt = {
            margin: 1,
            filename: `Policy_Compliance_Contract_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy & Compliance Contract</h2>
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download PDF</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <div ref={contentRef} className="space-y-6">
                        {/* Logo and Title Section */}
                        <div className="flex items-center justify-between mb-6">
                            <img 
                                src={BiyaHeleCombinedLogo} 
                                alt="BiyaHele Logo" 
                                className="h-20 w-auto"
                            />
                            <div className="text-right">
                                <h3 className="text-xl font-bold text-gray-900">Policy & Compliance Contract</h3>
                            </div>
                        </div>

                        {/* Generated Date and Administrator */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold">Generated:</span> {generatedDate}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold">Administrator:</span> admin@gmail.com
                            </p>
                        </div>

                        {/* Policy Snapshot */}
                        <div className="bg-teal-600 text-white rounded-lg p-6 mb-6">
                            <h4 className="text-xl font-bold mb-4">Policy Snapshot</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm opacity-90">Cancellation Window</p>
                                    <p className="text-lg font-semibold text-teal-100">{policies.cancellationPeriod || 24}hrs</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Refund Window</p>
                                    <p className="text-lg font-semibold text-teal-100">{policies.refundWindow || 24}hrs</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Processing Time</p>
                                    <p className="text-lg font-semibold text-teal-100">{policies.processingTime || 3} days</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Review Limit</p>
                                    <p className="text-lg font-semibold text-teal-100">{policies.reviewLimit || 30} days</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Service Fees</p>
                                    <p className="text-lg font-semibold text-teal-100">Active</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Auto-Approve Refunds</p>
                                    <p className="text-lg font-semibold text-teal-100">
                                        {policies.autoApproveRefunds ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Refund Policy Overview */}
                        <div className="mb-6">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xl font-bold text-gray-900">Refund Policy Overview</h4>
                                <span className={`px-4 py-2 rounded-lg font-semibold ${
                                    policies.enableRefunds 
                                        ? 'bg-teal-600 text-white' 
                                        : 'bg-red-600 text-white'
                                }`}>
                                    {policies.enableRefunds ? 'Refund Enabled' : 'Refund Disabled'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">
                                Guests may request refunds within the configured refundable window. PayPal fees are applied at {policies.paypalFeePercentage || 3.4}% + ₱{policies.paypalFixedFee || 15}. Minimum refundable amount is ₱{policies.minRefundAmount || 50}. Refund notifications are sent automatically.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                                <li>Refund window: {policies.refundWindow || 24} hours from confirmation</li>
                                <li>Processing time: {policies.refundProcessingDays || 3} business days</li>
                                <li>Auto-approval: {policies.autoApproveRefunds ? 'Enabled' : 'Disabled'} for eligible cases</li>
                            </ul>
                        </div>

                        {/* Payment Channels */}
                        <div className="mb-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Payment Channels</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {/* E-Wallet Payments */}
                                <div className="border-2 border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-900 mb-2">E-Wallet Payments</h5>
                                    <p className="text-sm text-gray-600 mb-3">Guest wallet top-ups and credits</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                        policies.eWalletPayment 
                                            ? 'bg-teal-600 text-white' 
                                            : 'bg-red-600 text-white'
                                    }`}>
                                        {policies.eWalletPayment ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>

                                {/* PayPal Payments */}
                                <div className="border-2 border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-900 mb-2">PayPal Payments</h5>
                                    <p className="text-sm text-gray-600 mb-3">Direct PayPal transactions</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                        policies.paypalPayment 
                                            ? 'bg-teal-600 text-white' 
                                            : 'bg-red-600 text-white'
                                    }`}>
                                        {policies.paypalPayment ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Compliance & Enforcement */}
                        <div className="mb-6">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Compliance & Enforcement</h4>
                            <h5 className="font-semibold text-gray-800 mb-3">Mandatory Clauses</h5>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 ml-4">
                                <li>All refund requests are processed within the stated turnaround time and subject to eligibility windows.</li>
                                <li>Hosts agree to honor cancellation, refund, and payout rules configured within the platform settings.</li>
                                <li>Guests acknowledge that payment methods enabled by the platform constitute the official settlement channels.</li>
                                <li>Service fees and tax components are transparently disclosed within booking summaries and payout statements.</li>
                                <li>Policy updates are communicated to stakeholders and enforced uniformly across all listings and accounts.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintPolicyContractModal;

