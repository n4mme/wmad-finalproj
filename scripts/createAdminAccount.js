/**
 * Script to create admin account
 * 
 * This script creates an admin user in Firebase Auth and Firestore
 * 
 * Usage:
 * 1. First, download your Firebase service account key:
 *    - Go to Firebase Console: https://console.firebase.google.com/
 *    - Select your project: biyahele
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate New Private Key"
 *    - Save the JSON file as 'serviceAccountKey.json' in the project root
 * 
 * 2. Run this script:
 *    node scripts/createAdminAccount.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('\n📋 To create the admin account, you need to:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select your project: biyahele');
    console.log('3. Go to Project Settings > Service Accounts');
    console.log('4. Click "Generate New Private Key"');
    console.log('5. Save the JSON file as "serviceAccountKey.json" in the project root');
    console.log('6. Run this script again: node scripts/createAdminAccount.js');
    process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'biyahele'
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminAccount() {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123456';

    try {
        console.log('🔄 Creating admin account...');

        // Check if user already exists
        let user;
        try {
            user = await auth.getUserByEmail(adminEmail);
            console.log('⚠️  User already exists in Firebase Auth');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // User doesn't exist, create it
                user = await auth.createUser({
                    email: adminEmail,
                    password: adminPassword,
                    emailVerified: true,
                });
                console.log('✅ Admin user created in Firebase Auth');
            } else {
                throw error;
            }
        }

        // Create or update user document in Firestore
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // Update existing document
            await userRef.update({
                role: 'admin',
                emailVerified: true,
                otpVerified: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('✅ Admin user document updated in Firestore');
        } else {
            // Create new document
            await userRef.set({
                uid: user.uid,
                email: adminEmail,
                fullName: 'Administrator',
                role: 'admin',
                emailVerified: true,
                otpVerified: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('✅ Admin user document created in Firestore');
        }

        console.log('\n🎉 Admin account created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('👤 UID:', user.uid);
        console.log('\n⚠️  IMPORTANT: Keep your password secure!');
        console.log('⚠️  You can now log in to the admin dashboard.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        process.exit(1);
    }
}

// Run the script
createAdminAccount();

