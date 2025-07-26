#!/usr/bin/env tsx

/**
 * Local Development Stripe Sync Script
 * 
 * This script syncs all products and prices from Stripe to your local database.
 * Run this when setting up local development or when Stripe products are updated.
 * 
 * Usage:
 *   npm run sync-stripe
 *   or
 *   npx tsx scripts/sync-stripe.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { syncStripeProductsAndPrices } from '../src/features/pricing/controllers/upsert-price';

async function main() {
  console.log('🔄 Starting Stripe products and prices sync...\n');
  
  try {
    const result = await syncStripeProductsAndPrices();
    
    console.log('\n📊 Sync Summary:');
    console.log(`  • Products synced: ${result.productsCount}`);
    console.log(`  • Prices synced: ${result.pricesCount}`);
    console.log('\n✅ All done! Your local database is now in sync with Stripe.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('  1. Check your Stripe API keys in .env.local');
    console.log('  2. Ensure your local Supabase is running');
    console.log('  3. Verify you have products created in your Stripe dashboard');
    
    process.exit(1);
  }
}

main();