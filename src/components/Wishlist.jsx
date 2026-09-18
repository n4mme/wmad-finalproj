import React, { useState, useEffect } from 'react';
import { Sparkles, Send, CheckCircle, Search, Clock, Wrench } from 'lucide-react';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createWish, getUserWishes } from '../utils/firestoreUtils';

const Wishlist = () => {
    const [wishText, setWishText] = useState('');
    const [userData, setUserData] = useState(null);
    const [pastWishes, setPastWishes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const maxWords = 500;

    // Inspiration buttons
    const inspirationOptions = [
        'Check-in/Check-out Flexibility',
        'Pricing and Payment',
        'Parking',
        'Extra/Missing Amenities',
        'Guests and Pets',
        'Add more experiences',
        'Better Search',
        'Better Sorting'
    ];

    useEffect(() => {
        loadUserData();
        loadPastWishes();
    }, []);

    useEffect(() => {
        // Count words in wish text
        const words = wishText.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    }, [wishText]);

    const loadUserData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadPastWishes = async () => {
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const result = await getUserWishes(user.uid);
        if (result.success) {
            setPastWishes(result.data);
        }
        setIsLoading(false);
    };

    const handleInspirationClick = (option) => {
        const prefix = wishText.trim() ? ' ' : '';
        const newText = wishText + prefix + `I wish BiyaHele have ${option.toLowerCase()}. `;
        
        // Check word limit
        const words = newText.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length <= maxWords) {
            setWishText(newText);
        } else {
            // Truncate to max words
            const truncated = words.slice(0, maxWords).join(' ');
            setWishText(truncated);
        }
    };

    const handleSubmitWish = async () => {
        if (!wishText.trim()) {
            alert('Please enter your wish or suggestion.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to submit a wish.');
            return;
        }

        // Extract inspiration tags from the wish text
        const inspirationTags = inspirationOptions.filter(option => 
            wishText.toLowerCase().includes(option.toLowerCase())
        );

        setIsSubmitting(true);
        const result = await createWish({
            userId: user.uid,
            wishText: wishText.trim(),
            inspirationTags: inspirationTags
        });

        if (result.success) {
            setWishText('');
            alert('Your wish has been submitted successfully!');
            loadPastWishes(); // Reload past wishes to show the new one
        } else {
            alert('Failed to submit wish. Please try again.');
        }
        setIsSubmitting(false);
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : date.toDate();
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

  return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-12 px-4">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Wishlist</h1>
                    <p className="text-lg md:text-xl text-teal-100">Your Wish is our Command</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Wish Submission Panel */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                    {/* User Info */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                        <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                            {userData?.photoURL ? (
                                <img 
                                    src={userData.photoURL} 
                                    alt="Profile" 
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {getInitial(userData?.fullName)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {userData?.fullName || 'Guest User'}
                            </h2>
                            <p className="text-sm text-gray-600">Making a wish</p>
                        </div>
                    </div>

                    {/* Wish Text Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Wish or Suggestion
                        </label>
                        <textarea
                            value={wishText}
                            onChange={(e) => {
                                const words = e.target.value.trim().split(/\s+/).filter(word => word.length > 0);
                                if (words.length <= maxWords || e.target.value.length < wishText.length) {
                                    setWishText(e.target.value);
                                }
                            }}
                            placeholder="I wish BiyaHele have…"
                            className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 resize-none"
                            maxLength={maxWords * 10} // Approximate character limit
                        />
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                                {wordCount} / {maxWords} words {wordCount >= maxWords && '(maximum reached)'}
          </p>
        </div>
                    </div>

                    {/* Inspiration Buttons */}
                    <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                            Get inspired with these options:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {inspirationOptions.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleInspirationClick(option)}
                                    className="px-3 py-2 text-xs md:text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition-colors text-center"
                                >
                                    {option}
                                </button>
        ))}
      </div>
    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmitWish}
                        disabled={isSubmitting || !wishText.trim() || wordCount > maxWords}
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        {isSubmitting ? 'Submitting...' : 'Send My Wish'}
                    </button>
                </div>

                {/* Every Wish is Helpful Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
                        Every Wish is Helpful
                    </h2>
                    
                    {/* Three Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {/* Panel 1: You Wish */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-2xl md:text-3xl font-bold">1</span>
                            </div>
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-600">
                                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                You Wish
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                Share your vision, your hopes, and your objectives with us.
                            </p>
                        </div>

                        {/* Panel 2: We Verify your Wish */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-2xl md:text-3xl font-bold">2</span>
                            </div>
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                                    <Search className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                We Verify your Wish
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                We will thoroughly evaluate your request to determine its potential benefit.
                            </p>
                        </div>

                        {/* Panel 3: We Develop */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-2xl md:text-3xl font-bold">3</span>
                            </div>
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                                    <Wrench className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                                We Develop
                            </h3>
                            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                Your wishes into reality.
                            </p>
                        </div>
        </div>
      </div>

                {/* Past Wishes Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                        Your Past Wishes
        </h2>
                    
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading your wishes...</p>
                        </div>
                    ) : pastWishes.length === 0 ? (
                        <div className="text-center py-8">
                            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No wishes submitted yet. Start making your first wish above!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pastWishes.map((wish) => (
                                <div
                                    key={wish.id}
                                    className="border-2 border-gray-200 rounded-lg p-4 md:p-6 hover:border-teal-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                {formatDate(wish.createdAt)}
            </span>
          </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            wish.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            wish.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                                            wish.status === 'in_development' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {wish.status === 'pending' ? 'Pending' :
                                             wish.status === 'reviewed' ? 'Reviewed' :
                                             wish.status === 'in_development' ? 'In Development' :
                                             'Completed'}
            </span>
          </div>
                                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {wish.wishText}
                                    </p>
                                    {wish.inspirationTags && wish.inspirationTags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {wish.inspirationTags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
