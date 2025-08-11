# TypeScript Error Fixing Implementation Checklist

## 🚀 Quick Start Guide

### Prerequisites
```bash
# 1. Install required dependencies
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 2. Make scripts executable
chmod +x docs/type-fix/scripts/*.sh
```

### Phase 1: Foundation Setup (Day 1) ✅

#### Step 1.1: Enable Enhanced ESLint
- [ ] **Backup current ESLint config**
  ```bash
  cp .eslintrc.json .eslintrc.json.backup
  ```

- [ ] **Apply enhanced ESLint configuration**
  ```bash
  cp docs/type-fix/enhanced-eslintrc.json .eslintrc.json
  ```

- [ ] **Test ESLint configuration**
  ```bash
  npm run lint
  ```

#### Step 1.2: Generate Missing Supabase Types
- [ ] **Check if Supabase types exist**
  ```bash
  ls -la src/libs/supabase/types.ts
  ```

- [ ] **Generate Supabase types** (if missing)
  ```bash
  npm run generate-types
  ```

- [ ] **Verify types were generated**
  ```bash
  head -20 src/libs/supabase/types.ts
  ```

#### Step 1.3: Run Initial Assessment
- [ ] **Run comprehensive type check**
  ```bash
  ./docs/type-fix/scripts/type-check.sh --summary
  ```

- [ ] **Categorize errors**
  ```bash
  ./docs/type-fix/scripts/categorize-errors.sh
  ```

- [ ] **Review error analysis**
  ```bash
  cat logs/error-analysis.md
  ```

**Target**: Reduce from 127 errors to <50 errors

---

### Phase 2: Stripe Integration Fixes (Day 2-3) 🔧

#### Step 2.1: Fix Stripe Admin Client Function Signatures
- [ ] **Locate createStripeAdminClient calls**
  ```bash
  grep -r "createStripeAdminClient()" src/
  ```

- [ ] **Fix function calls in:**
  - [ ] `src/features/account/controllers/stripe-plan-change.ts` (3 locations)
  - [ ] Add proper config parameter to each call

#### Step 2.2: Resolve Stripe Type Mismatches
- [ ] **Fix Invoice vs UpcomingInvoice issues**
  - [ ] `src/features/billing/controllers/proration-handler.ts`
  - [ ] `src/features/billing/controllers/invoice-generation.ts`

- [ ] **Add Stripe error type guards**
  ```bash
  cp docs/type-fix/utils/stripe-error-guards.ts src/utils/
  ```

- [ ] **Update subscription actions error handling**
  - [ ] Replace `unknown` error types with proper type guards
  - [ ] File: `src/features/account/actions/subscription-actions.ts`

#### Step 2.3: Fix Stripe Property Access Issues
- [ ] **Fix missing properties on Stripe objects:**
  - [ ] `default_payment_method` on subscription params
  - [ ] `payment_behavior` on subscription params
  - [ ] `amount_refunded` on PaymentIntent
  - [ ] `submission_count` on Evidence

**Target**: Eliminate all payment-related type errors

---

### Phase 3: Error Handling & Type Safety (Day 4-5) 🛡️

#### Step 3.1: Implement Error Type Guards
- [ ] **Add Supabase type helpers**
  ```bash
  cp docs/type-fix/utils/supabase-type-helpers.ts src/utils/
  ```

- [ ] **Update files with unknown error handling:**
  - [ ] `src/features/account/actions/subscription-actions.ts`
  - [ ] `src/features/billing/controllers/edge-case-coordinator.ts`
  - [ ] `src/features/quotes/components/QuotesManager.tsx`

#### Step 3.2: Fix Implicit Any Types
- [ ] **Add explicit types for function parameters:**
  - [ ] `src/features/pricing/components/price-card.tsx`
  - [ ] `src/features/account/components/PlanChangeDialog.tsx`

- [ ] **Fix array type inference issues**
  - [ ] Add proper type annotations for mapped arrays
  - [ ] Fix filter/map callback parameter types

#### Step 3.3: Resolve Property Access Errors
- [ ] **Fix component prop type issues:**
  - [ ] `src/components/layout/app-sidebar.tsx` (featureKey, premiumOnly)
  - [ ] `src/features/analytics/components/AnalyticsDashboard.tsx` (indicatorClassName)

**Target**: Achieve <10 type errors

---

### Phase 4: Component & UI Fixes (Day 6) ⚛️

#### Step 4.1: Fix React Component Props
- [ ] **Resolve missing component definitions:**
  - [ ] `src/app/blog/page.tsx` (BlogGrid component)
  - [ ] `src/app/blog/[slug]/page-old.tsx` (BlogPostNavigation props)

- [ ] **Fix JSX element type issues:**
  - [ ] Button disabled prop type mismatch
  - [ ] MDXRemote source prop type issues

#### Step 4.2: Fix Hook Dependencies
- [ ] **Address React Hook warnings:**
  - [ ] `src/app/blog/components/enhanced-blog-filter.tsx`
  - [ ] `src/features/account/components/EnhancedCurrentPlanCard.tsx`
  - [ ] `src/features/account/hooks/useBillingHistory.ts`
  - [ ] `src/features/quotes/components/QuotesManager.tsx`

**Target**: Zero type errors

---

### Phase 5: Testing & Validation (Day 7) ✅

#### Step 5.1: Fix Test-Related Type Issues
- [ ] **Update test imports:**
  - [ ] `src/lib/blog/__tests__/content.test.ts` (blogPostFrontmatterSchema)

- [ ] **Fix test environment issues:**
  - [ ] NODE_ENV assignment errors
  - [ ] Missing frontmatter properties

#### Step 5.2: Final Validation
- [ ] **Run comprehensive validation**
  ```bash
  ./docs/type-fix/scripts/type-check.sh
  ```

- [ ] **Test build process**
  ```bash
  npm run build
  ```

- [ ] **Run test suite**
  ```bash
  npm test
  ```

**Target**: Production-ready type safety

---

## 📊 Progress Tracking

### Daily Checkpoints

#### Day 1 Checkpoint
```bash
# Expected: <50 errors
./docs/type-fix/scripts/type-check.sh --summary
```

#### Day 3 Checkpoint
```bash
# Expected: <20 errors
./docs/type-fix/scripts/type-check.sh --summary
```

#### Day 5 Checkpoint
```bash
# Expected: <5 errors
./docs/type-fix/scripts/type-check.sh --summary
```

#### Day 7 Checkpoint
```bash
# Expected: 0 errors
./docs/type-fix/scripts/type-check.sh --summary
```

### Progress Visualization
```bash
# View progress over time
cat logs/progress.csv
```

---

## 🚨 Common Issues & Solutions

### Issue: Supabase Types Not Found
**Error**: `File '/root/dev/.devcontainer/QuoteKit/src/libs/supabase/types.ts' is not a module.`

**Solution**:
```bash
# Check if types file exists
ls -la src/libs/supabase/types.ts

# If missing, generate types
npm run generate-types

# If command fails, check Supabase configuration
cat .env.local | grep SUPABASE
```

### Issue: Stripe Function Signature Mismatch
**Error**: `Expected 1 arguments, but got 0.`

**Solution**:
```typescript
// Before
const stripe = createStripeAdminClient();

// After
const stripe = createStripeAdminClient({
  secret_key: process.env.STRIPE_SECRET_KEY!,
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
});
```

### Issue: Unknown Error Type
**Error**: `'error' is of type 'unknown'.`

**Solution**:
```typescript
// Before
console.error('Error:', error.message);

// After
import { handleStripeError } from '@/utils/stripe-error-guards';

const errorInfo = handleStripeError(error);
console.error('Error:', errorInfo.message);
```

---

## 🎯 Success Criteria

### ✅ Completion Checklist
- [ ] Zero TypeScript compilation errors
- [ ] All ESLint rules passing
- [ ] Build process successful
- [ ] Test suite passing
- [ ] No `any` types in critical payment flows
- [ ] Proper error handling throughout
- [ ] Enhanced IDE support and IntelliSense

### 📈 Quality Metrics
- **Type Coverage**: >95%
- **Build Time Impact**: <10% increase
- **Bundle Size Impact**: <5% increase
- **Developer Experience**: Improved IntelliSense and error catching

---

## 🔄 Rollback Plan

If issues arise during implementation:

```bash
# 1. Restore original ESLint config
cp .eslintrc.json.backup .eslintrc.json

# 2. Revert to original TypeScript config
git checkout tsconfig.json

# 3. Remove added utilities (if causing issues)
rm -f src/utils/stripe-error-guards.ts
rm -f src/utils/supabase-type-helpers.ts

# 4. Verify system is working
npm run build
```

---

**Ready to start? Begin with Phase 1 and follow the checklist step by step!** 🚀
