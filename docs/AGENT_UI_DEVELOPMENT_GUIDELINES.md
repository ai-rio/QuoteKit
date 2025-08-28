# Agent UI Development Guidelines: QuoteKit Style Guide Enforcement

**Objective**: Prevent UI consistency issues by enforcing mandatory use of shadcn/ui v4 tools and QuoteKit style guide compliance across all AI agents.

**Critical Rule**: **NEVER build components manually**. Always use shadcn/ui v4 MCP tools first.

---

## 🚫 PROHIBITED ACTIONS

### **❌ Manual Component Creation**
```typescript
// NEVER DO THIS - Manual component creation
const CustomButton = ({ children, ...props }) => {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded">
      {children}
    </button>
  );
};

// NEVER DO THIS - Manual form building
const ContactForm = () => {
  return (
    <form className="space-y-4">
      <input type="text" className="border rounded px-3 py-2" />
      <button type="submit" className="bg-green-500 text-white px-4 py-2">
        Submit
      </button>
    </form>
  );
};
```

### **❌ Style Guide Violations**
```typescript
// NEVER DO THIS - Wrong colors and typography
<h1 className="text-2xl text-gray-600">           // Wrong: Should be text-4xl md:text-6xl font-black text-forest-green
<p className="text-sm text-gray-500">             // Wrong: Should be text-lg text-charcoal
<button className="bg-blue-500 text-white">       // Wrong: Should use forest-green or equipment-yellow
```

---

## ✅ MANDATORY WORKFLOW

### **Step 1: ALWAYS Use shadcn/ui v4 Tools First**

**Before ANY UI work, run these commands:**

```bash
# 1. List available components
mcp__shadcn-ui-v4__list_components

# 2. List available blocks for complex UI
mcp__shadcn-ui-v4__list_blocks

# 3. Get specific component when needed
mcp__shadcn-ui-v4__get_component componentName="button"

# 4. Get component demo for usage examples
mcp__shadcn-ui-v4__get_component_demo componentName="button"
```

### **Step 2: Component Selection Priority**

1. **First Priority**: Use existing shadcn/ui components
2. **Second Priority**: Use shadcn/ui blocks for complex layouts
3. **Last Resort**: Extend existing components (never create from scratch)

### **Step 3: Style Guide Compliance Validation**

Every component MUST pass this checklist:

**Typography ✅**
- [ ] H1: `text-4xl md:text-6xl font-black text-forest-green`
- [ ] H2: `text-3xl md:text-4xl font-black text-forest-green`  
- [ ] H3: `text-xl md:text-2xl font-bold text-forest-green`
- [ ] Body: `text-lg text-charcoal` (minimum)
- [ ] Financial data: `font-mono text-forest-green`

**Colors ✅**
- [ ] Primary text: `text-charcoal`
- [ ] Headings: `text-forest-green`
- [ ] Primary buttons: `bg-forest-green hover:bg-forest-green/90`
- [ ] CTA buttons: `bg-equipment-yellow hover:bg-equipment-yellow/90`
- [ ] Icons: `text-charcoal`

**Components ✅**
- [ ] Cards: `rounded-2xl border border-stone-gray/20 shadow-lg`
- [ ] Buttons: `font-bold px-6 py-3 rounded-lg transition-all duration-200`
- [ ] All interactive elements have tooltips
- [ ] 44px minimum touch targets for mobile

---

## 🛠️ REQUIRED TOOL USAGE PATTERNS

### **Forms Development**
```bash
# MANDATORY: Use these commands for forms
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="select"
mcp__shadcn-ui-v4__get_component componentName="textarea"
```

### **Data Display**
```bash
# MANDATORY: Use these commands for data display
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__list_blocks category="dashboard"
```

### **Navigation Components**
```bash
# MANDATORY: Use these commands for navigation
mcp__shadcn-ui-v4__get_component componentName="breadcrumb"
mcp__shadcn-ui-v4__get_component componentName="navigation-menu"
mcp__shadcn-ui-v4__get_component componentName="tabs"
```

### **Complex Layouts**
```bash
# MANDATORY: Use blocks for complex layouts
mcp__shadcn-ui-v4__list_blocks
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01" 
```

---

## 📋 COMPONENT USAGE ENFORCEMENT

### **Button Components**
```typescript
// ✅ CORRECT: Use shadcn Button with QuoteKit styling
import { Button } from "@/components/ui/button"

<Button 
  className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
>
  Primary Action
</Button>

<Button 
  variant="outline"
  className="bg-paper-white border-stone-gray text-charcoal hover:bg-light-concrete font-bold px-6 py-3 rounded-lg transition-all duration-200"
>
  Secondary Action
</Button>
```

### **Card Components**
```typescript
// ✅ CORRECT: Use shadcn Card with QuoteKit styling
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
  <CardHeader className="p-8">
    <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="p-8 pt-0">
    <p className="text-lg text-charcoal">Card content here</p>
  </CardContent>
</Card>
```

### **Form Components**
```typescript
// ✅ CORRECT: Use shadcn Form components with QuoteKit styling
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label className="text-charcoal font-medium text-base">
    Field Label
  </Label>
  <Input 
    className="border-stone-gray/30 focus:border-forest-green focus:ring-forest-green/20 text-charcoal text-base px-4 py-3 rounded-lg"
    placeholder="Enter value..."
  />
</div>
```

---

## 🎯 TOOLTIP ENFORCEMENT

**MANDATORY**: Every interactive element MUST have a tooltip.

### **Required Tooltip Patterns**
```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ✅ CORRECT: All buttons have tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button className="...">Action</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Explains what this action does</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// ✅ CORRECT: All icons have tooltips  
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-charcoal" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Additional information about this field</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### **Tooltip Content Guidelines**
- **Action tooltips**: Describe what happens when clicked
- **Info tooltips**: Provide context or help information  
- **Status tooltips**: Explain current state or condition
- **Navigation tooltips**: Describe destination or purpose

---

## 🔍 PRE-IMPLEMENTATION CHECKLIST

**Before writing ANY UI code, complete this checklist:**

### **Research Phase** ✅
- [ ] Ran `mcp__shadcn-ui-v4__list_components` to see available components
- [ ] Ran `mcp__shadcn-ui-v4__list_blocks` to see available blocks
- [ ] Identified which shadcn/ui components meet requirements
- [ ] Reviewed component demos with `mcp__shadcn-ui-v4__get_component_demo`

### **Component Selection** ✅ 
- [ ] Selected appropriate shadcn/ui components (no manual creation)
- [ ] Retrieved component source code with `mcp__shadcn-ui-v4__get_component`
- [ ] Planned component composition using shadcn/ui building blocks
- [ ] Identified any necessary style guide customizations

### **Style Guide Validation** ✅
- [ ] Typography follows QuoteKit hierarchy (forest-green headings, charcoal text)
- [ ] Colors comply with palette (forest-green, equipment-yellow, charcoal, paper-white)
- [ ] Buttons follow style guide patterns (font-bold, rounded-lg, transitions)
- [ ] Cards use proper styling (rounded-2xl, shadow-lg, proper padding)
- [ ] Financial data uses `font-mono text-forest-green`

### **Accessibility & UX** ✅
- [ ] All interactive elements have tooltips
- [ ] Touch targets are minimum 44px for mobile
- [ ] Color contrast meets WCAG AAA standards
- [ ] Component is keyboard accessible
- [ ] Loading and error states are handled

---

## 🚨 ENFORCEMENT MECHANISMS

### **Code Review Automation**
Every component must pass automated validation:

```typescript
// Add to component files - MANDATORY validation
interface ComponentValidation {
  usesSchadcnUI: boolean;          // Must be true
  followsStyleGuide: boolean;      // Must be true  
  hasTooltips: boolean;           // Must be true
  meetsAccessibility: boolean;     // Must be true
}
```

### **Agent Task Templates**
**Use this template for ALL UI tasks:**

```markdown
## UI Task: [Component Name]

### 1. shadcn/ui Research ✅
- [ ] Listed available components: `mcp__shadcn-ui-v4__list_components`
- [ ] Retrieved component: `mcp__shadcn-ui-v4__get_component componentName="..."`
- [ ] Reviewed demo: `mcp__shadcn-ui-v4__get_component_demo componentName="..."`

### 2. Style Guide Compliance ✅
- [ ] Typography: forest-green headings, charcoal text, proper sizes
- [ ] Colors: QuoteKit palette only
- [ ] Components: rounded-2xl cards, font-bold buttons
- [ ] Financial data: font-mono text-forest-green

### 3. Implementation ✅
- [ ] Built using shadcn/ui components only
- [ ] Added required tooltips to all interactive elements
- [ ] Tested accessibility and mobile responsiveness
- [ ] Validated against style guide checklist

### 4. Quality Assurance ✅
- [ ] No manual component creation
- [ ] All colors from approved palette
- [ ] Typography hierarchy correct
- [ ] Tooltips functional and informative
```

---

## 📖 REFERENCE COMMANDS

### **Essential shadcn/ui v4 Commands**
```bash
# Always start with these
mcp__shadcn-ui-v4__list_components              # See all available components
mcp__shadcn-ui-v4__list_blocks                  # See all available blocks
mcp__shadcn-ui-v4__get_directory_structure      # Understand shadcn/ui structure

# For specific components
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component componentName="card"  
mcp__shadcn-ui-v4__get_component componentName="form"
mcp__shadcn-ui-v4__get_component componentName="input"
mcp__shadcn-ui-v4__get_component componentName="table"
mcp__shadcn-ui-v4__get_component componentName="tooltip"

# For complex layouts
mcp__shadcn-ui-v4__get_block blockName="dashboard-01"
mcp__shadcn-ui-v4__get_block blockName="sidebar-01"
mcp__shadcn-ui-v4__get_block blockName="calendar-01"

# For usage examples
mcp__shadcn-ui-v4__get_component_demo componentName="button"
mcp__shadcn-ui-v4__get_component_metadata componentName="button"
```

### **QuoteKit Style Guide Colors**
```css
/* MANDATORY color palette - NO other colors allowed */
--forest-green: #2D5016      /* Primary brand, headings, CTAs */
--equipment-yellow: #F4C430   /* Secondary CTAs, highlights */  
--charcoal: #36454F          /* Body text, icons */
--paper-white: #FAFAFA       /* Backgrounds, cards */
--stone-gray: #8B8680        /* Borders, subtle elements */
--light-concrete: #F5F5F5    /* Hover states, disabled */
```

---

## ⚡ QUICK START TEMPLATE

**Copy this template for every UI task:**

```typescript
// 1. MANDATORY: Get shadcn/ui component first
// mcp__shadcn-ui-v4__get_component componentName="[COMPONENT_NAME]"

// 2. Import shadcn/ui components
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// 3. Apply QuoteKit styling patterns
export function MyComponent() {
  return (
    <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
      <CardHeader className="p-8">
        <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
          Component Title
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <p className="text-lg text-charcoal mb-6">
          Component description here
        </p>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg">
                Primary Action
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Explains what this button does</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
```

---

## 🎯 SUCCESS CRITERIA

**Every UI component MUST achieve:**

### **Technical Compliance** ✅
- Built using shadcn/ui v4 components (verified with MCP tools)
- Zero manual component creation
- All imports from `@/components/ui/`
- TypeScript strict mode compliance

### **Style Guide Compliance** ✅  
- Typography hierarchy: forest-green headings, charcoal text
- Color palette: only approved QuoteKit colors
- Component styling: rounded-2xl cards, font-bold buttons
- Financial data: font-mono text-forest-green

### **User Experience** ✅
- Tooltips on all interactive elements
- 44px minimum touch targets
- WCAG AAA color contrast  
- Keyboard navigation support
- Loading and error states

### **Maintainability** ✅
- Consistent component patterns across app
- Reusable styling through utility classes
- Clear component hierarchy and organization
- Documentation of custom styling decisions

---

**Remember: The goal is to prevent UI inconsistency by making shadcn/ui v4 tool usage MANDATORY and style guide compliance AUTOMATIC. Every agent must follow these guidelines without exception.**