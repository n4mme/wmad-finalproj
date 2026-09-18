import React from 'react';
import { X, Check, XCircle } from 'lucide-react';

const HostRulesCompliance = ({ isOpen, onAccept, onDecline, fullName }) => {
    if (!isOpen) return null;

    const responsibilities = [
        {
            title: 'Accurate Listings',
            description: 'Provide truthful and complete information about your property, including accurate photos, amenities, and pricing.'
        },
        {
            title: 'Guest Safety',
            description: 'Ensure your property meets safety standards and is properly maintained for guest comfort and security.'
        },
        {
            title: 'Timely Communication',
            description: 'Respond promptly to guest inquiries, booking requests, and messages to maintain excellent service standards.'
        },
        {
            title: 'Fair Pricing',
            description: 'Set transparent and competitive prices without hidden fees, and honor the agreed-upon rates for confirmed bookings.'
        },
        {
            title: 'Legal Compliance',
            description: 'Comply with all local laws, regulations, and licensing requirements for short-term rentals in your area.'
        },
        {
            title: 'Non-discrimination',
            description: 'Treat all guests fairly and equally, regardless of race, religion, nationality, gender, age, or other protected characteristics.'
        }
    ];

    const prohibitedActivities = [
        'Denying cancellation even though the guest has valid reason',
        'Canceling confirmed bookings without valid reason',
        'Harassment, abuse, or inappropriate behavior towards guests',
        'Listing properties you don\'t own or have permission to rent',
        'Fraudulent or deceptive practices',
        'Attempting to circumvent platform fees or conduct transactions outside the platform'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-2xl">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-2">Host Rules & Compliance</h2>
                            <p className="text-teal-100 text-sm">Before hosting, you must read and accept these terms.</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Welcome Message */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-teal-600 mb-2">
                            Welcome to Hosting {fullName || 'Host'}!
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                            By joining our platform as a host, you commit to adhering to these essential rules and guidelines, helping us maintain a safe and excellent experience for every user.
                        </p>
                    </div>

                    {/* Host Responsibilities */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Host Responsibilities</h3>
                        <div className="space-y-4">
                            {responsibilities.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-shrink-0 mt-1">
                                        <Check className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Prohibited Activities */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Prohibited Activities</h3>
                        <div className="space-y-3">
                            {prohibitedActivities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex-shrink-0 mt-1">
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-gray-800 text-sm leading-relaxed flex-1">{activity}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Non-Compliance Consequences */}
                    <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Non-Compliance Consequences</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Failure to comply with these regulations may lead to serious penalties, including the removal of your listings, temporary account suspension, or permanent exclusion from the platform. Severe or recurring breaches will be escalated and reported to the appropriate legal authorities.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={onDecline}
                            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                        >
                            Decline
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            I Accept & Agree
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostRulesCompliance;

