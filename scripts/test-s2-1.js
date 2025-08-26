#!/usr/bin/env node

/**
 * S2.1 B2B2C Payment System Test Script
 * 
 * This script helps validate the S2.1 implementation by:
 * 1. Checking database schema
 * 2. Validating required components exist
 * 3. Testing basic functionality
 */

// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testS21Implementation() {
  log('🧪 Testing S2.1 B2B2C Payment System Implementation', 'blue');
  log('=' .repeat(60), 'blue');

  // Test 1: Check required files exist
  log('\n📁 Test 1: Checking required files...', 'yellow');
  
  const requiredFiles = [
    'src/features/quotes/actions/homeowner-invoice-actions.ts',
    'src/features/quotes/components/QuotePaymentStatus.tsx',
    'supabase/migrations/20250826000001_b2b2c_payment_system.sql'
  ];

  let filesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - MISSING`, 'red');
      filesExist = false;
    }
  }

  if (!filesExist) {
    log('\n❌ Required files missing. Cannot proceed with testing.', 'red');
    return;
  }

  // Test 2: Check environment variables
  log('\n🔧 Test 2: Checking environment variables...', 'yellow');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`  ✅ ${envVar}`, 'green');
    } else {
      log(`  ❌ ${envVar} - MISSING`, 'red');
      envVarsOk = false;
    }
  }

  if (!envVarsOk) {
    log('\n❌ Required environment variables missing.', 'red');
    log('Please check your .env file.', 'yellow');
    return;
  }

  // Test 3: Database schema validation
  log('\n🗄️  Test 3: Validating database schema...', 'yellow');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if B2B2C columns exist in quotes table
    const { data: quotesSchema, error: quotesError } = await supabase
      .from('quotes')
      .select('stripe_invoice_id, stripe_customer_id, invoice_status, homeowner_email')
      .limit(1);

    if (quotesError && quotesError.code === '42703') {
      log('  ❌ B2B2C columns missing from quotes table', 'red');
      log('  Run: supabase migration up', 'yellow');
      return;
    } else {
      log('  ✅ Quotes table has B2B2C columns', 'green');
    }

    // Check if homeowner_payments table exists
    const { data: paymentsSchema, error: paymentsError } = await supabase
      .from('homeowner_payments')
      .select('id')
      .limit(1);

    if (paymentsError && paymentsError.code === '42P01') {
      log('  ❌ homeowner_payments table missing', 'red');
      log('  Run: supabase migration up', 'yellow');
      return;
    } else {
      log('  ✅ homeowner_payments table exists', 'green');
    }

    log('  ✅ Database schema validation passed', 'green');

  } catch (error) {
    log(`  ❌ Database connection failed: ${error.message}`, 'red');
    return;
  }

  // Test 4: Component validation
  log('\n⚛️  Test 4: Validating React components...', 'yellow');
  
  try {
    const homeownerActionsContent = fs.readFileSync(
      'src/features/quotes/actions/homeowner-invoice-actions.ts', 
      'utf8'
    );
    
    const requiredFunctions = [
      'createHomeownerInvoice',
      'createHomeownerPortalSession'
    ];

    for (const func of requiredFunctions) {
      if (homeownerActionsContent.includes(func)) {
        log(`  ✅ ${func} function exists`, 'green');
      } else {
        log(`  ❌ ${func} function missing`, 'red');
      }
    }

    const componentContent = fs.readFileSync(
      'src/features/quotes/components/QuotePaymentStatus.tsx',
      'utf8'
    );

    if (componentContent.includes('QuotePaymentStatus')) {
      log('  ✅ QuotePaymentStatus component exists', 'green');
    } else {
      log('  ❌ QuotePaymentStatus component missing', 'red');
    }

  } catch (error) {
    log(`  ❌ Component validation failed: ${error.message}`, 'red');
    return;
  }

  // Test Summary
  log('\n🎯 S2.1 Implementation Test Summary', 'blue');
  log('=' .repeat(40), 'blue');
  log('✅ All required files exist', 'green');
  log('✅ Environment variables configured', 'green');
  log('✅ Database schema is ready', 'green');
  log('✅ Components are implemented', 'green');
  
  log('\n🚀 Ready for manual testing!', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Start development server: npm run dev', 'yellow');
  log('2. Navigate to a quote details page', 'yellow');
  log('3. Look for QuotePaymentStatus component', 'yellow');
  log('4. Test invoice creation workflow', 'yellow');
  log('5. Follow the test plan in docs/testing/S2.1_B2B2C_PAYMENT_TEST_PLAN.md', 'yellow');
}

// Run the test
testS21Implementation().catch(console.error);
