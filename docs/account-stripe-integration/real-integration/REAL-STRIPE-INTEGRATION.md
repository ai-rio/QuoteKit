# Real Stripe Integration Implementation

**Status**: 🚧 **IN PROGRESS - ACTUAL IMPLEMENTATION**  
**Created**: 2025-08-01  
**Last Updated**: 2025-08-01  
**Reality Check**: Previous docs claimed "PRODUCTION READY" - this is the actual implementation

---

## 🎯 **Current Reality Check**

### ❌ **What's Actually Broken**
- Users upgrade but get local subscription records (`sub_dev_1754084946541`)
- No Stripe customers created (`hasStripeCustomer: false`)
- Billing history shows "No invoice" because no real Stripe invoices exist
- Payment method management exists but not integrated with subscriptions
- Plan changes don't create actual Stripe subscriptions

### ✅ **What Actually Works**
- User authentication and basic account management
- UI components for billing/payment sections (they just show fake data)
- Stripe API client setup (`stripeAdmin`)
- Basic webhook endpoint (not properly integrated)

---

## 🏗️ **Implementation Plan**

### **Phase 1: Core Stripe Customer Integration** 
**Goal**: Every user gets a real Stripe customer

#### **Step 1.1: Fix User Registration/Upgrade Process**
- [ ] Create Stripe customer during user registration
- [ ] Store Stripe customer ID in user profile
- [ ] Handle existing users (migration script)

#### **Step 1.2: Implement Real Subscription Creation**
- [ ] Replace local subscription records with Stripe subscriptions
- [ ] Create Stripe subscription during plan upgrade
- [ ] Handle subscription status via webhooks

#### **Step 1.3: Real Payment Method Integration**
- [ ] Link payment methods to Stripe customers
- [ ] Use Stripe payment methods for subscription payments
- [ ] Remove fake payment method management

**Acceptance Criteria**:
- [ ] New users get Stripe customer ID immediately
- [ ] Plan upgrades create real Stripe subscriptions
- [ ] `hasStripeCustomer: true` for all paid users
- [ ] Real invoices generated automatically

---

### **Phase 2: Billing & Invoice Integration**
**Goal**: Users get real downloadable invoices

#### **Step 2.1: Real Invoice Generation**
- [ ] Configure Stripe to generate invoices automatically
- [ ] Ensure invoices have proper line items and descriptions
- [ ] Set up invoice email delivery

#### **Step 2.2: Fix Billing History**
- [ ] Remove local subscription fallback logic
- [ ] Show only real Stripe invoices
- [ ] Implement proper invoice download (already partially done)

#### **Step 2.3: Handle Edge Cases**
- [ ] Failed payments and retry logic
- [ ] Proration for plan changes
- [ ] Refunds and credits

**Acceptance Criteria**:
- [ ] All billing records start with `in_` (real Stripe invoices)
- [ ] Download buttons work for all invoices
- [ ] No more "No invoice" messages for paid users

---

### **Phase 3: Webhook & Sync Reliability**
**Goal**: Perfect sync between Stripe and local database

#### **Step 3.1: Enhanced Webhook Processing**
- [ ] Handle all subscription lifecycle events
- [ ] Process payment method updates
- [ ] Handle failed payments and dunning

#### **Step 3.2: Data Consistency**
- [ ] Implement webhook retry logic
- [ ] Add manual sync capabilities
- [ ] Create data validation scripts

**Acceptance Criteria**:
- [ ] Local data always matches Stripe
- [ ] Failed webhooks are retried automatically
- [ ] Manual sync tools available for edge cases

---

## 📊 **Implementation Tracking**

### **Current Status**
```
Phase 1: Core Integration     [▓▓▓▓▓▓░░░░] 60% (Steps 1.1 & 1.2 Complete)
Phase 2: Billing & Invoices  [░░░░░░░░░░]  0% (Waiting for Phase 1)
Phase 3: Webhook Reliability [░░░░░░░░░░]  0% (Waiting for Phase 2)

Overall Progress: 20% (Critical price ID issue resolved, ready for end-to-end testing)
```

### **Completed Tasks**
- [x] **Reality check**: Identified gap between docs and implementation
- [x] **Current state analysis**: Documented what's actually broken
- [x] **Implementation plan**: Created realistic roadmap
- [x] **Step 1.1 Implementation**: Fixed Stripe customer creation
  - [x] Updated `getOrCreateCustomerForUser` to default `forceCreate = true`
  - [x] Enabled production Stripe path (`FORCE_PRODUCTION_PATH = true`)
  - [x] Implemented real Stripe subscription creation with customer
  - [x] Added proper error handling and cleanup
  - [x] Created test script for verification
- [x] **Step 1.2 Implementation**: Fixed Price ID Configuration
  - [x] **CRITICAL FIX**: Identified price ID mismatch causing "No such price" error
  - [x] Updated code to use actual Stripe price IDs from account
  - [x] Fixed `price_pro_monthly` → `price_1RVyAQGgBK1ooXYF0LokEHtQ` ($12/month)
  - [x] Fixed `price_pro_annual` → `price_1RoUo5GgBK1ooXYF4nMSQooR` ($72/year)
  - [x] Updated all affected files and test scripts
  - [x] Verified fix with comprehensive test suite

### **Next Immediate Tasks**
1. ✅ **RESOLVED: Price ID Error** - Fixed "No such price: 'price_pro_monthly'" error
2. [ ] **Test End-to-End Flow** - Verify complete user upgrade process works
3. [ ] **Complete Step 1.3** - Ensure subscription creation is fully working
4. [ ] **Implement Step 1.4** - Update billing history to show real invoices

---

## 🔧 **Implementation Details**

### **Step 1.1: Stripe Customer Creation**

**Files to Modify**:
- `src/features/account/controllers/get-or-create-customer.ts` - Fix to always create customer
- User registration flow - Add Stripe customer creation
- Upgrade process - Ensure customer exists before subscription

**Implementation Approach**:
```typescript
// During user registration or first upgrade
const stripeCustomer = await stripe.customers.create({
  email: user.email,
  name: user.name,
  metadata: {
    supabase_user_id: user.id
  }
});

// Store in database
await supabase
  .from('users')
  .update({ stripe_customer_id: stripeCustomer.id })
  .eq('id', user.id);
```

### **Step 1.2: Real Subscription Creation**

**Files to Modify**:
- Plan upgrade API endpoints
- Subscription management components
- Database schema (remove local subscription tables?)

**Implementation Approach**:
```typescript
// During plan upgrade
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: priceId }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});

// Store subscription ID, not local subscription record
```

---

## 🧪 **Testing Strategy**

### **Test Scenarios**
1. **New User Registration** → Should create Stripe customer
2. **Plan Upgrade** → Should create real Stripe subscription
3. **Billing History** → Should show real invoices with download links
4. **Payment Methods** → Should be linked to Stripe customer
5. **Plan Changes** → Should update Stripe subscription

### **Verification Scripts**
- [ ] Create test script for new user flow
- [ ] Create test script for upgrade flow
- [ ] Create test script for billing verification
- [ ] Update existing debug scripts to check real integration

---

## 📝 **Documentation Standards**

### **Progress Updates**
- Update this document after each completed task
- Include actual test results, not assumptions
- Document any issues or blockers encountered
- Keep "Current Status" section accurate

### **Code Documentation**
- Comment all Stripe integration points
- Document webhook event handling
- Include error handling explanations
- Add debugging information

### **No More Fantasy Documentation**
- ❌ Don't mark things complete until actually tested
- ❌ Don't claim "PRODUCTION READY" until it actually works
- ❌ Don't document theoretical features as implemented
- ✅ Document actual progress and real test results

---

**Next Update**: After completing Step 1.1 (Stripe Customer Creation)  
**Responsible**: Development Team  
**Review**: After each phase completion
