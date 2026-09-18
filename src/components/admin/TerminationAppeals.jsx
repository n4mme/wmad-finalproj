import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const TerminationAppeals = () => {
    const [appeals, setAppeals] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadAppeals();
    }, [filter]);

    const loadAppeals = async () => {
        try {
            // Load termination appeals from a collection (you may need to create this)
            // For now, we'll use a placeholder structure
            let appealsQuery = collection(db, 'terminationAppeals');
            
            if (filter !== 'all') {
                appealsQuery = query(appealsQuery, where('status', '==', filter));
            }

            const appealsSnapshot = await getDocs(appealsQuery);
            const appealsData = await Promise.all(
                appealsSnapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    const userDoc = await getDoc(doc(db, 'users', data.userId));
                    const userData = userDoc.data();
                    
                    return {
                        id: docSnap.id,
                        ...data,
                        userName: userData?.fullName || 'Unknown',
                        userEmail: userData?.email || 'Unknown',
                    };
                })
            );

            setAppeals(appealsData);
        } catch (error) {
            console.error('Error loading appeals:', error);
            // If collection doesn't exist, show empty state
            setAppeals([]);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Termination Appeals</h1>

            {/* Filter Buttons */}
            <div className="flex space-x-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === status
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Appeals List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                    {appeals.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No termination appeals found</p>
                    ) : (
                        <div className="space-y-6">
                            {appeals.map((appeal) => (
                                <div
                                    key={appeal.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg">{appeal.userName}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{appeal.userEmail}</p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    appeal.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : appeal.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Submitted</p>
                                                <p className="font-medium text-gray-900">
                                                    {appeal.submittedAt?.toDate
                                                        ? appeal.submittedAt.toDate().toLocaleString('en-US', {
                                                            dateStyle: 'long',
                                                            timeStyle: 'short',
                                                        })
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">User ID</p>
                                                <p className="font-medium text-gray-900">{appeal.userId}</p>
                                            </div>
                                            {appeal.reviewedAt && (
                                                <div>
                                                    <p className="text-gray-600">Reviewed</p>
                                                    <p className="font-medium text-gray-900">
                                                        {appeal.reviewedAt?.toDate
                                                            ? appeal.reviewedAt.toDate().toLocaleString('en-US', {
                                                                dateStyle: 'long',
                                                                timeStyle: 'short',
                                                            })
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Original Termination Reason</p>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                {appeal.terminationReason || 'N/A'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Appeal Message</p>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                {appeal.appealMessage || 'N/A'}
                                            </p>
                                        </div>

                                        {appeal.adminResponse && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 mb-2">Admin Response</p>
                                                <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                                                    {appeal.adminResponse}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TerminationAppeals;

