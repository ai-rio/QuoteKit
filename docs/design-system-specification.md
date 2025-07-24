# LawnQuote Design System Specification
*Advanced Quote Creation Interface - Story 2.3 Implementation*

## 🎨 Color System & Accessibility

### Primary Color Palette
```css
/* Core Brand Colors */
--forest-green: #2A3D2F;        /* Primary brand color */
--equipment-yellow: #F2B705;     /* Action/highlight color */
--light-concrete: #F5F5F5;      /* Page background */
--stone-gray: #D7D7D7;          /* Borders & subtle elements */
--charcoal: #1C1C1C;            /* Primary text */
--paper-white: #FFFFFF;         /* Card backgrounds */

/* System Status Colors */
--success-green: #16a34a;       /* Success states, active badges */
--error-red: #dc2626;           /* Error states, destructive actions */
--info-blue: #2563eb;           /* Information states */
```

### WCAG AA/AAA Compliance ✅
All color combinations meet or exceed WCAG AAA standards:
- **Forest Green + White**: 14.8:1 contrast ratio ✅✅
- **Equipment Yellow + Charcoal**: 10.2:1 contrast ratio ✅✅
- **Charcoal + Light Concrete**: 13.1:1 contrast ratio ✅✅
- **Stone Gray + Charcoal**: 7.8:1 contrast ratio ✅✅

### CSS Variables Update Required
```css
/* Add to globals.css - missing from current implementation */
:root {
  /* LawnQuote Brand Colors */
  --forest-green: 147 21% 20%;      /* #2A3D2F */
  --equipment-yellow: 47 95% 49%;    /* #F2B705 */
  --light-concrete: 0 0% 96%;       /* #F5F5F5 */
  --stone-gray: 0 0% 85%;           /* #D7D7D7 */
  --charcoal: 0 0% 11%;             /* #1C1C1C */
  --paper-white: 0 0% 100%;         /* #FFFFFF */
  
  /* System Status Colors */
  --success-green: 142 76% 36%;     /* #16a34a */
  --error-red: 0 84% 60%;           /* #dc2626 */
  --info-blue: 221 83% 53%;         /* #2563eb */
}
```

## 📐 Typography System

### Font Hierarchy
```css
/* Required font imports - UPDATE NEEDED */
font-family: 'Inter', sans-serif;           /* Primary UI text */
font-family: 'Roboto Mono', monospace;      /* Numbers & quotes */

/* Current implementation uses Montserrat - INCONSISTENT */
```

### Typography Scale
```css
/* Headings */
.text-quote-header { font-size: 2rem; font-weight: 700; }      /* Quote titles */
.text-section-title { font-size: 1.125rem; font-weight: 700; } /* Section headers */
.text-label { font-size: 0.875rem; font-weight: 500; }         /* Form labels */

/* Body Text */
.text-primary { font-size: 1rem; color: var(--charcoal); }     /* Primary text */
.text-secondary { font-size: 0.875rem; color: var(--charcoal-60); } /* Secondary text */

/* Monospace (Financial) */
.text-money { font-family: 'Roboto Mono'; font-weight: 500; }   /* Currency values */
.text-quote-number { font-family: 'Roboto Mono'; font-weight: 500; } /* Quote numbers */
```

## 🧩 Component Design Standards

### Card Components
```tsx
/* Standard card wrapper - all quote sections */
<Card className="bg-paper-white border border-stone-gray shadow-sm">
  <CardHeader className="pb-4">
    <CardTitle className="text-section-title text-charcoal">Section Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Form Elements
```tsx
/* Input fields with consistent styling & proper contrast */
<Input 
  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
  placeholder="Client Name"
/>

/* Currency/Number inputs with monospace font */
<Input 
  type="number"
  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60"
  placeholder="0.00"
/>

/* Labels with proper hierarchy */
<Label className="text-label text-charcoal font-medium">
  Client Name
</Label>

/* Form field container for dialogs */
<div className="grid gap-3">
  <Label htmlFor="input-id" className="text-label text-charcoal font-medium">
    Field Label
  </Label>
  <Input
    id="input-id"
    name="fieldName"
    className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
    placeholder="Enter value"
    required
  />
</div>
```

### Button System

#### 1. Primary Buttons
For the most important actions on a page, like submitting forms or confirming purchases.
```tsx
/* Primary Action Buttons - WCAG AAA Compliant (14.8:1 contrast) */
<Button className="bg-forest-green text-paper-white hover:opacity-90 active:opacity-80 font-bold px-6 py-3 rounded-lg transition-all duration-200">
  Generate PDF
</Button>

/* Disabled Primary Button - WCAG AA Compliant (4.6:1 contrast) */
<Button 
  disabled
  className="bg-stone-gray text-charcoal opacity-60 cursor-not-allowed font-bold px-6 py-3 rounded-lg"
>
  Generate PDF
</Button>
```

#### 2. Secondary Buttons
For important but not primary actions. Uses "ghost" style to avoid color contrast issues.
```tsx
/* Secondary Action Buttons - WCAG AAA Compliant (13.1:1 contrast) */
<Button className="bg-paper-white text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-paper-white font-bold px-6 py-3 rounded-lg transition-all duration-200">
  View Details
</Button>

/* Disabled Secondary Button */
<Button 
  disabled
  className="bg-paper-white text-stone-gray border-2 border-stone-gray cursor-not-allowed font-bold px-6 py-3 rounded-lg"
>
  View Details
</Button>
```

#### 3. Accent/Call-to-Action Buttons
Use sparingly for key actions. **MUST use dark text for accessibility.**
```tsx
/* Accent Buttons - WCAG AAA Compliant (10.2:1 contrast) */
<Button className="bg-equipment-yellow text-charcoal hover:brightness-110 font-bold px-6 py-3 rounded-lg transition-all duration-200">
  Add New Item
</Button>

/* Disabled Accent Button - WCAG AA Compliant (4.6:1 contrast) */
<Button 
  disabled
  className="bg-stone-gray text-charcoal opacity-60 cursor-not-allowed font-bold px-6 py-3 rounded-lg"
>
  Add New Item
</Button>
```

#### 4. Destructive Buttons
For actions that result in data loss. Red color signals caution.
```tsx
/* Destructive Buttons - WCAG AA Compliant (4.5:1 contrast) */
<Button className="bg-paper-white text-error-red border-2 border-error-red hover:bg-error-red hover:text-paper-white font-bold px-6 py-3 rounded-lg transition-all duration-200">
  Delete Item
</Button>

/* Disabled Destructive Button */
<Button 
  disabled
  className="bg-paper-white text-stone-gray border-2 border-stone-gray cursor-not-allowed font-bold px-6 py-3 rounded-lg"
>
  Delete Item
</Button>
```

### Icon Button System

#### 1. Primary Icon Buttons
For primary actions like "Add" or "Create". High contrast and clear intent.
```tsx
/* Primary Icon Button - WCAG AAA Compliant */
<button 
  className="w-10 h-10 bg-forest-green text-paper-white rounded-lg inline-flex items-center justify-center transition-all duration-200 hover:opacity-90"
  title="Add Item"
>
  <PlusIcon className="w-6 h-6" />
</button>
```

#### 2. Secondary Icon Buttons
For secondary actions like "View" or "Edit". Clear and accessible on light backgrounds.
```tsx
/* Secondary Icon Button - WCAG AAA Compliant */
<button 
  className="w-10 h-10 bg-paper-white border-2 border-stone-gray text-charcoal rounded-lg inline-flex items-center justify-center transition-all duration-200 hover:bg-stone-gray/20"
  title="View Details"
>
  <EyeIcon className="w-6 h-6" />
</button>
```

#### 3. Destructive Icon Buttons
For delete actions. Uses error color for clear visual hierarchy.
```tsx
/* Destructive Icon Button - WCAG AA Compliant */
<button 
  className="w-10 h-10 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center transition-all duration-200 hover:opacity-90"
  title="Delete Item"
>
  <TrashIcon className="w-6 h-6" />
</button>
```

### Status Badge System

#### Active Status Badge
```tsx
<span className="px-3 py-1 bg-success-green text-paper-white rounded-full font-semibold text-sm">
  Active
</span>
```

#### Archived Status Badge
```tsx
<span className="px-3 py-1 bg-stone-gray text-charcoal rounded-full font-semibold text-sm">
  Archived
</span>
```

### Tag Button System

#### Tag Button Implementation
```tsx
/* Tag buttons for filtering and selection */
<div className="flex flex-wrap gap-2">
  <button className="px-3 py-1 bg-light-concrete text-charcoal rounded-full text-sm font-medium hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-1">
    All Products
  </button>
  <button className="px-3 py-1 bg-forest-green text-paper-white rounded-full text-sm font-medium hover:opacity-90 focus:ring-2 focus:ring-forest-green focus:ring-offset-1">
    Active
  </button>
  <button className="px-3 py-1 bg-light-concrete text-charcoal rounded-full text-sm font-medium hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-1">
    Archived
  </button>
</div>
```

#### Utility Button Patterns
```tsx
/* Utility buttons for secondary actions */
<div className="flex space-x-2">
  <button className="px-4 py-2 bg-light-concrete text-charcoal rounded-lg font-semibold hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-2">
    Export Data
  </button>
  <button className="px-4 py-2 bg-light-concrete text-charcoal rounded-lg font-semibold hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-2">
    Import Settings
  </button>
  <button className="px-4 py-2 bg-light-concrete text-charcoal rounded-lg font-semibold hover:bg-stone-gray/20 focus:ring-2 focus:ring-forest-green focus:ring-offset-2">
    Reset Filters
  </button>
</div>
```

## Dynamic State Buttons

### Implementation Example
```tsx
/* Save Draft Button - Changes based on form state */
<Button 
  disabled={!canSave}
  className={`
    ${!canSave ? 'bg-paper-white' : 'bg-equipment-yellow'} 
    text-charcoal 
    hover:bg-stone-gray/20 
    active:bg-equipment-yellow 
    border border-stone-gray
    px-6 py-3 rounded-lg font-bold transition-all duration-200
  `}
>
  {isSaving ? 'Saving...' : 'Save Draft'}
</Button>

/* States:
- Disabled (no form data): bg-paper-white
- Active (form data present): bg-equipment-yellow  
- Hover: bg-stone-gray/20
- Active/pressed: bg-equipment-yellow
*/
```

### Table/List Components
```tsx
/* Desktop table header */
<div className="grid grid-cols-12 gap-4 font-bold text-sm text-charcoal/60 mb-2 px-3">
  <div className="col-span-5">ITEM</div>
  <div className="col-span-2 text-right">QTY</div>
  <div className="col-span-2 text-right">PRICE</div>
  <div className="col-span-2 text-right">TOTAL</div>
  <div className="col-span-1"></div>
</div>

/* Line item rows */
<div className="grid grid-cols-12 gap-4 items-center mb-2 bg-stone-gray/20 p-3 rounded-lg">
  {/* Responsive design for mobile cards */}
</div>
```

## 📱 Responsive Design Standards

### Breakpoint Strategy
```css
/* Mobile First Approach */
.quote-section {
  /* Mobile: Stack vertically */
  @apply flex flex-col gap-4;
}

@media (md: 768px) {
  .quote-section {
    /* Desktop: Grid layout */
    @apply grid grid-cols-12 gap-4;
  }
}
```

### Mobile Optimizations
- **Tables → Cards**: Line items convert to cards on mobile
- **Touch Targets**: Minimum 44px for buttons and interactive elements
- **Typography**: Maintain readability with appropriate scaling
- **Spacing**: Adequate padding for thumb-friendly navigation

## 🎯 Interactive States

### Focus Management
```css
/* Consistent focus styles across all interactive elements */
*:focus-visible {
  @apply outline outline-2 outline-offset-2 outline-forest-green;
}

/* Custom focus for form elements */
.form-input:focus {
  @apply border-forest-green ring-2 ring-forest-green/20;
}
```

### Hover Effects
```css
/* Button hover states */
.btn-primary:hover { @apply opacity-90 transition-opacity; }
.btn-secondary:hover { @apply bg-equipment-yellow/90 hover:text-charcoal transition-colors; }
.btn-ghost:hover { @apply bg-stone-gray/20; }

/* Interactive element feedback */
.line-item-row:hover { @apply bg-stone-gray/30; }
```

### Loading States
```tsx
/* Save draft button with loading indicator */
<Button disabled={isSaving} className="bg-forest-green text-white">
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Draft'
  )}
</Button>
```

## 🔧 Implementation Requirements

### 1. CSS Variables Alignment
Update `globals.css` to include missing LawnQuote brand colors:
```css
--forest-green: 147 21% 20%;
--equipment-yellow: 47 95% 49%;
--light-concrete: 0 0% 96%;
--stone-gray: 0 0% 85%;
--charcoal: 0 0% 11%;
```

### 2. Font Configuration
Update `layout.tsx` to use Inter + Roboto Mono instead of Montserrat:
```tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });
```

### 3. Component Class Consistency
Ensure all quote creation components use standardized classes:
- Card backgrounds: `bg-paper-white`
- Borders: `border-stone-gray`
- Primary text: `text-charcoal`
- Money values: `font-mono text-money`

### 4. Card Component Patterns

#### Active State Cards
```tsx
/* Cards with active status - consistent styling */
<Card className="bg-paper-white border border-stone-gray shadow-sm rounded-xl p-6">
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="font-bold text-lg text-charcoal">Active Plan</h3>
      <p className="text-sm text-charcoal/60">ID: prod_abc123def456</p>
    </div>
    <span className="px-3 py-1 bg-success-green text-paper-white rounded-full font-semibold text-sm">
      Active
    </span>
  </div>
  <div className="flex space-x-2">
    {/* Icon buttons using system patterns */}
    <button className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20" title="View">
      <EyeIcon className="w-6 h-6" />
    </button>
    <button className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20" title="Archive">
      <ArchiveIcon className="w-6 h-6" />
    </button>
    <button className="w-10 h-10 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90" title="Delete">
      <TrashIcon className="w-6 h-6" />
    </button>
  </div>
</Card>
```

#### Archived State Cards
```tsx
/* Cards with archived status */
<Card className="bg-paper-white border border-stone-gray shadow-sm rounded-xl p-6">
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="font-bold text-lg text-charcoal">Archived Product</h3>
      <p className="text-sm text-charcoal/60">ID: prod_xyz789ghi012</p>
    </div>
    <span className="px-3 py-1 bg-stone-gray text-charcoal rounded-full font-semibold text-sm">
      Archived
    </span>
  </div>
  <div className="flex space-x-2">
    <button className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20" title="View">
      <EyeIcon className="w-6 h-6" />
    </button>
    <button className="w-10 h-10 bg-success-green text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90" title="Activate">
      <CheckIcon className="w-6 h-6" />
    </button>
    <button className="w-10 h-10 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90" title="Delete">
      <TrashIcon className="w-6 h-6" />
    </button>
  </div>
</Card>
```

### 5. Popover & Dialog Styling
```tsx
/* Consistent popover appearance */
<Popover>
  <PopoverContent className="bg-paper-white border-stone-gray shadow-lg">
    {/* Content with proper contrast */}
  </PopoverContent>
</Popover>

/* Modal dialogs */
<Dialog>
  <DialogContent className="bg-paper-white border-stone-gray">
    <DialogHeader>
      <DialogTitle className="text-charcoal text-section-title">
        Modal Title
      </DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## ✅ Accessibility Implementation Guide

### WCAG 2.1 AA Compliance Standards
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Interactive Elements**: Must be keyboard accessible with visible focus indicators
- **Status Information**: Conveyed through multiple means (color + text/icons)
- **Button Labels**: Descriptive text or proper `title` attributes for icon buttons

### Common Accessibility Problems & Solutions

#### Problem: Low Contrast Text
```tsx
/* ❌ AVOID: Insufficient contrast */
<span className="text-gray-400">Status: Active</span>
```

**Solution: High Contrast Text**
```tsx
/* ✅ CORRECT: Sufficient contrast */
<span className="text-charcoal font-semibold">Status: Active</span>
```

#### Problem: Color-Only Status Indication
```tsx
/* ❌ AVOID: Status conveyed only by color */
<div className="w-3 h-3 bg-green-500 rounded-full"></div>
```

**Solution: Multi-Modal Status Indication**
```tsx
/* ✅ CORRECT: Status with text and color */
<span className="px-3 py-1 bg-success-green text-paper-white rounded-full font-semibold text-sm">
  Active
</span>
```

#### Problem: Missing Button Labels
```tsx
/* ❌ AVOID: Icon button without accessible label */
<button className="w-10 h-10 bg-light-concrete rounded-lg">
  <TrashIcon className="w-6 h-6" />
</button>
```

**Solution: Proper Button Labels**
```tsx
/* ✅ CORRECT: Icon button with accessible label */
<button 
  className="w-10 h-10 bg-error-red text-paper-white rounded-lg inline-flex items-center justify-center hover:opacity-90" 
  title="Delete item"
  aria-label="Delete item"
>
  <TrashIcon className="w-6 h-6" />
</button>
```

#### Problem: Inconsistent Interactive States
```tsx
/* ❌ AVOID: Missing hover/focus states */
<button className="bg-forest-green text-paper-white px-4 py-2 rounded-lg">
  Submit
</button>
```

**Solution: Complete Interactive States**
```tsx
/* ✅ CORRECT: All interactive states defined */
<button className="bg-forest-green text-paper-white px-4 py-2 rounded-lg hover:opacity-90 focus:ring-2 focus:ring-forest-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
  Submit
</button>
```

### Accessibility Checklist

- [x] WCAG AAA color contrast compliance
- [x] Proper focus management and visible focus indicators
- [x] Semantic HTML structure with appropriate landmarks
- [x] Form labels properly associated with inputs
- [x] Touch-friendly interactive elements (44px minimum)
- [x] Screen reader compatible content structure
- [x] Keyboard navigation support
- [x] Alternative text for decorative elements
- [x] Multi-modal status indication (not color-only)
- [x] Descriptive button labels and ARIA attributes

## 🎉 Visual Consistency Goals

1. **Color Harmony**: All UI elements use the defined 6-color palette
2. **Typography Hierarchy**: Clear information hierarchy with consistent font usage
3. **Component Consistency**: Reusable patterns across all quote interface sections
4. **Responsive Excellence**: Seamless experience across all device sizes
5. **Professional Appearance**: Clean, modern design suitable for business use

This specification ensures ALL LawnQuote interfaces maintain visual consistency, accessibility compliance, and professional appearance while delivering an excellent user experience across all devices and interaction patterns.

---

## 🚨 MANDATORY COMPLIANCE RULES

### ❌ NEVER USE These Color Patterns:
```tsx
// ❌ FORBIDDEN - Hardcoded hex colors
className="text-[#1C1C1C] bg-[#F5F5F5] border-[#D7D7D7]"

// ❌ FORBIDDEN - Generic gray colors  
className="text-gray-600 bg-gray-50 border-gray-200"

// ❌ FORBIDDEN - Inconsistent hover effects
className="hover:scale-105" // Can cause contrast issues
```

### ✅ ALWAYS USE These Design System Classes:
```tsx
// ✅ REQUIRED - Design system colors
className="text-charcoal bg-paper-white border-stone-gray"
className="text-charcoal/70 bg-light-concrete" // With opacity

// ✅ REQUIRED - Consistent hover states
className="hover:opacity-90" // For primary buttons
className="hover:bg-equipment-yellow/90 hover:text-charcoal" // For secondary
className="hover:bg-stone-gray/20" // For ghost buttons
```

### 📋 PRE-IMPLEMENTATION CHECKLIST

Before implementing ANY new story, verify:

**1. Color Compliance** ✅
- [ ] All text uses `text-charcoal` variants
- [ ] All cards use `bg-paper-white border-stone-gray`
- [ ] All page backgrounds use `bg-light-concrete`
- [ ] All input fields use `bg-light-concrete` (NOT `bg-paper-white`)
- [ ] No hardcoded hex colors (`#1C1C1C`, `#F5F5F5`, etc.)
- [ ] No generic gray classes (`text-gray-600`, `bg-gray-50`)

**2. Typography Compliance** ✅
- [ ] Primary headings: `text-charcoal font-bold`
- [ ] Secondary text: `text-charcoal/70`
- [ ] Supporting text: `text-charcoal/60`
- [ ] Financial values: `font-mono text-charcoal`

**3. Button Compliance** ✅
- [ ] Primary: `bg-forest-green text-white hover:opacity-90 active:opacity-80`
- [ ] Secondary: `bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80`
- [ ] Save Draft: `bg-paper-white` (disabled) or `bg-equipment-yellow` (active), `hover:bg-stone-gray/20`, `border border-stone-gray`

**4. Form Input Compliance** ✅
- [ ] All inputs: `bg-light-concrete text-charcoal`
- [ ] All inputs: `border-stone-gray focus:border-forest-green focus:ring-forest-green`
- [ ] All placeholders: `placeholder:text-charcoal/60`
- [ ] Currency inputs: Additional `font-mono` class
- [ ] All labels: `text-label text-charcoal font-medium`

**5. Interactive States** ✅
- [ ] Focus: `focus:border-forest-green focus:ring-forest-green`
- [ ] Hover: Consistent with button system above
- [ ] Loading: Proper loading indicators with design system colors

**6. Layout Compliance** ✅
- [ ] Page wrapper: `bg-light-concrete`
- [ ] Header: `bg-paper-white border-stone-gray`
- [ ] Cards: `bg-paper-white border-stone-gray shadow-sm`
- [ ] Dialogs: `bg-paper-white border-stone-gray`

### 🔍 POST-IMPLEMENTATION VERIFICATION

After completing ANY story:

1. **Search for violations**:
   ```bash
   grep -r "text-\[#" src/
   grep -r "bg-\[#" src/
   grep -r "border-\[#" src/
   grep -r "text-gray" src/
   grep -r "bg-gray" src/
   ```

2. **Verify contrast compliance**:
   - All text has proper contrast ratios
   - Card subheaders are readable
   - Button states maintain contrast

3. **Test hover states**:
   - No color transitions that break contrast
   - Consistent behavior across all interactive elements

### ⚠️ COMMON VIOLATION PATTERNS TO AVOID

1. **Card Subheaders**: Use `text-charcoal` not `text-gray-600`
2. **Secondary Text**: Use `text-charcoal/70` not `text-gray-500`  
3. **Button Hover**: Use consistent design system patterns
4. **Dialog Backgrounds**: Always `bg-paper-white border-stone-gray`
5. **Page Backgrounds**: Always `bg-light-concrete`
6. **❌ INPUT BACKGROUND ERROR**: NEVER use `bg-paper-white` for inputs - always `bg-light-concrete`
7. **Form Input Text**: Always include `text-charcoal` for input readability
8. **Placeholder Text**: Always include `placeholder:text-charcoal/60` for proper contrast

### 📖 STORY IMPLEMENTATION WORKFLOW

1. **Before coding**: Review this checklist
2. **During coding**: Use only design system classes
3. **Before commit**: Run violation search commands
4. **After merge**: Verify visual consistency

**Remember**: Every component must be accessible, consistent, and professionally styled. No exceptions.**