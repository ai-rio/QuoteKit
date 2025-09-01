# QuoteKit Testing Context - Landscaping Business Workflows

## Testing Strategy for Landscaping SaaS

### Testing Architecture Overview
QuoteKit uses a comprehensive testing approach for landscaping business workflows:

- **Unit Tests (Jest)**: Business logic, pricing calculations, assessments
- **Integration Tests**: Assessment-to-quote conversion, payment processing
- **E2E Tests (Playwright)**: Complete landscaping workflows, client interactions
- **Component Tests**: UI components with landscaping business data

### Landscaping-Specific Testing Scenarios

#### Property Assessment Testing
```bash
# Test property condition evaluation with realistic data
bun test src/features/assessments/ --grep="property.*condition"

# Test assessment-to-quote pricing conversion
bun test --grep="assessment.*quote.*integration"

# Test condition-based pricing multipliers (1.1x-1.6x)
bun test src/features/quotes/pricing-engine/PropertyConditionPricing.ts
```

#### Quote Workflow Testing  
```bash
# Test complete quote lifecycle: draft → sent → accepted → converted
bun test --grep="quote.*status.*transition"

# Test professional PDF generation with landscaping branding
bun test src/features/quotes/email-actions.ts

# Test bulk quote operations for landscaping businesses
bun test --grep="bulk.*quote.*operations"
```

#### Payment Integration Testing
```bash
# Test B2B Stripe payment processing for landscaping subscriptions
bun run stripe:check && bun test --grep="stripe.*landscaping"

# Test webhook handling for payment confirmations
bun test --grep="webhook.*payment.*confirmation"

# Test subscription plan changes for landscaping businesses
bun test --grep="subscription.*plan.*change"
```

## E2E Testing Patterns

### Landscaping Business User Journeys
```bash
# Complete client onboarding and property setup
bun run test:e2e -- --grep="client.*onboarding.*property"

# Property assessment → quote generation → PDF delivery
bun run test:e2e -- --grep="assessment.*quote.*workflow"

# Quote approval → payment processing → analytics tracking
bun run test:e2e -- --grep="quote.*payment.*analytics"
```

### Formbricks UX Testing
```bash
# Test landscaping business UX surveys
bun run test:e2e:formbricks

# Test specific sprint features
bun run test:e2e:sprint3

# Test survey triggering after quote creation
bun test --grep="formbricks.*survey.*trigger"
```

## Component Testing for Landscaping UI

### shadcn/ui v4 Component Testing
```bash
# Test QuoteKit-customized shadcn/ui components
bun test src/components/ui/ --grep="shadcn.*customization"

# Test landscaping color palette application  
bun test --grep="forest.*green.*charcoal.*styling"

# Test accessibility compliance for landscaping forms
bun test --grep="accessibility.*landscaping.*forms"
```

### Business Component Testing
```tsx
// Example: Testing PricingCalculator with realistic landscaping data
describe('PricingCalculator', () => {
  it('applies condition multipliers for poor lawn conditions', async () => {
    const mockAssessment = {
      lawnCondition: 'poor', // Should apply 1.6x multiplier
      soilCondition: 'fair',  // Should apply 1.3x multiplier
      irrigationStatus: 'none' // Should apply 1.4x multiplier
    }
    
    const result = await calculateConditionPricing(mockAssessment)
    expect(result.totalMultiplier).toBeCloseTo(2.75) // Combined effect
  })
})
```

## Testing Data & Fixtures

### Landscaping Business Test Data
```javascript
// Realistic landscaping business scenarios
const testScenarios = {
  residential: {
    property: { size: '0.5 acres', type: 'suburban' },
    services: ['lawn_mowing', 'mulch_installation', 'hedge_trimming'],
    conditions: { lawn: 'good', soil: 'fair', irrigation: 'sprinkler' }
  },
  commercial: {
    property: { size: '2.3 acres', type: 'office_complex' },
    services: ['landscape_maintenance', 'hardscaping', 'irrigation_repair'],
    conditions: { lawn: 'poor', soil: 'poor', irrigation: 'broken' }
  }
}
```

### Assessment Test Fixtures
- Property photos with various conditions
- Realistic pricing scenarios for different regions
- Multi-property client configurations
- Complex landscaping service combinations

## Performance & Load Testing

### Landscaping Business Scale Testing
```bash
# Test concurrent quote generation (multiple landscaping businesses)
bun run test -- --grep="concurrent.*quote.*generation"

# Test database performance with large property datasets
bun run test -- --grep="database.*performance.*scale"

# Test PDF generation under load
bun run test -- --grep="pdf.*generation.*performance"
```

## Testing Environment Setup

### Local Testing Environment
```bash
# Start full QuoteKit testing environment
supabase start                    # Database with test data
bun run stripe:listen            # Webhook testing
bun run email:dev                # Email template testing
bunx playwright install         # E2E browser setup
```

### Test Data Management
```bash
# Reset to clean landscaping business test data
supabase db reset
bun run seed:landscaping-data

# Generate test quotes and assessments
bun run generate:test-scenarios

# Clean up test Stripe data
bun run stripe:cleanup
```

## Continuous Integration Testing

### GitHub Actions Testing Pipeline
```bash
# Full QuoteKit test suite for landscaping workflows
bun run type-check              # TypeScript validation
bun test                        # Unit & integration tests
bun run test:e2e               # Full workflow E2E tests
bun run test:e2e:formbricks    # UX analytics testing
bun run security:audit         # Security validation
```

### Test Coverage Requirements
- **Business Logic**: >90% coverage for pricing engine and assessments
- **API Routes**: >85% coverage for quote and payment endpoints
- **Components**: >80% coverage for critical UI components
- **E2E Workflows**: 100% coverage for core landscaping business flows

## Common Testing Patterns

### Mock Landscaping Services
```javascript
// Mock realistic landscaping service data
const mockLandscapingServices = {
  lawn_mowing: { basePrice: 65, unit: 'per_visit' },
  mulch_installation: { basePrice: 80, unit: 'per_cubic_yard' },
  hedge_trimming: { basePrice: 45, unit: 'per_hour' },
  hardscaping: { basePrice: 120, unit: 'per_square_foot' }
}
```

### Assessment Validation Testing
- Test all property condition combinations
- Validate pricing multiplier ranges (1.1x - 1.6x)
- Test edge cases (missing data, invalid conditions)
- Verify professional PDF output formatting

Remember: All tests should use realistic landscaping business scenarios and data to ensure QuoteKit works properly in real-world usage.