# How to Update Your Selenium IDE Tests

## Problem
Your current Selenium tests are using CSS class selectors (like `css=.text-gray-700` and `css=.space-y-4 > .pl-4`) which are:
- Not unique (multiple elements share the same classes)
- Fragile (break when styling changes)
- Hard to maintain

## Solution
Replace all CSS class selectors with `data-testid` selectors for reliable testing.

## Step-by-Step Test Update Guide

### Test: "Guest Login"

#### Current Test (BROKEN):
```
1. open | / | 
2. setWindowSize | 1065x800 | 
3. click | css=.text-gray-700 | 
4. type | css=.space-y-4 > .pl-4 | test@example.com
5. type | css=.space-y-4 > .pl-4 | password123
```

#### Updated Test (WORKING):
```
1. open | / | 
2. setWindowSize | 1065x800 | 
3. click | css=[data-testid="landing-login-button"] | 
4. waitForElementVisible | css=[data-testid="login-email-input"] | 5000
5. type | css=[data-testid="login-email-input"] | test@example.com
6. type | css=[data-testid="login-password-input"] | password123
7. click | css=[data-testid="login-submit-button"] | 
```

## Complete Test Examples

### Test 1: Guest Login Flow

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
Value: guest@example.com

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

### Test 2: Guest Sign Up Flow

```
Command: open
Target: /
Value: 

Command: click
Target: css=[data-testid="landing-signup-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="signup-form"]
Value: 5000

Command: type
Target: css=[data-testid="signup-fullname-input"]
Value: John Doe

Command: type
Target: css=[data-testid="signup-email-input"]
Value: john@example.com

Command: type
Target: css=[data-testid="signup-mobile-input"]
Value: +1234567890

Command: type
Target: css=[data-testid="signup-dob-input"]
Value: 1990-01-01

Command: select
Target: css=[data-testid="signup-role-select"]
Value: label=Guest

Command: type
Target: css=[data-testid="signup-password-input"]
Value: password123

Command: type
Target: css=[data-testid="signup-confirm-password-input"]
Value: password123

Command: click
Target: css=[data-testid="signup-submit-button"]
Value: 
```

### Test 3: Navigation Test

```
Command: click
Target: css=[data-testid="header-menu-wallet"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="wallet-add-money-button"]
Value: 5000

Command: click
Target: css=[data-testid="header-menu-favorites"]
Value: 

Command: click
Target: css=[data-testid="header-menu-bookings"]
Value: 
```

### Test 4: Booking Flow

```
Command: click
Target: css=[data-testid="listing-reserve-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="apply-dates-button"]
Value: 5000

Command: click
Target: css=[data-testid="apply-dates-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="book-now-button"]
Value: 5000

Command: click
Target: css=[data-testid="book-now-button"]
Value: 

Command: waitForElementVisible
Target: css=[data-testid="booking-proceed-button"]
Value: 10000

Command: click
Target: css=[data-testid="booking-proceed-button"]
Value: 
```

## Important: Add Waits!

Always add `waitForElementVisible` or `waitForElementPresent` before interacting with elements, especially after:
- Navigation
- Form submissions
- Page loads
- Dynamic content rendering

## Selector Format

### CSS Selector Format (Recommended)
```
css=[data-testid="element-name"]
```

### XPath Format (Alternative)
```
xpath=//*[@data-testid='element-name']
```

### Button-Specific XPath (More Specific)
```
xpath=//button[@data-testid='login-submit-button']
```

## Common Issues and Fixes

### Issue 1: "Element not found"
**Solution**: Add a wait before the command
```
waitForElementVisible | css=[data-testid="login-email-input"] | 5000
type | css=[data-testid="login-email-input"] | test@example.com
```

### Issue 2: "Element not clickable"
**Solution**: Wait for element to be visible and enabled
```
waitForElementVisible | css=[data-testid="login-submit-button"] | 5000
waitForElementEditable | css=[data-testid="login-submit-button"] | 5000
click | css=[data-testid="login-submit-button"] | 
```

### Issue 3: "Timeout after 30000ms"
**Solution**: 
1. Increase wait time
2. Check if element exists with correct test ID
3. Verify element is not hidden or conditionally rendered

## Quick Reference: All Available Test IDs

### Landing Page
- `landing-login-button`
- `landing-signup-button`

### Auth Page
- `auth-tab-login`
- `auth-tab-signup`
- `login-form`
- `login-email-input`
- `login-password-input`
- `login-submit-button`
- `google-signin-button`
- `signup-form`
- `signup-fullname-input`
- `signup-email-input`
- `signup-mobile-input`
- `signup-dob-input`
- `signup-role-select`
- `signup-password-input`
- `signup-confirm-password-input`
- `signup-submit-button`
- `google-signup-button`

### Header Navigation
- `header-create-listing-button`
- `header-menu-favorites`
- `header-menu-wishlist`
- `header-menu-bookings`
- `header-menu-messages`
- `header-menu-profile`
- `header-menu-wallet`
- `header-menu-settings`
- `header-menu-signout`

### Listing Detail
- `listing-reserve-button`
- `apply-dates-button`
- `book-now-button`
- `booking-proceed-button`
- `signin-prompt-button`

### Wallet
- `wallet-add-money-button`

### Host Dashboard
- `host-sidebar-dashboard`
- `host-sidebar-listings`
- `host-sidebar-bookings`
- `host-sidebar-calendar`
- `host-sidebar-messages`
- `host-sidebar-coupons`
- `host-sidebar-payments`
- `host-sidebar-rewards`

## Migration Checklist

- [ ] Replace all `css=.text-gray-700` with `css=[data-testid="landing-login-button"]`
- [ ] Replace all `css=.space-y-4 > .pl-4` with `css=[data-testid="login-email-input"]`
- [ ] Add `waitForElementVisible` before each interaction
- [ ] Replace all CSS class selectors with data-testid selectors
- [ ] Test each updated test case
- [ ] Verify all tests pass

## Best Practices

1. **Always use data-testid selectors** - Never use CSS classes for testing
2. **Add explicit waits** - Don't rely on implicit waits alone
3. **Use descriptive test IDs** - They're self-documenting
4. **Test incrementally** - Update one test at a time
5. **Verify selectors** - Use browser DevTools to verify test IDs exist

## Need Help?

If you're still getting errors:
1. Check that the element has the correct `data-testid` attribute
2. Verify the element is visible (not hidden by CSS)
3. Add longer wait times for slow-loading content
4. Check browser console for JavaScript errors
5. Verify the page has fully loaded before interacting

---

**Remember**: The key to 88%+ pass rate is using stable `data-testid` selectors with proper waits!

