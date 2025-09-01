# QuoteKit UI Components Context

## Component Architecture for Landscaping Business

### Mandatory shadcn/ui v4 MCP Usage
**CRITICAL**: Always use `mcp__shadcn-ui-v4__get_component` before ANY UI work:
```bash
# Never build components manually - always use MCP tools
mcp__shadcn-ui-v4__list_components
mcp__shadcn-ui-v4__get_component componentName="button"
mcp__shadcn-ui-v4__get_component_demo componentName="dialog"
```

### QuoteKit Landscaping Component Organization

#### Business Feature Components (`src/features/*/components/`)
- **Assessments**: `PropertyMeasurements`, `ConditionEvaluation`, `AssessmentForm`
- **Quotes**: `QuoteBuilder`, `PricingCalculator`, `QuoteStatusBadge`  
- **Clients**: `ClientProfile`, `PropertySelector`, `ContactForm`
- **Pricing**: `ConditionMultipliers`, `ServicePricing`, `ProfitabilityMetrics`

#### Shared UI Components (`src/components/ui/`)
- **Base**: shadcn/ui v4 components (Button, Dialog, Card, etc.)
- **Business**: `PricingDisplay`, `StatusIndicator`, `PropertyCard`
- **Forms**: `AssessmentField`, `QuoteLineItem`, `ClientInput`

#### Landscaping-Specific Patterns
```tsx
// Use CVA for landscaping business variants
const quoteStatusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800", 
        accepted: "bg-green-100 text-green-800",
        converted: "bg-purple-100 text-purple-800"
      }
    }
  }
)
```

## QuoteKit Style Guide Compliance

### Color Palette (Landscaping Theme)
```css
/* Primary landscaping colors */
--forest-green: #228B22    /* Headings, primary actions */
--charcoal: #36454F        /* Body text, secondary text */
--equipment-yellow: #FFD700 /* Highlights, warnings */
--paper-white: #FFFEF7     /* Backgrounds, cards */

/* Status colors for quotes/assessments */
--success-green: #10B981   /* Completed, approved */
--warning-amber: #F59E0B   /* Pending, in-review */
--error-red: #EF4444       /* Failed, declined */
```

### Typography Standards
```css
/* Landscaping business typography */
.heading-primary { color: var(--forest-green); font-weight: 600; }
.text-body { color: var(--charcoal); line-height: 1.6; }
.text-financial { font-family: 'JetBrains Mono', monospace; }
.text-status { font-weight: 500; text-transform: uppercase; }
```

### Component Requirements

#### Interactive Elements
- **ALL interactive elements MUST have tooltips**:
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

<Tooltip>
  <TooltipTrigger asChild>
    <Button>Calculate Quote</Button>
  </TooltipTrigger>
  <TooltipContent>Generate professional landscaping quote with current pricing</TooltipContent>
</Tooltip>
```

#### Mobile-First Landscaping UI
- **Touch targets**: Minimum 44px for field use on tablets
- **Quote forms**: Single-column layout on mobile
- **Assessment photos**: Optimized image display for property documentation

## Component Creation Workflow

### 1. Always Start with shadcn/ui v4 MCP
```bash
# Check available components first
mcp__shadcn-ui-v4__list_components

# Get base component with demo
mcp__shadcn-ui-v4__get_component componentName="card"
mcp__shadcn-ui-v4__get_component_demo componentName="card"
```

### 2. Apply QuoteKit Landscaping Customizations
- Add forest-green/charcoal color scheme
- Include landscaping business context (quotes, assessments, properties)
- Implement proper TypeScript with QuoteKit domain types
- Add required tooltips for professional UX

### 3. Component Testing Standards
```bash
# Test component with landscaping data
bun test src/components/ui/PricingDisplay.test.tsx

# Visual regression testing
bun run test:e2e -- --grep="component.*visual"

# Accessibility compliance (WCAG AAA)
bunx axe-core src/components/ui/
```

## Common Component Patterns

### Landscaping Business Card Layout
```tsx
<Card className="border-forest-green/20">
  <CardHeader className="bg-paper-white">
    <CardTitle className="text-forest-green">Property Assessment</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Assessment fields with condition indicators */}
  </CardContent>
</Card>
```

### Quote Status Flow Components
- `QuoteStatusBadge` - Visual status indicator
- `QuoteProgressBar` - Multi-step workflow progress  
- `QuoteActionButtons` - Context-aware action buttons
- `QuotePricingBreakdown` - Professional pricing display

### Assessment Form Components
- `PropertyConditionSelector` - Lawn/soil/irrigation conditions
- `ObstacleMapper` - Property obstacle documentation
- `MediaUploader` - Property photo/video capture
- `ConditionNotes` - Detailed assessment notes

## Accessibility Standards

### Landscaping Business Accessibility
- **WCAG AAA contrast**: All text meets highest contrast standards
- **Keyboard navigation**: Full quote/assessment form keyboard support
- **Screen reader support**: Proper ARIA labels for pricing data
- **Color independence**: Status not communicated by color alone

### Form Accessibility
```tsx
// Proper labeling for assessment forms
<FormField>
  <FormLabel htmlFor="lawn-condition">Lawn Condition Assessment</FormLabel>
  <Select>
    <SelectTrigger id="lawn-condition" aria-describedby="lawn-help">
      <SelectValue placeholder="Select lawn condition" />
    </SelectTrigger>
  </Select>
  <FormDescription id="lawn-help">
    Rate overall lawn health from excellent (1.0x) to poor (1.6x pricing)
  </FormDescription>
</FormField>
```

## Quality Checklist

Before committing any component:
- [ ] Used `mcp__shadcn-ui-v4__get_component` (never manual creation)
- [ ] Applied QuoteKit landscaping color palette
- [ ] Added tooltips to all interactive elements  
- [ ] Implemented proper TypeScript with domain types
- [ ] Mobile-responsive for field use (44px touch targets)
- [ ] WCAG AAA accessibility compliance
- [ ] Tested with realistic landscaping business data
- [ ] Includes proper error states and loading indicators