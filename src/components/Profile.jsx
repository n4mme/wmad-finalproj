import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getGuestBookings } from '../utils/firestoreUtils';
import { ArrowLeft, User, Mail, Shield, Calendar, Star, TrendingUp } from 'lucide-react';

const Profile = ({ setPage }) => {
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        totalBookings: 0,
        completedTrips: 0,
        reviewsGiven: 0,
        avgRating: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }

            const bookingsResult = await getGuestBookings(user.uid);
            if (bookingsResult.success) {
                const bookings = bookingsResult.data;
                setRecentBookings(bookings.slice(0, 3));
                
                const completed = bookings.filter(b => b.status === 'completed').length;
                setStats({
                    totalBookings: bookings.length,
                    completedTrips: completed,
                    reviewsGiven: 0,
                    avgRating: 0
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        setLoading(false);
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => setPage('Home')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                    <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                            {userData?.photoURL ? (
                                <img src={userData.photoURL} alt="Profile" className="w-24 h-24 rounded-full" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{getInitial(userData?.fullName)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{userData?.fullName || 'User'}</h1>
                            <div className="flex items-center text-gray-600 mb-1">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>{userData?.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Shield className="w-4 h-4 mr-2" />
                                <span className="capitalize">{userData?.role || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Completed Trips', value: stats.completedTrips, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
                        { label: 'Reviews Given', value: stats.reviewsGiven, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
                        { label: 'Avg. Rating', value: stats.avgRating || 'N/A', icon: Star, color: 'bg-purple-50 text-purple-600' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6">
                            <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center mb-3`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
                    {recentBookings.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No bookings yet</p>
                    ) : (
                        <div className="space-y-4">
                            {recentBookings.map((booking) => (
                                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{booking.listingTitle}</h3>
                                            <p className="text-sm text-gray-600">Check-in: {booking.checkIn?.toDate?.().toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {booking.status}
                                        </span>
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

export default Profile;

