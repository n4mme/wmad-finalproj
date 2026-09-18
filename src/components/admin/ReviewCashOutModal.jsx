import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { updateUserWalletBalance } from '../../utils/firestoreUtils';
import { processPayPalPayout } from '../../utils/paypalPayouts';

const ReviewCashOutModal = ({ request, onClose, onUpdate }) => {
    const [adminNotes, setAdminNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            const amount = request.amount || 0;
            const paypalEmail = request.paypalEmail || request.meta?.paypalEmail;
            
            if (!paypalEmail || !paypalEmail.includes('@')) {
                alert('Error: Invalid PayPal email address');
                setIsProcessing(false);
                return;
            }

            // Calculate PayPal fees (to be deducted from payout amount, not from wallet)
            const paypalFeePercentage = 3.4;
            const paypalFixedFee = 15;
            const paypalFees = (amount * paypalFeePercentage / 100) + paypalFixedFee;
            
            // Amount to send to host's PayPal (after deducting fees)
            const amountToSend = amount - paypalFees;
            
            // Validate that amount after fees is positive
            if (amountToSend <= 0) {
                alert(`Error: The requested amount (₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) is too small. After PayPal fees (₱${paypalFees.toFixed(2)}), the payout amount would be ₱${amountToSend.toFixed(2)}. Please request a larger amount.`);
                setIsProcessing(false);
                return;
            }
            
            // First, process PayPal payout (send amount minus fees to host's PayPal)
            // This calls PayPal API directly from the frontend
            // Currency: PHP (no conversion needed)
            console.log('Processing PayPal payout (client-side)...', { 
                paypalEmail, 
                requestedAmount: amount,
                paypalFees: paypalFees,
                amountToSend: amountToSend,
                currency: 'PHP'
            });
            const payoutResult = await processPayPalPayout(paypalEmail, amount, 'PHP', paypalFees);
            
            if (!payoutResult.success) {
                const errorMessage = payoutResult.error || 'Unknown error occurred';
                console.error('PayPal payout failed:', errorMessage);
                alert(`Error processing PayPal payout: ${errorMessage}\n\nPlease check:\n1. PayPal credentials are configured\n2. PayPal account has sufficient balance\n3. Recipient email is valid\n\nSee console for more details.`);
                setIsProcessing(false);
                return;
            }
            
            // Log successful payout
            console.log('PayPal payout successful:', {
                payoutId: payoutResult.payoutId,
                batchStatus: payoutResult.batchStatus,
                amountSent: amountToSend,
                feesDeducted: paypalFees
            });

            // Record the payout transaction in Firestore (similar to your example)
            const payoutTransactionRef = await addDoc(collection(db, 'walletTransactions'), {
                userId: request.userId,
                type: 'payout',
                amount: amount,
                currency: 'PHP',
                status: 'processing', // Status: 'processing' as in your example
                meta: {
                    paypalEmail: paypalEmail,
                    paypalBatchId: payoutResult.payoutId,
                    paypalBatchStatus: payoutResult.batchStatus,
                    amountRequested: amount,
                    amountSent: amountToSend,
                    paypalFees: paypalFees,
                    currency: 'PHP', // All amounts in PHP
                },
                createdAt: serverTimestamp(),
                payoutProcessedAt: serverTimestamp(),
            });

            console.log('Payout transaction recorded:', payoutTransactionRef.id);

            // Deduct only the requested amount from host's wallet (fees already deducted from payout)
            const walletResult = await updateUserWalletBalance(request.userId, -amount);
            
            if (!walletResult.success) {
                alert('Error: Insufficient wallet balance or wallet update failed');
                setIsProcessing(false);
                return;
            }
            
            // Update the original cashout request status to approved
            await updateDoc(doc(db, 'walletTransactions', request.id), {
                status: 'approved',
                adminNotes: adminNotes || null,
                reviewedAt: new Date(),
                paypalFees: paypalFees,
                amountRequested: amount,
                amountSent: amountToSend,
                walletDeduction: amount,
                payoutId: payoutResult.payoutId,
                payoutBatchId: payoutResult.payoutId,
                payoutProcessedAt: new Date(),
                paypalEmail: paypalEmail,
            });
            
            const successMessage = `Cash-out request approved!\n\nRequested Amount: ₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\nPayPal Fees (deducted from payout): ₱${paypalFees.toFixed(2)}\nAmount Sent to ${paypalEmail}: ₱${amountToSend.toLocaleString(undefined, { minimumFractionDigits: 2 })}\nWallet Deduction: ₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\nPayout ID: ${payoutResult.payoutId}`;
            
            alert(successMessage);
            onUpdate();
        } catch (error) {
            console.error('Error approving cash-out:', error);
            alert('Error approving cash-out request: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'walletTransactions', request.id), {
                status: 'cancelled',
                adminNotes: adminNotes || null,
                reviewedAt: new Date(),
            });
            alert('Cash-out request cancelled');
            onUpdate();
        } catch (error) {
            console.error('Error cancelling cash-out:', error);
            alert('Error cancelling cash-out request');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Review Cash-out Request</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Host Details */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Full Name</h3>
                        <p className="text-lg font-semibold text-gray-900">{request.hostName}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Amount to Cash Out</h3>
                        <p className="text-2xl font-bold text-teal-600">
                            ₱{request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">PayPal Email</h3>
                        <p className="text-lg text-gray-900">{request.paypalEmail || request.meta?.paypalEmail || 'N/A'}</p>
                    </div>

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notes (Optional)
                        </label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="Add any notes about this cash-out request..."
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">PayPal Payout:</span> Approval will send money from your PayPal business account to{' '}
                            <span className="font-semibold">{request.paypalEmail || request.meta?.paypalEmail || 'the host\'s PayPal Account'}</span>.
                        </p>
                        <div className="text-sm text-blue-800 mt-2 space-y-1">
                            <p>
                                <span className="font-semibold">Requested Amount:</span> ₱{request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p>
                                <span className="font-semibold">PayPal Fees (3.4% + ₱15):</span> ₱{(((request.amount || 0) * 3.4 / 100) + 15).toFixed(2)} <span className="text-blue-600">(deducted from payout amount)</span>
                            </p>
                            <p>
                                <span className="font-semibold">Amount Sent to Host PayPal:</span> ₱{((request.amount || 0) - (((request.amount || 0) * 3.4 / 100) + 15)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p>
                                <span className="font-semibold">Wallet Deduction:</span> ₱{request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-blue-600">(full requested amount)</span>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                            <XCircle className="w-5 h-5" />
                            <span>Reject</span>
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>Approve</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewCashOutModal;

