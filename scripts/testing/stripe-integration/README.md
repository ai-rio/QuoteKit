# Phase 1 Test Scripts

This directory contains console-based test scripts to verify Phase 1 Stripe integration implementation.

## Available Scripts

### 1. `run-step1-1-test.js` - Quick Step 1.1 Test
**Purpose**: Quick verification that Step 1.1 (Stripe Customer Creation) is working  
**Usage**: Copy and paste into browser console  
**Best for**: Quick status check

### 2. `test-step1-1.js` - Detailed Step 1.1 Test  
**Purpose**: Comprehensive test of Step 1.1 with detailed analysis  
**Usage**: Copy and paste into browser console  
**Best for**: Thorough testing and troubleshooting

### 3. `debug-phase1-comprehensive.js` - Full Phase 1 Debug
**Purpose**: Complete analysis of all Phase 1 components  
**Usage**: Copy and paste into browser console  
**Best for**: Deep debugging and understanding current state

## How to Use

### Prerequisites
1. Application running on `localhost:3000`
2. User logged in to the application
3. Browser console open (F12)

### Step-by-Step Instructions

1. **Open your browser** to `http://localhost:3000`

2. **Log in** to your account

3. **Open browser console** (F12 → Console tab)

4. **Choose and run a test script**:
   
   **For quick check:**
   ```javascript
   // Copy the entire contents of run-step1-1-test.js and paste here
   ```
   
   **For detailed analysis:**
   ```javascript
   // Copy the entire contents of test-step1-1.js and paste here
   ```
   
   **For comprehensive debugging:**
   ```javascript
   // Copy the entire contents of debug-phase1-comprehensive.js and paste here
   ```

5. **Press Enter** to execute

6. **Review the results** in the console

## Understanding Test Results

### Step 1.1 Test Results

#### ✅ SUCCESS Indicators
- `Has Stripe Customer: true`
- `Customer ID: cus_...` (starts with 'cus_')
- `Test Result: STEP 1.1 WORKING`

#### ❌ FAILURE Indicators  
- `Has Stripe Customer: false` (for paid users)
- `Customer ID: none` (for paid users)
- `Test Result: STEP 1.1 NOT WORKING`

#### ℹ️ Not Applicable
- `User Type: FREE` - Step 1.1 only applies to paid users

### What Each Test Checks

#### Quick Test (`run-step1-1-test.js`)
- ✅ User authentication
- ✅ Subscription count
- ✅ Stripe customer existence
- ✅ Basic Step 1.1 status

#### Detailed Test (`test-step1-1.js`)
- ✅ All Quick Test items
- ✅ Payment methods analysis
- ✅ Billing history analysis
- ✅ Detailed recommendations
- ✅ Troubleshooting guidance

#### Comprehensive Debug (`debug-phase1-comprehensive.js`)
- ✅ All Detailed Test items
- ✅ API accessibility testing
- ✅ Complete data structure analysis
- ✅ Phase 1 progress assessment
- ✅ Actionable recommendations

## Troubleshooting

### Common Issues

#### "Test failed: TypeError: Failed to fetch"
- **Cause**: Not logged in or API not accessible
- **Solution**: Log in and refresh the page

#### "FREE USER: You are on the free plan"
- **Cause**: User has no paid subscriptions
- **Solution**: Upgrade to a paid plan to test Step 1.1

#### "PAID USER without Stripe customer"
- **Cause**: Step 1.1 implementation not working
- **Solution**: 
  1. Try upgrading your plan again
  2. Check if `FORCE_PRODUCTION_PATH = true` in code
  3. Verify Stripe configuration

#### "Multiple subscriptions detected"
- **Cause**: User has both local and Stripe subscriptions
- **Solution**: This is expected during transition - newer subscriptions should have Stripe customers

### Getting Help

If tests are failing:

1. **Run the comprehensive debug script** for detailed analysis
2. **Check the browser Network tab** for failed API calls
3. **Look for error messages** in the browser console
4. **Verify your Stripe configuration** is correct
5. **Check the application logs** for server-side errors

## Expected Test Flow

### For New Implementation Testing

1. **Run comprehensive debug** to understand current state
2. **If you're a free user**: Upgrade to paid plan
3. **Run Step 1.1 test** to verify customer creation
4. **If Step 1.1 fails**: Check implementation and configuration
5. **If Step 1.1 passes**: Move to Step 1.2 testing

### For Ongoing Verification

1. **Run quick test** for regular status checks
2. **Run detailed test** when investigating issues
3. **Run comprehensive debug** for complete analysis

## Script Outputs

All scripts store their results in the browser console and some also store data in `window` variables for further inspection:

- `window.phase1DebugResults` - Comprehensive debug results
- Console logs with color-coded status indicators
- Actionable recommendations and next steps
