# Firestore & Firebase Storage Setup Guide

This document provides instructions for setting up Firestore and Firebase Storage security rules for the BiyaHele application.

## 📋 Table of Contents

1. [Data Models](#data-models)
2. [Security Rules Deployment](#security-rules-deployment)
3. [Collections Structure](#collections-structure)
4. [Storage Structure](#storage-structure)
5. [Indexes Required](#indexes-required)

---

## 🗂️ Data Models

The application uses the following Firestore collections:

### `/users`
User profiles and authentication data
- **Document ID**: User UID from Firebase Auth
- **Key Fields**: `uid`, `email`, `fullName`, `role`, `emailVerified`

### `/listings`
Property listings (homes, experiences, services)
- **Document ID**: Auto-generated
- **Key Fields**: `hostId`, `title`, `category`, `isActive`, `status`, `location`, `pricePerNight`

### `/favorites`
User-saved favorite listings
- **Document ID**: `{userId}_{listingId}`
- **Key Fields**: `userId`, `listingId`, `listingSnapshot`

### `/bookings`
Reservation and booking transactions
- **Document ID**: Auto-generated
- **Key Fields**: `guestId`, `hostId`, `listingId`, `checkIn`, `checkOut`, `status`

### `/messages`
Guest-Host communications (with subcollection for individual messages)
- **Document ID**: Auto-generated
- **Key Fields**: `participants`, `guestId`, `hostId`, `listingId`
- **Subcollection**: `/messages/{threadId}/messages/{messageId}`

---

## 🔒 Security Rules Deployment

### Step 1: Deploy Firestore Rules

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Use `firestore.rules` for rules file
   - Use `firestore.indexes.json` for indexes file

4. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Step 2: Deploy Storage Rules

1. **Initialize Firebase Storage** (if not already done):
   ```bash
   firebase init storage
   ```
   - Use `storage.rules` for rules file

2. **Deploy Storage Rules**:
   ```bash
   firebase deploy --only storage
   ```

### Step 3: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Verify that the rules are deployed
5. Navigate to **Storage** → **Rules**
6. Verify that the storage rules are deployed

---

## 📊 Collections Structure

### Users Collection (`/users/{userId}`)

```javascript
{
  uid: "user123",
  email: "user@example.com",
  fullName: "John Doe",
  dateOfBirth: "1990-01-01",
  mobileNumber: "+63123456789",
  photoURL: "https://...",
  role: "host", // or "guest"
  emailVerified: true,
  otpVerified: true,
  hostProfile: {
    bio: "...",
    languages: ["English", "Tagalog"],
    responseRate: 95,
    responseTime: 2,
    verified: true,
    superhost: false,
    totalListings: 5,
    totalBookings: 120,
    rating: 4.85,
    reviewsCount: 98
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Listings Collection (`/listings/{listingId}`)

```javascript
{
  id: "listing123",
  hostId: "user123",
  title: "Cozy Beach House",
  description: "...",
  category: "home", // 'home' | 'experience' | 'service'
  type: "entire_place",
  location: {
    address: "123 Beach St",
    city: "El Nido",
    province: "Palawan",
    country: "Philippines",
    lat: 11.1949,
    lng: 119.3990,
    zipCode: "5313"
  },
  pricePerNight: 3500,
  currency: "PHP",
  cleaningFee: 500,
  serviceFee: 350,
  specialRates: {
    "2025-12-25": 5000
  },
  guests: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 1,
  amenities: ["wifi", "kitchen", "pool"],
  images: ["https://...", "https://..."],
  coverImage: "https://...",
  isActive: true,
  status: "active", // 'draft' | 'active' | 'unlisted' | 'archived'
  instantBook: true,
  blockedDates: ["2025-11-15", "2025-11-16"],
  minimumStay: 2,
  maximumStay: 30,
  houseRules: ["No smoking", "No pets"],
  checkInTime: "14:00",
  checkOutTime: "11:00",
  stats: {
    views: 1250,
    favorites: 45,
    bookings: 23,
    rating: 4.8,
    reviewsCount: 18
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp
}
```

### Favorites Collection (`/favorites/{favoriteId}`)

```javascript
{
  userId: "user123",
  listingId: "listing123",
  listingSnapshot: {
    title: "Cozy Beach House",
    coverImage: "https://...",
    pricePerNight: 3500,
    location: "El Nido, Palawan",
    rating: 4.8
  },
  createdAt: Timestamp
}
```

### Bookings Collection (`/bookings/{bookingId}`)

```javascript
{
  guestId: "user123",
  hostId: "user456",
  listingId: "listing123",
  guestName: "John Doe",
  listingTitle: "Cozy Beach House",
  checkIn: Timestamp,
  checkOut: Timestamp,
  numberOfNights: 3,
  numberOfGuests: 2,
  pricePerNight: 3500,
  totalNightsCost: 10500,
  cleaningFee: 500,
  serviceFee: 350,
  totalPrice: 11350,
  currency: "PHP",
  status: "confirmed", // 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress'
  paymentStatus: "paid", // 'unpaid' | 'partial' | 'paid' | 'refunded'
  paymentMethod: "gcash",
  specialRequests: "Late check-in",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  confirmedAt: Timestamp
}
```

---

## 📁 Storage Structure

### Profile Photos
- **Path**: `/profile-photos/{userId}/{fileName}`
- **Access**: Public read, owner write/delete
- **Size Limit**: 5MB
- **File Types**: Images only (jpg, png, gif, webp)

### Listing Images
- **Path**: `/listing-images/{listingId}/{fileName}`
- **Access**: Public read, authenticated write, owner delete
- **Size Limit**: 10MB
- **File Types**: Images only (jpg, png, gif, webp)

---

## 🔍 Indexes Required

Create these composite indexes in Firestore for optimal query performance:

### Listings Indexes

1. **Active Listings Query**:
   - Collection: `listings`
   - Fields: `isActive` (Ascending), `status` (Ascending), `createdAt` (Descending)

2. **Host Listings Query**:
   - Collection: `listings`
   - Fields: `hostId` (Ascending), `createdAt` (Descending)

### Bookings Indexes

1. **Guest Bookings Query**:
   - Collection: `bookings`
   - Fields: `guestId` (Ascending), `createdAt` (Descending)

2. **Host Bookings Query**:
   - Collection: `bookings`
   - Fields: `hostId` (Ascending), `createdAt` (Descending)

### Favorites Indexes

1. **User Favorites Query**:
   - Collection: `favorites`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

### Creating Indexes

**Option 1: Firebase Console**
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields as specified above

**Option 2: Firebase CLI**
Create a `firestore.indexes.json` file with the following content:

```json
{
  "indexes": [
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "listings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "hostId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "guestId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "hostId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "favorites",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## 🧪 Testing Security Rules

### Test Cases

1. **Guests can only read active listings**:
   ```javascript
   // Should succeed
   db.collection('listings').where('isActive', '==', true).get();
   
   // Should fail (no permission to read inactive listings)
   db.collection('listings').where('isActive', '==', false).get();
   ```

2. **Only listing owners can update their listings**:
   ```javascript
   // Should succeed (if user is the host)
   db.collection('listings').doc('listing123').update({ title: 'New Title' });
   
   // Should fail (if user is not the host)
   db.collection('listings').doc('listing456').update({ title: 'Hack' });
   ```

3. **Users can only favorite existing, active listings**:
   ```javascript
   // Should succeed
   db.collection('favorites').doc('user123_listing123').set({
     userId: 'user123',
     listingId: 'listing123'
   });
   
   // Should fail (listing doesn't exist or inactive)
   db.collection('favorites').doc('user123_fakeId').set({
     userId: 'user123',
     listingId: 'fakeId'
   });
   ```

---

## 📝 Notes

- All timestamps use Firebase `serverTimestamp()` for consistency
- Security rules enforce that users can only modify their own data
- Listings must be validated before publishing (see `validateListingForPublish` in `firestoreModels.js`)
- Favorites use a composite ID pattern: `{userId}_{listingId}` for efficient lookups
- Bookings cannot be deleted, only cancelled to maintain audit trail

---

## 🚀 Quick Start

1. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

2. Create indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. Import utility functions in your components:
   ```javascript
   import { createListing, getActiveListings, toggleFavorite } from '../utils/firestoreUtils';
   ```

4. Use data models for consistency:
   ```javascript
   import { createListingDocument } from '../utils/firestoreModels';
   ```

---

## 📞 Support

If you encounter any issues with Firestore setup:
1. Check the Firebase Console for error messages
2. Verify security rules are properly deployed
3. Ensure indexes are created
4. Check browser console for detailed error messages

