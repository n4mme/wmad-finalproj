import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, CreditCard } from 'lucide-react';
import PayPalCheckout from './PayPalCheckout';
import { getAuth } from 'firebase/auth';
import { getUserWallet, updateUserWalletBalance, recordWalletTransaction, getWalletTransactions } from '../utils/firestoreUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Wallet = ({ setPage }) => {
    const [balance, setBalance] = useState(0);
    const [isTopUpOpen, setTopUpOpen] = useState(false);
    const [isCashOutOpen, setCashOutOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(500);
    const [cashOutAmount, setCashOutAmount] = useState(500);
    const [cashOutEmail, setCashOutEmail] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [showBalance, setShowBalance] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [filterType, setFilterType] = useState('all'); // 'all', 'payment', 'refund', 'topup' for guest; 'all', 'earning', 'refund', 'cashout' for host

    useEffect(() => {
        const load = async () => {
            const auth = getAuth();
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            // fetch user role
            try {
                const udoc = await getDoc(doc(db, 'users', uid));
                if (udoc.exists()) setIsHost(udoc.data().role === 'host');
            } catch {}
            const res = await getUserWallet(uid);
            if (res.success) setBalance(res.balance || 0);
            const tx = await getWalletTransactions(uid, 100);
            if (tx.success) setTransactions(tx.data);
        };
        load();
    }, []);

    const handleTopUpSuccess = async (paypalDetails) => {
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const amount = Number(topUpAmount) || 0;
        await updateUserWalletBalance(uid, amount);
        await recordWalletTransaction({ userId: uid, type: 'topup', amount, currency: 'PHP', meta: { orderId: paypalDetails?.id } });
        setBalance(prev => prev + amount);
        setTopUpOpen(false);
        alert('Top-up successful!');
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center">
                        <button onClick={() => setPage('Home')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Wallet</h1>
                    </div>
                </div>
            </div>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white mb-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90 mb-2">Available Balance</p>
                            <h2 className="text-5xl font-extrabold">{showBalance ? `₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••'}</h2>
                        </div>
                        <button onClick={() => setShowBalance(!showBalance)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="mt-3 text-xs opacity-90">Secure wallet powered by PayPal Sandbox</div>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {!isHost && (
                    <button 
                        onClick={() => setTopUpOpen(true)} 
                        data-testid="wallet-add-money-button"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg flex flex-col items-center border border-teal-100"
                    >
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl mb-2">₱</div>
                        <span className="font-medium">Add Money</span>
                    </button>
                    )}
                    {isHost && (
                        <button onClick={() => setCashOutOpen(true)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg flex flex-col items-center border border-teal-100">
                            <CreditCard className="w-8 h-8 text-teal-600 mb-2" />
                            <span className="font-medium">Request Cash Out</span>
                        </button>
                    )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Transaction History</h3>
                        <div className="flex gap-2">
                            {isHost ? (
                                <>
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'all' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterType('earning')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'earning' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Earnings
                                    </button>
                                    <button
                                        onClick={() => setFilterType('refund')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'refund' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Refund
                                    </button>
                                    <button
                                        onClick={() => setFilterType('cashout')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'cashout' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Cash out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'all' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setFilterType('payment')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'payment' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Payment
                                    </button>
                                    <button
                                        onClick={() => setFilterType('refund')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'refund' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Refund
                                    </button>
                                    <button
                                        onClick={() => setFilterType('topup')}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            filterType === 'topup' 
                                                ? 'bg-teal-600 text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Top up
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {transactions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No transactions yet</p>
                    ) : (() => {
                        // Filter transactions based on selected filter
                        const filteredTransactions = transactions.filter(t => {
                            if (filterType === 'all') return true;
                            if (isHost) {
                                if (filterType === 'earning') return t.type === 'earning';
                                if (filterType === 'refund') return t.type === 'refund';
                                if (filterType === 'cashout') return t.type === 'cashout';
                            } else {
                                if (filterType === 'payment') return t.type === 'payment';
                                if (filterType === 'refund') return t.type === 'refund';
                                if (filterType === 'topup') return t.type === 'topup';
                            }
                            return false;
                        });

                        if (filteredTransactions.length === 0) {
                            return <p className="text-center text-gray-500 py-8">No {filterType} transactions found</p>;
                        }

                        return (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600">
                                        <th className="py-2 pr-4">Date</th>
                                        <th className="py-2 pr-4">Type</th>
                                        <th className="py-2 pr-4">Amount</th>
                                        <th className="py-2">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                        {filteredTransactions.map((t) => {
                                            // Determine amount display based on type and role
                                            let amountDisplay = '';
                                            let amountColor = '';
                                            
                                            if (isHost) {
                                                // Host: Earning = +, Refund = -
                                                if (t.type === 'earning') {
                                                    amountDisplay = `+₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = 'text-green-600';
                                                } else if (t.type === 'refund') {
                                                    amountDisplay = `-₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = 'text-red-600';
                                                } else if (t.type === 'cashout') {
                                                    amountDisplay = `-₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    // Yellow color for pending cashouts
                                                    if (t.status === 'pending') {
                                                        amountColor = 'text-yellow-600';
                                                    } else {
                                                        amountColor = 'text-gray-800';
                                                    }
                                                } else {
                                                    // Default: positive for topup-like, negative for payment-like
                                                    amountDisplay = t.amount >= 0 ? `+₱${Number(Math.abs(t.amount) || 0).toLocaleString()}` : `-₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = t.amount >= 0 ? 'text-green-600' : 'text-red-600';
                                                }
                                            } else {
                                                // Guest: Topup = +, Refund = +, Payment = -
                                                if (t.type === 'topup' || t.type === 'refund') {
                                                    amountDisplay = `+₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = t.type === 'topup' ? 'text-green-600' : 'text-emerald-600';
                                                } else if (t.type === 'payment') {
                                                    amountDisplay = `-₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = 'text-gray-800';
                                                } else {
                                                    // Default
                                                    amountDisplay = t.amount >= 0 ? `+₱${Number(Math.abs(t.amount) || 0).toLocaleString()}` : `-₱${Number(Math.abs(t.amount) || 0).toLocaleString()}`;
                                                    amountColor = t.amount >= 0 ? 'text-green-600' : 'text-gray-800';
                                                }
                                            }

                                            return (
                                        <tr key={t.id}>
                                            <td className="py-2 pr-4 text-gray-700">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : ''}</td>
                                            <td className="py-2 pr-4 font-medium capitalize">{t.type}</td>
                                                    <td className={`py-2 pr-4 font-semibold ${amountColor}`}>
                                                        <div className="flex flex-col">
                                                            <span>{amountDisplay}</span>
                                                            {t.type === 'cashout' && t.status === 'pending' && (
                                                                <span className="text-xs text-yellow-600 font-normal mt-0.5">Pending</span>
                                                            )}
                                                        </div>
                                            </td>
                                            <td className="py-2 text-gray-600">{t.meta?.title || t.meta?.orderId || '-'}</td>
                                        </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                        );
                    })()}
                </div>

                {isTopUpOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTopUpOpen(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">Add Money</h3>
                            <label className="block text-sm font-medium mb-2">Amount (PHP)</label>
                            <input
                                type="number"
                                min={50}
                                step={50}
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(parseInt(e.target.value || '0', 10))}
                                className="w-full p-3 border rounded-lg mb-4"
                            />
                            <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                                <PayPalCheckout
                                    amount={Number(topUpAmount) || 0}
                                    description={`Wallet top-up ₱${Number(topUpAmount).toLocaleString()}`}
                                    onApprove={handleTopUpSuccess}
                                    onError={(e) => alert('Top-up error: ' + (e?.message || 'Unknown error'))}
                                    disabled={!topUpAmount || Number(topUpAmount) <= 0}
                                />
                                <p className="text-xs text-gray-500 mt-2">Sandbox: pay with your sandbox buyer account.</p>
                            </div>
                            <button onClick={() => setTopUpOpen(false)} className="w-full py-3 border rounded-lg">Close</button>
                        </div>
                    </div>
                )}
                {isCashOutOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCashOutOpen(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">Request Cash Out</h3>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">Amount to Cash Out (PHP)</label>
                                <input type="number" min={100} step={50} value={cashOutAmount} onChange={(e) => setCashOutAmount(parseInt(e.target.value || '0', 10))} className="w-full p-3 border rounded-lg" />
                                <div className="text-xs text-gray-500 mt-1">Available: ₱{balance.toLocaleString()}</div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">PayPal Email</label>
                                <input type="email" value={cashOutEmail} onChange={(e) => setCashOutEmail(e.target.value)} placeholder="your-paypal@email.com" className="w-full p-3 border rounded-lg" />
                                <div className="text-xs text-gray-500 mt-1">Money will be sent to this PayPal email after admin approval</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCashOutOpen(false)} className="flex-1 py-3 border rounded-lg">Close</button>
                                <button onClick={async () => {
                                    const amt = Number(cashOutAmount) || 0;
                                    if (amt <= 0 || amt > balance) { 
                                        alert('Enter a valid amount within available balance.'); 
                                        return; 
                                    }
                                    if (!cashOutEmail || !cashOutEmail.includes('@')) { 
                                        alert('Enter a valid PayPal email.'); 
                                        return; 
                                    }
                                    const auth = getAuth();
                                    const uid = auth.currentUser?.uid;
                                    if (!uid) {
                                        alert('Please sign in to request cash out.');
                                        return;
                                    }
                                    
                                    try {
                                        // Create cash out request with pending status
                                        await recordWalletTransaction({ 
                                            userId: uid, 
                                            type: 'cashout', 
                                            amount: amt, 
                                            currency: 'PHP', 
                                            status: 'pending',
                                            meta: { paypalEmail: cashOutEmail } 
                                        });
                                        setCashOutOpen(false);
                                        setCashOutAmount(500);
                                        setCashOutEmail('');
                                        alert('Cash out request submitted! Waiting for admin approval.');
                                    } catch (error) {
                                        console.error('Error creating cash out request:', error);
                                        alert('Error submitting cash out request. Please try again.');
                                    }
                                }} className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-medium">Request Cash Out</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;

