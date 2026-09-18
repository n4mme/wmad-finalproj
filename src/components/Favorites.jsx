import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getUserFavorites, removeFromFavorites } from '../utils/firestoreUtils';
import { Heart, ArrowLeft } from 'lucide-react';

const Favorites = ({ setPage }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        const result = await getUserFavorites(user.uid);
        if (result.success) {
            setFavorites(result.data);
        }
        setLoading(false);
    };

    const handleRemoveFavorite = async (listingId) => {
        const user = auth.currentUser;
        if (!user) return;

        const result = await removeFromFavorites(user.uid, listingId);
        if (result.success) {
            // Remove from local state
            setFavorites(favorites.filter(fav => fav.listingId !== listingId));
        }
    };

    const handleStartExploring = () => {
        setPage('Home');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your favorites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => setPage('Home')}
                            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Your Favorites</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {favorites.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Heart className="w-16 h-16 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            No favorites yet
                        </h2>
                        <p className="text-gray-600 text-center mb-8 max-w-md">
                            Start exploring and save your favorite listings by clicking the heart icon
                        </p>
                        <button
                            onClick={handleStartExploring}
                            className="px-8 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-md"
                        >
                            Start Exploring
                        </button>
                    </div>
                ) : (
                    // Favorites Grid
                    <div>
                        <p className="text-gray-600 mb-6">
                            {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {favorites.map((favorite) => (
                                <div
                                    key={favorite.id}
                                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={favorite.listingSnapshot?.coverImage || 'https://placehold.co/400x300/0D9488/FFFFFF?text=No+Image'}
                                            alt={favorite.listingSnapshot?.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFavorite(favorite.listingId);
                                            }}
                                            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                                        >
                                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                                            {favorite.listingSnapshot?.title || 'Untitled'}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {favorite.listingSnapshot?.location || 'Location not specified'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-500">★</span>
                                                <span className="text-sm text-gray-900 ml-1">
                                                    {favorite.listingSnapshot?.rating || 'New'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    ₱{favorite.listingSnapshot?.pricePerNight || 0}
                                                </span>
                                                <span className="text-sm text-gray-500"> / night</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;

