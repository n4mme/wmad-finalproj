import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save, RotateCcw, Printer } from 'lucide-react';
import PrintPolicyContractModal from './PrintPolicyContractModal';

const PolicyCompliance = () => {
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [policies, setPolicies] = useState({
        cancellationPeriod: 24,
        refundWindow: 24,
        processingTime: 3,
        maxImages: 8,
        reviewLimit: 30,
        paypalFeePercentage: 3.4,
        paypalFixedFee: 15,
        refundableHours: 24,
        minRefundAmount: 50,
        refundProcessingDays: 3,
        enableRefunds: true,
        emailNotification: true,
        autoApproveRefunds: false,
        eWalletPayment: true,
        paypalPayment: true,
    });

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        try {
            const policiesDoc = await getDoc(doc(db, 'settings', 'policies'));
            if (policiesDoc.exists()) {
                setPolicies(policiesDoc.data());
            }
        } catch (error) {
            console.error('Error loading policies:', error);
        }
    };

    const handleSave = async (type) => {
        try {
            // Validate that at least one payment method is enabled
            if (type === 'payment' && !policies.eWalletPayment && !policies.paypalPayment) {
                alert('At least one payment method must be enabled!');
                return;
            }

            if (type === 'refund') {
                await setDoc(doc(db, 'settings', 'policies'), {
                    ...policies,
                    refundPolicy: policies,
                }, { merge: true });
            } else if (type === 'payment') {
                await setDoc(doc(db, 'settings', 'policies'), {
                    ...policies,
                    paymentMethods: {
                        eWallet: policies.eWalletPayment,
                        paypal: policies.paypalPayment,
                    },
                }, { merge: true });
            } else {
                await setDoc(doc(db, 'settings', 'policies'), policies, { merge: true });
            }
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving policies:', error);
            alert('Error saving settings');
        }
    };

    const handleReset = () => {
        setPolicies({
            cancellationPeriod: 24,
            refundWindow: 24,
            processingTime: 3,
            maxImages: 8,
            reviewLimit: 30,
            paypalFeePercentage: 3.4,
            paypalFixedFee: 15,
            refundableHours: 24,
            minRefundAmount: 50,
            refundProcessingDays: 3,
            enableRefunds: true,
            emailNotification: true,
            autoApproveRefunds: false,
            eWalletPayment: true,
            paypalPayment: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Policy & Compliance</h1>
                <div className="flex space-x-4">
                    <button 
                        onClick={() => setIsPrintModalOpen(true)}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <Printer className="w-5 h-5" />
                        <span>Print Policy Contract</span>
                    </button>
                    <button
                        onClick={() => handleSave('refund')}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Save Refund Policy
                    </button>
                    <button
                        onClick={() => handleSave('payment')}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Save Payment Methods
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Reset to Defaults</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Cancellation Period</p>
                    <p className="text-2xl font-bold text-teal-600">{policies.cancellationPeriod}h</p>
                    <p className="text-xs text-gray-500 mt-1">Before Check-in</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Refund Window</p>
                    <p className="text-2xl font-bold text-teal-600">{policies.refundWindow}h</p>
                    <p className="text-xs text-gray-500 mt-1">After confirmation</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Processing Time</p>
                    <p className="text-2xl font-bold text-teal-600">{policies.processingTime}d</p>
                    <p className="text-xs text-gray-500 mt-1">For refunds</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Max Images</p>
                    <p className="text-2xl font-bold text-teal-600">{policies.maxImages}</p>
                    <p className="text-xs text-gray-500 mt-1">Per listing</p>
                </div>
            </div>

            {/* Policy Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Rules */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Platform Rules</h2>
                    <p className="text-sm text-gray-600 mb-4">Basic platform regulations and limits</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cancellation Period (hours)
                            </label>
                            <input
                                type="number"
                                value={policies.cancellationPeriod}
                                onChange={(e) => setPolicies(prev => ({ ...prev, cancellationPeriod: parseInt(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Hours before check-in for free cancellation</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Images
                                </label>
                                <input
                                    type="number"
                                    value={policies.maxImages}
                                    onChange={(e) => setPolicies(prev => ({ ...prev, maxImages: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Review Limit (days)
                                </label>
                                <input
                                    type="number"
                                    value={policies.reviewLimit}
                                    onChange={(e) => setPolicies(prev => ({ ...prev, reviewLimit: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* PayPal Fees */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">PayPal Fees</h2>
                    <p className="text-sm text-gray-600 mb-4">Transaction fee configuration</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PayPal Fee Percentage (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={policies.paypalFeePercentage}
                                onChange={(e) => setPolicies(prev => ({ ...prev, paypalFeePercentage: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PayPal Fixed Fee (PHP)
                            </label>
                            <input
                                type="number"
                                value={policies.paypalFixedFee}
                                onChange={(e) => setPolicies(prev => ({ ...prev, paypalFixedFee: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Refund Eligibility */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Refund Eligibility</h2>
                    <p className="text-sm text-gray-600 mb-4">Configure refund windows and amounts</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Refundable Hours After Confirmation
                            </label>
                            <input
                                type="number"
                                value={policies.refundableHours}
                                onChange={(e) => setPolicies(prev => ({ ...prev, refundableHours: parseInt(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Hours after host confirmation for full refund (0-168)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Refund Amount (PHP)
                            </label>
                            <input
                                type="number"
                                value={policies.minRefundAmount}
                                onChange={(e) => setPolicies(prev => ({ ...prev, minRefundAmount: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum amount for refund processing</p>
                        </div>
                    </div>
                </div>

                {/* Processing Settings */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Settings</h2>
                    <p className="text-sm text-gray-600 mb-4">Refund processing and automation</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Refund Processing Days
                            </label>
                            <input
                                type="number"
                                value={policies.refundProcessingDays}
                                onChange={(e) => setPolicies(prev => ({ ...prev, refundProcessingDays: parseInt(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Days to process refunds (1-30)</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Enable Refunds</p>
                                <p className="text-xs text-gray-500">Allow users to request refunds for bookings</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={policies.enableRefunds}
                                    onChange={(e) => setPolicies(prev => ({ ...prev, enableRefunds: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Email Notification</p>
                                <p className="text-xs text-gray-500">Send Email to guest after a successful cancellation or refund</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={policies.emailNotification}
                                    onChange={(e) => setPolicies(prev => ({ ...prev, emailNotification: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Auto-Approve Eligible Refunds</p>
                                <p className="text-xs text-gray-500">Automatically approve refunds that meet eligibility criteria</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={policies.autoApproveRefunds}
                                    onChange={(e) => setPolicies(prev => ({ ...prev, autoApproveRefunds: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Methods</h2>
                <p className="text-sm text-gray-600 mb-4">Enable or disable payment methods for guest bookings</p>
                {(!policies.eWalletPayment && !policies.paypalPayment) && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 font-semibold">
                            ⚠️ At least one payment method must be enabled!
                        </p>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">E-Wallet Payment</p>
                            <p className="text-xs text-gray-500">Allow guests to pay using their e-wallet balance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policies.eWalletPayment}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    // Prevent turning off if PayPal is also off
                                    if (!newValue && !policies.paypalPayment) {
                                        alert('At least one payment method must be enabled!');
                                        return;
                                    }
                                    setPolicies(prev => ({ ...prev, eWalletPayment: newValue }));
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">PayPal Payment</p>
                            <p className="text-xs text-gray-500">Allow guests to pay using PayPal</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policies.paypalPayment}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    // Prevent turning off if E-Wallet is also off
                                    if (!newValue && !policies.eWalletPayment) {
                                        alert('At least one payment method must be enabled!');
                                        return;
                                    }
                                    setPolicies(prev => ({ ...prev, paypalPayment: newValue }));
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => handleSave('payment')}
                        disabled={!policies.eWalletPayment && !policies.paypalPayment}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Save Payment Methods
                    </button>
                </div>
            </div>

            {/* Print Policy Contract Modal */}
            <PrintPolicyContractModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                policies={policies}
            />
        </div>
    );
};

export default PolicyCompliance;

