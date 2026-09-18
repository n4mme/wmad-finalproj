/**
 * Script to delete the cashout transaction with amount 241
 * 
 * Usage:
 * node scripts/deleteTransaction241.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('\n📋 To delete the transaction, you need to:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select your project: biyahele');
    console.log('3. Go to Firestore Database');
    console.log('4. Navigate to walletTransactions collection');
    console.log('5. Find the transaction with amount 241');
    console.log('6. Delete it manually');
    process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'biyahele'
});

const db = admin.firestore();

async function deleteTransaction241() {
    try {
        console.log('🔄 Searching for transaction with amount 241...');

        // Query for cashout transactions with amount 241
        const transactionsRef = db.collection('walletTransactions');
        const snapshot = await transactionsRef
            .where('type', '==', 'cashout')
            .where('amount', '==', 241)
            .get();

        if (snapshot.empty) {
            console.log('⚠️  No transaction found with amount 241');
            process.exit(0);
        }

        console.log(`✅ Found ${snapshot.size} transaction(s) with amount 241`);

        // Delete all matching transactions
        const batch = db.batch();
        snapshot.forEach((doc) => {
            console.log(`   - Deleting transaction ID: ${doc.id}`);
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('\n🎉 Transaction(s) deleted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting transaction:', error.message);
        process.exit(1);
    }
}

// Run the script
deleteTransaction241();

