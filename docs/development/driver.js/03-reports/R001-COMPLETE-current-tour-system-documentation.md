# QuoteKit Tour System - Current State Documentation

## Table of Contents

1. [Current Tours Available](#current-tours-available)
2. [Current Page Mappings](#current-page-mappings)
3. [Tour Filtering Logic](#tour-filtering-logic)
4. [App Pages Inventory](#app-pages-inventory)
5. [Tour Management System](#tour-management-system)
6. [Recommendations & Questions](#recommendations--questions)

## Current Tours Available

### Main Tours (from tour-configs.ts)

| Tour ID                   | Name                      | Description                                                     | User Tiers            | Device Types            | Prerequisites |
| ------------------------- | ------------------------- | --------------------------------------------------------------- | --------------------- | ----------------------- | ------------- |
| `welcome`                 | Welcome to LawnQuote      | Get started with your quote management system                   | free, pro, enterprise | desktop, mobile, tablet | None          |
| `quote-creation`          | Create Your First Quote   | Learn how to create professional quotes step by step            | free, pro, enterprise | desktop, mobile, tablet | welcome       |
| `settings`                | Company Setup             | Configure your company information for professional quotes      | free, pro, enterprise | desktop, mobile, tablet | welcome       |
| `item-library`            | Item Library Management   | Learn how to manage your services and materials library         | free, pro, enterprise | desktop, mobile, tablet | welcome       |
| `pro-features`            | Pro Features Overview     | Discover advanced features available with your Pro subscription | pro, enterprise       | desktop, mobile, tablet | None          |
| `contextual-help`         | Contextual Help System    | Learn how to get help when you need it                          | free, pro, enterprise | desktop, mobile, tablet | None          |
| `freemium-highlights`     | Discover Premium Features | Learn about advanced features available with premium plans      | free                  | desktop, mobile, tablet | None          |
| `interactive-tutorial`    | Hands-On Practice         | Practice with real features in a safe environment               | free, pro, enterprise | desktop, mobile, tablet | None          |
| `personalized-onboarding` | Tailored Experience       | Customized onboarding based on your business type and goals     | free, pro, enterprise | desktop, mobile, tablet | None          |

### Sprint 3 Tours (from sprint3-tour-configs.ts)

| Tour ID                  | Name                   | Description                                      | User Tiers            | Device Types            | Prerequisites |
| ------------------------ | ---------------------- | ------------------------------------------------ | --------------------- | ----------------------- | ------------- |
| `mobile-welcome`         | Mobile Welcome Tour    | Mobile-optimized welcome experience              | free, pro, enterprise | mobile, tablet          | None          |
| `quote-management-mini`  | Quote Management Tips  | Quick tips for managing your quotes effectively  | free, pro, enterprise | desktop, mobile, tablet | None          |
| `client-management-mini` | Client Management Tips | Best practices for managing client relationships | free, pro, enterprise | desktop, mobile, tablet | None          |

**Total Tours Available: 12**

## Current Page Mappings

### Official Mapping (from page-tour-router.ts)

The system uses `PAGE_TOUR_MAP` to define which tours are available on each
page:

```typescript
const PAGE_TOUR_MAP = {
  "/dashboard": {
    availableTours: ["welcome", "personalized-onboarding", "contextual-help"],
    defaultTour: "welcome",
  },
  "/quotes": {
    availableTours: ["quote-creation", "interactive-tutorial"],
    defaultTour: "quote-creation",
  },
  "/quotes/new": {
    availableTours: ["quote-creation", "interactive-tutorial"],
    defaultTour: "quote-creation",
  },
  "/quotes/[id]": {
    availableTours: ["quote-creation", "interactive-tutorial"],
    defaultTour: "quote-creation",
  },
  "/quotes/[id]/edit": {
    availableTours: ["quote-creation", "interactive-tutorial"],
    defaultTour: "quote-creation",
  },
  "/items": {
    availableTours: ["item-library"],
    defaultTour: "item-library",
  },
  "/clients": {
    availableTours: ["welcome", "contextual-help"],
    defaultTour: "welcome",
  },
  "/settings": {
    availableTours: ["settings"],
    defaultTour: "settings",
  },
  "/analytics": {
    availableTours: ["pro-features", "contextual-help"],
    defaultTour: "pro-features",
  },
  "/analytics/surveys": {
    availableTours: ["pro-features", "contextual-help"],
    defaultTour: "pro-features",
  },
  "/usage": {
    availableTours: ["pro-features", "contextual-help"],
    defaultTour: "pro-features",
  },
  "/admin": {
    availableTours: ["contextual-help"],
    defaultTour: "contextual-help",
  },
};
```

### HelpMenu Override (from HelpMenu.tsx)

The HelpMenu component has its own simplified mapping that **overrides** the
official PAGE_TOUR_MAP:

```typescript
const pageToTours = {
  "/dashboard": ["welcome"],
  "/quotes": [], // Dynamically determined based on quote existence
  "/quotes/new": ["quote-creation"],
  "/quotes/[id]": ["interactive-tutorial"],
  "/quotes/[id]/edit": ["interactive-tutorial"],
  "/items": ["item-library"],
  "/clients": ["welcome"],
  "/settings": ["settings"],
  "/analytics": ["pro-features"],
  "/analytics/surveys": ["pro-features"],
  "/usage": ["pro-features"],
  "/admin": [],
};
```

**🚨 INCONSISTENCY DETECTED:** The two mappings don't match, which could cause
confusion.

## Tour Filtering Logic

### Current Filtering System

The tour system has multiple layers of filtering:

1. **Page-based filtering** - Tours are filtered based on current URL path
2. **User tier filtering** - Tours are filtered based on user subscription level
   (free/pro/enterprise)
3. **Device type filtering** - Tours can be restricted to specific device types
4. **Smart content filtering** - Special logic for quotes page to detect if user
   has existing quotes

### Smart Quotes Page Logic

The `/quotes` page has intelligent filtering:

```typescript
// Check if user has any quotes by looking for quote cards in the DOM
const hasQuotes = document.querySelectorAll(
  '[data-testid="quote-card"], .quote-item, [data-quote-id]',
).length > 0;

if (!hasQuotes) {
  // Show "Create your first quote" tour
  pageToTours["/quotes"] = ["quote-creation"];
} else {
  // User has quotes - show different relevant tours
  pageToTours["/quotes"] = ["interactive-tutorial"];
}
```

### Prerequisites System

Tours can have prerequisites that must be completed first:

- `quote-creation` requires `welcome` to be completed
- `settings` requires `welcome` to be completed
- `item-library` requires `welcome` to be completed

## App Pages Inventory

### Main App Pages (Route Groups)

#### Public Pages

- `/` - Homepage
- `/about` - About page
- `/pricing` - Pricing page
- `/features` - Features page
- `/contact` - Contact page
- `/blog` - Blog listing
- `/blog/[slug]` - Individual blog posts
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy
- `/gdpr` - GDPR compliance

#### Auth Pages

- `/login` - User login
- `/signup` - User registration
- `/auth/callback` - OAuth callback

#### Account Pages

- `/account` - Account management
- `/manage-subscription` - Subscription management

#### Main App Pages (Protected - requires auth)

- `/dashboard` - Main dashboard ✅ **Has Tours**
- `/quotes` - Quote listing ✅ **Has Tours**
- `/quotes/new` - Create new quote ✅ **Has Tours**
- `/quotes/[id]` - View quote ✅ **Has Tours**
- `/quotes/[id]/edit` - Edit quote ✅ **Has Tours**
- `/items` - Item library management ✅ **Has Tours**
- `/clients` - Client management ✅ **Has Tours**
- `/settings` - Company settings ✅ **Has Tours**
- `/analytics` - Business analytics ✅ **Has Tours**
- `/analytics/surveys` - Survey analytics ✅ **Has Tours**
- `/usage` - Usage tracking ✅ **Has Tours**

#### Admin Pages (Protected - admin only)

- `/admin` - Admin dashboard ✅ **Has Tours**
- Multiple admin sub-pages for system management

### Pages WITHOUT Tour Mapping

The following app pages currently have **NO tours assigned**:

#### Missing Tour Opportunities

1. **Checkout Flow**
   - `/checkout` - Payment and subscription upgrade

2. **Debug Pages**
   - `/debug/formbricks` - Formbricks testing

3. **Admin Sub-Pages** (many specialized admin pages)
   - Various analytics, user management, and system admin pages

## Tour Management System

### Architecture Overview

1. **Tour Configs** (`tour-configs.ts` + `sprint3-tour-configs.ts`)
   - Contains all tour definitions with steps, descriptions, targeting rules
   - 12 total tours available

2. **Page Router** (`page-tour-router.ts`)
   - Maps app routes to available tours
   - Handles dynamic route matching
   - Provides official tour-to-page mapping

3. **Tour Manager** (`tour-manager.ts`)
   - Handles tour execution using Driver.js library
   - Manages tour lifecycle (start, pause, complete, destroy)
   - Applies responsive positioning and UX enhancements

4. **HelpMenu Component** (`HelpMenu.tsx`)
   - User-facing tour selection interface
   - Implements page-based filtering (with different rules than PageRouter)
   - Shows tour progress and status

5. **Driver Config** (`driver-config.ts`)
   - Configuration for Driver.js tour library
   - Handles positioning, styling, and interaction behavior

### Current Issues

1. **Mapping Inconsistency** - HelpMenu and PageRouter have different mapping
   rules
2. **Underutilized Tours** - Some tours aren't mapped to appropriate pages
3. **Missing Coverage** - Several important pages lack tour coverage

## Recommendations & Questions

### 🎯 Key Questions for User Review

1. **Mapping Consistency**: Should we use the PAGE_TOUR_MAP as the single source
   of truth, or keep the HelpMenu override? Which mapping approach do you
   prefer?

2. **Tour Coverage Gaps**: Which of these pages should have tours?
   - `/checkout` - Help with upgrade/payment process?
   - `/account` - Account management guidance?
   - Individual admin pages - Specialized admin help?

3. **Quote Page Logic**: The current smart filtering for `/quotes` page - should
   this be:
   - More aggressive (always show quote-creation for new users)?
   - Different logic (show both tours always)?
   - User-controlled (let users choose)?

4. **Tour Prerequisites**: Current system requires `welcome` tour before others.
   Should this be:
   - More flexible (allow any tour anytime)?
   - More structured (enforce learning path)?
   - User preference-based?

### 🔧 Technical Recommendations

1. **Consolidate Mapping Logic** - Choose one system and remove the other
2. **Add Missing Tours** - Create tours for uncovered important pages
3. **Improve Smart Filtering** - Make the quotes page logic more robust
4. **Tour Analytics** - Track which tours are most/least used
5. **Mobile Optimization** - Ensure all tours work well on mobile devices

### 💡 Suggested Improvements

1. **Progressive Disclosure** - Show relevant tours based on user journey stage
2. **Contextual Triggers** - Auto-suggest tours when users seem stuck
3. **Tour Recommendations** - AI-powered suggestions based on user behavior
4. **Skip Onboarding Option** - For experienced users who want to jump in
5. **Tour Replay System** - Easy access to replay completed tours

---

## Next Steps

Please review this documentation and let us know:

1. Which mapping system you prefer (PAGE_TOUR_MAP vs HelpMenu approach)?
   PAGE_TOUR_MAP
2. Which pages should have tours added? As planned in PAGE_TOUR_MAP
3. How aggressive the tour suggestions should be? The tour should only autoload
   Once in the first user access after that the user shoud be able to trigger
   the tour through the HelpMenu
4. Any specific tour content or flow changes needed? Not really. Lets focus on
   fixing the mapping system.

This will help us create a final implementation plan that matches your vision
for the user onboarding experience.
