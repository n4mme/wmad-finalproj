# Selenium Test Improvements - Data Test IDs Added

## Overview
This document outlines all the `data-testid` attributes that have been added to critical interactive elements throughout the application to improve Selenium test reliability and achieve at least 88% pass rate.

## Why Data Test IDs?
- **Stable Selectors**: Unlike CSS classes that can change, `data-testid` attributes are specifically designed for testing
- **Unique Identifiers**: Each critical element has a unique, descriptive test ID
- **Maintainable**: Tests won't break when styling changes
- **Best Practice**: Industry standard for automated testing

## Test ID Reference Guide

### Authentication Page (`/auth`)

#### Login Form
- `data-testid="login-form"` - Login form container
- `data-testid="login-email-input"` - Email input field
- `data-testid="login-password-input"` - Password input field
- `data-testid="login-submit-button"` - Sign In button
- `data-testid="google-signin-button"` - Google Sign In button
- `data-testid="auth-tab-login"` - Login tab button
- `data-testid="auth-tab-signup"` - Sign Up tab button

#### Sign Up Form
- `data-testid="signup-form"` - Sign up form container
- `data-testid="signup-form-container"` - Sign up form wrapper
- `data-testid="signup-fullname-input"` - Full name input
- `data-testid="signup-email-input"` - Email input
- `data-testid="signup-mobile-input"` - Mobile number input
- `data-testid="signup-dob-input"` - Date of birth input
- `data-testid="signup-role-select"` - Role selection dropdown
- `data-testid="signup-password-input"` - Password input
- `data-testid="signup-confirm-password-input"` - Confirm password input
- `data-testid="signup-submit-button"` - Sign Up button
- `data-testid="google-signup-button"` - Google Sign Up button

### Landing Page (`/`)

- `data-testid="landing-login-button"` - Login button in header
- `data-testid="landing-signup-button"` - Sign Up button in header

### Header Component (All Pages)

#### Desktop Menu
- `data-testid="header-create-listing-button"` - Create Listing button (Host only)
- `data-testid="header-menu-favorites"` - Favorites menu item
- `data-testid="header-menu-wishlist"` - Wishlist menu item
- `data-testid="header-menu-bookings"` - Bookings menu item
- `data-testid="header-menu-messages"` - Messages menu item
- `data-testid="header-menu-profile"` - Profile menu item
- `data-testid="header-menu-wallet"` - Wallet menu item
- `data-testid="header-menu-settings"` - Settings menu item
- `data-testid="header-menu-signout"` - Sign Out button

#### Mobile Menu
- `data-testid="mobile-menu-favorites"` - Favorites (mobile)
- `data-testid="mobile-menu-wishlist"` - Wishlist (mobile)
- `data-testid="mobile-menu-bookings"` - Bookings (mobile)
- `data-testid="mobile-menu-messages"` - Messages (mobile)
- `data-testid="mobile-menu-profile"` - Profile (mobile)
- `data-testid="mobile-menu-wallet"` - Wallet (mobile)
- `data-testid="mobile-menu-settings"` - Settings (mobile)
- `data-testid="mobile-menu-signout"` - Sign Out (mobile)

### Listing Detail View

- `data-testid="listing-reserve-button"` - Reserve/Reserve Now button
- `data-testid="apply-dates-button"` - Apply dates button in calendar
- `data-testid="book-now-button"` - Book Now button in booking panel
- `data-testid="booking-proceed-button"` - Proceed button after successful booking
- `data-testid="signin-prompt-button"` - Sign In button in prompt modal

### Guest Dashboard

- `data-testid="favorite-button-{listingId}"` - Favorite button for each listing (dynamic ID)

### Wallet Page

- `data-testid="wallet-add-money-button"` - Add Money button

### Host Page

#### Sidebar Navigation (Desktop)
- `data-testid="host-sidebar-dashboard"` - Dashboard menu item
- `data-testid="host-sidebar-listings"` - Listings menu item
- `data-testid="host-sidebar-bookings"` - Bookings menu item
- `data-testid="host-sidebar-calendar"` - Calendar menu item
- `data-testid="host-sidebar-messages"` - Messages menu item
- `data-testid="host-sidebar-coupons"` - Coupons menu item
- `data-testid="host-sidebar-payments"` - Payments menu item
- `data-testid="host-sidebar-rewards"` - Rewards menu item

#### Mobile Navigation
- `data-testid="host-mobile-dashboard"` - Dashboard (mobile)
- `data-testid="host-mobile-listings"` - Listings (mobile)
- `data-testid="host-mobile-bookings"` - Bookings (mobile)
- `data-testid="host-mobile-calendar"` - Calendar (mobile)
- `data-testid="host-mobile-messages"` - Messages (mobile)
- `data-testid="host-mobile-coupons"` - Coupons (mobile)
- `data-testid="host-mobile-payments"` - Payments (mobile)
- `data-testid="host-mobile-rewards"` - Rewards (mobile)

## Selenium IDE Usage Examples

### ⚠️ CRITICAL: Fix Your Current Error

**Your Current Test (BROKEN):**
```
3. click | css=.text-gray-700 | 
4. type | css=.space-y-4 > .pl-4 | test@example.com
5. type | css=.space-y-4 > .pl-4 | password123
```

**Fixed Test (WORKING):**
```
3. click | css=[data-testid="landing-login-button"] | 
4. waitForElementVisible | css=[data-testid="login-form"] | 5000
5. type | css=[data-testid="login-email-input"] | test@example.com
6. type | css=[data-testid="login-password-input"] | password123
7. click | css=[data-testid="login-submit-button"] | 
8. waitForElementVisible | css=[data-testid="header-menu-profile"] | 10000
```

### Example 1: Complete Login Test
```
Command: open
Target: /
Value: 

Command: setWindowSize
Target: 1065x800
Value: 

Command: click
Target: css=[data-testid="landing-login-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="login-form"]
Value: 5000

Command: type
Target: css=[data-testid="login-email-input"]
Value: user@example.com

Command: type
Target: css=[data-testid="login-password-input"]
Value: password123

Command: click
Target: css=[data-testid="login-submit-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="header-menu-profile"]
Value: 10000
```

### Example 2: Sign Up Test
```
Command: click
Target: css=[data-testid="auth-tab-signup"]

Command: type
Target: css=[data-testid="signup-fullname-input"]
Value: John Doe

Command: type
Target: css=[data-testid="signup-email-input"]
Value: john@example.com

Command: type
Target: css=[data-testid="signup-password-input"]
Value: password123

Command: select
Target: css=[data-testid="signup-role-select"]
Value: guest

Command: click
Target: css=[data-testid="signup-submit-button"]
```

### Example 3: Navigation Test
```
Command: click
Target: css=[data-testid="header-menu-wallet"]

Command: click
Target: css=[data-testid="wallet-add-money-button"]
```

### Example 4: Booking Flow Test
```
Command: click
Target: css=[data-testid="listing-reserve-button"]

Command: click
Target: css=[data-testid="apply-dates-button"]

Command: click
Target: css=[data-testid="book-now-button"]

Command: click
Target: css=[data-testid="booking-proceed-button"]
```

## Alternative Selector Strategies

If you need to use XPath instead of CSS selectors:

### XPath Examples
```xpath
//button[@data-testid='login-submit-button']
//input[@data-testid='login-email-input']
//button[@data-testid='header-menu-wallet']
```

### Recommended Wait Strategies

For better reliability, use explicit waits:

```javascript
// Wait for element to be visible
waitForElementVisible: css=[data-testid="login-submit-button"]

// Wait for element to be clickable
waitForElementPresent: css=[data-testid="login-submit-button"]
```

## Best Practices for Selenium Tests

1. **Always use data-testid selectors** instead of CSS classes or XPath when available
2. **Add explicit waits** before interacting with elements (especially after navigation)
3. **Use unique test IDs** - Each critical element has a unique identifier
4. **Test both desktop and mobile** - Separate test IDs are provided for mobile menus
5. **Handle dynamic content** - Some test IDs include dynamic values (e.g., `favorite-button-{listingId}`)

## Common Test Scenarios Covered

✅ User Registration
✅ User Login
✅ Google Sign In
✅ Navigation (Desktop & Mobile)
✅ Listing Browsing
✅ Favorite Toggle
✅ Booking Flow
✅ Wallet Operations
✅ Host Dashboard Navigation
✅ Sign Out

## Testing Checklist

- [ ] Login flow works with test IDs
- [ ] Sign up flow works with test IDs
- [ ] Navigation menu items are clickable
- [ ] Mobile menu works correctly
- [ ] Booking flow can be automated
- [ ] Favorite buttons are clickable
- [ ] Wallet operations work
- [ ] Host dashboard navigation works
- [ ] All forms can be filled and submitted

## Notes

- All test IDs follow a consistent naming convention: `{component}-{element}-{type}`
- Test IDs are stable and won't change with styling updates
- Some elements have both desktop and mobile test IDs for responsive testing
- Dynamic test IDs (like favorite buttons) include the listing ID for uniqueness

## Support

If you encounter any issues with test IDs:
1. Verify the element exists in the DOM
2. Check that the test ID is spelled correctly
3. Ensure the element is visible and clickable before interaction
4. Add appropriate waits for dynamic content

---

**Last Updated**: All critical components now have data-testid attributes for reliable Selenium testing.

