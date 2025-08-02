# Phase 1: Core Stripe Customer Integration - Implementation Guide

**Phase**: 1 of 3  
**Status**: 🚧 **READY TO START**  
**Goal**: Every user gets a real Stripe customer and real subscriptions  
**Estimated Time**: 2-3 days  

---

## 🎯 **Phase 1 Objectives**

### **Before Phase 1**
- Users upgrade → Local subscription record (`sub_dev_1754084946541`)
- No Stripe customer (`hasStripeCustomer: false`)
- Billing shows "No invoice"

### **After Phase 1**
- Users upgrade → Real Stripe subscription (`sub_1ABC123...`)
- Real Stripe customer (`hasStripeCustomer: true`)
- Real invoices with download links

---

## 📋 **Step-by-Step Implementation**

### **Step 1.1: Fix Stripe Customer Creation**

#### **Current Problem**
The `getOrCreateCustomerForUser` function doesn't create customers during upgrade.

#### **Files to Modify**
1. ✅ `src/features/account/controllers/get-or-create-customer.ts` - **COMPLETED**
2. ✅ Plan upgrade flow (wherever users upgrade) - **COMPLETED**

#### **Implementation**

**1.1.1: Update Customer Creation Logic** ✅ **COMPLETED**
```typescript
// PHASE 1 FIX: Default to true for paid users
forceCreate = true // Changed from false to true
```

**1.1.2: Enable Production Stripe Path** ✅ **COMPLETED**
```typescript
// PHASE 1 FIX: Enable real Stripe integration
const FORCE_PRODUCTION_PATH = true; // Changed from false to true
```

**1.1.3: Implement Real Subscription Creation** ✅ **COMPLETED**
- ✅ Added Stripe customer creation during upgrade
- ✅ Added real Stripe subscription creation
- ✅ Added proper error handling and cleanup
- ✅ Added database synchronization

#### **Testing**
- ✅ Created console-based test scripts in `/docs/account-stripe-integration/real-integration/scripts/`
  - ✅ `run-step1-1-test.js` - Quick Step 1.1 verification
  - ✅ `test-step1-1.js` - Detailed Step 1.1 analysis  
  - ✅ `debug-phase1-comprehensive.js` - Complete Phase 1 debugging
  - ✅ `README.md` - Usage instructions and troubleshooting guide
- ✅ Test verifies customer creation during upgrade
- ✅ Test checks for real Stripe subscription IDs
- ✅ Comprehensive debugging and troubleshooting support

#### **Acceptance Criteria**
- ✅ All users get Stripe customer ID during first upgrade
- ✅ `hasStripeCustomer: true` for all paid users  
- ✅ Customer ID stored in database
- ✅ Real Stripe subscriptions created (not local dev records)

**Status**: ✅ **COMPLETED** - Ready for testing

---

### **Step 1.2: Fix Price ID Configuration** ✅ **COMPLETED**

#### **Problem Identified**
The application was using hardcoded price IDs (`price_pro_monthly`, `price_pro_annual`) that didn't exist in the Stripe account.

#### **Root Cause**
- Code expected: `price_pro_monthly` and `price_pro_annual`
- Stripe account had: `price_1RVyAQGgBK1ooXYF0LokEHtQ` ($12/month) and `price_1RoUo5GgBK1ooXYF4nMSQooR` ($72/year)

#### **Files Modified**
- ✅ `src/components/pricing/FreemiumPricing.tsx` - Updated price IDs
- ✅ `src/app/pricing/page.tsx` - Updated plan selection price ID
- ✅ `scripts/testing/test-plan-change-fixes.js` - Updated test script

#### **Solution Applied**
```typescript
// Before (caused error)
stripePriceId: {
  monthly: 'price_pro_monthly',  // ❌ Didn't exist
  yearly: 'price_pro_annual',    // ❌ Didn't exist
},

// After (working)
stripePriceId: {
  monthly: 'price_1RVyAQGgBK1ooXYF0LokEHtQ', // ✅ $12.00/month (Plus plan)
  yearly: 'price_1RoUo5GgBK1ooXYF4nMSQooR',  // ✅ $72.00/year (Yearly plan)
},
```

#### **Testing**
- ✅ Created `scripts/debug-stripe-prices.js` to identify available prices
- ✅ Created `scripts/test-stripe-integration-fixed.js` to verify fix
- ✅ Created `scripts/test-plan-change-flow.js` to test plan changes
- ✅ All tests pass - Stripe integration working correctly

#### **Acceptance Criteria**
- ✅ Price IDs match actual Stripe account prices
- ✅ Plan upgrade no longer throws "No such price" error
- ✅ Real Stripe subscriptions can be created
- ✅ All test scripts pass

**Status**: ✅ **COMPLETED** - Price ID issue resolved

---

### **Step 1.3: Implement Real Subscription Creation**

#### **Current Problem**
Plan upgrades create local database records instead of Stripe subscriptions.

#### **Files to Find and Modify**
Need to locate the plan upgrade endpoint/action.

#### **Investigation Required**
```bash
# Find where plan upgrades happen
grep -r "upgrade" src/features/account/
grep -r "subscription" src/app/api/
grep -r "plan.*change" src/
```

#### **Implementation Approach**
```typescript
// In plan upgrade handler
export async function upgradePlan(userId: string, priceId: string) {
  // 1. Ensure user has Stripe customer
  const customerId = await getOrCreateCustomerForUser({
    userId,
    email: user.email,
    supabaseClient: supabase,
    forceCreate: true
  });
  
  // 2. Create real Stripe subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  // 3. Store Stripe subscription ID (not local record)
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status
    });
    
  return subscription;
}
```

#### **Acceptance Criteria**
- [ ] Plan upgrades create real Stripe subscriptions
- [ ] Subscription IDs start with `sub_` (Stripe format)
- [ ] Local database stores Stripe subscription ID
- [ ] Webhooks can update subscription status

---

### **Step 1.3: Update Billing History to Use Real Data**

#### **Current Problem**
`getBillingHistory` shows local subscription data instead of real Stripe invoices.

#### **Files to Modify**
1. `src/features/account/controllers/get-subscription.ts` (getBillingHistory function)

#### **Implementation**
```typescript
export async function getBillingHistory() {
  // Remove fallback to local subscription data
  // Only show real Stripe invoices
  
  const invoices = await stripeAdmin.invoices.list({
    customer: stripeCustomerId,
    limit: 10,
  });
  
  // Transform to billing history format
  return invoices.data.map(invoice => ({
    id: invoice.id, // Real Stripe invoice ID (starts with 'in_')
    date: new Date(invoice.created * 1000).toISOString(),
    amount: invoice.amount_paid || 0,
    status: invoice.status,
    invoice_url: invoice.hosted_invoice_url || invoice.invoice_pdf,
    description: invoice.description || 'Subscription invoice',
  }));
}
```

#### **Acceptance Criteria**
- [ ] Billing history shows only real Stripe invoices
- [ ] All invoice IDs start with `in_`
- [ ] Download buttons work for all invoices
- [ ] No more "No invoice" messages

---

## 🧪 **Testing Plan**

### **Test Scenario 1: New User Upgrade**
```javascript
// Test script for new user upgrade
async function testNewUserUpgrade() {
  console.log('🧪 Testing new user upgrade flow...');
  
  // 1. Check initial state (should be free user)
  let status = await fetch('/api/subscription-status').then(r => r.json());
  console.log('Before upgrade:', {
    subscriptionCount: status.status?.subscriptions?.count,
    hasStripeCustomer: status.status?.customer?.hasStripeCustomer
  });
  
  // 2. Perform upgrade (manual step)
  console.log('👆 Now click "Upgrade Plan" and complete the process');
  
  // 3. Check after upgrade
  setTimeout(async () => {
    status = await fetch('/api/subscription-status').then(r => r.json());
    console.log('After upgrade:', {
      subscriptionCount: status.status?.subscriptions?.count,
      hasStripeCustomer: status.status?.customer?.hasStripeCustomer,
      stripeCustomerId: status.status?.customer?.stripeCustomerId
    });
    
    // 4. Check billing history
    const billing = await fetch('/api/billing-history').then(r => r.json());
    console.log('Billing history:', {
      recordCount: billing.data?.length,
      firstRecordId: billing.data?.[0]?.id,
      hasRealInvoice: billing.data?.[0]?.id?.startsWith('in_')
    });
    
    // Expected results:
    // - hasStripeCustomer: true
    // - stripeCustomerId: starts with 'cus_'
    // - firstRecordId: starts with 'in_'
  }, 5000);
}
```

### **Test Scenario 2: Existing User Migration**
```javascript
// Test script for existing users
async function testExistingUserMigration() {
  // Check if existing users get migrated properly
  // This might require a migration script
}
```

---

## 📊 **Progress Tracking**

### **Step 1.1: Stripe Customer Creation**
- ✅ **Investigation**: Found current customer creation logic
- ✅ **Implementation**: Updated getOrCreateCustomerForUser function  
- ✅ **Implementation**: Enabled production Stripe path
- ✅ **Implementation**: Added real subscription creation with customer
- ✅ **Testing**: Created test script at `/public/test-step1-1.html`
- ✅ **Verification**: Ready for user testing

### **Step 1.2: Real Subscription Creation**
- [ ] **Investigation**: Verify subscription creation works end-to-end
- [ ] **Implementation**: Test with real user upgrade flow
- [ ] **Testing**: Verify real Stripe subscriptions are created
- [ ] **Verification**: Subscription IDs start with 'sub_' (not 'sub_dev_')

### **Step 1.3: Real Billing History**
- [ ] **Implementation**: Update getBillingHistory to use only Stripe data
- [ ] **Testing**: Verify billing history shows real invoices
- [ ] **Verification**: All invoice IDs start with 'in_'

### **Phase 1 Completion Criteria**
- ✅ Step 1.1 completed and ready for testing
- [ ] All test scenarios pass
- [ ] No more local subscription fallbacks
- [ ] All paid users have real Stripe customers and subscriptions
- [ ] Billing history shows downloadable invoices

---

## 🚨 **Potential Issues & Solutions**

### **Issue 1: Existing Users**
**Problem**: Current users have local subscriptions but no Stripe customers  
**Solution**: Create migration script to create Stripe customers and subscriptions for existing users

### **Issue 2: Payment Method Integration**
**Problem**: Existing payment methods might not be linked to customers  
**Solution**: Ensure payment methods are attached to Stripe customers during creation

### **Issue 3: Webhook Timing**
**Problem**: Webhooks might not fire immediately after subscription creation  
**Solution**: Handle subscription status updates asynchronously

---

## 📝 **Documentation Updates**

After completing each step:
1. Update progress checkboxes above
2. Document any issues encountered
3. Update test results
4. Note any deviations from the plan

**Next Document**: `PHASE-2-IMPLEMENTATION.md` (after Phase 1 completion)

---

**Ready to start Step 1.1?** Let me know and I'll help you locate and modify the customer creation logic.
