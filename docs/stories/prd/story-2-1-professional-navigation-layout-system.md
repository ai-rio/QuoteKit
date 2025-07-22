# Story 2.1: Professional Navigation & Layout System 🚧 PLANNED

As a user,  
I want a professional, intuitive navigation system,  
so that I can easily access all features and the application feels trustworthy and established.

## 🚧 Implementation Status: PLANNED
**Target**: Epic 2 Phase 1  
**Dependencies**: Epic 1 completion, HTML mockup analysis
**Status**: Ready for development

## Acceptance Criteria

1. A user sees a professional sidebar navigation matching the HTML mockups design pattern.  
2. The LawnQuote logo and branding are prominently displayed in the navigation header.  
3. The navigation includes clear icons and labels for Quotes, Item Library, and Settings.  
4. The active page is clearly indicated with visual highlighting (bg-white/20 pattern from mockups).  
5. The navigation is fully responsive, collapsing appropriately on mobile devices.  
6. Hover states and transitions provide smooth, professional interactions.  
7. The layout system supports the forest green (#2A3D2F) color scheme from mockups.  
8. A logout option is clearly available at the bottom of the navigation.  
9. The main content area adjusts properly with the sidebar navigation.

## Component Implementation

### Required Shadcn/UI Components:
- ✅ `avatar` - For user profile display in navigation (already installed)
- ✅ `button` - Navigation items and logout functionality (already installed)
- ✅ `separator` - Visual dividers in navigation sections
- ✅ `collapsible` - Mobile navigation collapse functionality
- ✅ `tooltip` - Helpful tooltips for navigation items

### Custom Components to Build:
```tsx
// Professional sidebar navigation
<AppSidebar>
  <SidebarHeader>
    <LawnQuoteLogo />
    <CompanyName>LawnQuote</CompanyName>
  </SidebarHeader>
  
  <SidebarNav>
    <NavItem href="/quotes" icon={FileText} active={pathname === '/quotes'}>
      Quotes
    </NavItem>
    <NavItem href="/items" icon={Package} active={pathname === '/items'}>
      Item Library
    </NavItem>
    <NavItem href="/settings" icon={Settings} active={pathname === '/settings'}>
      Settings
    </NavItem>
  </SidebarNav>
  
  <SidebarFooter>
    <LogoutButton />
  </SidebarFooter>
</AppSidebar>
```

### Implementation Pattern:
1. **Layout Structure**: Create AppLayout component wrapping sidebar + main content
2. **Navigation State**: Use Next.js usePathname() for active state management
3. **Responsive Design**: Implement mobile-first responsive patterns
4. **Brand Integration**: Custom SVG logo matching mockup specifications
5. **Color System**: Implement forest green theme variables
6. **Accessibility**: Keyboard navigation and screen reader support

### Key Features:
1. **Professional Appearance**: Match mockup visual quality and design patterns
2. **Brand Identity**: Implement LawnQuote logo and forest green color scheme
3. **Responsive Navigation**: Mobile-friendly collapsible sidebar
4. **Active State Management**: Clear visual indication of current page
5. **Smooth Interactions**: Professional hover and transition effects
6. **Accessibility**: WCAG AA compliant navigation

### Technical Implementation:
- Create custom CSS variables for forest green theme
- Implement responsive breakpoints for mobile/desktop
- Build reusable navigation components for consistency
- Integrate with existing authentication and routing
- Ensure compatibility with existing shadcn/ui components

### File Locations:
- `src/components/layout/AppLayout.tsx` - Main layout wrapper
- `src/components/layout/AppSidebar.tsx` - Professional sidebar navigation
- `src/components/layout/AppHeader.tsx` - Context-aware page headers
- `src/components/branding/LawnQuoteLogo.tsx` - Custom logo component
- `src/styles/theme.css` - Forest green color scheme variables

## Integration Points

**Authentication Integration**: Seamlessly integrate with existing Supabase Auth system for user state and logout functionality.

**Routing Integration**: Work with existing Next.js App Router structure and maintain current page organization.

**Existing Features**: Ensure all Epic 1 features (settings, items, quotes, PDF generation) work seamlessly with new navigation.

**Mobile Experience**: Provide professional mobile navigation that maintains all functionality on smaller screens.

This story establishes the visual and navigational foundation for all subsequent Epic 2 enhancements, transforming the application's professional appearance and user experience.