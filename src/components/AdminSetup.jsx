import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import BiyaHeleCombinedLogo from './BiyaHeleCombinedLogo.png';

/**
 * One-time setup component to create admin account
 * 
 * IMPORTANT: This component should only be used ONCE to create the admin account.
 * After creating the admin account, remove this component from your app.
 * 
 * To use:
 * 1. Make sure you are NOT logged in
 * 2. Add this route temporarily to App.js:
 *    <Route path="/admin-setup" element={<AdminSetup />} />
 * 3. Navigate to http://localhost:3000/admin-setup
 * 4. Click "Create Admin Account"
 * 5. Remove this route and component after use
 */
const AdminSetup = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleCreateAdmin = async () => {
        setIsCreating(true);
        setError('');
        setMessage('');

        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin123456';

        try {
            // Check if user is already logged in
            if (auth.currentUser) {
                setError('Please sign out first before creating admin account');
                setIsCreating(false);
                return;
            }

            setMessage('Creating admin account in Firebase Auth...');

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                adminEmail,
                adminPassword
            );

            const user = userCredential.user;

            setMessage('Creating admin document in Firestore...');

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: adminEmail,
                fullName: 'Administrator',
                role: 'admin',
                emailVerified: true,
                otpVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            setMessage('✅ Admin account created successfully!');
            setError('');

            // Sign out the newly created admin (they'll need to sign in manually)
            await signOut(auth);

            setTimeout(() => {
                window.location.href = '/auth';
            }, 3000);
        } catch (error) {
            console.error('Error creating admin:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                setError('Admin account already exists. You can sign in with admin@gmail.com');
            } else {
                setError(`Error: ${error.message}`);
            }
            setMessage('');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <img
                        src={BiyaHeleCombinedLogo}
                        alt="BiyaHele Logo"
                        className="h-16 w-auto mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Account Setup</h1>
                    <p className="text-sm text-gray-600">
                        Create the admin account for BiyaHele
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Account Details:</p>
                        <p className="text-sm text-blue-800">Email: admin@gmail.com</p>
                        <p className="text-sm text-blue-800">Password: admin123456</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">{message}</p>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-xs text-yellow-800">
                            ⚠️ <strong>Important:</strong> Make sure you are NOT logged in before creating the admin account.
                            This should only be done once.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleCreateAdmin}
                    disabled={isCreating || auth.currentUser !== null}
                    className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? 'Creating Admin Account...' : 'Create Admin Account'}
                </button>

                {auth.currentUser && (
                    <p className="text-xs text-red-600 text-center mt-4">
                        Please sign out first before creating admin account
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminSetup;

