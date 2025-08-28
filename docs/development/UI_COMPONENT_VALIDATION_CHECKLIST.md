# UI Component Validation Checklist: QuoteKit Quality Assurance

**Objective**: Provide a comprehensive validation checklist to ensure every UI component meets QuoteKit standards for consistency, accessibility, and user experience.

**Usage**: Run this checklist BEFORE submitting any UI component for review or deployment.

---

## 🔍 PRE-DEVELOPMENT VALIDATION

### **shadcn/ui v4 Tool Usage** ✅ MANDATORY

**Discovery Phase:**
- [ ] Ran `mcp__shadcn-ui-v4__list_components` to see available components
- [ ] Ran `mcp__shadcn-ui-v4__list_blocks` for complex layout requirements  
- [ ] Identified specific shadcn/ui components that meet requirements
- [ ] Checked for existing blocks with `mcp__shadcn-ui-v4__list_blocks category="..."`

**Component Retrieval:**
- [ ] Retrieved component source: `mcp__shadcn-ui-v4__get_component componentName="..."`
- [ ] Retrieved usage demos: `mcp__shadcn-ui-v4__get_component_demo componentName="..."`
- [ ] Retrieved blocks if needed: `mcp__shadcn-ui-v4__get_block blockName="..."`
- [ ] Reviewed component metadata: `mcp__shadcn-ui-v4__get_component_metadata componentName="..."`

**❌ FAILURE CONDITIONS:**
- Component built manually without using shadcn/ui v4 tools
- shadcn/ui components modified instead of styled with className
- Tools skipped and component created from scratch

---

## 🎨 STYLE GUIDE COMPLIANCE

### **Typography Hierarchy** ✅ MANDATORY

**Headings:**
- [ ] H1 uses: `text-4xl md:text-6xl font-black text-forest-green`
- [ ] H2 uses: `text-3xl md:text-4xl font-black text-forest-green`  
- [ ] H3 uses: `text-xl md:text-2xl font-bold text-forest-green`
- [ ] Card titles use: `text-xl md:text-2xl font-bold text-forest-green`
- [ ] Section headings use: `text-lg font-bold text-forest-green`

**Body Text:**
- [ ] Primary text uses: `text-lg text-charcoal` (minimum)
- [ ] Secondary text uses: `text-base text-charcoal`
- [ ] Small text (if necessary) uses: `text-sm text-charcoal` (avoid when possible)
- [ ] Never uses text smaller than `text-sm` (14px minimum)

**Special Text Types:**
- [ ] Financial amounts use: `font-mono font-medium text-forest-green text-lg`
- [ ] Dates/timestamps use: `font-mono text-charcoal text-base`
- [ ] Status indicators use: `font-medium text-charcoal`
- [ ] Error text uses: `text-red-600 font-medium`

**❌ FAILURE CONDITIONS:**
- Any text uses colors outside QuoteKit palette
- Financial data without `font-mono`
- Headings not using `text-forest-green`
- Text smaller than 14px (`text-sm`)

### **Color Palette Compliance** ✅ MANDATORY

**Approved Colors Only:**
- [ ] Forest Green (`#2D5016`): Primary brand, headings, primary buttons
- [ ] Equipment Yellow (`#F4C430`): Secondary CTAs, highlights, warnings
- [ ] Charcoal (`#36454F`): Body text, icons, secondary elements
- [ ] Paper White (`#FAFAFA`): Backgrounds, card backgrounds
- [ ] Stone Gray (`#8B8680`): Borders, dividers, subtle elements  
- [ ] Light Concrete (`#F5F5F5`): Hover states, disabled elements

**Color Usage Rules:**
- [ ] Primary text: `text-charcoal` (never `text-gray-*`)
- [ ] Headings: `text-forest-green` (never `text-black` or `text-gray-*`)
- [ ] Icons: `text-charcoal` (consistent with text)
- [ ] Financial data: `text-forest-green` (emphasizes importance)
- [ ] Backgrounds: `bg-paper-white` (never pure white)

**❌ FAILURE CONDITIONS:**
- Any Tailwind gray colors (`text-gray-500`, `bg-gray-100`, etc.)
- Custom hex colors outside approved palette
- Poor contrast combinations
- Inconsistent color usage across similar elements

### **Component Styling Standards** ✅ MANDATORY

**Cards:**
- [ ] Uses: `bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg`
- [ ] Header padding: `p-8`
- [ ] Content padding: `p-8 pt-0`
- [ ] Consistent spacing between cards: `space-y-6`

**Buttons:**
- [ ] Primary: `bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg`
- [ ] Secondary: `bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200`
- [ ] CTA: `bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200`
- [ ] All buttons use `font-bold`
- [ ] All buttons use `rounded-lg`
- [ ] All buttons have proper hover states
- [ ] All buttons have `transition-all duration-200`

**Form Elements:**
- [ ] Inputs: `border-stone-gray/30 focus:border-forest-green focus:ring-forest-green/20 text-charcoal text-base px-4 py-3 rounded-lg`
- [ ] Labels: `text-charcoal font-medium text-base`
- [ ] Form spacing: `space-y-4` for form groups
- [ ] Form validation states properly styled

**❌ FAILURE CONDITIONS:**
- Buttons without proper hover states
- Cards without rounded corners or shadows
- Form elements without focus states
- Inconsistent spacing patterns

---

## ♿ ACCESSIBILITY COMPLIANCE

### **WCAG AAA Standards** ✅ MANDATORY

**Color Contrast:**
- [ ] Forest Green text on Paper White background: 4.5:1+ ratio
- [ ] Charcoal text on Paper White background: 4.5:1+ ratio
- [ ] All text meets WCAG AAA contrast requirements
- [ ] Tested with color contrast analyzer tool

**Keyboard Navigation:**
- [ ] All interactive elements are keyboard accessible
- [ ] Proper tab order throughout component
- [ ] Focus indicators visible and styled consistently
- [ ] No keyboard traps

**Screen Reader Support:**
- [ ] Proper semantic HTML elements used
- [ ] ARIA labels on complex interactions
- [ ] Alt text on all images
- [ ] Proper heading hierarchy (H1 → H2 → H3)

**Touch/Mobile Accessibility:**
- [ ] Minimum 44px touch targets for all interactive elements
- [ ] Proper spacing between touch targets (8px minimum)
- [ ] Gestures have keyboard/mouse alternatives
- [ ] Component works properly on mobile devices

**❌ FAILURE CONDITIONS:**
- Touch targets smaller than 44px
- Missing ARIA labels on complex components
- Poor color contrast ratios
- Keyboard navigation broken

---

## 💡 USER EXPERIENCE VALIDATION

### **Tooltip Requirements** ✅ MANDATORY

**Interactive Element Coverage:**
- [ ] Every button has descriptive tooltip explaining action
- [ ] Every icon has tooltip explaining meaning
- [ ] Form fields have helpful tooltips where appropriate
- [ ] Complex UI elements have contextual help tooltips

**Tooltip Implementation:**
- [ ] Uses shadcn/ui Tooltip component: `mcp__shadcn-ui-v4__get_component componentName="tooltip"`
- [ ] Proper TooltipProvider wrapper around component
- [ ] Tooltip content is descriptive and helpful
- [ ] Tooltips don't interfere with mobile usage

**Tooltip Content Quality:**
- [ ] Action tooltips: "Click to [action]" or "Opens [destination]"
- [ ] Info tooltips: Provide context or additional information
- [ ] Status tooltips: Explain current state or condition
- [ ] Help tooltips: Guide user on how to use feature

**❌ FAILURE CONDITIONS:**
- Interactive elements without tooltips
- Tooltip content is generic or unhelpful
- Tooltips cause mobile usability issues
- Missing TooltipProvider wrapper

### **Loading and Error States** ✅ MANDATORY

**Loading States:**
- [ ] Button loading states with proper disabled styling
- [ ] Form submission loading indicators
- [ ] Data loading states with skeletons or spinners
- [ ] Loading states don't break layout

**Error States:**
- [ ] Clear error messaging with actionable solutions
- [ ] Error styling consistent with design system
- [ ] Form validation errors properly placed and styled
- [ ] Network errors handled gracefully

**Empty States:**
- [ ] Meaningful empty state messaging
- [ ] Clear call-to-action for empty states
- [ ] Proper illustration or icon for context
- [ ] Maintains layout structure when empty

**❌ FAILURE CONDITIONS:**
- Loading states that break layout
- Generic or unclear error messages
- Missing empty state handling
- Inconsistent error styling

---

## 📱 RESPONSIVE DESIGN VALIDATION

### **Mobile-First Approach** ✅ MANDATORY

**Breakpoint Testing:**
- [ ] Component works properly on mobile (320px-768px)
- [ ] Component adapts well on tablet (768px-1024px)  
- [ ] Component displays correctly on desktop (1024px+)
- [ ] No horizontal scrolling on any device

**Typography Scaling:**
- [ ] Text sizes scale appropriately across devices
- [ ] Headings use responsive sizing (`text-xl md:text-2xl`)
- [ ] Line height maintains readability on mobile
- [ ] Text doesn't overflow containers on small screens

**Layout Adaptation:**
- [ ] Cards stack properly on mobile
- [ ] Tables have horizontal scroll or mobile-friendly alternative
- [ ] Forms remain usable on mobile devices
- [ ] Navigation components collapse appropriately

**Touch Optimization:**
- [ ] 44px minimum touch targets
- [ ] Adequate spacing between interactive elements
- [ ] Gestures work properly on touch devices
- [ ] No hover-dependent functionality without alternatives

**❌ FAILURE CONDITIONS:**
- Component breaks on mobile devices
- Text too small to read on mobile
- Touch targets too small for mobile use
- Horizontal scrolling required

---

## ⚡ PERFORMANCE VALIDATION

### **Component Performance** ✅ MANDATORY

**Bundle Size:**
- [ ] Component uses tree-shakable imports
- [ ] No unnecessary dependencies imported
- [ ] Optimal component splitting and code organization
- [ ] Dynamic imports for heavy components when appropriate

**Runtime Performance:**
- [ ] No unnecessary re-renders
- [ ] Proper React key attributes for lists
- [ ] Optimal use of useMemo and useCallback when needed
- [ ] No console errors or warnings

**Image and Asset Optimization:**
- [ ] Images properly optimized and sized
- [ ] Icons use SVG or icon library
- [ ] No large assets loaded unnecessarily
- [ ] Proper lazy loading for images

**❌ FAILURE CONDITIONS:**
- Component causes performance bottlenecks
- Unnecessary bundle size increases
- Runtime errors or warnings in console
- Poor Core Web Vitals scores

---

## 🔧 TECHNICAL IMPLEMENTATION VALIDATION

### **TypeScript Compliance** ✅ MANDATORY

**Type Safety:**
- [ ] All props properly typed with TypeScript interfaces
- [ ] No `any` types used
- [ ] Proper return types for all functions
- [ ] Component exports properly typed

**Code Quality:**
- [ ] Follows established code conventions
- [ ] Proper error handling implemented
- [ ] No deprecated patterns or anti-patterns
- [ ] Clean, readable, and maintainable code

**Integration:**
- [ ] Properly integrates with existing QuoteKit architecture
- [ ] Uses established state management patterns
- [ ] Follows project folder structure
- [ ] Compatible with existing components and systems

**❌ FAILURE CONDITIONS:**
- TypeScript compilation errors
- Runtime JavaScript errors
- Integration breaks existing functionality
- Code doesn't follow project conventions

---

## 📋 FINAL VALIDATION CHECKLIST

### **Pre-Deployment Final Check** ✅ ALL REQUIRED

**Documentation:**
- [ ] Component has proper JSDoc comments
- [ ] Usage examples provided where complex
- [ ] Props interface documented
- [ ] Special usage notes documented

**Testing:**
- [ ] Component tested across all target browsers
- [ ] Mobile testing completed on real devices
- [ ] Accessibility testing with screen reader
- [ ] Performance impact assessed

**Integration Testing:**
- [ ] Component works with existing QuoteKit components
- [ ] No conflicts with global styles
- [ ] State management integration working
- [ ] API integration working properly

**Quality Assurance:**
- [ ] Code review completed
- [ ] Design review completed
- [ ] All validation checklist items passed
- [ ] No known issues or technical debt introduced

**❌ DEPLOYMENT BLOCKED IF:**
- Any mandatory checklist item fails
- Accessibility requirements not met
- Performance significantly degraded
- Integration tests failing

---

## 🎯 VALIDATION SCORING

### **Component Quality Score**

**Calculate score based on checklist completion:**

- **90-100%**: ✅ **Excellent** - Ready for deployment
- **80-89%**: ⚠️ **Good** - Minor improvements needed
- **70-79%**: ❌ **Needs Work** - Significant improvements required
- **Below 70%**: 🚫 **Not Ready** - Major rework needed

**Scoring Categories:**
- shadcn/ui v4 Tool Usage: 25 points
- Style Guide Compliance: 25 points
- Accessibility Compliance: 20 points
- User Experience: 15 points
- Technical Implementation: 15 points

### **Quality Gates**

**Gate 1: Tool Usage** 🚪
- Must score 100% on shadcn/ui v4 tool usage
- Zero tolerance for manual component creation

**Gate 2: Style Guide** 🚪  
- Must score 90%+ on style guide compliance
- All colors must be from approved palette

**Gate 3: Accessibility** 🚪
- Must score 90%+ on accessibility checklist
- WCAG AAA compliance required

**Gate 4: User Experience** 🚪
- Must score 85%+ on UX validation
- All interactive elements must have tooltips

---

## 📚 QUICK REFERENCE

### **Common Failure Points**
1. **Skipping shadcn/ui v4 tools** - Always use MCP tools first
2. **Wrong colors** - Only use QuoteKit approved palette
3. **Missing tooltips** - Every interactive element needs tooltip
4. **Poor mobile experience** - Test on actual mobile devices
5. **Accessibility gaps** - Run screen reader and contrast tests

### **Success Formula**
```
✅ shadcn/ui v4 tools + 
✅ QuoteKit styling + 
✅ Accessibility compliance + 
✅ Comprehensive tooltips + 
✅ Mobile optimization = 
✅ High-quality QuoteKit component
```

### **Emergency Checklist** (Minimum viable validation)
- [ ] Used shadcn/ui v4 tools (not manual creation)
- [ ] Applied QuoteKit colors only (forest-green, charcoal, etc.)  
- [ ] Added tooltips to all buttons and icons
- [ ] Tested on mobile device
- [ ] Verified accessibility with keyboard navigation

**Remember**: This checklist exists to prevent the recurring UI consistency issues. Every agent must complete this validation before any UI component is considered complete.