import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { auth } from '../firebase';
import { getGuestPoints, redeemRewardWithPayPal, completeRewardRedemption } from '../utils/firestoreUtils';
import PayPalCheckout from './PayPalCheckout';

const Points = ({ setPage }) => {
    const [activeSection, setActiveSection] = useState('earn'); // 'earn' or 'marketplace'
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(null); // Track which reward is being redeemed
    const [showPayPalModal, setShowPayPalModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    
    const loadPoints = async () => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            const result = await getGuestPoints(user.uid);
            if (result.success) {
                setPoints(result.points || 0);
            } else {
                console.error('Failed to load points:', result.error);
                setPoints(0);
            }
        } catch (error) {
            console.error('Error loading points:', error);
            setPoints(0);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadPoints();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const earnPointsCriteria = [
        { 
            icon: '🎯', 
            title: 'Complete Their First Booking', 
            points: '+15 pts',
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-600'
        },
        { 
            icon: '3rd', 
            title: 'Complete a Third Booking', 
            points: '+25 pts',
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'from-blue-50 to-cyan-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-600'
        },
        { 
            icon: '7+', 
            title: 'Book a Stay 7+ Nights Long', 
            points: '+20 pts',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-600'
        },
        { 
            icon: '⭐', 
            title: 'Leave Review / Rate a listing', 
            points: '+10 pts',
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-50 to-orange-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-600'
        },
        { 
            icon: '📷', 
            title: 'Upload a Profile Photo', 
            points: '+5 pts',
            color: 'from-indigo-500 to-violet-500',
            bgColor: 'from-indigo-50 to-violet-50',
            borderColor: 'border-indigo-200',
            textColor: 'text-indigo-600'
        }
    ];
    
    const rewards = [
        { points: 100, amount: 99 },
        { points: 300, amount: 320 },
        { points: 500, amount: 550 }
    ];
    
    const handleRedeem = async (reward) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to redeem rewards');
            return;
        }
        
        if (points < reward.points) {
            alert('Insufficient points!');
            return;
        }
        
        if (!window.confirm(`Redeem ${reward.points} points for ₱${reward.amount}?`)) {
            return;
        }
        
        // First, deduct points
        setRedeeming(reward.points);
        const result = await redeemRewardWithPayPal(user.uid, reward.points, reward.amount, false);
        
        if (result.success) {
            // Update points immediately
            setPoints(result.newPoints);
            // Show PayPal modal
            setSelectedReward(reward);
            setShowPayPalModal(true);
        } else {
            alert('Failed to redeem reward: ' + result.error);
            setRedeeming(null);
        }
    };
    
    const handlePayPalSuccess = async (paypalDetails) => {
        const user = auth.currentUser;
        if (!user || !selectedReward) return;
        
        try {
            // Complete the redemption by adding money to wallet
            const result = await completeRewardRedemption(
                user.uid, 
                selectedReward.points, 
                selectedReward.amount, 
                paypalDetails
            );
            
            if (result.success) {
                alert(`Reward redeemed successfully! ₱${selectedReward.amount} has been added to your wallet.`);
                setShowPayPalModal(false);
                setSelectedReward(null);
            } else {
                alert('Failed to complete redemption: ' + result.error);
            }
        } catch (error) {
            console.error('Error completing redemption:', error);
            alert('An error occurred. Please contact support.');
        } finally {
            setRedeeming(null);
        }
    };
    
    const handlePayPalError = (err) => {
        console.error('PayPal error:', err);
        alert('Payment failed. Your points have been deducted but payment was not processed. Please contact support.');
        setShowPayPalModal(false);
        setSelectedReward(null);
        setRedeeming(null);
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center">
                        <button onClick={() => setPage('Home')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Points & Rewards</h1>
                    </div>
                </div>
            </div>
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Points Status Bar - Teal Blue with Gradient */}
                <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 rounded-xl p-6 mb-6 shadow-lg relative overflow-hidden">
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-teal-500/20 animate-pulse"></div>
                    
                    <div className="flex items-center justify-between text-white relative z-10">
                        <div>
                            <p className="text-sm opacity-90 mb-1">Your Points</p>
                            <h3 className="text-4xl font-bold animate-pulse">
                                {loading ? '...' : points.toLocaleString()}
                            </h3>
                        </div>
                        <div className="text-6xl opacity-30 animate-bounce">⭐</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden relative z-10">
                        <div 
                            className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Tab Buttons with Animation */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveSection('earn')}
                        className={`relative flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                            activeSection === 'earn'
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span className={`transition-transform duration-300 ${activeSection === 'earn' ? 'rotate-12 scale-110' : ''}`}>
                                🎯
                            </span>
                            How to Earn Points
                        </span>
                        {activeSection === 'earn' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl animate-pulse opacity-50"></div>
                        )}
                    </button>
                    
                    <button
                        onClick={() => setActiveSection('marketplace')}
                        className={`relative flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                            activeSection === 'marketplace'
                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <span className={`transition-transform duration-300 ${activeSection === 'marketplace' ? 'rotate-12 scale-110' : ''}`}>
                                🛒
                            </span>
                            Points Marketplace
                        </span>
                        {activeSection === 'marketplace' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl animate-pulse opacity-50"></div>
                        )}
                    </button>
                </div>
                
                {/* How to Earn Points Section */}
                {activeSection === 'earn' && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <span className="text-2xl animate-bounce">📋</span>
                            How to Earn Points
                        </h3>
                        <div className="space-y-4">
                            {earnPointsCriteria.map((criterion, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-center justify-between p-5 bg-gradient-to-r ${criterion.bgColor} rounded-xl border-2 ${criterion.borderColor} hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-slideIn`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 bg-gradient-to-r ${criterion.color} text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md animate-pulse`}>
                                            {criterion.icon}
                                        </div>
                                        <span className="text-gray-700 font-semibold text-lg">{criterion.title}</span>
                                    </div>
                                    <span className={`${criterion.textColor} font-bold text-xl animate-bounce`}>
                                        {criterion.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Points Marketplace Section */}
                {activeSection === 'marketplace' && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <span className="text-2xl animate-bounce">💰</span>
                            Available Rewards
                        </h3>
                        <div className="space-y-4">
                            {rewards.map((reward, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-center justify-between p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl animate-slideIn`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg animate-pulse">
                                            {reward.points}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">
                                                {reward.points} Points
                                            </p>
                                            <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                                ₱{reward.amount}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(reward)}
                                        disabled={points < reward.points || redeeming === reward.points}
                                        className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
                                            points >= reward.points && redeeming !== reward.points
                                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 transform hover:scale-110 shadow-lg hover:shadow-xl animate-pulse'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {redeeming === reward.points ? 'Processing...' : 'Redeem'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* PayPal Modal for Reward Redemption */}
            {showPayPalModal && selectedReward && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => {
                    if (!redeeming) {
                        setShowPayPalModal(false);
                        setSelectedReward(null);
                    }
                }}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">Complete Your Redemption</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            You've redeemed {selectedReward.points} points. Complete the payment to add ₱{selectedReward.amount} to your wallet.
                        </p>
                        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                            <PayPalCheckout
                                amount={selectedReward.amount}
                                description={`Points redemption: ${selectedReward.points} points for ₱${selectedReward.amount}`}
                                onApprove={handlePayPalSuccess}
                                onError={handlePayPalError}
                                disabled={false}
                            />
                            <p className="text-xs text-gray-500 mt-2">Sandbox: pay with your sandbox buyer account.</p>
                        </div>
                        <button 
                            onClick={() => {
                                if (!redeeming) {
                                    setShowPayPalModal(false);
                                    setSelectedReward(null);
                                }
                            }}
                            disabled={redeeming}
                            className="w-full py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {redeeming ? 'Processing...' : 'Cancel'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Add custom animations via style tag */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                
                .animate-slideIn {
                    animation: slideIn 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
};

export default Points;

