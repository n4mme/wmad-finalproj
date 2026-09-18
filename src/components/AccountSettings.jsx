import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { uploadProfilePhoto } from '../utils/storageUtils';
import { ArrowLeft, Upload, Save, Lock, AlertTriangle, User, Mail, Phone } from 'lucide-react';

const AccountSettings = ({ setPage }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState({ firstName: '', surname: '', mobileNumber: '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            const names = data.fullName?.split(' ') || ['', ''];
            setProfileData({
                firstName: names[0] || '',
                surname: names.slice(1).join(' ') || '',
                mobileNumber: data.mobileNumber || ''
            });
        }
    };

    const handleProfilePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const user = auth.currentUser;
        const result = await uploadProfilePhoto(user.uid, file);
        
        if (result.success) {
            await updateDoc(doc(db, 'users', user.uid), { photoURL: result.url });
            setUserData({ ...userData, photoURL: result.url });
            setMessage('Profile photo updated successfully!');
        } else {
            setMessage('Failed to upload photo: ' + result.error);
        }
        setUploading(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        const user = auth.currentUser;
        const fullName = `${profileData.firstName} ${profileData.surname}`.trim();
        
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                fullName,
                mobileNumber: profileData.mobileNumber
            });
            setMessage('Profile updated successfully!');
            loadUserData();
        } catch (error) {
            setMessage('Failed to update profile: ' + error.message);
        }
        setSaving(false);
    };

    const handleUpdatePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            setMessage('New passwords do not match!');
            return;
        }

        setSaving(true);
        const user = auth.currentUser;
        
        try {
            const credential = EmailAuthProvider.credential(user.email, passwords.current);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwords.new);
            setMessage('Password updated successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            setMessage('Failed to update password: ' + error.message);
        }
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        const user = auth.currentUser;
        
        try {
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(user);
            window.location.reload(); // Reload to trigger auth state change
        } catch (error) {
            setMessage('Failed to delete account: ' + error.message);
        }
        setShowDeleteConfirm(false);
    };

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center">
                        <button onClick={() => setPage('Home')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold">Account Settings</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="border-b flex">
                        {['profile', 'security', 'account'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 px-6 py-4 font-medium ${
                                    activeTab === tab ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-600'
                                }`}
                            >
                                {tab === 'profile' && 'Profile Settings'}
                                {tab === 'security' && 'Security & Privacy'}
                                {tab === 'account' && 'Account Management'}
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        {message && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                                {message}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-4">Profile Picture</label>
                                    <div className="flex items-center space-x-6">
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt="Profile" className="w-20 h-20 rounded-full" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{getInitial(userData?.fullName)}</span>
                                            </div>
                                        )}
                                        <label className="cursor-pointer px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                                            <Upload className="w-4 h-4 inline mr-2" />
                                            {uploading ? 'Uploading...' : 'Upload Photo'}
                                            <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">First Name</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                            className="w-full p-3 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Surname</label>
                                        <input
                                            type="text"
                                            value={profileData.surname}
                                            onChange={(e) => setProfileData({ ...profileData, surname: e.target.value })}
                                            className="w-full p-3 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={profileData.mobileNumber}
                                        onChange={(e) => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                                        className="w-full p-3 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email Address (Cannot be changed)</label>
                                    <input type="email" value={userData?.email} disabled className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>

                                <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400">
                                    <Save className="w-4 h-4 inline mr-2" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">Change Password</h3>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        className="w-full p-3 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        className="w-full p-3 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full p-3 border rounded-lg"
                                    />
                                </div>
                                <button onClick={handleUpdatePassword} disabled={saving} className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                    <div className="flex items-start space-x-4">
                                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                                            <p className="text-red-800 mb-4">
                                                Warning: This action cannot be undone. All your data, bookings, and favorites will be permanently deleted.
                                            </p>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4">Confirm Account Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you absolutely sure? This action cannot be undone.</p>
                        <div className="flex space-x-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} className="flex-1 py-2 bg-red-600 text-white rounded-lg">
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;

