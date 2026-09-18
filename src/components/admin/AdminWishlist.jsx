import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Sparkles, Clock, User } from 'lucide-react';

const AdminWishlist = () => {
    const [wishes, setWishes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadWishes();
    }, []);

    const loadWishes = async () => {
        try {
            setIsLoading(true);
            // Get all wishes ordered by creation date (newest first)
            const wishesQuery = query(
                collection(db, 'wishes'),
                orderBy('createdAt', 'desc')
            );
            
            const wishesSnapshot = await getDocs(wishesQuery);
            
            // Fetch user data for each wish
            const wishesData = await Promise.all(
                wishesSnapshot.docs.map(async (docSnap) => {
                    const wishData = docSnap.data();
                    
                    // Get user information
                    let userData = null;
                    try {
                        const userDoc = await getDoc(doc(db, 'users', wishData.userId));
                        if (userDoc.exists()) {
                            userData = userDoc.data();
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    }
                    
                    return {
                        id: docSnap.id,
                        wishText: wishData.wishText || '',
                        createdAt: wishData.createdAt?.toDate 
                            ? wishData.createdAt.toDate() 
                            : (wishData.createdAt ? new Date(wishData.createdAt) : new Date()),
                        status: wishData.status || 'pending',
                        userId: wishData.userId,
                        // User information
                        guestName: userData?.fullName || 'Unknown User',
                        guestEmail: userData?.email || 'No email',
                        guestPhotoURL: userData?.photoURL || null,
                    };
                })
            );
            
            setWishes(wishesData);
        } catch (error) {
            console.error('Error loading wishes:', error);
            // If orderBy fails (likely due to missing index), try without it
            if (error.code === 'failed-precondition') {
                try {
                    const wishesQuery = query(collection(db, 'wishes'));
                    const wishesSnapshot = await getDocs(wishesQuery);
                    
                    const wishesData = await Promise.all(
                        wishesSnapshot.docs.map(async (docSnap) => {
                            const wishData = docSnap.data();
                            
                            let userData = null;
                            try {
                                const userDoc = await getDoc(doc(db, 'users', wishData.userId));
                                if (userDoc.exists()) {
                                    userData = userDoc.data();
                                }
                            } catch (error) {
                                console.error('Error fetching user data:', error);
                            }
                            
                            return {
                                id: docSnap.id,
                                wishText: wishData.wishText || '',
                                createdAt: wishData.createdAt?.toDate 
                                    ? wishData.createdAt.toDate() 
                                    : (wishData.createdAt ? new Date(wishData.createdAt) : new Date()),
                                status: wishData.status || 'pending',
                                userId: wishData.userId,
                                guestName: userData?.fullName || 'Unknown User',
                                guestEmail: userData?.email || 'No email',
                                guestPhotoURL: userData?.photoURL || null,
                            };
                        })
                    );
                    
                    // Sort manually by createdAt
                    wishesData.sort((a, b) => b.createdAt - a.createdAt);
                    setWishes(wishesData);
                } catch (retryError) {
                    console.error('Error loading wishes (retry):', retryError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return 'Unknown date';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Guest Wishlist</h1>
                    <p className="text-gray-600 mt-1">View all wishes and suggestions from guests</p>
                </div>
                <div className="flex items-center gap-2 text-teal-600">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-lg font-semibold">{wishes.length} Wishes</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        <p className="text-gray-500 mt-4">Loading wishes...</p>
                    </div>
                ) : wishes.length === 0 ? (
                    <div className="text-center py-12">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 text-lg">No wishes submitted yet</p>
                        <p className="text-gray-500 text-sm mt-2">Wishes from guests will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {wishes.map((wish) => (
                            <div
                                key={wish.id}
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-6">
                                    {/* Profile Picture */}
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                                            {wish.guestPhotoURL ? (
                                                <img
                                                    src={wish.guestPhotoURL}
                                                    alt={wish.guestName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold text-teal-600">
                                                    {getInitial(wish.guestName)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Guest Name and Email */}
                                        <div className="mb-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {wish.guestName}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600 ml-6">
                                                {wish.guestEmail}
                                            </p>
                                        </div>

                                        {/* Wish Text */}
                                        <div className="mb-3">
                                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                {wish.wishText}
                                            </p>
                                        </div>

                                        {/* Date and Time */}
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span>Sent on {formatDateTime(wish.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminWishlist;

