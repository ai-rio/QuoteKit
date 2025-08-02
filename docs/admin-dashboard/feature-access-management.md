# Feature Access Management - Agile Implementation Plan

## 🎯 **Epic Overview**
Implement feature gating system to control free vs paid tier access through admin dashboard toggles.

---

## ✅ **Recent Fixes (2025-08-02)**

### **Database Schema Compatibility Issue - RESOLVED**
- **Issue**: "Product ID is required" error when applying premium tier features
- **Root Cause**: API code expected `stripe_products.stripe_product_id` column, but database has `id` column
- **Solution**: Updated API endpoints to use correct column names with compatibility mapping
- **Impact**: Premium tier features now work correctly in pricing management interface
- **Files Fixed**: 
  - `src/app/api/admin/stripe-config/products/route.ts`
  - `src/app/api/admin/stripe-config/prices/route.ts`

### **Database Schema Reference**
```sql
-- Correct schema (now properly supported by API)
CREATE TABLE stripe_products (
  id TEXT PRIMARY KEY,           -- Stripe product ID
  name TEXT,
  description TEXT,
  active BOOLEAN,
  metadata JSONB,               -- Feature toggles stored here
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE stripe_prices (
  id TEXT PRIMARY KEY,           -- Stripe price ID
  stripe_product_id TEXT,        -- References stripe_products.id
  unit_amount BIGINT,
  currency TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 📊 **Current Implementation Status**

### **✅ Completed**
- [x] Database schema compatibility fixed
- [x] Admin pricing management interface working
- [x] Premium tier feature toggles functional
- [x] Basic product/price CRUD operations
- [x] Database-only mode for local development

### **🚧 In Progress**
- [ ] Feature gating implementation (Sprints 1-3 below)
- [ ] User-facing feature restrictions
- [ ] Upgrade prompts and UX polish

### **📋 Next Steps**
Follow the sprint breakdown below to implement the complete feature access management system.

---

## 📋 **Sprint Breakdown**

### **Sprint 1: Foundation (2-3 hours)**
*Core infrastructure and admin interface*

#### **Story 1.1: Feature Configuration Schema** ⏱️ *30 min*
- **Task**: Define feature metadata structure
- **Acceptance Criteria**:
  - [ ] Feature schema defined in TypeScript interfaces
  - [ ] Default free/premium feature sets created
  - [ ] Feature validation logic implemented
- **Files**: `src/types/features.ts`

#### **Story 1.2: Admin Feature Toggles** ⏱️ *90 min*
- **Task**: Add feature management to existing pricing page
- **Acceptance Criteria**:
  - [ ] Feature toggles added to product edit dialog
  - [ ] Toggle states save to product metadata
  - [ ] Visual indicators for free vs premium features
- **Files**: `src/app/(admin)/pricing-management/page.tsx`

#### **Story 1.3: Feature Access Hook** ⏱️ *45 min*
- **Task**: Create reusable hook for feature checking
- **Acceptance Criteria**:
  - [ ] `useFeatureAccess()` hook created
  - [ ] Integrates with existing subscription system
  - [ ] Returns feature permissions for current user
- **Files**: `src/hooks/useFeatureAccess.ts`

---

### **Sprint 2: Feature Gating (1-2 hours)**
*Apply feature restrictions to existing components*

#### **Story 2.1: Quote Limits** ⏱️ *30 min*
- **Task**: Implement quote creation limits
- **Acceptance Criteria**:
  - [ ] Free users limited to X quotes
  - [ ] Upgrade prompt shown when limit reached
  - [ ] Quote counter displays current usage
- **Files**: `src/features/quotes/components/CreateQuoteButton.tsx`

#### **Story 2.2: PDF Export Gating** ⏱️ *20 min*
- **Task**: Restrict PDF export to paid users
- **Acceptance Criteria**:
  - [ ] PDF button disabled for free users
  - [ ] Upgrade tooltip/modal shown on click
  - [ ] Premium users can export normally
- **Files**: `src/features/quotes/components/PDFExportButton.tsx`

#### **Story 2.3: Analytics Access** ⏱️ *30 min*
- **Task**: Gate analytics dashboard
- **Acceptance Criteria**:
  - [ ] Free users see upgrade prompt instead of analytics
  - [ ] Navigation shows locked state for free users
  - [ ] Premium users access full analytics
- **Files**: `src/app/(app)/analytics/page.tsx`

---

### **Sprint 3: Polish & UX (1 hour)**
*Enhance user experience and visual feedback*

#### **Story 3.1: Upgrade Prompts** ⏱️ *30 min*
- **Task**: Create consistent upgrade UI components
- **Acceptance Criteria**:
  - [ ] Reusable `<UpgradePrompt />` component
  - [ ] Consistent messaging across features
  - [ ] Direct link to plan change dialog
- **Files**: `src/components/UpgradePrompt.tsx`

#### **Story 3.2: Feature Indicators** ⏱️ *30 min*
- **Task**: Add visual indicators for feature availability
- **Acceptance Criteria**:
  - [ ] Pro badges on premium features
  - [ ] Usage counters for limited features
  - [ ] Clear free vs paid distinction in UI
- **Files**: `src/components/FeatureBadge.tsx`

---

## 🏗️ **Technical Implementation**

### **Core Types**
```typescript
interface PlanFeatures {
  max_quotes: number | -1  // -1 = unlimited
  pdf_export: boolean
  analytics_access: boolean
  email_templates: boolean
  bulk_operations: boolean
  custom_branding: boolean
}
```

### **Feature Hook Pattern**
```typescript
const useFeatureAccess = () => {
  const { subscription } = useSubscription()
  const features = subscription?.stripe_prices?.stripe_products?.metadata
  
  return {
    features: features || FREE_PLAN_FEATURES,
    canAccess: (feature: keyof PlanFeatures) => features?.[feature] || false,
    isAtLimit: (feature: string, current: number) => current >= features?.[feature]
  }
}
```

### **Admin Toggle Pattern**
```typescript
<Switch 
  checked={productMetadata.pdf_export}
  onCheckedChange={(checked) => 
    updateProductMetadata({ ...metadata, pdf_export: checked })
  }
/>
```

---

## 🎯 **Definition of Done**

### **Sprint 1 Complete When:**
- [ ] Admin can toggle features for each product
- [ ] Feature settings save to database
- [ ] Feature access hook returns correct permissions

### **Sprint 2 Complete When:**
- [ ] Free users hit feature limits appropriately
- [ ] Upgrade prompts appear for restricted features
- [ ] Premium users have full access

### **Sprint 3 Complete When:**
- [ ] Consistent upgrade UX across all features
- [ ] Visual indicators clearly show feature availability
- [ ] User testing confirms intuitive experience

---

## 🚀 **Deployment Strategy**

### **Phase 1: Admin Only** (Sprint 1)
- Deploy admin feature toggles
- Test with existing products
- Verify metadata saves correctly

### **Phase 2: Feature Gating** (Sprint 2)
- Deploy feature restrictions
- Monitor for any access issues
- Ensure upgrade flows work

### **Phase 3: Full Release** (Sprint 3)
- Deploy polished UX
- Update documentation
- Announce new feature tiers

---

## 📊 **Success Metrics**

### **Technical Metrics**
- [ ] Zero breaking changes to existing functionality
- [ ] Feature checks add <50ms to page load
- [ ] Admin toggles update in real-time

### **Business Metrics**
- [ ] Clear distinction between free/paid features
- [ ] Upgrade conversion tracking implemented
- [ ] User feedback on feature clarity

### **User Experience Metrics**
- [ ] Intuitive feature discovery
- [ ] Clear upgrade paths
- [ ] No confusion about feature availability

---

## 🔧 **Risk Mitigation**

### **Technical Risks**
- **Risk**: Breaking existing subscription logic
- **Mitigation**: Use existing metadata fields, no schema changes

### **UX Risks**
- **Risk**: Confusing feature restrictions
- **Mitigation**: Clear messaging and consistent upgrade prompts

### **Business Risks**
- **Risk**: Users frustrated by limitations
- **Mitigation**: Generous free tier limits, clear value proposition

---

## 📝 **Notes**

- **Leverage Existing**: Build on current subscription/pricing system
- **No Database Changes**: Use existing metadata fields
- **Incremental**: Each sprint delivers working functionality
- **User-Centric**: Focus on clear, helpful upgrade prompts
- **Maintainable**: Simple toggle-based configuration
