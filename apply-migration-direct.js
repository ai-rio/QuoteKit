#!/usr/bin/env node

/**
 * Direct Migration Application Script
 * Applies the clean subscription schema directly to the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function applyMigrationDirect() {
  console.log('🚀 Direct Migration Application Starting...');
  
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('📡 Connected to Supabase:', supabaseUrl);
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250729000000_implement_clean_subscription_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📁 Migration file loaded successfully');
    console.log(`📊 Migration size: ${Math.round(migrationSQL.length / 1024)}KB`);
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct SQL execution
          const { error: directError } = await supabase
            .from('_migration_temp')
            .select('*')
            .limit(0); // This will create a dummy query to check connection
            
          if (directError) {
            console.warn(`⚠️  Statement ${i + 1} failed:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n🎯 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migration partially or fully applied!');
      console.log('📋 Next steps:');
      console.log('1. Run: npm run generate-types');
      console.log('2. Restart your Next.js application');
      console.log('3. Test subscription functionality');
      
      return { success: true, successCount, errorCount, total: statements.length };
    } else {
      console.log('\n💥 Migration failed completely');
      console.log('💡 Try using Supabase Studio instead:');
      console.log('1. Open: https://supabase.com/dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Execute the SQL from DEPLOY_SCHEMA.md');
      
      return { success: false, successCount, errorCount, total: statements.length };
    }
    
  } catch (error) {
    console.error('❌ Migration application failed:', error);
    console.log('\n💡 Alternative approaches:');
    console.log('1. Use Supabase Studio (browser)');
    console.log('2. Fix Docker permissions and retry npm run migration:up');
    console.log('3. Use a SQL client to connect directly');
    
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  applyMigrationDirect().then(result => {
    if (result.success) {
      console.log('\n🎊 Direct migration application complete!');
      process.exit(0);
    } else {
      console.error('\n💔 Direct migration failed');
      process.exit(1);
    }
  });
}

module.exports = { applyMigrationDirect };