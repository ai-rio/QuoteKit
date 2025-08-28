# LawnQuote HTML to Next.js Component Mapping

## Overview

This document provides a comprehensive mapping of UI components and blocks needed to convert the HTML templates to Next.js pages using shadcn/ui components. The analysis covers 15 HTML files and identifies all necessary components for a complete conversion.

## Directory Structure

```
docs/html/
├── home.html                    # Landing page with interactive demo
├── about.html                   # Founder story and mission
├── features.html                # Feature showcase with animations
├── pricing.html                 # Pricing plans with toggles
├── blog.html                    # Blog listing with search/filter
├── blog-post-template.html      # Individual blog post layout
├── contact.html                 # Contact form
├── dashboard.html              # Main quote creation interface
├── settings.html               # User settings and preferences
├── signup.html                 # User registration
├── terms.html                  # Terms of service
├── privacy.html                # Privacy policy
├── button-system.html          # Button component specifications
├── component-system.html       # UI component examples
└── Item Library UI.html        # Item management interface
```

## Design System

### Color Palette
- **forest-green**: `#2A3D2F` (Primary)
- **equipment-yellow**: `#F2B705` (Accent)
- **light-concrete**: `#F5F5F5` (Background)
- **stone-gray**: `#D7D7D7` (Border/Divider)
- **charcoal**: `#1C1C1C` (Text)
- **paper-white**: `#FFFFFF` (Cards/Surface)

### Typography
- **Primary**: Inter (sans-serif)
- **Monospace**: Roboto Mono (for numbers/codes)
- **Accent**: Kalam (handwriting, limited use)

## shadcn/ui Components Needed

### Core Components

| Component | Usage | Pages | Priority |
|-----------|-------|-------|----------|
| `Button` | Primary actions, CTAs | All pages | High |
| `Input` | Form fields, search | contact, settings, dashboard | High |
| `Card` | Content containers | All pages | High |
| `Badge` | Status indicators | dashboard, admin | High |
| `Avatar` | User profiles | settings, contact | Medium |
| `Select` | Dropdowns | contact, settings | Medium |
| `Textarea` | Multi-line inputs | contact, settings | Medium |
| `Checkbox` | Settings toggles | settings, pricing | Medium |
| `Switch` | Billing toggle | pricing | Medium |
| `Label` | Form labels | All forms | High |
| `Separator` | Content dividers | All pages | Medium |

### Navigation Components

| Component | Usage | Pages | Priority |
|-----------|-------|-------|----------|
| `NavigationMenu` | Main site navigation | All public pages | High |
| `Breadcrumb` | Page hierarchy | Dashboard pages | Medium |
| `Tabs` | Content switching | settings, dashboard | Medium |
| `Sidebar` | App navigation | Dashboard pages | High |

### Data Display Components

| Component | Usage | Pages | Priority |
|-----------|-------|-------|----------|
| `Table` | Data listing | dashboard, item library | High |
| `Accordion` | FAQ sections | pricing, blog-post | Medium |
| `Sheet` | Mobile navigation | All pages | Medium |
| `Dialog` | Modals, confirmations | dashboard, settings | High |
| `Tooltip` | Help text | Dashboard pages | Medium |

### Feedback Components

| Component | Usage | Pages | Priority |
|-----------|-------|-------|----------|
| `Alert` | Status messages | All forms | Medium |
| `Progress` | Loading states | Dashboard | Low |
| `Skeleton` | Loading placeholders | All data pages | Low |
| `Toast` | Notifications | Dashboard actions | Medium |

## Custom Components Needed

### 1. Interactive Quote Builder (`/home.html`)
```typescript
// Components needed:
- QuoteSandbox
- ItemLibraryPanel  
- LineItemsTable
- QuoteTotals
- PricingToggle

// Features:
- Real-time calculation
- Interactive item selection
- Responsive design
- Animation effects
```

### 2. Feature Showcase (`/features.html`)
```typescript
// Components needed:
- FeatureCard
- FeatureMockup
- ScrollAnimation

// Features:
- Intersection Observer animations
- Responsive mockups
- Progressive disclosure
```

### 3. Blog System (`/blog.html`, `/blog-post-template.html`)
```typescript
// Components needed:
- BlogCard
- BlogGrid
- BlogSearch
- BlogFilters
- TableOfContents
- FaqAccordion

// Features:
- Search and filter functionality
- Sticky navigation
- Article progress tracking
- Schema markup
```

### 4. Dashboard Interface (`/dashboard.html`)
```typescript
// Components needed:
- DashboardSidebar
- QuoteForm
- LineItemRow
- ClientDetailsForm
- QuoteActions

// Features:
- CRUD operations
- Real-time calculations
- PDF generation
- State management
```

### 5. Item Library (`/Item Library UI.html`)
```typescript
// Components needed:
- ItemLibraryTable
- ItemRow
- ItemForm
- EmptyState

// Features:
- CRUD operations
- Inline editing
- Confirmation dialogs
```

### 6. Settings Interface (`/settings.html`)
```typescript
// Components needed:
- SettingsCard
- CompanyProfile
- FinancialDefaults
- FileUpload

// Features:
- Form validation
- Auto-save detection
- Image upload
```

## Layout Components

### 1. Marketing Layout
Used for: home, about, features, pricing, blog, contact, terms, privacy

```typescript
// Components:
- MarketingHeader
- MarketingFooter
- MarketingHero
- MarketingSection

// Features:
- Sticky navigation
- Responsive design
- Consistent spacing
```

### 2. Dashboard Layout
Used for: dashboard, settings, item library

```typescript
// Components:
- DashboardLayout
- DashboardSidebar
- DashboardHeader
- MainContent

// Features:
- Collapsible sidebar
- User context
- Active state management
```

### 3. Blog Layout
Used for: blog listing and individual posts

```typescript
// Components:
- BlogLayout
- BlogHeader
- BlogSidebar
- BlogContent

// Features:
- SEO optimization
- Reading progress
- Related content
```

## shadcn/ui Blocks Needed

### 1. Hero Sections
- **Type**: Marketing hero with CTA
- **Usage**: home, about, features, pricing, blog, contact
- **Variants**: With/without interactive elements

### 2. Feature Grids
- **Type**: 2-3 column feature showcase
- **Usage**: home, features
- **Components**: Card, Badge, Icon

### 3. Pricing Cards
- **Type**: Comparison table with toggle
- **Usage**: pricing
- **Components**: Card, Switch, Badge, Button

### 4. Testimonial Cards
- **Type**: Social proof display
- **Usage**: home
- **Components**: Card, Avatar, Quote

### 5. Contact Forms
- **Type**: Multi-field contact form
- **Usage**: contact
- **Components**: Input, Textarea, Select, Button

### 6. Legal Content
- **Type**: Structured legal text
- **Usage**: terms, privacy
- **Components**: Card, Separator, Typography

### 7. Data Tables
- **Type**: Interactive data display
- **Usage**: dashboard, item library
- **Components**: Table, Button, Badge, Input

### 8. Dashboard Cards
- **Type**: Metric and action cards
- **Usage**: dashboard, settings
- **Components**: Card, Button, Progress, Badge

## Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
1. Design system setup (colors, typography, components)
2. Layout components (Marketing, Dashboard)
3. Navigation components
4. Basic UI components (Button, Card, Input, Label)

### Phase 2: Marketing Pages (Week 2)
1. Home page with interactive quote sandbox
2. About, Features, Pricing pages
3. Blog listing and post templates
4. Contact and legal pages

### Phase 3: Dashboard Features (Week 3)
1. Dashboard layout and navigation
2. Quote creation interface
3. Item library management
4. Settings interface

### Phase 4: Polish & Features (Week 4)
1. Advanced interactions and animations
2. Form validation and error handling
3. Responsive design optimization
4. Accessibility improvements

## Key Implementation Notes

### 1. Interactive Quote Sandbox
- Requires state management (React Context or Zustand)
- Real-time calculations with proper number formatting
- Mobile-responsive table layouts
- Animation for value updates

### 2. Blog System
- Search functionality needs debouncing
- Filter state management
- SEO optimization with Next.js head management
- Schema markup for better search visibility

### 3. Dashboard Interface
- Complex form state management
- File handling for PDF generation
- Real-time validation
- Optimistic UI updates

### 4. Responsive Design
- Mobile-first approach
- Collapsible navigation
- Touch-friendly interactions
- Optimized typography scales

### 5. Accessibility
- Proper ARIA labels throughout
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Screen reader compatibility

### 6. Performance
- Code splitting for dashboard vs marketing
- Image optimization
- Bundle size optimization
- Loading states and skeleton screens

## File Structure Recommendation

```
src/
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Layout components
│   ├── marketing/              # Marketing page components
│   ├── dashboard/              # Dashboard components
│   └── common/                 # Shared components
├── app/                        # Next.js App Router pages
├── lib/                        # Utilities and configurations
├── styles/                     # Global styles and design tokens
└── types/                      # TypeScript type definitions
```

## Next Steps

1. **Setup**: Initialize Next.js project with shadcn/ui
2. **Design System**: Implement color palette and typography
3. **Components**: Build custom components following shadcn/ui patterns
4. **Pages**: Convert HTML templates to Next.js pages
5. **Testing**: Ensure responsive design and accessibility
6. **Optimization**: Performance and SEO improvements

This mapping provides a comprehensive guide for converting the HTML templates to a modern Next.js application with consistent, accessible, and maintainable components.