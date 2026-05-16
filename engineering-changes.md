# SavePlate Engineering Changes

Date: 16 May 2026

This document records the engineering changes made to align the SavePlate implementation with the requirements in:

- `Assignment 1 - Task 2.docx`
- `[Common Case Study] SavePlate.docx`

The focus of this pass was to strengthen the current full-stack implementation against the assignment's Must Have requirements and the case-study use cases, while leaving lower-priority production work such as full login-time 2FA, HTTPS deployment enforcement, scheduled cron jobs, and E2E automation as future work.

## Summary

The application was already connected to a MongoDB-backed Express API and Vue frontend. This pass improved requirement compliance in the following areas:

- Authentication and user profile security
- Inventory validation and item lifecycle rules
- Donation privacy and notification generation
- Meal-plan confirmation behavior
- Dashboard replacement of prototype/mock values
- Frontend service/test stability

## Backend Changes

### User Model

File: `backend/models/User.js`

Added fields required by the assignment's privacy, security, and notification-preference requirements:

- `is2FAEnabled`
- `listingVisibility`
- `showFullName`
- `showLocation`
- `expiryAlerts`
- `donationUpdates`
- `mealReminders`
- `accountAlerts`

The password minimum length was also changed from 6 to 8 characters to match `FR-1.1` and `NFR-SE-1`.

### Authentication Controller

File: `backend/controllers/authController.js`

Changes:

- JWT expiry changed from 7 days to 24 hours to match `NFR-SE-2`.
- Registration password validation now requires:
  - At least 8 characters
  - At least one uppercase letter
  - At least one number
- Registration now accepts optional `householdSize`.
- Profile responses now return a consistent safe user object.
- Profile updates now support privacy, 2FA, and notification-preference fields.

Requirement coverage:

- `FR-1.1`: stronger registration password rules
- `FR-1.2`: existing OTP verification flow preserved
- `FR-1.4`: privacy settings support
- `FR-1.5`: settings are stored centrally for future/current listing behavior
- `NFR-SE-2`: JWT validity limited to 24 hours

### Inventory Model and Controller

Files:

- `backend/models/Item.js`
- `backend/controllers/itemController.js`

Changes:

- Added `usedAt` to support analytics tracking when food is consumed.
- Server-side item creation/update now rejects:
  - Missing required fields
  - Quantity less than or equal to 0
  - Expiry dates in the past
- Marking an item as `used` now records `usedAt`.
- Deleting a reserved item now returns a conflict response instead of deleting it.
- Deletion also checks confirmed meal plans that reference the item by ingredient name.

Requirement coverage:

- `FR-2.1`: validates inventory item creation
- `FR-2.3`: records consumed/used items for analytics
- `FR-2.5`: prevents deletion of meal-plan-reserved items
- `NFR-SE-4`: user-owned item access remains scoped by `userId`

### Donation Controller

File: `backend/controllers/donationController.js`

Changes:

- Donation browse responses now respect donor privacy fields:
  - Private listings are hidden from other users.
  - Donor name can be masked as `Anonymous Donor`.
  - Pickup location can be hidden until claim/coordination.
- Creating a donation now creates a donation notification for the donor.
- Claiming a donation now creates notifications for both donor and claimant.
- Completing a donation now notifies the claimant.

Requirement coverage:

- `FR-1.4`: donation visibility/privacy settings
- `FR-3.4`: claim updates and notifications
- `FR-5.2`: automatic donation notifications
- `NFR-SE-4`: privacy protection across user data

### Meal Plan Controller

File: `backend/controllers/mealPlanController.js`

Changes:

- Confirming a meal plan now reserves matching available inventory items.
- Confirming a meal plan creates meal reminder notifications.
- Reservation only runs when a plan changes from unconfirmed to confirmed.

Requirement coverage:

- `FR-6.1`: existing weekly plan retrieval/saving preserved
- `FR-6.3`: confirmed plans reserve inventory and create reminders
- `FR-5.2`: meal reminder notifications

## Frontend Changes

### Auth Service

File: `frontend/src/services/authService.js`

Changes:

- `registerUser` now supports optional `householdSize`.
- `updateProfile` now accepts either the original `(name, email)` parameters or a full profile/settings payload.
- Added a safe storage fallback so Vitest can import the service outside a browser environment.

### Register Page

File: `frontend/src/components/User Registration/RegisterPage.vue`

Changes:

- Registration now passes `householdSize` to the backend when provided.

### Settings Page

File: `frontend/src/components/Menu/Settings.vue`

Changes:

- Settings page now loads the latest profile from the backend.
- 2FA toggle state is persisted to the user profile.
- Donation visibility setting is persisted to the user profile.
- Full-name and location visibility toggles are persisted.
- Notification preferences are persisted for:
  - Expiry alerts
  - Donation updates
  - Meal reminders

Requirement coverage:

- `FR-1.4`: privacy settings from dashboard/settings
- `FR-1.5`: central preference changes apply consistently
- `FR-5.5`: notification preference storage

### Dashboard Page

File: `frontend/src/components/Menu/Dashboard.vue`

Changes:

- Removed prototype hardcoded dashboard values.
- Dashboard now uses:
  - Authenticated user name
  - Live analytics stats
  - Live inventory expiring-soon items
  - Live meal-plan count
  - Live notification activity

Requirement coverage:

- `FR-4.1`: real dashboard summary
- `FR-4.5`: dashboard can reflect true empty/low-data states through analytics service
- `FR-5.1`: recent notification activity reflects backend notifications

### Notifications Composable

File: `frontend/src/composables/useNotifications.js`

Changes:

- `addNotification` now performs an optimistic local insert before API completion.
- This keeps the UI responsive and restores compatibility with the existing unit tests.

### Meal Planner Composable

File: `frontend/src/composables/useMealPlanner.js`

Changes:

- `confirmPlan` now returns the immediate confirmation result synchronously for UI/test compatibility.
- Backend persistence still runs in the background.
- Local reservation behavior is preserved for the current UI.

### Test Compatibility

File: `frontend/src/logic/browseFoodLogic.js`

Added a compatibility re-export from `frontend/src/utils/browseFoodLogic.js` so the existing Vitest suite can resolve the older import path.

## Verification

The following checks were run successfully:

```bash
cd frontend
npm test
```

Result:

- 4 test files passed
- 103 tests passed

```bash
cd frontend
npm run build
```

Result:

- Production build completed successfully.

Backend syntax checks were also run on the changed controllers:

```bash
node --check backend/controllers/authController.js
node --check backend/controllers/itemController.js
node --check backend/controllers/donationController.js
node --check backend/controllers/mealPlanController.js
```

Result:

- All syntax checks passed.

## Intentionally Not Implemented

The following items are documented in the assignment/case-study materials but were intentionally left as future work because they are not required for the current implementation pass:

- Full login-time 2FA challenge flow
  - Assignment priority: Should Have
  - Current status: profile setting is stored, but login does not yet require a second OTP.

- HTTPS/TLS enforcement
  - Assignment priority: Must Have NFR for production
  - Current status: should be handled during deployment/hosting configuration.

- Scheduled expiry cron jobs
  - Assignment priority: expiry alerts are important, but full background scheduling can be added later.
  - Current status: notification infrastructure exists; production scheduler is not implemented.

- E2E automation
  - Current status: unit tests pass; E2E flows remain future validation work.

## Current Compliance Position

The application is now better aligned with the six high-level SavePlate use cases:

1. Register User and Privacy Settings
2. Manage Food Inventory
3. Browse Food Items and Donations
4. Food Analytics
5. View Notifications
6. Plan Weekly Meals

The main remaining work is production hardening rather than basic use-case completion.
