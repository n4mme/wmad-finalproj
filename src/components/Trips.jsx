import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getGuestBookings } from '../utils/firestoreUtils';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

const Trips = ({ setPage }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const result = await getGuestBookings(user.uid);
        if (result.success) {
            setBookings(result.data);
        }
        setLoading(false);
    };

    const filteredBookings = bookings.filter(booking => {
        if (filter === 'upcoming') return booking.status === 'confirmed' || booking.status === 'pending';
        if (filter === 'past') return booking.status === 'completed' || booking.status === 'cancelled';
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button onClick={() => setPage('Home')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-bold">Your Trips</h1>
                        </div>
                        <div className="flex space-x-2">
                            {['all', 'upcoming', 'past'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg capitalize ${
                                        filter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {filteredBookings.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No trips found</h2>
                        <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
                        <button onClick={() => setPage('Home')} className="px-6 py-3 bg-teal-600 text-white rounded-lg">
                            Explore Listings
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{booking.listingTitle}</h3>
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{booking.checkIn?.toDate?.().toLocaleDateString()} - {booking.checkOut?.toDate?.().toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600">Guests: {booking.numberOfGuests}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {booking.status}
                                        </span>
                                        <p className="mt-4 text-lg font-bold text-gray-900">₱{booking.totalPrice}</p>
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

export default Trips;

