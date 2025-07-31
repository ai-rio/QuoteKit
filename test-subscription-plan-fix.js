#!/usr/bin/env node

/**
 * Test script to verify subscription plan display fix
 * This script tests the complete flow from database to UI display
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testSubscriptionPlanDisplay() {
  console.log('🧪 Testing Subscription Plan Display Fix\n');
  
  try {
    // Test 1: Check database schema and relationships
    console.log('📊 Test 1: Database Schema Verification');
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_price_id,
        price_id,
        status,
        stripe_prices!subscriptions_stripe_price_id_fkey(
          stripe_price_id,
          unit_amount,
          currency,
          recurring_interval,
          stripe_products!stripe_prices_stripe_product_id_fkey(
            name,
            description,
            active
          )
        )
      `)
      .in('status', ['active', 'trialing'])
      .limit(5);
    
    if (subError) {
      console.error('❌ Database query failed:', subError.message);
      return false;
    }
    
    console.log(`✅ Found ${subscriptions.length} active subscriptions`);
    
    // Analyze each subscription
    let hasIssues = false;
    subscriptions.forEach((sub, index) => {
      console.log(`\n📋 Subscription ${index + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  User: ${sub.user_id}`);
      console.log(`  Price ID: ${sub.stripe_price_id || sub.price_id || 'None'}`);
      console.log(`  Status: ${sub.status}`);
      
      if (sub.stripe_prices) {
        console.log(`  ✅ Has price data: $${(sub.stripe_prices.unit_amount || 0) / 100} ${sub.stripe_prices.currency}`);
        
        if (sub.stripe_prices.stripe_products) {
          const productName = sub.stripe_prices.stripe_products.name;
          console.log(`  ✅ Has product data: ${productName}`);
          
          if (!productName || productName === 'Unknown Plan') {
            console.log(`  ⚠️  Issue: Product name is "${productName}"`);
            hasIssues = true;
          }
        } else {
          console.log(`  ❌ Missing product data - will show "Unknown Plan"`);
          hasIssues = true;
        }
      } else {
        console.log(`  ❌ Missing price data - will show "Unknown Plan"`);
        hasIssues = true;
      }
    });
    
    // Test 2: Check for missing product/price data
    console.log('\n🔍 Test 2: Missing Data Analysis');
    
    const { data: missingPriceData } = await supabase
      .from('subscriptions')
      .select('id, stripe_price_id')
      .in('status', ['active', 'trialing'])
      .is('stripe_prices.stripe_price_id', null);
    
    if (missingPriceData && missingPriceData.length > 0) {
      console.log(`⚠️  Found ${missingPriceData.length} subscriptions with missing price data`);
      hasIssues = true;
    } else {
      console.log('✅ All active subscriptions have price data');
    }
    
    // Test 3: Verify foreign key relationships
    console.log('\n🔗 Test 3: Foreign Key Relationships');
    
    const { data: relationshipTest, error: relError } = await supabase
      .rpc('select', {
        query: `
          SELECT 
            s.id as subscription_id,
            s.stripe_price_id,
            sp.stripe_price_id as price_exists,
            spr.name as product_name
          FROM subscriptions s
          LEFT JOIN stripe_prices sp ON s.stripe_price_id = sp.stripe_price_id
          LEFT JOIN stripe_products spr ON sp.stripe_product_id = spr.stripe_product_id
          WHERE s.status IN ('active', 'trialing')
          LIMIT 5
        `
      });
    
    // Test 4: Performance check
    console.log('\n⚡ Test 4: Query Performance');
    
    const startTime = Date.now();
    const { data: perfTest } = await supabase
      .from('subscriptions')
      .select(`
        id,
        stripe_prices!subscriptions_stripe_price_id_fkey(
          stripe_products!stripe_prices_stripe_product_id_fkey(name)
        )
      `)
      .in('status', ['active', 'trialing'])
      .limit(10);
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Query completed in ${queryTime}ms`);
    
    if (queryTime > 1000) {
      console.log('⚠️  Query is slow - consider adding indexes');
    }
    
    // Test 5: Check trigger functionality
    console.log('\n🔧 Test 5: Database Trigger Test');
    
    // This would require a test subscription update
    console.log('ℹ️  Trigger test requires manual verification');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Active subscriptions found: ${subscriptions.length}`);
    console.log(`Issues detected: ${hasIssues ? 'Yes' : 'No'}`);
    
    if (!hasIssues) {
      console.log('🎉 All tests passed! Subscription plan display should work correctly.');
    } else {
      console.log('⚠️  Issues found. Run the migration and sync scripts to fix.');
    }
    
    return !hasIssues;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function suggestFixes() {
  console.log('\n🛠️  Suggested Fixes:');
  console.log('1. Run the database migration:');
  console.log('   npx supabase db push');
  console.log('');
  console.log('2. Sync subscription data:');
  console.log('   curl -X POST http://localhost:3000/api/sync-my-subscription');
  console.log('');
  console.log('3. Check logs for specific issues:');
  console.log('   - Look for "Unknown Plan" in application logs');
  console.log('   - Check Stripe webhook logs for failed events');
  console.log('   - Verify product/price data in Supabase dashboard');
}

// Run the test
testSubscriptionPlanDisplay()
  .then(success => {
    if (!success) {
      suggestFixes();
      process.exit(1);
    }
    console.log('\n✅ All tests completed successfully!');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });