import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save, RotateCcw } from 'lucide-react';

const ServiceFees = () => {
    const [fees, setFees] = useState({
        guestServiceFee: 14,
        hostServiceFee: 4,
        tax: 12,
        cleaningFee: 200,
        guestMinFee: 25,
        guestMaxFee: 1000,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadFees();
    }, []);

    const loadFees = async () => {
        try {
            const feesDoc = await getDoc(doc(db, 'settings', 'serviceFees'));
            if (feesDoc.exists()) {
                setFees(feesDoc.data());
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'serviceFees'), fees);
            alert('Service fees updated successfully!');
        } catch (error) {
            console.error('Error saving fees:', error);
            alert('Error saving service fees');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFees({
            guestServiceFee: 14,
            hostServiceFee: 4,
            tax: 12,
            cleaningFee: 200,
            guestMinFee: 25,
            guestMaxFee: 1000,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Service Fees Management</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        <span>Save Changes</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Reset to Defaults</span>
                    </button>
                </div>
            </div>

            {/* Current Fees Display */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Service Fees</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-gray-600">Guest Service Fee</p>
                        <p className="text-2xl font-bold text-teal-600">{fees.guestServiceFee}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Host Service Fee</p>
                        <p className="text-2xl font-bold text-teal-600">{fees.hostServiceFee}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Tax (VAT)</p>
                        <p className="text-2xl font-bold text-teal-600">{fees.tax}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Cleaning Fee</p>
                        <p className="text-2xl font-bold text-teal-600">₱{fees.cleaningFee}</p>
                    </div>
                </div>
            </div>

            {/* Fee Configuration */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Fee Configuration</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Manage service fees and revenue distribution settings.
                </p>

                {/* Guest Service Fee */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-2">Guest Service Fee</h3>
                    <p className="text-sm text-gray-600 mb-4">What guests pay for platform services</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Fee Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={fees.guestServiceFee}
                                onChange={(e) => setFees(prev => ({ ...prev, guestServiceFee: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Fee (PHP)
                            </label>
                            <input
                                type="number"
                                value={fees.guestMinFee}
                                onChange={(e) => setFees(prev => ({ ...prev, guestMinFee: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Fee (PHP)
                            </label>
                            <input
                                type="number"
                                value={fees.guestMaxFee}
                                onChange={(e) => setFees(prev => ({ ...prev, guestMaxFee: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Host Service Fee */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-2">Host Service Fee</h3>
                    <p className="text-sm text-gray-600 mb-4">What hosts pay for platform services</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Fee Percentage (%)
                        </label>
                        <input
                            type="number"
                            value={fees.hostServiceFee}
                            onChange={(e) => setFees(prev => ({ ...prev, hostServiceFee: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                    </div>
                </div>

                {/* Additional Fees */}
                <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-2">Additional Fees</h3>
                    <p className="text-sm text-gray-600 mb-4">Cleaning fees and taxes</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cleaning Fee (PHP)
                            </label>
                            <input
                                type="number"
                                value={fees.cleaningFee}
                                onChange={(e) => setFees(prev => ({ ...prev, cleaningFee: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={fees.tax}
                                onChange={(e) => setFees(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceFees;

