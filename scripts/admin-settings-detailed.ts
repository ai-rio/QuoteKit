#!/usr/bin/env node

/**
 * Detailed admin settings analysis script
 * Usage: npx tsx scripts/admin-settings-detailed.ts
 */

// Load environment variables from .env.local file
import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

// Create Supabase admin client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey)

async function detailedAnalysis() {
  console.log('🔍 Detailed Admin Settings Analysis\n')
  
  try {
    // Check if admin_settings table exists
    console.log('1️⃣ Checking table structure...')
    const { data: tableInfo } = await supabaseAdminClient
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'admin_settings')
      .eq('table_schema', 'public')

    if (!tableInfo || tableInfo.length === 0) {
      console.log('❌ admin_settings table does not exist')
      return
    }
    
    console.log('✅ admin_settings table exists\n')

    // Get column information
    console.log('2️⃣ Table schema:')
    const { data: columns } = await supabaseAdminClient
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'admin_settings')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (columns) {
      columns.forEach(col => {
        console.log(`   📝 ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
      })
    }
    console.log('')

    // Get all admin settings
    console.log('3️⃣ Current admin settings:')
    const { data: settings, error } = await supabaseAdminClient
      .from('admin_settings')
      .select('*')
      .order('key')

    if (error) {
      console.error('❌ Error querying admin_settings:', error)
      return
    }

    if (!settings || settings.length === 0) {
      console.log('📋 No admin settings found\n')
    } else {
      console.log(`📋 Found ${settings.length} admin setting(s):\n`)
      
      settings.forEach((setting, index) => {
        console.log(`${index + 1}. 🔑 ${setting.key}`)
        console.log(`   📊 ID: ${setting.id}`)
        console.log(`   👤 Updated by: ${setting.updated_by || 'system'}`)
        console.log(`   📅 Created: ${new Date(setting.created_at).toLocaleString()}`)
        console.log(`   📅 Updated: ${new Date(setting.updated_at).toLocaleString()}`)
        
        if (setting.value && typeof setting.value === 'object') {
          const keys = Object.keys(setting.value)
          console.log(`   🏗️  Structure: {${keys.join(', ')}}`)
          
          // Show configuration status
          if (setting.key === 'stripe_config') {
            const config = setting.value as any
            const isConfigured = !!(config.secret_key && config.publishable_key)
            console.log(`   ⚙️  Status: ${isConfigured ? '✅ Configured' : '❌ Incomplete'}`)
          } else if (setting.key === 'resend_config') {
            const config = setting.value as any
            const isConfigured = !!(config.api_key && config.from_email)
            console.log(`   ⚙️  Status: ${isConfigured ? '✅ Configured' : '❌ Incomplete'}`)
          } else if (setting.key === 'posthog_config') {
            const config = setting.value as any
            const isConfigured = !!(config.project_api_key && config.personal_api_key)
            console.log(`   ⚙️  Status: ${isConfigured ? '✅ Configured' : '❌ Incomplete'}`)
          }
        } else {
          console.log(`   📊 Value: ${JSON.stringify(setting.value)}`)
        }
        console.log('')
      })
    }

    // Check for missing configurations
    console.log('4️⃣ Configuration completeness:')
    const expectedConfigs = [
      { key: 'stripe_config', name: 'Stripe Payment Processing' },
      { key: 'resend_config', name: 'Resend Email Service' },
      { key: 'posthog_config', name: 'PostHog Analytics' }
    ]
    
    const existingKeys = settings?.map(s => s.key) || []
    
    expectedConfigs.forEach(config => {
      const exists = existingKeys.includes(config.key)
      console.log(`   ${exists ? '✅' : '❌'} ${config.name} (${config.key})`)
    })

    console.log('\n5️⃣ Summary:')
    console.log(`   📊 Total configurations: ${settings?.length || 0}/3`)
    console.log(`   ✅ Configured services: ${existingKeys.length}`)
    console.log(`   ❌ Missing services: ${3 - existingKeys.length}`)
    
    if (existingKeys.length === 3) {
      console.log('   🎉 All expected services are configured!')
    } else {
      console.log('   📝 Configure missing services through the admin panel')
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

// Run the analysis
detailedAnalysis().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})