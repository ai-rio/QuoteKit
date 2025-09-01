# /debug-pricing-engine $ISSUE_TYPE

Debug QuoteKit's advanced condition-based pricing engine:

1. **Pricing Multiplier Validation**: Check 15+ adjustment factors
   ```bash
   bun test src/features/quotes/pricing-engine/PropertyConditionPricing.ts --verbose
   ```

2. **Assessment Condition Mapping**: Verify condition-to-price calculations  
   ```bash
   # Test lawn, soil, irrigation, obstacle pricing adjustments (1.1x-1.6x multipliers)
   bun run test -- --grep="condition.*pricing.*multiplier"
   ```

3. **Quote Calculation Accuracy**: Test complex pricing scenarios
   ```bash
   bun test src/features/quotes/utils.ts --grep="calculation"
   ```

4. **Labor & Material Breakdown**: Verify cost component analysis
   ```bash
   bun run test -- --grep="labor.*material.*equipment"
   ```

5. **Edge Case Pricing**: Test boundary conditions and error handling
   ```bash
   bun run test -- --grep="pricing.*edge.*case"
   ```

6. **Integration Testing**: Full assessment-to-quote pricing pipeline
   ```bash
   bun run test:e2e -- --grep="pricing.*integration"
   ```

7. **Pricing Analytics**: Verify quote profitability calculations
   ```bash
   echo "💰 Testing pricing analytics and profit margins"
   bun run test -- --grep="profitability.*analytics"
   ```