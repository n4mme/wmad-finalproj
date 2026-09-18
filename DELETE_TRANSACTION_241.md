# 🗑️ Delete Transaction with Amount 241

## Method 1: Using Script (Recommended)

### Prerequisites:
1. Download your Firebase Service Account Key (if not already done)
2. Save it as `serviceAccountKey.json` in the project root

### Steps:
1. Open terminal/command prompt
2. Navigate to project directory:
   ```bash
   cd C:\Users\EMMAN\Desktop\WMAD\final-project
   ```
3. Run the script:
   ```bash
   node scripts/deleteTransaction241.js
   ```

The script will:
- Find all cashout transactions with amount 241
- Delete them from the database
- Show confirmation message

---

## Method 2: Manual Deletion via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **biyahele**
3. Go to **Firestore Database**
4. Navigate to **walletTransactions** collection
5. Find the transaction with:
   - `type: 'cashout'`
   - `amount: 241`
6. Click on the document
7. Click **Delete** button
8. Confirm deletion

---

## Method 3: Using Firebase CLI

```bash
# First, find the document ID
firebase firestore:get walletTransactions --where "type==cashout" --where "amount==241"

# Then delete it (replace DOCUMENT_ID with actual ID)
firebase firestore:delete walletTransactions/DOCUMENT_ID
```

---

## ✅ Verification

After deletion, verify:
1. Go to Admin Dashboard → Cash Out Approval
2. The transaction with amount 241 should no longer appear
3. Check Transaction History → Hosts filter
4. The transaction should be gone

---

## ⚠️ Important Notes

- This action cannot be undone
- Make sure you're deleting the correct transaction
- The script will delete ALL transactions with amount 241 (if there are multiple)

