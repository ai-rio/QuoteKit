# Admin Section Button Style Guide Compliance Fix

## Overview
This document outlines the comprehensive fix for all admin section buttons to ensure 100% compliance with `docs/templates/html/style-guide.md`.

## Button Style Guide Requirements

### Primary Action Buttons (Forest Green)
```jsx
className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
```

### Secondary/Outline Buttons
```jsx
className="bg-paper-white border border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
```

### Equipment Yellow CTA Buttons
```jsx
className="bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200"
```

### Small Buttons
```jsx
className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 py-2 rounded-lg transition-all duration-200"
```

## Files to Fix

### 1. Admin Dashboard (`src/app/(admin)/admin-dashboard/page.tsx`)

**Issues Found:**
- Quick Actions buttons missing proper hover states
- Some buttons using `hover:opacity-90` instead of proper color transitions
- Missing `transition-all duration-200`

**Fixes Required:**
- Update all Quick Actions buttons to use proper Forest Green/Equipment Yellow styling
- Add proper transition classes
- Ensure consistent `font-bold` usage

### 2. Customers Page (`src/app/(admin)/customers/page.tsx`)

**Issues Found:**
- "Retry Payment" button missing proper styling
- Action buttons in mobile cards need style guide compliance
- Dropdown menu buttons need proper styling

**Fixes Required:**
- Update all action buttons to use style guide patterns
- Fix mobile card button styling
- Ensure proper hover states

### 3. Users Overview (`src/app/(admin)/users/overview/page.tsx`)

**Issues Found:**
- Export Data button using correct Equipment Yellow but missing some classes
- Add User button correct but could be enhanced
- Edit buttons in table need proper styling
- Pagination buttons need style guide compliance

**Fixes Required:**
- Ensure all buttons have proper padding and transitions
- Update table action buttons
- Fix pagination button styling

## Implementation Plan

1. **Phase 1**: Fix Admin Dashboard buttons
2. **Phase 2**: Fix Customers page buttons  
3. **Phase 3**: Fix Users Overview buttons
4. **Phase 4**: Check remaining admin pages
5. **Phase 5**: Verify compliance across all admin sections

## Style Guide Compliance Checklist

For each button, verify:
- [ ] Uses `font-bold` (not `font-medium` or `font-semibold`)
- [ ] Uses proper color combinations (Forest Green, Equipment Yellow, or Outline)
- [ ] Uses `rounded-lg` (not `rounded` or other variants)
- [ ] Uses `transition-all duration-200`
- [ ] Has proper hover states
- [ ] Uses correct padding (`px-6 py-3` for normal, `px-4 py-2` for small)
- [ ] Includes `shadow-lg` for primary buttons

## Expected Outcome

After implementation:
- ✅ All admin buttons follow consistent style guide patterns
- ✅ Professional appearance matching the "Pro-Grade Kit" identity
- ✅ Proper accessibility with WCAG AAA compliant colors
- ✅ Consistent user experience across all admin pages
- ✅ Enhanced visual hierarchy and brand alignment
