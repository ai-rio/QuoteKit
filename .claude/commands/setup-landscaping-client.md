# /setup-landscaping-client $BUSINESS_NAME $PROPERTY_TYPE

Set up new landscaping business client with property assessment:

1. **Create Client Profile**: Set up business information and contact details
   ```bash
   bun run test -- --grep="client.*creation" --verbose
   ```

2. **Property Setup**: Initialize property with assessment framework
   ```bash
   bun test src/features/assessments/ --grep="property.*initialization"
   ```

3. **Assessment Template**: Create property assessment with common conditions
   ```bash
   # Test lawn, irrigation, soil, and obstacle detection
   bun test src/features/assessments/types.ts
   ```

4. **Pricing Configuration**: Set up condition-based pricing multipliers
   ```bash
   bun test src/features/quotes/pricing-engine/PropertyConditionPricing.ts
   ```

5. **Generate Initial Quote**: Test assessment-to-quote conversion
   ```bash
   bun run test -- --grep="assessment.*quote.*conversion"
   ```

6. **Verify Analytics Setup**: Ensure PostHog and Formbricks tracking
   ```bash
   bun run test:formbricks && echo "Analytics configured for $BUSINESS_NAME"
   ```