import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import ReviewCashOutModal from './ReviewCashOutModal';

const CashOutApproval = () => {
    const [cashOutRequests, setCashOutRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        loadCashOutRequests();
    }, []);

    const loadCashOutRequests = async () => {
        try {
            // Load cash out requests from walletTransactions or a dedicated collection
            const walletTransactionsQuery = query(
                collection(db, 'walletTransactions'),
                where('type', '==', 'cashout'),
                where('status', '==', 'pending')
            );
            const walletTransactionsSnapshot = await getDocs(walletTransactionsQuery);

            const requests = await Promise.all(
                walletTransactionsSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const userDoc = await getDoc(doc(db, 'users', data.userId));
                    const userData = userDoc.data();
                    
                    return {
                        id: docSnap.id,
                        ...data,
                        hostName: userData?.fullName || 'Unknown',
                        hostEmail: userData?.email || 'Unknown',
                        hostPhotoURL: userData?.photoURL || null,
                        paypalEmail: data.meta?.paypalEmail || data.paypalEmail || 'N/A',
                    };
                })
            );

            setCashOutRequests(requests);
        } catch (error) {
            console.error('Error loading cash out requests:', error);
        }
    };

    const handleReview = (request) => {
        setSelectedRequest(request);
        setIsReviewModalOpen(true);
    };

    const handleRequestUpdate = () => {
        loadCashOutRequests();
        setIsReviewModalOpen(false);
        setSelectedRequest(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Cash Out Approval</h1>

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="overflow-x-auto">
                    {cashOutRequests.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No cash out requests found</p>
                    ) : (
                        <div className="space-y-4 p-6">
                            {cashOutRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex items-center gap-6">
                                        {/* Left: Profile Picture */}
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                                            {request.hostPhotoURL ? (
                                                <img
                                                    src={request.hostPhotoURL}
                                                    alt={request.hostName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                    <span className="text-2xl font-bold text-teal-600">
                                                    {request.hostName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            </div>
                                        </div>

                                        {/* Beside Profile Pic: Full Name and Email */}
                                        <div className="flex-shrink-0 min-w-[200px]">
                                            <div className="text-base font-semibold text-gray-900">{request.hostName}</div>
                                            <div className="text-sm text-gray-600 mt-1">{request.hostEmail}</div>
                                    </div>
                                    
                                        {/* Wide gap, then Amount */}
                                        <div className="flex-shrink-0 min-w-[150px] ml-8">
                                            <div className="text-sm text-gray-500">Amount to Cash Out</div>
                                            <div className="text-xl font-bold text-teal-600 mt-1">
                                                ₱{request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>

                                        {/* Beside Amount: PayPal Email */}
                                        <div className="flex-shrink-0 min-w-[200px] ml-8">
                                            <div className="text-sm text-gray-500">PayPal Email</div>
                                            <div className="text-sm font-medium text-gray-900 mt-1 break-words">
                                                {request.paypalEmail || 'N/A'}
                                            </div>
                                        </div>

                                        {/* Beside PayPal Email: Date & Time */}
                                        <div className="flex-shrink-0 min-w-[180px] ml-6">
                                            <div className="text-sm text-gray-500">Date & Time Requested</div>
                                            <div className="text-sm text-gray-900 mt-1 whitespace-nowrap">
                                                {request.createdAt?.toDate
                                                    ? request.createdAt.toDate().toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : new Date(request.createdAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                            </div>
                                    </div>
                                    
                                        {/* Far Right: Review Button */}
                                        <div className="flex-shrink-0 ml-auto">
                                    <button
                                        onClick={() => handleReview(request)}
                                                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 whitespace-nowrap"
                                    >
                                                <Eye className="w-4 h-4" />
                                        <span>Review</span>
                                    </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isReviewModalOpen && selectedRequest && (
                <ReviewCashOutModal
                    request={selectedRequest}
                    onClose={() => {
                        setIsReviewModalOpen(false);
                        setSelectedRequest(null);
                    }}
                    onUpdate={handleRequestUpdate}
                />
            )}
        </div>
    );
};

export default CashOutApproval;

