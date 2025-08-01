# Debug Plan Change Dialog Issue - Enhanced Version

## Current Status
The error "Payment method required for upgrades" is still occurring despite implementing fixes.

## Enhanced Debugging Steps

### 1. Check Environment Detection
Look for these new console logs:
- `🌍 Environment detection:` - Shows environment variables and detection logic
- `🎯 Path Selection:` - Shows which code path (development vs production) is being taken
- `🔍 Stripe Integration Check:` - Shows Stripe customer/subscription IDs

### 2. Check if changes are being loaded
- Added console.log at start of handlePlanChange: `🔥 FIXED VERSION: handlePlanChange called`
- If this appears in browser console, the fix is loaded
- If not, there's a caching or compilation issue

### 3. Check payment method state
When the dialog opens, check browser console for:
- `🔍 Setting up payment method selection:` - Shows payment method loading
- `🔧 Default payment method set:` - Shows successful selection
- `⚠️ No valid payment methods available:` - Shows when no valid methods

### 4. Check validation flow
When clicking "Change Plan", look for:
- `🚀 handlePlanChange called with state:` - Shows current state
- `💰 Plan change analysis:` - Shows upgrade/downgrade analysis
- `⬆️ This is an upgrade, validating payment method...` - Shows upgrade validation
- `✅ Upgrade validation passed:` - Shows successful validation

### 5. Server-side validation
Added validation in subscription-actions.ts:
- For new subscriptions (free to paid)
- For existing subscription upgrades
- Both now require payment method for upgrades in development mode

### 6. NEW: Force Production Path Testing
Added debug flags to test Stripe integration:
- Set `FORCE_PRODUCTION_PATH = true` in subscription-actions.ts (lines ~118 and ~267)
- This will force the code to use Stripe integration even in development
- Look for `🎯 Path Selection:` logs to confirm which path is taken

## Expected Flow

### Scenario 1: User has valid payment methods
1. Dialog opens
2. Default payment method auto-selected
3. User selects upgrade plan
4. Validation passes
5. Server action succeeds

### Scenario 2: User has no payment methods
1. Dialog opens
2. No payment methods available
3. User selects upgrade plan
4. Client validation fails with clear message
5. "Add Payment Method" button shown

### Scenario 3: User has expired payment methods
1. Dialog opens
2. Expired methods filtered out
3. Valid method auto-selected (if any)
4. User proceeds normally

## NEW: Comprehensive Debug Test

### Option 1: Browser Console Script
1. Open browser dev tools
2. Navigate to account page
3. Copy and paste the contents of `debug-test-script.js` into the console
4. Press Enter to run the comprehensive test
5. Review all the logged information

### Option 2: Manual Testing
1. Open browser dev tools
2. Navigate to account page
3. Click "Change Plan"
4. Check console for all the new debug messages
5. Try to upgrade plan
6. Observe error messages and flow

## Key Debug Messages to Look For

### Environment Detection
```
🌍 Environment detection: {
  NODE_ENV: "development",
  SUPABASE_URL: true,
  isDevelopment: true,
  STRIPE_SECRET_KEY_EXISTS: true
}
```

### Path Selection
```
🎯 Path Selection: {
  FORCE_PRODUCTION_PATH: false,
  isDevelopment: true,
  willUseStripe: false,
  pathSelected: "DEVELOPMENT (Database Only)"
}
```

### Stripe Integration Status
```
🔍 Stripe Integration Check: {
  hasStripeCustomerId: true,
  hasStripeSubscriptionId: true,
  canProcessPayments: true,
  canHandleUpgrades: true
}
```

## Testing Scenarios

### Test 1: Development Path (Current)
1. Keep `FORCE_PRODUCTION_PATH = false`
2. Should see "DEVELOPMENT (Database Only)" in path selection
3. Should work for plan changes without Stripe

### Test 2: Production Path (New)
1. Set `FORCE_PRODUCTION_PATH = true`
2. Should see "PRODUCTION (Stripe Integration)" in path selection
3. Should attempt to use Stripe for plan changes
4. May reveal Stripe integration issues

## Files Modified
- `src/features/account/components/PlanChangeDialog.tsx` - Enhanced Stripe integration logging
- `src/features/account/actions/subscription-actions.ts` - Environment detection and path selection logging
- `src/app/api/payment-methods/route.ts` - Enhanced API logging
- `debug-test-script.js` - Comprehensive test script

## Next Steps
1. Run the comprehensive debug test script
2. Test both development and production paths
3. Check if debug messages appear
4. Identify where the exact error is coming from
5. Fix the root cause based on findings

## Quick Commands
```javascript
// Run in browser console for comprehensive test
debugPaymentFlow()

// Manually open plan dialog
debugOpenPlanDialog()
```
