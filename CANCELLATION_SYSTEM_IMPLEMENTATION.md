# Cancellation System Implementation Summary

## Overview
This document summarizes the implementation of the booking cancellation request system for both guests and hosts.

## Features Implemented

### 1. Host Bookings Page
- ✅ Added "Bookings" to HostPage sidebar with notification badge
- ✅ Red notification badge shows count of pending cancellation requests
- ✅ Badge updates automatically every 30 seconds
- ✅ HostBookings component displays all bookings for the host
- ✅ Special highlighting for bookings with cancellation requests

### 2. Guest Cancellation Request
- ✅ Changed from immediate cancellation to cancellation request
- ✅ Status changes to "Requesting for Cancellation" when guest requests
- ✅ Guest can provide optional cancellation reason
- ✅ Cancel button only shows for confirmed bookings (not for cancellation requests or cancelled bookings)
- ✅ Status badge shows "Requesting for Cancellation" with yellow badge

### 3. Host Cancellation Review
- ✅ Host sees cancellation requests in their Bookings page
- ✅ Host can Approve or Deny cancellation requests
- ✅ Refund calculation based on time until check-in:
  - **More than 48 hours before check-in**: Full Refund
  - **24-48 hours before check-in**: Partial Refund (20% deduction = 80% refund)
  - **Less than 24 hours before check-in**: No Refund
- ✅ Refund automatically credited to guest wallet when approved
- ✅ Booked dates automatically removed from listing when approved

### 4. Email Notification
- ✅ Email sent to guest when host approves cancellation
- ✅ Email template created (see `CANCELLATION_EMAIL_TEMPLATE.html`)
- ✅ Email includes booking details, refund amount, and refund policy

## Files Modified

### New Files
1. `src/components/HostBookings.jsx` - Host bookings view with cancellation management
2. `CANCELLATION_EMAIL_TEMPLATE.html` - Email template for cancellation confirmation

### Modified Files
1. `src/components/HostPage.jsx` - Added Bookings to sidebar with notification badge
2. `src/components/Bookings.jsx` - Updated to request cancellation instead of immediate cancel
3. `src/utils/firestoreUtils.js` - Added cancellation request functions:
   - `requestCancellation()` - Guest requests cancellation
   - `approveCancellation()` - Host approves cancellation
   - `denyCancellation()` - Host denies cancellation
   - `calculateRefund()` - Calculates refund based on policy

## Booking Status Flow

1. **Confirmed** → Guest clicks "Request Cancellation" → **Requesting Cancellation**
2. **Requesting Cancellation** → Host approves → **Cancelled** (with refund)
3. **Requesting Cancellation** → Host denies → **Confirmed** (booking continues)

## Refund Policy Implementation

The refund is calculated based on hours until check-in date:

```javascript
if (hoursUntilCheckIn >= 48) {
    // Full refund
    refundAmount = totalPrice;
} else if (hoursUntilCheckIn >= 24) {
    // Partial refund (80% of total, 20% deduction)
    refundAmount = totalPrice * 0.8;
} else {
    // No refund
    refundAmount = 0;
}
```

## Email Template Setup

### EmailJS Configuration
1. Go to EmailJS dashboard
2. Create a new template named: `template_cancellation_confirmation`
3. Copy the HTML from `CANCELLATION_EMAIL_TEMPLATE.html`
4. Use the following template variables:
   - `{{to_email}}` - Guest email
   - `{{to_name}}` - Guest name
   - `{{booking_id}}` - Booking ID
   - `{{listing_title}}` - Listing title
   - `{{refund_amount}}` - Refund amount (e.g., "₱5,000")
   - `{{refund_policy}}` - Refund policy (e.g., "Full Refund")

### Template Variables Mapping
- Service ID: `service_pj8jk8q` (same as OTP email)
- Template ID: `template_cancellation_confirmation` (create this in EmailJS)
- Public Key: `F0NOLhwaqVJSlllOF` (same as OTP email)

## Database Changes

### Booking Document Fields Added
- `status: 'requesting_cancellation'` - When guest requests cancellation
- `cancellationRequestedAt` - Timestamp of cancellation request
- `cancellationReason` - Guest's reason for cancellation
- `cancellationApprovedAt` - Timestamp when host approves
- `cancellationApprovedBy` - 'host'
- `cancellationDeniedAt` - Timestamp when host denies
- `cancellationDeniedBy` - 'host'
- `cancellationDenialReason` - Host's reason for denial
- `refundAmount` - Calculated refund amount
- `refundPolicy` - Policy applied ('full_refund', 'partial_refund_20pct_deduction', 'no_refund')

## User Experience Flow

### Guest Side
1. Guest views their bookings
2. Clicks "Request Cancellation" button
3. Modal appears with refund policy information
4. Guest can optionally provide cancellation reason
5. Status changes to "Requesting for Cancellation"
6. Guest receives email when host approves

### Host Side
1. Host sees red notification badge on Bookings menu item
2. Badge shows count of pending cancellation requests
3. Host clicks Bookings to view all bookings
4. Cancellation requests are highlighted with yellow border
5. Host sees cancellation reason (if provided)
6. Host clicks "Approve" or "Deny"
7. If approved, refund is calculated and processed
8. Guest receives confirmation email

## Testing Checklist

- [ ] Guest can request cancellation
- [ ] Status changes to "Requesting for Cancellation"
- [ ] Host sees notification badge
- [ ] Host can view cancellation requests
- [ ] Host can approve cancellation
- [ ] Refund is calculated correctly based on time
- [ ] Refund is credited to guest wallet
- [ ] Booked dates are removed from listing
- [ ] Email is sent to guest on approval
- [ ] Host can deny cancellation
- [ ] Booking status reverts to "Confirmed" when denied

## Notes

- The refund calculation uses the cancellation request time, not the approval time
- Refunds are automatically processed to the guest's wallet
- The email template uses the same design style as the OTP email for consistency
- All cancellation requests are tracked in the booking document for audit purposes

