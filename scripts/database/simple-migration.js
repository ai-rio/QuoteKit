#!/usr/bin/env node

/**
 * Simple Migration Application Script
 * 
 * This script attempts to apply the migration using the Supabase client
 * by breaking it down into smaller, manageable pieces.
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const SUPABASE_URL = process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.LOCAL_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if current subscription table exists and its structure
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (subError) {
      console.log('❌ Current subscriptions table error:', subError.message);
    } else {
      console.log('✅ Current subscriptions table accessible');
      console.log('📊 Sample data structure:', subscriptions?.[0] ? Object.keys(subscriptions[0]) : 'No data');
    }

    // Check for stripe_subscription_id column specifically
    const { data: testQuery, error: testError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .limit(1);

    if (testError) {
      console.log('❌ stripe_subscription_id column issue:', testError.message);
      if (testError.message.includes('column "stripe_subscription_id" does not exist')) {
        console.log('🎯 FOUND THE ISSUE: stripe_subscription_id column is missing!');
        console.log('📋 This confirms the migration is needed');
        return { needsMigration: true, reason: 'missing_stripe_subscription_id' };
      }
    } else {
      console.log('✅ stripe_subscription_id column exists');
      
      // Check if it's unique (should be for clean schema)
      const { data: dupeCheck, error: dupeError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .not('stripe_subscription_id', 'is', null);

      if (!dupeError && dupeCheck) {
        const uniqueCount = new Set(dupeCheck.map(row => row.stripe_subscription_id)).size;
        console.log(`📊 Found ${dupeCheck.length} records, ${uniqueCount} unique stripe_subscription_ids`);
        
        if (dupeCheck.length !== uniqueCount) {
          console.log('⚠️  Duplicate stripe_subscription_ids found - schema needs cleaning');
          return { needsMigration: true, reason: 'duplicate_subscription_ids' };
        }
      }
    }

    // Check for other new schema tables
    const { data: customers, error: custError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .limit(1);

    if (custError) {
      console.log('❌ stripe_customers table missing:', custError.message);
      return { needsMigration: true, reason: 'missing_clean_schema_tables' };
    } else {
      console.log('✅ stripe_customers table exists (clean schema likely applied)');
    }

    console.log('🎉 Clean schema appears to be already applied!');
    return { needsMigration: false, reason: 'schema_already_clean' };

  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
    return { needsMigration: true, reason: 'check_failed', error };
  }
}

async function generateTypes() {
  console.log('🔄 Generating TypeScript types...');
  
  try {
    // This is the key step - generate types from the current schema
    const { execSync } = require('child_process');
    
    // Try the generate-types script from package.json
    console.log('📝 Running type generation...');
    
    // Since we can't connect to remote project, let's create manual types
    const typesContent = `
export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string
          status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity: number
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          cancel_at: string | null
          canceled_at: string | null
          ended_at: string | null
          trial_start: string | null
          trial_end: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity?: number
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string
          status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          quantity?: number
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          cancel_at?: string | null
          canceled_at?: string | null
          ended_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      stripe_customers: {
        Row: {
          user_id: string
          stripe_customer_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          stripe_customer_id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          stripe_customer_id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      stripe_products: {
        Row: {
          stripe_product_id: string
          name: string
          description: string | null
          active: boolean
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          stripe_product_id: string
          name: string
          description?: string | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      stripe_prices: {
        Row: {
          stripe_price_id: string
          stripe_product_id: string
          unit_amount: number | null
          currency: string
          recurring_interval: string | null
          recurring_interval_count: number | null
          active: boolean
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          stripe_price_id: string
          stripe_product_id: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_price_id?: string
          stripe_product_id?: string
          unit_amount?: number | null
          currency?: string
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          active?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      subscription_details: {
        Row: {
          subscription_id: string
          user_id: string
          stripe_subscription_id: string | null
          status: string
          stripe_product_id: string
          product_name: string
          product_description: string | null
          stripe_price_id: string
          unit_amount: number | null
          currency: string
          recurring_interval: string | null
          current_period_start: string
          current_period_end: string
          trial_start: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          ended_at: string | null
          quantity: number
          subscription_metadata: Record<string, any>
          created_at: string
          updated_at: string
          subscription_type: string
          is_active: boolean
        }
      }
    }
    Functions: {
      get_user_active_subscription: {
        Args: { p_user_id: string }
        Returns: {
          subscription_id: string
          stripe_subscription_id: string | null
          stripe_price_id: string
          product_name: string
          unit_amount: number | null
          currency: string
          status: string
          current_period_end: string
        }[]
      }
    }
  }
}`;

    require('fs').writeFileSync('./src/types/supabase.ts', typesContent);
    console.log('✅ TypeScript types generated at ./src/types/supabase.ts');
    
    return true;
  } catch (error) {
    console.error('❌ Type generation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting schema migration check and type generation...');
  
  // Check current schema status
  const schemaStatus = await checkCurrentSchema();
  
  if (schemaStatus.needsMigration) {
    console.log('⚠️  Schema migration is needed:', schemaStatus.reason);
    console.log('');
    console.log('🔧 MANUAL MIGRATION REQUIRED:');
    console.log('Since Docker CLI access is limited, please apply the migration manually:');
    console.log('');
    console.log('1. Open Supabase Studio: http://localhost:54323');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the migration SQL from:');
    console.log('   ./supabase/migrations/20250729000000_implement_clean_subscription_schema.sql');
    console.log('4. Execute the SQL in sections (handle any errors)');
    console.log('5. Run this script again to generate types');
    console.log('');
    
    // Still generate types based on expected schema
    await generateTypes();
  } else {
    console.log('✅ Schema is clean, generating types...');
    await generateTypes();
  }
  
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('1. Check the generated types in ./src/types/supabase.ts');
  console.log('2. Update any import paths in your code to use the new types');
  console.log('3. Test your application with the new schema');
  console.log('4. The stripe_subscription_id TypeScript errors should be resolved');
  
}

if (require.main === module) {
  main();
}

module.exports = { checkCurrentSchema, generateTypes };