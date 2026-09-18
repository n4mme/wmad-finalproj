import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, UserX, Star } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('hosts');
    const [hosts, setHosts] = useState([]);
    const [guests, setGuests] = useState([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const hostsData = usersData.filter(u => u.role === 'host');
            const guestsData = usersData.filter(u => u.role === 'guest');

            // Load ratings for hosts
            const hostsWithRatings = await Promise.all(
                hostsData.map(async (host) => {
                    try {
                        // Get host's listings
                        const listingsQuery = query(
                            collection(db, 'listings'),
                            where('hostId', '==', host.id)
                        );
                        const listingsSnapshot = await getDocs(listingsQuery);
                        const listings = listingsSnapshot.docs.map(doc => doc.id);

                        // Calculate average rating from all listings
                        let totalRating = 0;
                        let reviewCount = 0;
                        for (const listingId of listings) {
                            try {
                                const reviewsSnapshot = await getDocs(
                                    collection(db, 'listings', listingId, 'reviews')
                                );
                                const reviews = reviewsSnapshot.docs.map(doc => doc.data());
                                reviews.forEach(review => {
                                    totalRating += review.rating || 0;
                                    reviewCount++;
                                });
                            } catch (error) {
                                // Skip if reviews collection doesn't exist
                            }
                        }

                        return {
                            ...host,
                            averageRating: reviewCount > 0 ? totalRating / reviewCount : 0,
                            reviewCount,
                        };
                    } catch (error) {
                        return {
                            ...host,
                            averageRating: 0,
                            reviewCount: 0,
                        };
                    }
                })
            );

            setHosts(hostsWithRatings);
            setGuests(guestsData);
            setUsers(filter === 'hosts' ? hostsWithRatings : guestsData);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    useEffect(() => {
        setUsers(filter === 'hosts' ? hosts : guests);
    }, [filter, hosts, guests]);

    const handleTerminate = async (userId) => {
        if (window.confirm('Are you sure you want to terminate this user?')) {
            try {
                await updateDoc(doc(db, 'users', userId), {
                    status: 'terminated',
                    terminatedAt: new Date(),
                });
                alert('User terminated successfully');
                loadUsers();
            } catch (error) {
                console.error('Error terminating user:', error);
                alert('Error terminating user');
            }
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                // Soft delete: mark as deleted (safer, keeps data for records)
                await updateDoc(doc(db, 'users', userId), {
                    status: 'deleted',
                    deletedAt: new Date(),
                });
                alert('User deleted successfully');
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                // If soft delete fails, try hard delete
                if (error.code === 'permission-denied') {
                    try {
                        await deleteDoc(doc(db, 'users', userId));
                        alert('User permanently deleted');
                        loadUsers();
                    } catch (deleteError) {
                        console.error('Error permanently deleting user:', deleteError);
                        alert('Error deleting user: ' + deleteError.message);
                    }
                } else {
                    alert('Error deleting user: ' + error.message);
                }
            }
        }
    };

    const handleSuspend = async (userId) => {
        if (window.confirm('Are you sure you want to suspend this user?')) {
            try {
                await updateDoc(doc(db, 'users', userId), {
                    status: 'suspended',
                    suspendedAt: new Date(),
                });
                alert('User suspended successfully');
                loadUsers();
            } catch (error) {
                console.error('Error suspending user:', error);
                alert('Error suspending user');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-gray-100 text-gray-700';
            case 'terminated':
                return 'bg-red-100 text-red-700';
            case 'suspended':
                return 'bg-yellow-100 text-yellow-700';
            case 'deleted':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatus = (user) => {
        if (user.status === 'terminated') return 'terminated';
        if (user.status === 'suspended') return 'suspended';
        if (user.status === 'deleted') return 'deleted';
        if (user.emailVerified || user.otpVerified) return 'active';
        return 'inactive';
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= Math.round(rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setFilter('hosts')}
                            className={`px-6 py-4 font-medium transition-colors ${
                                filter === 'hosts'
                                    ? 'border-b-2 border-teal-600 text-teal-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Hosts ({hosts.length})
                        </button>
                        <button
                            onClick={() => setFilter('guests')}
                            className={`px-6 py-4 font-medium transition-colors ${
                                filter === 'guests'
                                    ? 'border-b-2 border-teal-600 text-teal-600'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Guests ({guests.length})
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {users.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No {filter} found</p>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                                                {user.photoURL ? (
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold text-teal-600">
                                                        {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-lg">{user.fullName || 'Unknown'}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                                                
                                                {filter === 'hosts' && (
                                                    <div className="mt-3 flex items-center space-x-4">
                                                        <div className="flex items-center space-x-2">
                                                            {renderStars(user.averageRating || 0)}
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {user.averageRating > 0 ? user.averageRating.toFixed(1) : '0.0'}
                                                            </span>
                                                            <span className="text-sm text-gray-500">
                                                                ({user.reviewCount || 0} {user.reviewCount === 1 ? 'review' : 'reviews'})
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Status</p>
                                                        <span
                                                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(getStatus(user))}`}
                                                        >
                                                            {getStatus(user).charAt(0).toUpperCase() + getStatus(user).slice(1)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Joined Date</p>
                                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                                            {user.createdAt?.toDate
                                                                ? user.createdAt.toDate().toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                })
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {filter === 'hosts' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleTerminate(user.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        <span>Terminate</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleSuspend(user.id)}
                                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                        <span>Suspend</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Delete</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
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

export default UserManagement;

