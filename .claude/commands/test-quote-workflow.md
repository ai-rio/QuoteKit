# /test-quote-workflow $CLIENT_NAME

Test complete QuoteKit landscaping workflow:

1. **Property Assessment Creation**: Test realistic property conditions
   ```bash
   bun run test:e2e -- --grep="property assessment creation"
   ```

2. **Condition-Based Pricing**: Verify 15+ pricing adjustment factors
   ```bash
   bun test src/features/quotes/pricing-engine/PropertyConditionPricing.ts
   ```

3. **Assessment to Quote Conversion**: Test pricing engine integration
   ```bash
   bun run test -- --grep="assessment.*quote.*integration"
   ```

4. **Quote Status Lifecycle**: Test draft→sent→accepted→converted flow
   ```bash
   bun run test -- --grep="quote.*status.*(draft|sent|accepted|converted)"
   ```

5. **Professional PDF Generation**: Verify landscaping quote branding
   ```bash
   bun test src/features/quotes/email-actions.ts
   ```

6. **Formbricks Survey Integration**: Test post-quote UX tracking
   ```bash
   bun run test:e2e:formbricks
   ```

7. **Stripe Payment Flow**: Test B2B landscaping payment processing
   ```bash
   bun run stripe:check && bun run test -- --grep="stripe.*landscaping"
   ```