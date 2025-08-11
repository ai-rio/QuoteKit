# Plan Change Dialog Fixes - Sprint 1.5

## Issue Analysis

The PlanChangeDialog should work as a **complete checkout experience** within the account page, but currently has two critical issues:

1. **Payment Method Detection**: Doesn't properly detect existing default payment methods
2. **Plan Status Updates**: Account page billing section doesn't reflect updated plan status

## Root Cause

The implementation has the **Stripe integration working correctly** (stripe-plan-change.ts), but the **UI integration is flawed**:

- Race condition in payment method loading
- Missing real-time updates after plan changes
- Incorrect default payment method selection logic

## Fixes Required

### Fix 1: Payment Method Detection in PlanChangeDialog

**File**: `src/features/account/components/PlanChangeDialog.tsx`

**Current Problem**:
```typescript
// This runs before paymentMethods are loaded
useEffect(() => {
  if (isOpen && paymentMethods.length > 0) {
    const defaultMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];
    if (defaultMethod) {
      setSelectedPaymentMethodId(defaultMethod.id);
    }
  }
}, [isOpen, paymentMethods, validatePaymentMethods]);
```

**Fixed Logic**:
```typescript
// Set default payment method when dialog opens AND payment methods are loaded
useEffect(() => {
  if (isOpen && paymentMethods.length > 0 && !selectedPaymentMethodId) {
    const defaultMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0];
    if (defaultMethod && !paymentMethodErrors[defaultMethod.id]) {
      setSelectedPaymentMethodId(defaultMethod.id);
      console.log('🔧 Default payment method set:', defaultMethod.id);
    }
  }
}, [isOpen, paymentMethods, selectedPaymentMethodId, paymentMethodErrors]);

// Clear selection when dialog closes
useEffect(() => {
  if (!isOpen) {
    setSelectedPaymentMethodId('');
    setSelectedPriceId('');
    setProrationPreview(null);
    setPreviewError(null);
  }
}, [isOpen]);
```

### Fix 2: Account Page Real-time Updates

**File**: `src/app/(account)/account/page.tsx`

**Add State Management**:
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function AccountPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for plan change events
  useEffect(() => {
    const handlePlanChange = () => {
      console.log('🔄 Plan change detected, refreshing account data');
      setRefreshKey(prev => prev + 1);
      // Force page refresh to get latest data
      window.location.reload();
    };

    const handleBillingUpdate = () => {
      console.log('💳 Billing update detected');
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('plan-change-completed', handlePlanChange);
    window.addEventListener('billing-history-updated', handleBillingUpdate);

    return () => {
      window.removeEventListener('plan-change-completed', handlePlanChange);
      window.removeEventListener('billing-history-updated', handleBillingUpdate);
    };
  }, []);

  // Rest of component...
}
```

### Fix 3: Enhanced Plan Change Handler

**File**: `src/features/account/components/EnhancedCurrentPlanCard.tsx`

**Improve Event Dispatching**:
```typescript
const handlePlanChange = async (priceId: string, isUpgrade: boolean, paymentMethodId?: string) => {
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('💳 Plan change initiated:', {
      priceId,
      isUpgrade,
      paymentMethodId,
      hasPaymentMethod: !!paymentMethodId
    });

    const result = await changePlan(priceId, isUpgrade, paymentMethodId);
    
    // Close dialog first
    setShowPlanDialog(false);
    
    // Dispatch events for UI updates
    window.dispatchEvent(new CustomEvent('plan-change-completed', {
      detail: { priceId, isUpgrade, result }
    }));
    
    window.dispatchEvent(new CustomEvent('billing-history-updated'));
    
    // Show success message
    setSyncSuccess(`Plan ${isUpgrade ? 'upgraded' : 'changed'} successfully!`);
    setTimeout(() => setSyncSuccess(null), 3000);
    
    // Reload payment methods in case they were updated
    loadPaymentMethods();
    
  } catch (err) {
    console.error('Plan change error:', err);
    setError(err instanceof Error ? err.message : 'Failed to change plan');
  } finally {
    setIsLoading(false);
  }
};
```

## Implementation Priority

### Immediate (Today)
1. ✅ Fix payment method detection logic in PlanChangeDialog
2. ✅ Add proper event listeners to account page
3. ✅ Test the fixes in development mode

### This Week
1. Enhance error handling for payment failures
2. Add loading states during plan changes
3. Implement proper state synchronization

## Testing Checklist

### Payment Method Detection
- [ ] Dialog opens with existing payment method pre-selected
- [ ] Default payment method is automatically chosen
- [ ] Expired payment methods are flagged and not selected
- [ ] Multiple payment methods show correct default

### Plan Status Updates
- [ ] Account page shows new plan immediately after change
- [ ] Billing history updates with new transaction
- [ ] Current plan card reflects new pricing
- [ ] Status badges update correctly

### Error Handling
- [ ] Payment failures show clear error messages
- [ ] Network errors are handled gracefully
- [ ] Invalid payment methods are rejected
- [ ] User can retry failed operations

## Success Criteria

✅ **PlanChangeDialog works as complete checkout**:
- Detects existing default payment method automatically
- Processes payment through Stripe successfully
- Updates billing section immediately

✅ **Account page reflects real-time changes**:
- Current plan updates immediately
- Billing history shows new transactions
- Payment methods stay synchronized

✅ **User experience is seamless**:
- No manual refresh required
- Clear feedback during processing
- Graceful error handling
