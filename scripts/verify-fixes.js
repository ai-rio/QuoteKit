#!/usr/bin/env node

/**
 * Verify Fixes Script
 * 
 * This script verifies that the console log issues have been resolved
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Console Log Fixes');
console.log('===============================\n');

// Check 1: Layout.tsx has proper CSP headers
const layoutPath = path.join(__dirname, '../src/app/layout.tsx');
try {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('Content-Security-Policy')) {
    console.log('✅ CSP headers found in layout.tsx');
  } else {
    console.log('❌ CSP headers missing in layout.tsx');
  }
  
  if (layoutContent.includes('https://js.stripe.com')) {
    console.log('✅ Stripe domains included in CSP');
  } else {
    console.log('❌ Stripe domains missing from CSP');
  }
  
  if (layoutContent.includes('@/styles/globals.css')) {
    console.log('✅ Correct globals.css import path');
  } else {
    console.log('❌ Incorrect globals.css import path');
  }
  
  if (layoutContent.includes('@/utils/cn')) {
    console.log('✅ Correct utils import path');
  } else {
    console.log('❌ Incorrect utils import path');
  }
} catch (error) {
  console.log('❌ Error reading layout.tsx:', error.message);
}

// Check 2: AddPaymentMethodDialog has clean Stripe config
const dialogPath = path.join(__dirname, '../src/features/account/components/AddPaymentMethodDialog.tsx');
try {
  const dialogContent = fs.readFileSync(dialogPath, 'utf8');
  
  if (!dialogContent.includes('backgroundColor:') && !dialogContent.includes('lineHeight:') && !dialogContent.includes('padding:')) {
    console.log('✅ Invalid Stripe style parameters removed');
  } else {
    console.log('❌ Invalid Stripe style parameters still present');
  }
  
  if (!dialogContent.includes('focus:') || !dialogContent.match(/style:\s*{[^}]*focus:/)) {
    console.log('✅ Invalid Stripe focus parameter removed');
  } else {
    console.log('❌ Invalid Stripe focus parameter still present');
  }
} catch (error) {
  console.log('❌ Error reading AddPaymentMethodDialog.tsx:', error.message);
}

// Check 3: Payment method API has proper error handling
const apiPath = path.join(__dirname, '../src/app/api/payment-methods/[id]/route.ts');
try {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  if (apiContent.includes('resource_missing')) {
    console.log('✅ Proper 404 error handling added to API');
  } else {
    console.log('❌ 404 error handling missing from API');
  }
  
  if (apiContent.includes('stripeError.code')) {
    console.log('✅ Stripe error code handling implemented');
  } else {
    console.log('❌ Stripe error code handling missing');
  }
} catch (error) {
  console.log('❌ Error reading payment methods API:', error.message);
}

// Check 4: Next.js config has security headers
const configPath = path.join(__dirname, '../next.config.js');
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('async headers()')) {
    console.log('✅ Security headers configured in Next.js');
  } else {
    console.log('❌ Security headers missing from Next.js config');
  }
} catch (error) {
  console.log('❌ Error reading next.config.js:', error.message);
}

console.log('\n🎯 Summary:');
console.log('- CSP violations should be resolved');
console.log('- Stripe configuration warnings should be eliminated');
console.log('- Payment method 404 errors should be handled gracefully');
console.log('- Security headers should be properly configured');

console.log('\n🚀 Next Steps:');
console.log('1. Restart your development server');
console.log('2. Clear browser cache (Ctrl+Shift+R)');
console.log('3. Test payment method functionality');
console.log('4. Check console for remaining issues');

console.log('\n✨ Verification complete!');
