import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Star } from 'lucide-react';

const BestReviewsAnalytics = () => {
    const [listings, setListings] = useState([]);

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            const listingsSnapshot = await getDocs(collection(db, 'listings'));
            const listingsData = listingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Load reviews for each listing
            const listingsWithReviews = await Promise.all(
                listingsData.map(async (listing) => {
                    try {
                        const reviewsSnapshot = await getDocs(
                            collection(db, 'listings', listing.id, 'reviews')
                        );
                        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
                        
                        const averageRating = reviews.length > 0
                            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                            : 0;

                        return {
                            ...listing,
                            reviews,
                            averageRating,
                            reviewCount: reviews.length,
                        };
                    } catch (error) {
                        return {
                            ...listing,
                            reviews: [],
                            averageRating: 0,
                            reviewCount: 0,
                        };
                    }
                })
            );

            // Sort by average rating (highest first)
            listingsWithReviews.sort((a, b) => b.averageRating - a.averageRating);
            setListings(listingsWithReviews);
        } catch (error) {
            console.error('Error loading listings:', error);
        }
    };

    const renderStars = (rating, reviewCount) => {
        if (reviewCount === 0) {
            return (
                <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 text-gray-300 fill-gray-300" />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">No reviews</span>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${
                            star <= Math.round(rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-900">
                    {rating.toFixed(1)}
                </span>
                <span className="ml-1 text-sm text-gray-500">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Best Reviews Analytics</h3>
            <div className="space-y-4">
                {listings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No listings found</p>
                ) : (
                    listings.map((listing) => (
                        <div
                            key={listing.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">{listing.title || 'Untitled Listing'}</h4>
                                    {renderStars(listing.averageRating, listing.reviewCount)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BestReviewsAnalytics;

