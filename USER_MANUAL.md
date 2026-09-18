# BiyaHele User Manual

![BiyaHele Logo](src/components/BiyaheleLogo.png)

---

## Summary of Test Results

| Test Area | No. of Test Cases | Passed | Failed | Blocked | Pass % |
|-----------|-------------------|--------|--------|---------|--------|
| **General Users** |
| User Login and Registration | 3 | 3 | 0 | 0 | 100% |
| **Guest & Host** |
| Cash-In the E-Wallet from Paypal | 1 | 0 | 1 | 0 | 0% |
| Core User Functionality | 10 | 10 | 0 | 0 | 100% |
| E-Wallet | 2 | 2 | 0 | 0 | 100% |
| Security & Negative Testing | 2 | 2 | 0 | 0 | 100% |
| Administrative | 1 | 1 | 0 | 0 | 100% |
| **Total** | **19** | **18** | **1** | **0** | **94.74%** |

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Guest Guide](#guest-guide)
4. [Host Guide](#host-guide)
5. [Admin Guide](#admin-guide)
6. [Troubleshooting](#troubleshooting)
7. [FAQs](#faqs)

---

## Introduction

In today's travel landscape, travelers increasingly seek meaningful experiences through staycations and adventure-based activities, preferring localized, flexible, and experience-driven travel options over traditional hotel accommodations. This significant shift in consumer behavior reflects a growing desire for authentic, personalized travel experiences that connect visitors with local culture, unique accommodations, and immersive activities. Modern travelers value the flexibility to choose from diverse lodging options ranging from entire homes and private rooms to unique spaces, while also seeking curated experiences such as food tours, cultural activities, and adventure excursions. This growing demand has created an urgent need for digital platforms that can effectively support these diverse accommodation and activity preferences while ensuring convenience, security, and accessibility for both travelers and service providers. The market requires solutions that can seamlessly bridge the gap between guests seeking memorable experiences and hosts offering unique properties and services, all within a trusted, user-friendly digital ecosystem.

**BiyaHele** addresses this market need as a comprehensive reservation web application designed to seamlessly connect guests and hosts through a secure and intuitive digital environment that prioritizes user experience and operational efficiency. The platform enables users to browse extensive listings of homes, experiences, and services with advanced search and filtering capabilities, making it easy to discover properties and activities that match their specific preferences, budget, and travel dates. Users can make reservations through a streamlined booking process and complete payments using an in-app e-wallet that is fully integrated with their PayPal accounts, providing a secure and convenient payment solution that eliminates the need for multiple payment gateways. Additionally, BiyaHele features a sophisticated rewards system designed to enhance user engagement and foster long-term loyalty, incentivizing both guests and hosts to actively participate in the platform ecosystem. The platform offers a wide selection of homes, experiences, and services carefully tailored to different travel and staycation needs across the Philippines, from beachfront villas in Palawan to urban apartments in Metro Manila, from food tours in Cebu to adventure activities in Baguio, ensuring that every traveler can find something that suits their unique preferences and travel style.

For hosts, the system provides comprehensive management tools that empower them to effectively track bookings, monitor earnings, analyze performance metrics, and oversee their listings with ease and efficiency. Hosts can manage their availability calendars, set dynamic pricing, create promotional discounts, handle booking approvals and cancellations, communicate directly with guests through an integrated messaging system, and request payouts through a secure withdrawal process. Administrators benefit from a streamlined, professional dashboard that supports comprehensive monitoring of platform activity, including detailed analytics on user engagement, booking trends, revenue generation, and platform growth metrics. The administrative interface also facilitates the management of service and registration fees collected from hosts, user account oversight, policy compliance monitoring, and cash-out request approvals, ensuring that the platform operates smoothly and maintains high standards of service quality. These features collectively ensure smooth operations and an efficient, high-quality user experience for all stakeholders in the BiyaHele ecosystem, creating a sustainable and mutually beneficial platform that serves the needs of travelers, hosts, and administrators while contributing to the growth of the local tourism and hospitality industry in the Philippines.

---

## General Information

**BiyaHele** is a web-based application designed to ease the reservation process for homes, services, and experiences between guests and hosts, creating a comprehensive digital marketplace that simplifies the entire booking lifecycle from discovery to completion. The platform streamlines the complex process of connecting travelers with accommodation providers and experience hosts, eliminating traditional barriers such as multiple communication channels, inconsistent booking procedures, and fragmented payment systems. By centralizing all reservation activities within a single, user-friendly interface, BiyaHele significantly reduces the time and effort required for both guests to find and book their ideal travel experiences and for hosts to manage their listings and reservations effectively. The platform serves as an income-generating system for both administrators and hosts, creating a sustainable business model that benefits all parties involved. Administrators benefit from host registration fees that are collected when new hosts join the platform, as well as service fees that are automatically deducted from each completed booking, providing a steady revenue stream that supports platform maintenance, development, and growth initiatives. Meanwhile, hosts earn revenue directly from their listed properties, experiences, and services, with transparent pricing structures and immediate access to their earnings through the integrated payout system, enabling them to build and grow their hospitality businesses while contributing to the platform's diverse offering of travel options.

The application is built using modern web technologies carefully selected to ensure reliability, security, and optimal performance across all devices and network conditions. The user interface is developed with React-Vite, a cutting-edge frontend framework that combines the power of React's component-based architecture with Vite's lightning-fast build tooling, providing users with a fast, responsive, and seamless user experience that loads quickly and responds instantly to user interactions. Database management and authentication are handled through Firebase Firestore, Google's scalable NoSQL cloud database solution that ensures secure data storage, real-time synchronization, and robust user verification processes, protecting sensitive user information while enabling seamless data access across different devices and sessions. Email verification is implemented using EmailJS, a reliable email service that enables the platform to send OTP codes, booking confirmations, cancellation notices, and other important communications directly to users' email inboxes without requiring complex email server configurations. Wallet transactions are processed through PayPal integration, leveraging one of the world's most trusted and secure payment platforms to handle all financial transactions, including wallet top-ups, booking payments, refunds, and host payouts, ensuring that all monetary exchanges are processed securely and in compliance with international financial regulations. The platform also includes HTML2PDF for comprehensive report generation capabilities, allowing administrators to create detailed PDF reports on platform activity, financial performance, user statistics, and booking analytics that can be exported, shared, and archived for business intelligence and compliance purposes. Finally, the entire application is deployed on Vercel, a modern cloud platform optimized for frontend applications that provides global content delivery, automatic scaling, and exceptional performance metrics, ensuring that BiyaHele is accessible to users worldwide with minimal latency and maximum reliability, regardless of their geographic location or device type.

---

## System Overview

BiyaHele includes the following functionalities and processes:

- **User Registration**: New users can create accounts by providing personal information, selecting their role (guest, host, or admin), and completing email verification through OTP codes.

- **Authentication and Verification**: Secure login system supporting email/password authentication and Google Sign-In, with email verification required for account activation.

- **Browsing of Listings**: Users can explore available homes, experiences, and services through search functionality, filters, and category-based navigation with detailed listing information.

- **Reservation Process and Management**: Complete booking workflow from date selection to payment processing, with host approval system and booking status tracking for both guests and hosts.

- **User Management/Profile Management**: Comprehensive profile management allowing users to update personal information, profile photos, preferences, and account settings.

- **Report Generation**: System administrators can generate reports on platform activity, bookings, earnings, and user statistics using PDF export functionality.

- **Smart Analytics/Dashboard**: Role-specific dashboards providing insights, statistics, and key metrics for guests, hosts, and administrators to monitor activity and performance.

- **Communication Module**: Integrated messaging system enabling direct communication between guests and hosts, with real-time notifications and message history.

- **Notifications**: Real-time notification system alerting users about booking updates, messages, cancellations, and important platform announcements.

- **Points and Rewards System**: Gamification features allowing users to earn points through various activities and redeem rewards, with host-specific point earning opportunities.

- **E-Wallet System (Cash-In/Withdraw)**: Integrated wallet functionality allowing users to add funds via PayPal, use wallet balance for bookings, and hosts to request payouts through secure withdrawal processes.

- **Search Functionality**: Advanced search capabilities including location-based search, category filters, date availability, price range, and keyword search to help users find relevant listings quickly.

---

## Roles and Access Privileges

| Roles | Access and Privileges | Limitations | Additional Features |
|-------|----------------------|-------------|---------------------|
| **Guest** | Browse and search listings (homes, experiences, services); Create and manage bookings; Add funds to e-wallet via PayPal; Use wallet balance for payments; View and manage favorites and wishlists; Communicate with hosts through messaging system; View booking history and status; Cancel bookings (subject to cancellation policy); Receive refunds for cancelled bookings; Earn and redeem points through rewards system; Update personal profile and account settings; View transaction history; Access guest dashboard with personalized recommendations. | Cannot create listings; Cannot approve or manage bookings from host perspective; Cannot access admin functions; Cannot view other users' private information; Cannot generate platform reports; Cannot manage service fees or platform settings. | Personalized dashboard with booking recommendations; Wishlist functionality for trip planning; Points and rewards redemption system; Real-time booking status notifications; Integrated messaging with hosts; Wallet balance management for faster checkout. |
| **Host** | Create, edit, and manage listings (homes, experiences, services); Set pricing and availability calendars; Create and manage promotional discounts and coupons; Approve or deny booking requests; Manage booking cancellations and refunds; View and respond to guest messages; Track earnings and revenue analytics; Request payouts through secure withdrawal process; Manage availability calendars and block dates; Set special pricing for specific dates; View booking history and guest information; Earn points through hosting activities (listings, reviews, bookings); Access host dashboard with business analytics; Manage multiple listings simultaneously; View performance metrics and statistics. | Cannot access admin dashboard or platform-wide analytics; Cannot manage other hosts' listings or bookings; Cannot approve their own cash-out requests (requires admin approval); Cannot modify platform policies or service fees; Cannot view all users or generate system-wide reports; Cannot suspend or terminate user accounts. | Business analytics dashboard with revenue tracking; Coupon and promo management tools; Calendar and pricing management system; Performance metrics and statistics; Points earning through hosting milestones; Secure payout request system; Booking approval workflow management. |
| **Admin** | Access comprehensive admin dashboard with platform-wide analytics; View all users, listings, and bookings across the platform; Manage user accounts (suspend, terminate, change roles); Approve or deny host cash-out requests; Process payouts to host PayPal accounts; Monitor platform activity and transactions; Generate detailed reports (PDF export) on platform activity, bookings, earnings, and user statistics; Manage service fees and registration fees; View and manage all wallet transactions; Handle termination appeals and policy compliance; Monitor user compliance and track violations; Update platform policies and guidelines; Access system-wide analytics and growth metrics; Manage platform settings and configurations; View all messages and communications for moderation purposes. | Cannot create personal bookings as a guest; Cannot create listings as a host (unless role is changed); Cannot bypass security rules or access raw database; Cannot modify core system architecture; Cannot access user payment credentials (PayPal handles this); Cannot delete platform data without proper authorization. | Comprehensive platform analytics and reporting; User management and account control; Cash-out approval and processing system; Policy and compliance management tools; PDF report generation for business intelligence; System-wide transaction monitoring; Platform configuration and settings management; Termination appeal handling system. |

---

## Getting Started

### Creating an Account

1. **Visit the Landing Page**
   - Navigate to the BiyaHele homepage at https://biyahele.web.app
   - Click the **"Sign Up"** button in the top-right corner

2. **Sign Up Process**
   - Enter your email address
   - Create a secure password
   - Provide your full name
   - Complete email verification (OTP code will be sent)
   - Enter the OTP code to verify your account

3. **Account Types**
   - **Guest Account**: Default account type for booking stays and experiences
   - **Host Account**: Apply to become a host to list your properties/services
   - **Admin Account**: System administrators (contact support for access)

### Logging In

1. Click **"Login"** in the top-right corner
2. Enter your email and password
3. You'll be redirected to your dashboard based on your account type

**Alternative Login Methods:**
- **Google Sign-In**: Click "Continue with Google" button
- Select your Google account from the list

### Forgot Password

- Click "Forgot Password" on the login page
- Enter your email address
- Check your email for password reset instructions

---

## Guest Guide

### Dashboard Overview

The Guest Dashboard is your home base for exploring and managing your bookings.

#### Navigation Menu

- **Home**: Browse available listings
- **Favorites**: View your saved listings
- **Wishlist**: Your curated wishlist items
- **Bookings**: Manage your reservations
- **Messages**: Communicate with hosts
- **Profile**: View and edit your profile
- **Wallet**: Manage payments and transactions
- **Account Settings**: Update your account information

### Browsing Listings

#### Search and Filter

1. **Location Search**
   - Use the search bar to find listings by location
   - Select from dropdown suggestions
   - Filter by province, city, or specific address

2. **Date Selection**
   - Click on the calendar icon
   - Select your check-in and check-out dates
   - Available dates are highlighted in green
   - Click "Apply Dates" to confirm your selection

3. **Guest Count**
   - Use the guest selector to specify number of guests
   - The system will show listings that accommodate your party size

4. **Additional Filters**
   - **Price Range**: Set minimum and maximum price
   - **Property Type**: Filter by Entire Place, Private Room, etc.
   - **Amenities**: Filter by WiFi, Pool, Kitchen, etc.
   - **Rating**: Show only listings with minimum star rating

#### Viewing Listings

1. **Listing Cards**
   - Browse listings in grid or list view
   - Each card shows:
     - Main photo
     - Title and location
     - Price per night
     - Average rating
     - Super Host badge (if applicable)

2. **Listing Details Page**
   - Click any listing to view full details
   - View photo gallery (click to enlarge)
   - Read full description
   - Check amenities list
   - View location on map
   - Read reviews from previous guests
   - See host profile and response rate

### Saving Listings

#### Favorites

1. **Add to Favorites**
   - Click the heart icon on any listing card
   - The heart will turn red when favorited
   - Access favorites from the "Favorites" menu item

2. **Remove from Favorites**
   - Click the heart icon again to unfavorite
   - Or remove from the Favorites page

#### Wishlist

1. **Add to Wishlist**
   - Click the sparkles icon on a listing
   - Create custom wishlists for different trips
   - Organize listings by destination or occasion

2. **Manage Wishlist**
   - View all wishlist items from the menu
   - Remove items or move to different lists
   - Share wishlists with travel companions

### Making a Booking

#### Booking Process

1. **Select Dates**
   - On the listing detail page, use the calendar to select dates
   - Click "CHECK-IN & CHECK-OUT" button
   - Select check-in date (first click)
   - Select check-out date (second click)
   - Click "Apply Dates" to confirm
   - Available dates are shown in green
   - Blocked dates appear in gray

2. **Choose Guests**
   - Select number of guests
   - Some listings have maximum guest limits

3. **Review Pricing**
   - Base price per night
   - Discount (if applicable)
   - Service fees
   - Total amount displayed

4. **Complete Booking**
   - Click **"Reserve"** or **"Book Now"** button
   - Review booking summary
   - Click **"Proceed"** to continue
   - Complete payment through PayPal

**Note**: You must select check-in and check-out dates before booking. An alert will appear if dates are not selected.

#### Payment

1. **Payment Method**
   - BiyaHele uses PayPal for secure payments
   - You'll be redirected to PayPal checkout
   - Complete payment through PayPal

2. **Booking Confirmation**
   - After successful payment, you'll receive:
     - Booking confirmation email
     - Booking ID
     - Host contact information
     - Check-in instructions (if provided by host)

3. **Booking Status**
   - **Pending**: Awaiting host confirmation
   - **Confirmed**: Booking is confirmed
   - **Completed**: Stay has ended
   - **Cancelled**: Booking was cancelled

### Managing Bookings

#### View Bookings

1. Navigate to **"Bookings"** from the menu
2. View all your bookings:
   - **Upcoming**: Future reservations
   - **Current**: Active stays
   - **Past**: Completed bookings
   - **Cancelled**: Cancelled reservations

#### Booking Actions

1. **View Details**
   - Click on any booking to see full details
   - View booking dates, price, and status
   - Access host contact information

2. **Cancel Booking**
   - Click "Cancel Booking" on an upcoming reservation
   - Review cancellation policy
   - Confirm cancellation
   - Refund processed according to policy

3. **Contact Host**
   - Use the "Message Host" button
   - Send messages about your stay
   - Ask questions before or during your visit

### Messaging

#### Starting a Conversation

1. **From Listing Page**
   - Click "Message Host" button
   - A new message thread will be created

2. **From Bookings Page**
   - Click "Message Host" on any booking
   - Continue existing conversation

#### Using Messages

1. **Message Thread**
   - View conversation history
   - Send text messages
   - Receive notifications for new messages
   - Unread message count shown in header

2. **Best Practices**
   - Be clear about your questions
   - Respond promptly to host messages
   - Confirm check-in details before arrival

### Wallet

#### Viewing Wallet

1. Navigate to **"Wallet"** from the menu
2. View:
   - Current balance
   - Transaction history
   - Pending payments
   - Refunds

#### How to Cash-In to E-Wallet

1. **Access Wallet**
   - Navigate to **"Wallet"** from the menu
   - You'll see your current wallet balance displayed

2. **Initiate Cash-In**
   - Click the **"Add Money"** button (₱ icon)
   - A cash-in modal will open

3. **Enter Amount**
   - Enter the amount you want to add to your wallet
   - Minimum amount may apply (check the platform for current minimum)
   - Default amount is usually ₱500
   - You can change this amount

4. **Complete Payment via PayPal**
   - Click the **PayPal** button in the modal
   - You'll be redirected to PayPal checkout
   - Log in to your PayPal account (if not already logged in)
   - Review the payment amount
   - Confirm the payment

5. **Payment Confirmation**
   - After successful payment, you'll be redirected back to BiyaHele
   - You'll see a confirmation message: **"Top-up successful!"**
   - Your wallet balance will be updated immediately
   - The transaction will appear in your transaction history

6. **Verify Transaction**
   - Check your wallet balance to confirm the funds were added
   - View the transaction in your Transaction History
   - Transaction type will show as "Top up"

#### Using Wallet Balance

1. **For Bookings**
   - When making a booking, select "E-Wallet" as payment method
   - Your wallet balance will be used automatically
   - Faster checkout process (no need to enter payment details)
   - If balance is insufficient, you can add more funds or use PayPal

2. **Balance Visibility**
   - Your wallet balance is always visible in the Wallet section
   - Click the eye icon to show/hide balance for privacy
   - Balance is displayed in Philippine Peso (₱)

#### Transactions

- **Payment**: Payments made for bookings using wallet balance
- **Refund**: Cancelled booking refunds added to wallet
- **Top up**: Cash-in transactions from PayPal
- **Rewards**: Points redeemed for cash (added to wallet)

### Profile

#### Edit Profile

1. Navigate to **"Profile"** from the menu
2. Update:
   - Profile photo
   - Full name
   - Bio/About me
   - Phone number
   - Location

3. **Profile Visibility**
   - Your profile is visible to hosts when you book
   - Keep information up to date

### Account Settings

#### Update Settings

1. Navigate to **"Account Settings"**
2. Manage:
   - Email address
   - Password
   - Notification preferences
   - Privacy settings
   - Language preferences

#### Security

- Enable two-factor authentication (if available)
- Review active sessions
- Change password regularly

---

## Host Guide

### Becoming a Host

#### Application Process

1. **Request Host Status**
   - Contact support or use the "Become a Host" feature
   - Provide business information
   - Wait for approval

2. **Host Requirements**
   - Valid identification
   - Bank account for payouts
   - Property ownership or authorization

### Host Dashboard

#### Navigation

The Host Dashboard includes:

- **Dashboard**: Overview of your hosting business
- **Listings**: Manage your properties/services
- **Bookings**: View and manage reservations
- **Calendar & Pricing**: Manage availability and rates
- **Messages**: Communicate with guests
- **Coupons**: Create and manage discount codes
- **Payments & Earnings**: Track income and request payouts
- **Points & Rewards**: View earned rewards

### Creating Listings

#### Listing Types

BiyaHele supports three types of listings:

1. **Homes** 🏠
   - Entire Place
   - Private Room
   - Shared Room
   - Apartment
   - Unique Space
   - Outdoor Space

2. **Experiences** 🎈
   - Food Tour
   - City Tour
   - Adventure
   - Cultural
   - Wellness
   - Entertainment

3. **Services** 🛎️
   - Cleaning
   - Cooking
   - Transportation
   - Personal Care
   - Education
   - Professional

#### Listing Creation Process

1. **Click "Create Listing"**
   - Button appears in header for hosts
   - Opens multi-step creation modal

2. **Step 1: Category Selection**
   - Choose Homes, Experiences, or Services
   - Each category has different requirements

3. **Step 2: Basic Information**
   - **Title**: Catchy, descriptive title
   - **Description**: Detailed description of your offering
   - **Type**: Select specific type (e.g., Entire Place, Food Tour)

4. **Step 3: Location**
   - Enter address or use location search
   - Use map to set precise coordinates
   - Verify location on interactive map

5. **Step 4: Details**
   - **For Homes**:
     - Number of guests
     - Bedrooms
     - Beds
     - Bathrooms
   - **For Experiences**:
     - Duration (hours)
     - Max capacity
     - What's included
     - Requirements
   - **For Services**:
     - Service details
     - What's included
     - Requirements

6. **Step 5: Amenities/Features**
   - Select available amenities
   - Check all that apply
   - Add custom amenities if needed

7. **Step 6: Photos**
   - Upload high-quality photos
   - Drag and drop or click to upload
   - First photo is the cover image
   - Add at least 5 photos (recommended)
   - Remove photos if needed

8. **Step 7: Pricing**
   - **Base Price**: Price per night (Homes) or per person (Experiences) or service rate
   - **Discount**: Optional percentage discount
   - Review total pricing

9. **Step 8: House Rules** (Homes only)
   - Check-in time
   - Check-out time
   - Minimum stay (nights)
   - Maximum stay (nights)

10. **Publish or Save Draft**
    - **Publish**: Makes listing active and searchable
    - **Save Draft**: Saves progress for later editing
    - Validation checks before publishing

#### Listing Requirements

Before publishing, ensure:
- ✅ Title and description are complete
- ✅ At least one photo uploaded
- ✅ Location is set
- ✅ Pricing is configured
- ✅ All required fields are filled

### Managing Listings

#### Listings View

1. **View All Listings**
   - Navigate to "Listings" in sidebar
   - See all your listings (active and drafts)

2. **Listing Status**
   - **Draft**: Not yet published
   - **Active**: Published and searchable
   - **Inactive**: Temporarily hidden

#### Listing Actions

1. **Edit Listing**
   - Click "Edit" on any listing
   - Modify any section
   - Save changes

2. **Publish/Unpublish**
   - Publish draft listings
   - Unpublish to temporarily hide
   - Re-publish anytime

3. **Delete Listing**
   - Click "Delete" (use with caution)
   - Cannot be undone
   - Existing bookings remain valid

### Calendar & Pricing

#### Managing Availability

1. **View Calendar**
   - Navigate to "Calendar & Pricing"
   - See all your listings' calendars
   - Color-coded by listing

2. **Block Dates**
   - Click on dates to block
   - Blocked dates are unavailable for booking
   - Unblock by clicking again

3. **Special Pricing**
   - Set different prices for specific dates
   - Holiday pricing
   - Seasonal rates
   - Weekend pricing

4. **Bulk Actions**
   - Block multiple dates at once
   - Set pricing for date ranges
   - Clear all blocked dates

### How to Manage Reservations

Managing reservations is a crucial part of being a host. The Bookings section in your Host Dashboard allows you to view, approve, and manage all reservations for your listings.

#### Accessing the Bookings Page

1. **Navigate to Bookings**
   - Log in to your Host Dashboard
   - Click **"Bookings"** in the sidebar navigation menu
   - You'll see all reservations for your listings

2. **Understanding the Bookings Page**
   - Bookings are displayed in cards showing key information
   - Each booking card shows:
     - Listing title
     - Guest name and contact information
     - Check-in and check-out dates
     - Number of guests
     - Total booking amount
     - Booking ID
     - Current status badge

#### Booking Statuses

Understanding booking statuses helps you manage reservations effectively:

- **Pending Approval** (Orange badge): New booking requests awaiting your confirmation
  - These require your action to approve or decline
  - Guest has completed payment but booking is not yet confirmed
  - You'll see an "Approve Booking" button

- **Confirmed** (Green badge): Bookings that have been approved
  - Guest's stay is confirmed
  - Booking is active and valid

- **Requesting Cancellation** (Yellow badge): Guest has requested to cancel
  - Guest has submitted a cancellation request
  - You need to approve or deny the cancellation
  - Refund amount is calculated based on cancellation policy

- **Cancelled** (Red badge): Cancelled bookings
  - Cancellation has been processed
  - Refunds have been issued (if applicable)

- **Completed** (Blue badge): Finished stays
  - Guest's stay has ended
  - Booking is complete

#### Managing Pending Bookings

1. **Review Pending Bookings**
   - Look for bookings with "Pending Approval" status
   - Review all booking details:
     - Guest information
     - Check-in and check-out dates
     - Number of guests
     - Total price
     - Booking ID

2. **Approve a Booking**
   - Click the **"Approve Booking"** button on the booking card
   - Review the booking details one more time
   - Confirm your approval
   - A confirmation email will be automatically sent to the guest
   - The booking status will change to "Confirmed"
   - The dates will be marked as booked in your calendar

3. **Important Notes**
   - Once approved, the booking is confirmed
   - Guest receives a confirmation email automatically
   - Approved bookings cannot be easily cancelled by you
   - Make sure dates are available before approving

#### Handling Cancellation Requests

When a guest requests to cancel a booking, you'll see a "Requesting Cancellation" status badge.

1. **Review Cancellation Request**
   - Click on the booking with "Requesting Cancellation" status
   - Review the cancellation reason (if provided by guest)
   - Check the booking details:
     - Original booking date
     - Cancellation request time
     - Total booking amount

2. **Understanding Refund Policies**
   The system automatically calculates refunds based on when the cancellation is requested:
   
   - **Within 24 hours of booking**: Full refund (no deduction)
   - **24-48 hours after booking**: Partial refund with 20% deduction
   - **After 48 hours**: Cancellation only, no refund
   
   The refund amount is displayed before you approve the cancellation.

3. **Approve Cancellation**
   - Click the **"Approve"** button
   - Review the calculated refund amount
   - Confirm the cancellation approval
   - Refund is processed automatically
   - Guest receives a cancellation confirmation email
   - Booking status changes to "Cancelled"
   - Dates become available again in your calendar

4. **Deny Cancellation**
   - Click the **"Deny"** button
   - Optionally provide a reason for denial
   - Confirm your decision
   - Booking remains confirmed
   - Guest is notified that cancellation was denied
   - Booking status remains "Confirmed"

#### Viewing Booking Details

Each booking card displays comprehensive information:

- **Guest Information**
  - Guest's full name
  - Guest's email (for contact purposes)

- **Booking Dates**
  - Check-in date (formatted clearly)
  - Check-out date (formatted clearly)
  - Number of nights

- **Booking Summary**
  - Number of guests
  - Total booking amount (in Philippine Peso)
  - Booking ID (for reference)

- **Status Information**
  - Current booking status
  - Cancellation reason (if applicable)

#### Notification Badges

At the top of the Bookings page, you'll see notification badges:

- **Pending Approval Badge**: Shows the number of bookings awaiting your approval
- **Cancellation Request Badge**: Shows the number of cancellation requests needing your attention

These badges help you quickly identify bookings that require immediate action.

#### Best Practices for Managing Reservations

1. **Respond Promptly**
   - Review and approve/deny bookings within 24 hours
   - Quick responses improve guest experience
   - Reduces the chance of guest cancellations

2. **Verify Availability**
   - Check your calendar before approving bookings
   - Ensure dates are not double-booked
   - Block dates if needed before approving

3. **Handle Cancellations Fairly**
   - Review cancellation requests carefully
   - Consider guest circumstances
   - Follow platform policies consistently

4. **Keep Records**
   - Note booking IDs for reference
   - Save important guest communication
   - Track cancellation patterns

5. **Communicate with Guests**
   - Use the messaging system to clarify details
   - Confirm check-in instructions
   - Address any questions or concerns

### Messaging Guests

#### Communication

1. **Message Threads**
   - Navigate to "Messages"
   - View all conversations
   - Unread message indicator

2. **Responding to Guests**
   - Reply to guest inquiries
   - Provide check-in instructions
   - Answer questions promptly

3. **Best Practices**
   - Respond within 24 hours
   - Be professional and friendly
   - Provide clear instructions
   - Confirm details before arrival

### How to Create Coupons and Promos

BiyaHele offers two types of discounts: **Coupons** (reusable discount codes) and **Promos** (listing-specific discounts). Both help attract guests and increase bookings.

---

## Creating Coupons

Coupons are reusable discount codes that guests can apply during checkout. They're separate from your listings and can be used across multiple bookings.

#### Accessing the Coupons Section

1. **Navigate to Coupons**
   - Log in to your Host Dashboard
   - Click **"Coupons"** in the sidebar navigation menu
   - You'll see the Coupon Management page with:
     - Statistics dashboard (Total Coupons, Active Coupons, Total Usage, Expired Coupons)
     - List of all your existing coupons
     - "Create Coupon" button

#### Creating a New Coupon

1. **Click "Create Coupon"**
   - Click the **"Create Coupon"** button at the top right
   - A coupon creation modal will open

2. **Fill in Coupon Details**

   **Coupon Name (Code)**
   - Enter a unique discount code (e.g., "SUMMER2024", "WELCOME10")
   - Code will be automatically converted to uppercase
   - Must be unique (cannot duplicate existing codes)
   - Example: "HOLIDAY20"

   **Discount Type**
   - Select from dropdown:
     - **Percentage**: Discount as a percentage (e.g., 10% off)
     - **Fixed Amount**: Fixed discount amount in pesos (e.g., ₱500 off)

   **Discount Value**
   - For Percentage: Enter a number between 0-100 (e.g., 15 for 15% off)
   - For Fixed Amount: Enter the discount amount in pesos (e.g., 500 for ₱500 off)
   - Cannot be zero or negative

   **Usage Limit Per Account**
   - Enter how many times each guest can use this coupon
   - Minimum: 1
   - Example: If set to 3, each guest can use the coupon up to 3 times

   **Minimum Purchase Amount**
   - Set the minimum booking amount required to use this coupon
   - Enter amount in pesos (e.g., 2000)
   - Can be set to 0 for no minimum requirement
   - Example: If set to ₱5,000, coupon only applies to bookings of ₱5,000 or more

   **Description** (Optional)
   - Add a description explaining the coupon offer
   - Helps guests understand the promotion
   - Example: "Summer vacation special - 20% off all bookings"

   **Validity Dates**
   - Click the date range field to open the calendar
   - Select **Start Date**: When the coupon becomes active
   - Select **End Date**: When the coupon expires
   - End date must be after start date
   - Past dates cannot be selected
   - Click **"Apply Dates"** to confirm the date range

3. **Review and Submit**
   - Review all coupon details
   - Ensure all required fields are filled
   - Click **"Create Coupon"** or **"Save"**
   - You'll see a success message: "Coupon created successfully"
   - The coupon will appear in your coupons list

#### Managing Existing Coupons

1. **View Coupon Statistics**
   - **Total Coupons**: Number of all coupons you've created
   - **Active Coupons**: Currently valid and usable coupons
   - **Total Usage**: Combined usage count across all coupons
   - **Expired Coupons**: Coupons that have passed their end date

2. **Edit a Coupon**
   - Find the coupon in your list
   - Click the **Edit** icon (pencil icon) on the coupon card
   - Modify any coupon details
   - Click **"Save"** to update
   - You'll see: "Coupon updated successfully"

3. **Delete a Coupon**
   - Find the coupon you want to delete
   - Click the **"Delete"** button
   - Confirm the deletion
   - Note: This action cannot be undone
   - Coupon will be removed from your list

4. **View Coupon Information**
   Each coupon card displays:
   - **Coupon Name**: The discount code
   - **Type**: Percentage or Fixed Amount
   - **Value**: Discount amount (e.g., "15%" or "₱500")
   - **Usage**: How many times it's been used
   - **Valid Until**: Expiration date
   - **Status**: Active or Expired badge

---

#### Creating Promos (Listing Discounts)

Promos are discounts attached directly to specific listings. They appear automatically when guests view your listing during the promo period. Unlike coupons, guests don't need to enter a code.

#### When to Create a Promo

Promos are created during the listing creation or editing process, specifically in **Step 3: Pricing & Details**.

#### Creating a Promo During Listing Creation

1. **Start Creating or Editing a Listing**
   - Click **"Create Listing"** from the header or dashboard
   - Or edit an existing listing
   - Navigate through the listing creation steps

2. **Reach Step 3: Pricing & Details**
   - After completing Steps 1 (Category) and 2 (Location & Basic Info)
   - You'll see the "Pricing & Details" step
   - Scroll down to find the **"Discount (Optional)"** section

3. **Fill in Promo Details**

   **Discount Name**
   - Enter a descriptive name for your promotion
   - Examples: "Xmas Sale", "Early Bird Special", "Summer Sale"
   - This name appears to guests viewing your listing

   **Discount Percentage**
   - Enter a percentage between 0-100
   - Example: Enter "20" for 20% off
   - This percentage is deducted from the final booking price
   - Note: Cannot exceed 100%

   **Discount Date Range**
   - Click the date range button to open the calendar picker
   - **Select Start Date**: Click the first date when the discount becomes active
   - **Select End Date**: Click the last date when the discount expires
   - Selected dates will be highlighted
   - You can navigate between months using arrow buttons
   - Past dates are disabled (grayed out)
   - Click **"Apply Dates"** to confirm
   - Or click **"Clear"** to remove selected dates

   **Discount Description** (Optional)
   - Add a description explaining the promotion
   - Helps guests understand the offer
   - Example: "Book now and save 20% on your summer vacation!"

4. **Save Your Promo**
   - The discount is saved as part of your listing
   - Continue with the remaining listing creation steps
   - Or click **"Save & Exit"** to save as draft
   - The promo will be active once the listing is published

#### How Promos Work

- **Automatic Application**: Promos apply automatically during the specified date range
- **No Code Required**: Guests don't need to enter any code
- **Visible to Guests**: The discount appears on your listing page
- **Date-Based**: Only active during the selected date range
- **Listing-Specific**: Each listing can have its own promo

#### Editing Promos

1. **Edit an Existing Listing**
   - Go to **"Listings"** in your sidebar
   - Click **"Edit"** on the listing you want to modify
   - Navigate to **Step 3: Pricing & Details**
   - Scroll to the **"Discount (Optional)"** section
   - Modify any discount details
   - Save your changes

2. **Remove a Promo**
   - Edit the listing
   - Go to Step 3: Pricing & Details
   - Clear the discount name and percentage
   - Or use the "Clear" button in the date picker
   - Save your changes

#### Best Practices for Coupons and Promos

1. **Create Clear Names**
   - Use descriptive, memorable names
   - Make it easy for guests to understand the offer

2. **Set Realistic Discounts**
   - Consider your profit margins
   - Don't set discounts too high (e.g., avoid 100% off)
   - Typical discounts range from 10-30%

3. **Plan Date Ranges**
   - Align promos with seasons or holidays
   - Set end dates to create urgency
   - Avoid overlapping conflicting promotions

4. **Monitor Usage**
   - Check coupon usage statistics regularly
   - See which promotions are most effective
   - Adjust strategies based on performance

5. **Combine Strategies**
   - Use coupons for general promotions
   - Use listing promos for specific properties
   - Create seasonal campaigns

6. **Test Different Offers**
   - Try different discount percentages
   - Test various date ranges
   - Analyze which promotions drive more bookings

### Payments & Earnings

#### Viewing Earnings

1. **Navigate to Payments & Earnings**
   - See total earnings
   - View transaction history
   - Check pending payouts

2. **Earnings Breakdown**
   - Booking revenue
   - Service fees (deducted)
   - Net earnings
   - Pending payouts

#### How to Request Cash-Out (Withdraw from E-Wallet)

1. **Access Wallet**
   - Navigate to **"Payments & Earnings"** from the host sidebar menu
   - Or go to **"Wallet"** section
   - You'll see your current wallet balance

2. **Initiate Cash-Out Request**
   - Click the **"Request Cash Out"** button (Credit Card icon)
   - A cash-out modal will open

3. **Enter Cash-Out Details**
   - **PayPal Email**: Enter your PayPal email address
     - This is where the funds will be sent
     - Make sure the email is correct and associated with an active PayPal account
     - Example: yourname@email.com
   
   - **Amount**: Enter the amount you want to withdraw
     - Default amount is usually ₱500
     - You can change this amount
     - Minimum withdrawal amount may apply (check platform for current minimum)
     - Maximum is your current wallet balance
     - You cannot withdraw more than your available balance

4. **Submit Cash-Out Request**
   - Review your PayPal email and amount
   - Click **"Submit"** or **"Request Cash Out"** button
   - Your request will be submitted for admin review

5. **Request Status**
   - After submission, your request status will be **"Pending"**
   - You'll see the pending cash-out in your transaction history
   - Transaction type will show as "Cash out"
   - Status badge will be yellow (Pending)

6. **Admin Review Process**
   - An administrator will review your cash-out request
   - Review typically takes 2-3 business days
   - Admin will verify:
     - Your account balance
     - PayPal email validity
     - Requested amount

7. **Approval and Processing**
   - If approved:
     - Status changes to **"Approved"** or **"Completed"**
     - Funds are transferred to your PayPal account
     - PayPal fees (3.4% + ₱15) are deducted from the payout amount
     - The full requested amount is deducted from your wallet
     - You'll receive a notification
   - If denied:
     - Status changes to **"Rejected"** or **"Cancelled"**
     - You'll receive a notification with reason
     - Funds remain in your wallet

8. **Check PayPal Account**
   - After approval, check your PayPal account
   - Funds should appear within 1-2 business days
   - The amount received will be less PayPal fees

#### Understanding Cash-Out Fees

1. **PayPal Fees**
   - PayPal charges a fee for each payout:
     - **Percentage Fee**: 3.4% of the payout amount
     - **Fixed Fee**: ₱15 per transaction
   - Example: For ₱1,000 withdrawal:
     - PayPal fees: (₱1,000 × 3.4%) + ₱15 = ₱49
     - Amount received: ₱1,000 - ₱49 = ₱951
     - Wallet deduction: ₱1,000 (full requested amount)

2. **Net Amount Received**
   - The amount you receive in PayPal = Requested Amount - PayPal Fees
   - Fees are deducted from the payout, not from your wallet
   - Your wallet is debited the full requested amount

#### Viewing Cash-Out History

1. **Transaction History**
   - Go to **"Wallet"** section
   - Scroll to **"Transaction History"**
   - Filter by **"Cash out"** to see only withdrawal transactions

2. **Transaction Details**
   - Each cash-out transaction shows:
     - Date and time of request
     - Amount requested
     - PayPal email used
     - Current status (Pending/Approved/Cancelled)
     - Transaction ID

3. **Status Tracking**
   - **Pending**: Awaiting admin approval
   - **Approved/Completed**: Funds sent to PayPal
   - **Cancelled/Rejected**: Request denied

#### Payout Requirements

1. **Minimum Balance**
   - You must have sufficient balance in your wallet
   - Minimum withdrawal amount may apply
   - Check platform for current minimum requirements

2. **Completed Bookings**
   - Funds from completed bookings are available for withdrawal
   - Pending bookings do not contribute to withdrawable balance

3. **Valid PayPal Account**
   - You must provide a valid PayPal email address
   - The PayPal account must be active and verified
   - Ensure the email is correct to avoid payment issues

#### Best Practices for Cash-Out

1. **Verify PayPal Email**
   - Double-check your PayPal email before submitting
   - Use an email associated with a verified PayPal account
   - Ensure the account can receive payments

2. **Plan Withdrawals**
   - Consider PayPal fees when deciding withdrawal amounts
   - Larger withdrawals may be more cost-effective (same fixed fee)
   - Don't withdraw too frequently to minimize fees

3. **Monitor Status**
   - Check transaction history regularly
   - Follow up if approval takes longer than expected
   - Contact support if you have concerns

4. **Keep Records**
   - Save transaction confirmations
   - Keep records of PayPal receipts
   - Track withdrawal history for accounting

#### Troubleshooting Cash-Out Issues

1. **Request Not Appearing**
   - Refresh the page
   - Check transaction history
   - Contact support if issue persists

2. **PayPal Payment Not Received**
   - Wait 1-2 business days after approval
   - Check your PayPal account activity
   - Verify the email address was correct
   - Contact PayPal support if needed

3. **Request Denied**
   - Review the reason provided
   - Verify your PayPal email is correct
   - Ensure you have sufficient balance
   - Contact admin support for clarification

### Points and Rewards

The Points and Rewards system allows hosts to earn points through various hosting activities and redeem them for cash rewards that are added directly to their e-wallet.

#### How Hosts Earn Points

Hosts can earn points through the following activities:

1. **For Every Listing** 🏠
   - **Points**: +10 points per listing
   - **How it works**: You earn 10 points for each active, published listing you create
   - **Example**: If you have 5 active listings, you earn 50 points
   - **Note**: Only active/published listings count toward points

2. **For Every Star in Reviews** ⭐
   - **Points**: +2 points per star
   - **How it works**: For each star rating your listings receive, you earn 2 points
   - **Example**: If a listing has a 4.5-star average with 10 reviews:
     - Total stars: 4.5 × 10 = 45 stars
     - Points earned: 45 × 2 = 90 points
   - **Note**: Points are calculated based on total stars across all your listings

3. **For Every 1st Booking in a Listing** 🎯
   - **Points**: +10 points per first booking
   - **How it works**: When a listing receives its first booking, you earn 10 points
   - **Example**: If 3 of your listings get their first booking, you earn 30 points
   - **Note**: Only the first booking per listing counts (not subsequent bookings)

4. **Receive 2 Bookings in a Single Day** 📅
   - **Points**: +10 points per occurrence
   - **How it works**: If you receive 2 or more bookings on the same day, you earn 10 points
   - **Example**: If you get 3 bookings on January 15th, you earn 10 points (not 10 per booking)
   - **Note**: This is a daily bonus, not per booking

#### Understanding Point Calculation

1. **Automatic Calculation**
   - Points are calculated automatically based on your hosting activity
   - The system recalculates points when:
     - You create or publish a new listing
     - Your listings receive reviews
     - Your listings receive bookings
   - Points update in real-time

2. **Point Accumulation**
   - Points accumulate over time
   - You don't lose points (unless redeemed)
   - Points are tied to your host account
   - Points persist across all your listings

3. **Viewing Your Points**
   - Navigate to **"Points & Rewards"** in your host dashboard
   - Your current point balance is displayed at the top
   - Points are shown as a number (e.g., "250 points")

#### Available Rewards for Redemption

Hosts can redeem points for cash rewards. The available redemption options are:

1. **100 Points = ₱99**
   - Minimum redemption option
   - Good for smaller rewards
   - Best for hosts with fewer points

2. **300 Points = ₱320**
   - Medium redemption option
   - Better value per point (1.07 pesos per point)
   - Recommended for regular redemptions

3. **500 Points = ₱550**
   - Maximum redemption option
   - Best value per point (1.10 pesos per point)
   - Most cost-effective option

#### How to Redeem Rewards

1. **Access Points & Rewards**
   - Navigate to **"Points & Rewards"** from your host dashboard sidebar
   - You'll see three sections:
     - **Earn Points**: Shows how to earn points
     - **Marketplace**: Shows available rewards
     - **Transactions**: Shows redemption history

2. **View Available Rewards**
   - Click on the **"Marketplace"** tab
   - You'll see the three reward options displayed as cards
   - Each card shows:
     - Required points
     - Cash reward amount
     - "Redeem" button

3. **Select a Reward**
   - Choose the reward you want to redeem
   - Make sure you have enough points
   - The "Redeem" button will be disabled if you don't have enough points

4. **Confirm Redemption**
   - Click the **"Redeem"** button on your chosen reward
   - A confirmation dialog will appear
   - Review the details:
     - Points to be deducted
     - Cash amount to be added to wallet
   - Click **"Confirm"** to proceed

5. **Redemption Processing**
   - Points are deducted from your account immediately
   - Cash is added directly to your e-wallet
   - You'll see a success message: **"You Successfully Redeem the Rewards and it is added to your wallet."**
   - Your point balance updates immediately
   - Your wallet balance increases by the reward amount

6. **Verify Redemption**
   - Check your updated point balance
   - Check your wallet balance to confirm cash was added
   - View the transaction in the **"Transactions"** tab
   - Transaction type will show as "Reward" or "Points Redeemed"

#### Viewing Redemption History

1. **Access Transaction History**
   - Click on the **"Transactions"** tab in Points & Rewards
   - You'll see all your reward redemption transactions

2. **Transaction Details**
   - Each transaction shows:
     - Date and time of redemption
     - Points redeemed
     - Cash amount received
     - Transaction status

3. **Filter Transactions**
   - Transactions are automatically filtered to show only reward redemptions
   - You can also view these in your main Wallet transaction history

#### Tips for Maximizing Points

1. **Create Multiple Listings**
   - Each active listing earns 10 points
   - More listings = more points
   - Keep listings active and published

2. **Encourage Reviews**
   - More reviews = more stars = more points
   - Provide excellent service to get positive reviews
   - Respond to guest feedback

3. **Optimize for First Bookings**
   - Focus on getting first bookings for new listings
   - Each first booking earns 10 points
   - Promote new listings to get initial bookings

4. **Strategic Redemption**
   - Save points for the 500-point reward (best value)
   - Redeem when you need cash in your wallet
   - Don't let points accumulate unnecessarily

#### Best Practices

1. **Regular Monitoring**
   - Check your points balance regularly
   - Monitor how points are earned
   - Track redemption history

2. **Plan Redemptions**
   - Redeem when you need cash for payouts
   - Consider saving for larger rewards (better value)
   - Time redemptions with cash-out requests

3. **Maximize Earnings**
   - Keep all listings active
   - Provide excellent service for good reviews
   - Promote listings to get bookings

4. **Record Keeping**
   - Keep track of point earnings
   - Save redemption confirmations
   - Monitor transaction history

### Host Rules Compliance

#### Policy Compliance

1. **View Rules**
   - Access from dashboard
   - Review platform policies
   - Understand requirements

2. **Compliance Status**
   - Check compliance score
   - Address any violations
   - Maintain good standing

---

## Admin Guide

### Admin Dashboard

#### Overview

The Admin Dashboard provides comprehensive platform management tools.

#### Navigation

- **Dashboard Overview**: Platform statistics and metrics
- **Cash Out Approval**: Review and approve host payout requests
- **Wishlist**: View platform wishlist analytics
- **Termination Appeals**: Handle account termination appeals
- **Service Fees**: Manage platform service fees
- **Policy & Compliance**: Platform policies and compliance
- **User Management**: Manage all user accounts

### Dashboard Overview

#### Key Metrics

- Total users (guests, hosts, admins)
- Active listings
- Total bookings
- Revenue statistics
- Platform growth metrics

#### Reports

- Generate financial reports
- User activity reports
- Listing performance reports
- Export data for analysis

### Report Generation

The Report Generation feature allows administrators to create comprehensive PDF reports on various aspects of platform activity, including financial performance, user statistics, and listing analytics.

#### Accessing Report Generation

1. **Navigate to Report Generation**
   - Log in to your admin account
   - Go to the Admin Dashboard Overview
   - Scroll down to find the **"Report Generation"** section
   - It appears below the Transaction History section

2. **Understanding Report Types**
   - The section offers three types of reports:
     - **Financial Report**: Revenue, earnings, and financial analytics
     - **User Report**: User statistics and demographics
     - **Listing Performance Report**: Listing analytics and performance metrics

#### Generating Financial Reports

1. **Open Financial Report**
   - Click the **"Generate Financial Report"** button
   - A modal will open with financial report options

2. **Select Date Range (Optional)**
   - Click the calendar icon or date range button
   - A calendar picker will appear
   - **Select Start Date**: Click the first date of your desired range
   - **Select End Date**: Click the last date of your desired range
   - Selected dates will be highlighted
   - Click **"Apply Dates"** to confirm
   - Click **"Clear"** to remove date selection
   - **Note**: If no date range is selected, the report includes all-time data

3. **View Financial Report**
   - The modal displays comprehensive financial data:
     - **Revenue Summary**: Total revenue, gross revenue, net revenue
     - **Service Fees**: Total service fees collected
     - **Host Payouts**: Total amount paid to hosts
     - **Revenue Trends**: Charts showing revenue over time
     - **Transaction Breakdown**: Detailed transaction statistics

4. **Download Financial Report as PDF**
   - Click the **"Download PDF"** button in the modal
   - The system will generate a PDF file with all financial data
   - PDF includes:
     - Report header with date range
     - Financial summary statistics
     - Revenue charts and graphs
     - Detailed transaction breakdowns
     - Professional formatting for business use

5. **Print Financial Report**
   - Use your browser's print function (Ctrl+P or Cmd+P)
   - Or click print from the PDF viewer
   - Adjust print settings as needed

#### Generating User Reports

1. **Open User Report**
   - Click the **"Generate User Report"** button
   - A modal will open displaying user statistics

2. **View User Report**
   - The modal shows comprehensive user data:
     - **User Summary**: Total users, guests, hosts, admins
     - **User Growth**: Charts showing user growth over time
     - **User Table**: Detailed list of all users with:
       - User ID
       - Full Name
       - Email Address
       - Role (Guest/Host/Admin)
       - Registration Date
       - Account Status
     - **User Statistics**: Breakdown by role and status

3. **Navigate User Table**
   - The user table is paginated
   - Use pagination controls to view all users
   - Scroll through the table to see all user details

4. **Download User Report as PDF**
   - Click the **"Download PDF"** button
   - The system will generate a PDF with all user data
   - PDF includes:
     - User summary statistics
     - User growth charts
     - Complete user table with all entries
     - Multiple pages if needed (automatically paginated)

5. **Print User Report**
   - Use your browser's print function
   - The PDF is formatted in landscape orientation for better table viewing

#### Generating Listing Performance Reports

1. **Open Listing Performance Report**
   - Click the **"Generate Listing Performance Report"** button
   - A modal will open with listing analytics

2. **View Listing Performance Report**
   - The modal displays comprehensive listing data:
     - **Summary Statistics**:
       - Total Listings
       - Active Listings
       - Total Bookings
       - Total Revenue
       - Average Rating
     - **Top Performing Listings**: Table showing:
       - Listing Title
       - Host Name
       - Number of Bookings
       - Total Revenue
       - Average Rating
       - Reviews Count
     - **Listing Details**: Complete list of all listings with performance metrics

3. **Analyze Performance Data**
   - Review top listings to identify successful properties
   - Check booking counts and revenue per listing
   - Analyze average ratings and review counts
   - Identify trends in listing performance

4. **Download Listing Performance Report as PDF**
   - Click the **"Download PDF"** button
   - The system will generate a PDF with all listing data
   - PDF includes:
     - Summary statistics
     - Top performing listings table
     - Complete listing performance data
     - Professional formatting

5. **Print Listing Performance Report**
   - Use your browser's print function
   - The report is formatted for standard printing

#### Report Features

1. **Date Range Filtering** (Financial Reports)
   - Select specific date ranges to analyze periods
   - Compare performance across different timeframes
   - Generate monthly, quarterly, or annual reports

2. **Comprehensive Data**
   - All reports include detailed statistics
   - Charts and graphs for visual analysis
   - Tables with complete data sets

3. **PDF Export**
   - All reports can be exported as PDF files
   - PDFs are professionally formatted
   - Suitable for sharing with stakeholders
   - Can be archived for record-keeping

4. **Print-Ready Format**
   - Reports are formatted for printing
   - Proper page breaks and margins
   - Clear headers and footers
   - Professional appearance

#### Best Practices for Report Generation

1. **Regular Reporting**
   - Generate reports weekly or monthly for regular monitoring
   - Create quarterly and annual reports for comprehensive analysis
   - Keep historical reports for trend analysis

2. **Date Range Selection**
   - Use specific date ranges for focused analysis
   - Compare periods to identify trends
   - Generate reports for specific events or campaigns

3. **Data Analysis**
   - Review all sections of each report
   - Identify patterns and trends
   - Use data to make informed decisions
   - Share insights with relevant stakeholders

4. **Record Keeping**
   - Download and save PDF reports regularly
   - Organize reports by date and type
   - Keep reports for compliance and auditing purposes

5. **Sharing Reports**
   - Share financial reports with finance team
   - Share user reports for marketing insights
   - Share listing performance reports with hosts (if applicable)

### Cash Out Approval

#### Reviewing Requests

1. **View Pending Requests**
   - See all host payout requests
   - Review request details:
     - Host information
     - Requested amount
     - Account balance
     - Transaction history

2. **Approve/Deny**
   - **Approve**: Process payout to host's PayPal
   - **Deny**: Reject with reason
   - Add notes for record-keeping

3. **Processing**
   - Approved payouts processed automatically
   - Host receives notification
   - Transaction recorded

### How to See the Transaction History (Admin)

The Transaction History section provides administrators with a comprehensive view of all platform transactions, including guest cash-ins, refunds, host payouts, and service fees.

#### Accessing Transaction History

1. **Navigate to Admin Dashboard**
   - Log in to your admin account
   - The Transaction History section is displayed directly on the Dashboard Overview page
   - It appears below the revenue charts and analytics

2. **Understanding the Transaction History View**
   - The section shows all platform transactions in a chronological list
   - Transactions are sorted by date (newest first)
   - Each transaction displays:
     - Date and time
     - Description of the transaction
     - Account type (Guest, Host, or Admin)
     - Transaction type
     - Amount (in Philippine Peso)
     - Status (Completed, Pending, Cancelled)

#### Filtering Transactions

1. **Filter by Account Type**
   - Use the "Account" dropdown filter
   - Options:
     - **All**: Shows all transactions
     - **Guests**: Shows only guest transactions (cash-ins and refunds)
     - **Hosts**: Shows only host transactions (cash-out requests and payouts)
     - **Admin**: Shows only admin transactions (service fees)

2. **Filter by Status**
   - Use the "Status" dropdown filter
   - Options:
     - **All**: Shows all transaction statuses
     - **Completed**: Shows completed transactions
     - **Pending**: Shows pending transactions (e.g., pending cash-out requests)
     - **Cancelled**: Shows cancelled or rejected transactions

3. **Clear Filters**
   - Click the "Clear Filters" button (X icon) to reset all filters
   - This will show all transactions again

#### Understanding Transaction Types

The Transaction History displays different types of transactions:

- **Guest Transactions**:
  - **Cash In Tracking**: Guest top-up transactions via PayPal
  - **Booking Refund**: Refunds issued to guests for cancelled bookings

- **Host Transactions**:
  - **PayPal payout to host**: Completed cash-out requests sent to host's PayPal
  - **Pending PayPal payout to host**: Cash-out requests awaiting admin approval

- **Admin Transactions**:
  - **Service Fee (Guest)**: Service fees collected from guest bookings
  - **Host Service Fee**: Service fees collected from host bookings

#### Viewing Transaction Details

1. **Transaction Cards**
   - Each transaction is displayed in a card format
   - Cards show:
     - Transaction date and time
     - Description
     - Account type badge (Guest/Host/Admin)
     - Transaction type badge
     - Amount (with + for credits, - for debits)
     - Status badge (color-coded)

2. **Status Badge Colors**
   - **Green (Completed)**: Transaction successfully processed
   - **Yellow (Pending)**: Transaction awaiting approval or processing
   - **Red (Cancelled)**: Transaction was cancelled or rejected

#### Printing Transaction History

1. **Generate Print Report**
   - Click the **"Print Transaction"** button (Printer icon) at the top right
   - A print modal will open showing a formatted transaction report

2. **Print Modal Features**
   - The modal displays:
     - Transaction summary statistics
     - Total completed transactions count and amount
     - Total cancelled transactions count and amount
     - Total pending transactions count and amount
     - Date range of transactions
     - Paginated transaction list

3. **Download as PDF**
   - In the print modal, click the **"Download PDF"** button
   - The system will generate a PDF file with all transaction details
   - PDF includes:
     - Report header with date range
     - Summary statistics
     - Complete transaction list with all details
     - Pagination for multiple pages

4. **Print Options**
   - Use your browser's print function (Ctrl+P or Cmd+P)
   - Select your printer or save as PDF
   - Adjust print settings as needed

#### Pagination

- Transactions are displayed in pages (5 transactions per page by default)
- Use pagination controls to navigate between pages
- The page indicator shows: "Showing X-Y of Z transactions"

#### Best Practices

1. **Regular Monitoring**
   - Check transaction history regularly to monitor platform activity
   - Review pending transactions daily to ensure timely processing

2. **Filter Usage**
   - Use filters to focus on specific transaction types or accounts
   - Filter by status to quickly identify pending actions

3. **Record Keeping**
   - Download PDF reports regularly for record-keeping
   - Export transaction data for accounting purposes

4. **Verification**
   - Verify transaction amounts match expected values
   - Check that service fees are calculated correctly
   - Ensure refunds are processed according to policies

### User Management

#### Managing Users

1. **View All Users**
   - Search users by email, name, or ID
   - Filter by role (guest, host, admin)
   - View user profiles

2. **User Actions**
   - **Suspend**: Temporarily disable account
   - **Terminate**: Permanently remove account
   - **Change Role**: Modify user role
   - **View Activity**: Check user activity log

3. **User Details**
   - Profile information
   - Booking history
   - Payment history
   - Compliance status

### Termination Appeals

#### Handling Appeals

1. **View Appeals**
   - See all termination appeals
   - Review appeal details
   - Check original termination reason

2. **Review Process**
   - Read appeal submission
   - Review user history
   - Check compliance record

3. **Decision**
   - **Approve**: Reinstate account
   - **Deny**: Uphold termination
   - Add notes explaining decision

### Service Fees

#### Managing Fees

1. **View Current Fees**
   - Platform service fee percentage
   - Transaction fees
   - Host fees

2. **Update Fees**
   - Modify service fee rates
   - Set different fees for different listing types
   - Apply changes (affects future bookings)

### How to Configure Policy & Compliance

The Policy & Compliance section allows administrators to configure platform rules, refund policies, payment methods, and other compliance settings that govern how the platform operates.

#### Accessing Policy & Compliance

1. **Navigate to Policy & Compliance**
   - Log in to your admin account
   - Click **"Policy & Compliance"** in the admin sidebar navigation menu
   - You'll see the Policy & Compliance configuration page

2. **Understanding the Dashboard**
   - Quick stats cards showing current policy values:
     - Cancellation Period (hours)
     - Refund Window (hours)
     - Processing Time (days)
     - Max Images per listing

#### Configuring Platform Rules

1. **Cancellation Period**
   - **Setting**: Hours before check-in for free cancellation
   - **How to Configure**:
     - Locate the "Cancellation Period (hours)" field in the Platform Rules section
     - Enter the number of hours (e.g., 24 for 24 hours)
     - Default: 24 hours
   - **What it does**: Determines how many hours before check-in guests can cancel for free

2. **Refund Window**
   - **Setting**: Hours after booking confirmation for refund eligibility
   - **How to Configure**:
     - Locate the "Refund Window (hours)" field
     - Enter the number of hours (e.g., 24 for 24 hours)
     - Default: 24 hours
   - **What it does**: Sets the time window after booking when refunds are allowed

3. **Max Images**
   - **Setting**: Maximum number of images allowed per listing
   - **How to Configure**:
     - Locate the "Max Images" field
     - Enter the maximum number (e.g., 8)
     - Default: 8 images
   - **What it does**: Limits how many photos hosts can upload per listing

4. **Review Limit**
   - **Setting**: Number of days after stay when reviews can be submitted
   - **How to Configure**:
     - Locate the "Review Limit (days)" field
     - Enter the number of days (e.g., 30)
     - Default: 30 days
   - **What it does**: Sets the time limit for submitting reviews after a completed stay

#### Configuring PayPal Fees

1. **PayPal Fee Percentage**
   - **Setting**: Percentage fee charged by PayPal (e.g., 3.4%)
   - **How to Configure**:
     - Locate the "PayPal Fee Percentage" field in the PayPal Fees section
     - Enter the percentage (e.g., 3.4 for 3.4%)
     - Default: 3.4%
   - **What it does**: Used to calculate PayPal transaction fees

2. **PayPal Fixed Fee**
   - **Setting**: Fixed fee amount in pesos charged by PayPal
   - **How to Configure**:
     - Locate the "PayPal Fixed Fee" field
     - Enter the amount in pesos (e.g., 15)
     - Default: ₱15
   - **What it does**: Fixed fee added to PayPal transactions

#### Configuring Refund Policy

1. **Refundable Hours**
   - **Setting**: Hours after booking when full refund is available
   - **How to Configure**:
     - Locate the "Refundable Hours" field in the Refund Policy section
     - Enter the number of hours (e.g., 24)
     - Default: 24 hours
   - **What it does**: Determines the time window for full refunds

2. **Minimum Refund Amount**
   - **Setting**: Minimum amount in pesos for refund processing
   - **How to Configure**:
     - Locate the "Minimum Refund Amount" field
     - Enter the minimum amount (e.g., 50)
     - Default: ₱50
   - **What it does**: Sets the minimum refund threshold

3. **Refund Processing Days**
   - **Setting**: Number of days to process refunds
   - **How to Configure**:
     - Locate the "Refund Processing Days" field
     - Enter number of days (1-30)
     - Default: 3 days
   - **What it does**: Sets the expected processing time for refunds

4. **Enable Refunds**
   - **Setting**: Toggle to enable/disable refund functionality
   - **How to Configure**:
     - Check or uncheck the "Enable Refunds" checkbox
     - Default: Enabled
   - **What it does**: Controls whether refunds are allowed on the platform

5. **Auto Approve Refunds**
   - **Setting**: Automatically approve refund requests
   - **How to Configure**:
     - Check or uncheck the "Auto Approve Refunds" checkbox
     - Default: Disabled (manual approval required)
   - **What it does**: If enabled, refunds are processed automatically without admin review

#### Configuring Payment Methods

1. **E-Wallet Payment**
   - **Setting**: Enable or disable e-wallet payment method
   - **How to Configure**:
     - Check or uncheck the "E-Wallet Payment" checkbox in the Payment Methods section
     - Default: Enabled
   - **What it does**: Allows users to pay using their e-wallet balance

2. **PayPal Payment**
   - **Setting**: Enable or disable PayPal payment method
   - **How to Configure**:
     - Check or uncheck the "PayPal Payment" checkbox
     - Default: Enabled
   - **What it does**: Allows users to pay directly via PayPal
   - **Note**: At least one payment method must be enabled

#### Configuring Processing Settings

1. **Email Notification**
   - **Setting**: Enable email notifications for policy-related events
   - **How to Configure**:
     - Check or uncheck the "Email Notification" checkbox
     - Default: Enabled
   - **What it does**: Sends email notifications for refunds, cancellations, etc.

#### Saving Policy Changes

1. **Save Refund Policy**
   - After configuring refund settings, click **"Save Refund Policy"** button
   - Changes to refund-related settings will be saved
   - You'll see a confirmation: "Settings saved successfully!"

2. **Save Payment Methods**
   - After configuring payment method settings, click **"Save Payment Methods"** button
   - Changes to payment method settings will be saved
   - **Important**: At least one payment method must remain enabled

3. **Save All Settings**
   - For other policy changes, click the appropriate save button
   - All changes are saved to the database immediately

#### Resetting to Defaults

1. **Reset All Settings**
   - Click the **"Reset to Defaults"** button (RotateCcw icon)
   - This will restore all policy settings to their default values:
     - Cancellation Period: 24 hours
     - Refund Window: 24 hours
     - Processing Time: 3 days
     - Max Images: 8
     - Review Limit: 30 days
     - PayPal Fee Percentage: 3.4%
     - PayPal Fixed Fee: ₱15
     - Refundable Hours: 24
     - Minimum Refund Amount: ₱50
     - Refund Processing Days: 3
     - Enable Refunds: Enabled
     - Email Notification: Enabled
     - Auto Approve Refunds: Disabled
     - E-Wallet Payment: Enabled
     - PayPal Payment: Enabled

2. **Confirm Reset**
   - After resetting, you must click the appropriate save button to apply defaults
   - Review the reset values before saving

#### Printing Policy & Compliance Contract

1. **Generate Policy Contract**
   - Click the **"Print Policy Contract"** button (Printer icon) at the top right
   - A print modal will open displaying the complete policy contract

2. **Print Modal Contents**
   - The modal shows a formatted document including:
     - Policy header and date
     - Platform Rules section with all configured values
     - PayPal Fees configuration
     - Refund Policy details
     - Payment Methods settings
     - Processing Settings
     - All current policy values and settings

3. **Download as PDF**
   - In the print modal, click the **"Download PDF"** button
   - The system will generate a PDF file with the complete policy contract
   - PDF includes:
     - Professional formatting
     - All policy configurations
     - Current date and time
     - Complete policy document ready for distribution

4. **Print Options**
   - Use your browser's print function (Ctrl+P or Cmd+P)
   - Select your printer or save as PDF
   - Adjust print settings (margins, orientation, etc.)
   - The document is formatted for standard letter-size paper

5. **Sharing Policy Contract**
   - Download the PDF to share with stakeholders
   - Use for documentation and compliance purposes
   - Keep records of policy changes over time

#### Best Practices

1. **Review Before Saving**
   - Always review policy changes before saving
   - Consider the impact on existing bookings and users
   - Test changes in a staging environment if possible

2. **Document Changes**
   - Print or download policy contracts after making changes
   - Keep records of when policies were updated
   - Notify users of significant policy changes

3. **Balance Flexibility and Protection**
   - Set refund windows that protect both guests and hosts
   - Ensure cancellation periods are reasonable
   - Consider seasonal adjustments if needed

4. **Regular Updates**
   - Review policies quarterly or as needed
   - Update based on user feedback and platform performance
   - Keep policies aligned with industry standards

5. **Compliance Monitoring**
   - Monitor how policies affect user behavior
   - Track refund rates and cancellation patterns
   - Adjust policies based on data and feedback

---

## Troubleshooting

### Common Issues

#### Login Problems

**Issue**: Cannot log in
- **Solution**: 
  - Verify email and password
  - Check if account is verified
  - Use "Forgot Password" if needed
  - Clear browser cache

**Issue**: OTP not received
- **Solution**:
  - Check spam folder
  - Request new OTP
  - Verify email address is correct
  - Wait a few minutes before requesting again

#### Booking Issues

**Issue**: Cannot complete booking
- **Solution**:
  - Check payment method
  - Verify dates are available
  - Ensure guest count is within limits
  - Try different browser
  - Make sure check-in and check-out dates are selected

**Issue**: Booking not showing
- **Solution**:
  - Refresh page
  - Check "Bookings" section
  - Verify payment was successful
  - Contact support if issue persists

#### Payment Issues

**Issue**: Payment failed
- **Solution**:
  - Verify PayPal account
  - Check account balance
  - Try different payment method
  - Contact PayPal support

**Issue**: Wallet cash-in failed
- **Solution**:
  - Verify PayPal account credentials
  - Check PayPal account balance
  - Ensure minimum amount is met
  - Try again after a few minutes
  - Contact support if issue persists

**Issue**: Refund not received
- **Solution**:
  - Check cancellation policy
  - Allow 5-7 business days
  - Contact support with booking ID

#### Listing Issues

**Issue**: Listing not appearing in search
- **Solution**:
  - Verify listing is published
  - Check dates are available
  - Ensure all required fields are filled
  - Wait a few minutes for indexing

**Issue**: Cannot upload photos
- **Solution**:
  - Check file size (max 10MB)
  - Verify file format (JPG, PNG)
  - Try different browser
  - Clear browser cache

#### Messaging Issues

**Issue**: Messages not sending
- **Solution**:
  - Check internet connection
  - Refresh page
  - Try again in a few minutes

**Issue**: Not receiving message notifications
- **Solution**:
  - Check notification settings
  - Verify email notifications enabled
  - Check spam folder

### Getting Help

#### Contact Support

1. **Email Support**
   - Send email to support@biyahele.com
   - Include:
     - Your account email
     - Description of issue
     - Screenshots if applicable
     - Booking/transaction IDs if relevant

2. **In-App Support**
   - Use "Help" or "Contact Support" in settings
   - Submit support ticket
   - Receive response within 24-48 hours

3. **Emergency Support**
   - For urgent booking issues
   - Contact during business hours
   - Provide booking reference number

---

## FAQs

### General Questions

**Q: What is BiyaHele?**
A: BiyaHele is a vacation rental and accommodation booking platform connecting travelers with unique stays, experiences, and services in the Philippines.

**Q: Is BiyaHele free to use?**
A: Yes, creating an account and browsing listings is free. Service fees apply to bookings.

**Q: What payment methods are accepted?**
A: Currently, BiyaHele uses PayPal for all transactions.

**Q: Is my payment information secure?**
A: Yes, all payments are processed through PayPal's secure payment system. BiyaHele does not store your payment details.

### Guest Questions

**Q: How do I cancel a booking?**
A: Go to "Bookings", select your reservation, and click "Cancel Booking". Refund depends on cancellation policy.

**Q: Can I modify my booking dates?**
A: You'll need to cancel and rebook. Contact the host first to check availability.

**Q: What if I have a problem during my stay?**
A: Contact your host immediately through the messaging system. For urgent issues, contact support.

**Q: How do reviews work?**
A: After your stay, you can leave a review. Reviews are published immediately and can be edited within 14 days.

**Q: Can I book for someone else?**
A: Yes, but you're responsible for the booking. Ensure the guest information is accurate.

**Q: How do I add money to my wallet?**
A: Go to "Wallet", click "Cash-In" or "Top-up", enter amount, and complete payment through PayPal.

### Host Questions

**Q: How do I become a host?**
A: Contact support to request host status. You'll need to provide identification and business information.

**Q: How much can I earn?**
A: Earnings depend on your listing type, pricing, and booking frequency. Service fees are deducted from each booking.

**Q: When do I get paid?**
A: After a booking is completed, you can request a payout. Admin approval takes 2-3 business days, then funds are transferred to your PayPal.

**Q: Can I block dates?**
A: Yes, use the Calendar & Pricing section to block dates or set special pricing.

**Q: What if a guest damages my property?**
A: Contact support immediately. Document the damage with photos. BiyaHele may assist in resolution.

**Q: How do I handle cancellations?**
A: Review cancellation requests in your Bookings section. Approve or deny based on your policy.

### Technical Questions

**Q: What browsers are supported?**
A: BiyaHele works on Chrome, Firefox, Safari, and Edge. Keep your browser updated.

**Q: Is there a mobile app?**
A: Currently, BiyaHele is web-based and optimized for mobile browsers.

**Q: Why are images loading slowly?**
A: Check your internet connection. Large images may take time to load on slower connections.

**Q: Can I use BiyaHele on multiple devices?**
A: Yes, you can access your account from any device with internet access.

---

## Additional Resources

### Helpful Links

- **Terms of Service**: [Link to Terms]
- **Privacy Policy**: [Link to Privacy Policy]
- **Host Guidelines**: [Link to Guidelines]
- **Safety Tips**: [Link to Safety]

### Tips for Success

#### For Guests:
- Read listings carefully before booking
- Communicate with hosts before and during your stay
- Leave honest reviews to help other travelers
- Respect the property and house rules

#### For Hosts:
- Keep your calendar updated
- Respond to messages promptly
- Provide accurate listing information
- Maintain your property to high standards
- Build your reputation with great reviews

---

## Version Information

**Manual Version**: 1.0  
**Last Updated**: 2024  
**Platform Version**: Current  
**Website URL**: https://biyahele.web.app

---

## Contact Information

**Support Email**: support@biyahele.com  
**Business Hours**: Monday-Friday, 9 AM - 6 PM PHT  
**Emergency Support**: Available for urgent booking issues

---

*Thank you for using BiyaHele! We hope this manual helps you make the most of your experience. For additional assistance, please contact our support team.*
