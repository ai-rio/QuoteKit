# Driver.js Tour Configurations & Expected Behaviors

## Overview
This document outlines all current tour configurations, their expected behaviors on different pages, and test scenarios for validation. This serves as the reference for ensuring the driver.js implementation works correctly across all app pages.

## Current Tour Configurations

### 1. Welcome Tour (`welcome`)
- **Target Pages**: `/dashboard` (primary)
- **User Tiers**: All (free, pro, enterprise)
- **Prerequisites**: None (entry tour)
- **Steps**: 6 steps
  1. Welcome Message (floating)
  2. Navigation Sidebar (`[data-tour="sidebar"]`)
  3. Dashboard Statistics (`[data-tour="stats-cards"]`)
  4. Quick Actions Panel (`[data-tour="quick-actions"]`)
  5. Account Menu (`[data-tour="account-menu"]`)
  6. Settings Access (`[data-tour="settings-link"]`)

**Expected Behavior:**
- ✅ Should start automatically for new users on dashboard
- ✅ Should complete when user finishes all 6 steps
- ✅ Should not restart if already completed

### 2. Quote Creation Tour (`quote-creation`)
- **Target Pages**: `/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/[id]/edit`
- **User Tiers**: All (free, pro, enterprise)
- **Prerequisites**: `welcome` (recommended)
- **Steps**: 9 steps
  1. Navigate to Quotes (`[data-tour="create-quote"]`)
  2. Client Selection Intro (floating)
  3. Client Selector (`[data-tour="client-selector"]`)
  4. Quote Details (`[data-tour="quote-details"]`)
  5. Add Items Section (`[data-tour="add-items"]`)
  6. Line Items Table (`[data-tour="line-items-table"]`)
  7. Financial Settings (`[data-tour="financial-settings"]`)
  8. Quote Totals (`[data-tour="quote-totals"]`)
  9. Save & Send Actions (`[data-tour="save-send-actions"]`)

**Expected Behavior:**
- ✅ Should start when user visits quotes pages for first time
- ✅ Should navigate between dashboard and quotes pages automatically
- ✅ Should validate element existence before highlighting
- ❌ **CURRENTLY BROKEN**: Only works if triggered from dashboard

### 3. Item Library Tour (`item-library`)
- **Target Pages**: `/items`
- **User Tiers**: All (free, pro, enterprise)
- **Prerequisites**: `welcome` (recommended)
- **Steps**: 6 steps
  1. Item Library Intro (floating)
  2. Add New Items (`[data-tour="add-item"]`)
  3. Item Categories (`[data-tour="categories"]`)
  4. Item List (`[data-tour="items-list"]`)
  5. Search & Filter (`[data-tour="search-filter"]`)
  6. Global Library (`[data-tour="global-library"]`)

**Expected Behavior:**
- ✅ Should start when user visits `/items` for first time
- ✅ Should navigate to items page if starting from elsewhere
- ❌ **CURRENTLY BROKEN**: Only works if triggered from dashboard

### 4. Settings Tour (`settings`)
- **Target Pages**: `/settings`
- **User Tiers**: All (free, pro, enterprise)
- **Prerequisites**: `welcome` (recommended)
- **Steps**: 6 steps
  1. Settings Navigation (floating)
  2. Company Profile (`[data-tour="company-profile"]`)
  3. Logo Upload (`[data-tour="logo-upload"]`)
  4. Financial Defaults (`[data-tour="financial-defaults"]`)
  5. Quote Terms (`[data-tour="quote-terms"]`)
  6. Save Settings (`[data-tour="save-settings"]`)

**Expected Behavior:**
- ✅ Should start when user visits `/settings` for first time
- ✅ Should navigate to settings page if starting from elsewhere
- ❌ **CURRENTLY BROKEN**: Only works if triggered from dashboard

### 5. Pro Features Tour (`pro-features`)
- **Target Pages**: `/analytics`, `/analytics/surveys`, `/usage`
- **User Tiers**: Pro and Enterprise only
- **Prerequisites**: None
- **Steps**: 4 steps
  1. Unlimited Quotes (floating)
  2. Advanced Analytics (`[data-tour="analytics-link"]`)
  3. Custom Branding (floating)
  4. Priority Support (floating)

**Expected Behavior:**
- ✅ Should start for Pro/Enterprise users on analytics pages
- ✅ Should only show to paying users
- ❌ **CURRENTLY BROKEN**: Only works if triggered from dashboard

## Current Page Tour Mappings

### From `src/libs/onboarding/page-tour-router.ts`:

```typescript
PAGE_TOUR_MAP = {
  '/dashboard': {
    availableTours: ['welcome', 'personalized-onboarding', 'contextual-help'],
    defaultTour: 'welcome'
  },
  '/quotes': {
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation'
  },
  '/quotes/new': {
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation'
  },
  '/quotes/[id]': {
    availableTours: ['quote-creation', 'interactive-tutorial'],
    defaultTour: 'quote-creation'
  },
  '/items': {
    availableTours: ['item-library'],
    defaultTour: 'item-library'
  },
  '/settings': {
    availableTours: ['settings'],
    defaultTour: 'settings'
  },
  '/analytics': {
    availableTours: ['pro-features', 'contextual-help'],
    defaultTour: 'pro-features'
  }
}
```

## Current Issues Analysis

### Root Cause: Complex Implementation Pattern
The current implementation uses:
1. **TourManager wrapper class** instead of direct driver.js calls
2. **Double initialization**: `initializeTour()` + `startTour()`
3. **Complex step conversion** from TourStep to DriveStep
4. **Overly restrictive logic** in OnboardingManager

### Issue 1: Tours Only Work on Dashboard Page Load
**Problem**: Tours only start when users first visit dashboard, not on other pages
**Root Cause**: OnboardingManager logic prevents tours if user has completed ANY tour

**Current Logic** (Incorrect):
```typescript
const hasCompletedAnyTour = availableTours.some(tour => isTourCompleted(tour.id))
if (!hasCompletedAnyTour) {
  await startNextTour(validTour) // Only for brand new users
}
```

**Should Be**:
```typescript
const isSpecificTourCompleted = isTourCompleted(validTour)
if (!isSpecificTourCompleted) {
  await startTour(validTour) // For each specific tour
}
```

### Issue 2: Complex Wrapper vs Simple Direct Usage
**Official Driver.js Pattern**:
```javascript
import { driver } from "driver.js";
const driverObj = driver({ steps: [...] });
driverObj.drive();
```

**Our Current Pattern** (Overly Complex):
```javascript
await tourManager.initializeTour(tourId, config)
await startTour(tourId)
await tourManager.startTour()
```

## Expected Tour Behaviors by Page

### Dashboard (`/dashboard`)
- **First Visit**: Welcome tour should start automatically
- **Return Visits**: No tours (welcome already completed)
- **User Action**: User can manually trigger tours via help menu

### Quotes Pages (`/quotes/*`)
- **First Visit**: Quote creation tour should start automatically
- **Return Visits**: No tours (quote-creation already completed)
- **Navigation**: Tour should handle page transitions seamlessly

### Items Page (`/items`)
- **First Visit**: Item library tour should start automatically
- **Return Visits**: No tours (item-library already completed)
- **Prerequisites**: Recommend completing welcome tour first

### Settings Page (`/settings`)
- **First Visit**: Settings tour should start automatically
- **Return Visits**: No tours (settings already completed)
- **Integration**: Tour should work with settings form interactions

### Analytics Pages (`/analytics/*`)
- **First Visit**: Pro features tour for Pro/Enterprise users
- **Free Users**: Should not show pro features tour
- **Return Visits**: No tours (pro-features already completed)

## Test Scenarios & Validation Criteria

### Test Scenario 1: New User Journey
1. **Step 1**: User logs in, lands on `/dashboard`
   - ✅ **Expected**: Welcome tour starts automatically
   - ✅ **Validation**: Tour highlights correct elements in sequence

2. **Step 2**: User completes welcome tour, navigates to `/quotes/new`
   - ✅ **Expected**: Quote creation tour starts automatically
   - ❌ **Current**: No tour starts (blocked by hasCompletedAnyTour)

3. **Step 3**: User navigates to `/items`
   - ✅ **Expected**: Item library tour starts automatically
   - ❌ **Current**: No tour starts (blocked by hasCompletedAnyTour)

### Test Scenario 2: Returning User
1. **Step 1**: User who completed welcome tour visits `/quotes`
   - ✅ **Expected**: Quote creation tour starts (if not completed)
   - ❌ **Current**: No tour starts

2. **Step 2**: User who completed all tours visits any page
   - ✅ **Expected**: No tours start
   - ✅ **Current**: Works correctly

### Test Scenario 3: Manual Tour Triggering
1. **Step 1**: User clicks help menu and selects a tour
   - ✅ **Expected**: Selected tour starts regardless of completion status
   - ❓ **Current**: Needs testing

### Test Scenario 4: Cross-Page Navigation
1. **Step 1**: Tour starts on one page, navigates to another
   - ✅ **Expected**: Tour continues seamlessly with page transitions
   - ❓ **Current**: Needs testing with new implementation

## Fix Implementation Plan

### Phase 1: Simplify Driver.js Usage
1. **Remove TourManager wrapper** - Use direct driver() calls
2. **Single initialization** - Create and start tours in one step
3. **Direct step format** - Use native Driver.js step format

### Phase 2: Fix OnboardingManager Logic
1. **Per-tour completion check** instead of "any tour completed"
2. **Remove cooldown complexity** - Use Driver.js built-in controls
3. **Simplify auto-start logic** - Direct page-to-tour mapping

### Phase 3: Validation & Testing
1. **Test each page individually** - Verify tours start correctly
2. **Test user journey flows** - Verify multi-tour progression
3. **Test edge cases** - Navigation, errors, incomplete tours

## Success Criteria

After implementation, the following should work:

1. ✅ **Dashboard**: Welcome tour starts for new users
2. ✅ **Quotes Pages**: Quote creation tour starts for users who haven't done it
3. ✅ **Items Page**: Item library tour starts for users who haven't done it
4. ✅ **Settings Page**: Settings tour starts for users who haven't done it
5. ✅ **Analytics Pages**: Pro features tour starts for Pro users who haven't done it
6. ✅ **No Tour Spam**: Tours don't restart if already completed
7. ✅ **Manual Override**: Help menu can trigger any tour anytime
8. ✅ **Smooth Navigation**: Tours handle page transitions gracefully

---

**Next Steps**: 
1. Implement simplified driver.js usage
2. Fix OnboardingManager logic
3. Test all scenarios systematically
4. Document any remaining issues

**Last Updated**: January 2025  
**Status**: Analysis Complete - Ready for Implementation