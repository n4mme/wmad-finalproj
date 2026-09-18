# How to Create Sample Cavite Listings

I've created a utility function to add 2 complete home listings in Cavite, Philippines.

## Function Location
The function `createSampleCaviteListings` is located in `src/utils/firestoreUtils.js`

## How to Use

### Option 1: From Browser Console (Easiest)

1. Open your app in the browser
2. Open the browser console (F12)
3. Make sure you're logged in as a host user
4. Run this code:

```javascript
// Import the function (if using ES6 modules)
import { createSampleCaviteListings } from './utils/firestoreUtils';

// Or if you need to access it from window:
// First, make sure the function is accessible
// Then get your current user ID
const auth = firebase.auth();
const user = auth.currentUser;

if (user) {
    createSampleCaviteListings(user.uid)
        .then(results => {
            console.log('Results:', results);
            alert('Listings created successfully!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating listings: ' + error.message);
        });
} else {
    alert('Please log in first!');
}
```

### Option 2: Add a Button in Host Page (Temporary)

You can temporarily add a button in the Host Page to trigger this function:

```javascript
// In HostPage.jsx, add this button temporarily
import { createSampleCaviteListings } from '../utils/firestoreUtils';
import { auth } from '../firebase';

// Add this button somewhere in your HostPage component
<button 
    onClick={async () => {
        const user = auth.currentUser;
        if (user) {
            const results = await createSampleCaviteListings(user.uid);
            console.log('Results:', results);
            alert('Listings created! Check console for details.');
        } else {
            alert('Please log in first!');
        }
    }}
    className="bg-blue-500 text-white px-4 py-2 rounded"
>
    Create Sample Cavite Listings
</button>
```

## What Will Be Created

### Listing 1: Modern 2BR Condo in Tagaytay
- **Location**: Tagaytay City, Cavite
- **Price**: ₱3,500/night (10% discount)
- **Capacity**: 4 guests, 2 bedrooms, 2 beds, 1 bathroom
- **Amenities**: WiFi, Kitchen, Air Conditioning, TV, Free Parking, Mountain View
- **4 Photos**: Modern condo interior images

### Listing 2: Luxurious Beachfront Villa
- **Location**: Naic, Cavite
- **Price**: ₱8,500/night (15% discount)
- **Capacity**: 6 guests, 3 bedrooms, 3 beds, 2 bathrooms
- **Amenities**: WiFi, Kitchen, Pool, Air Conditioning, TV, Free Parking, Beach Access, Washer, Dryer
- **4 Photos**: Luxury villa and beach images

Both listings include:
- Complete location data (lat/lng in Cavite)
- All required fields (title, description, pricing, amenities, house rules, etc.)
- 4 high-quality photos from Unsplash
- Proper status (active, published)
- All validation requirements met

## Notes

- Make sure you're logged in as a host user
- The function will create both listings with all required fields
- All photos are from Unsplash (placeholder images)
- Both listings are set to "active" status and will appear in your listings

