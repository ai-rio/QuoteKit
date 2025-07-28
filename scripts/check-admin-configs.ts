#!/usr/bin/env node

/**
 * Script to check admin configurations in the Supabase admin_settings table
 * Usage: npx tsx scripts/check-admin-configs.ts
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
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌')
  process.exit(1)
}

const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey)

interface AdminSetting {
  id: string
  key: string
  value: any
  updated_by: string | null
  created_at: string
  updated_at: string
}

async function checkAdminConfigs() {
  console.log('🔍 Checking admin configurations in Supabase...\n')
  
  try {
    // Query all admin settings
    const { data: settings, error } = await supabaseAdminClient
      .from('admin_settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('❌ Error querying admin_settings table:', error)
      return
    }

    if (!settings || settings.length === 0) {
      console.log('📋 No admin configurations found in the database.')
      console.log('   The admin_settings table exists but is empty.')
      return
    }

    console.log(`📋 Found ${settings.length} admin configuration(s):\n`)
    
    // Expected config keys
    const expectedConfigs = ['stripe_config', 'resend_config', 'posthog_config']
    
    settings.forEach((setting: AdminSetting) => {
      console.log(`🔑 Key: ${setting.key}`)
      console.log(`📅 Created: ${new Date(setting.created_at).toLocaleString()}`)
      console.log(`📅 Updated: ${new Date(setting.updated_at).toLocaleString()}`)
      
      // Show structure without exposing sensitive values
      if (setting.value && typeof setting.value === 'object') {
        const keys = Object.keys(setting.value)
        console.log(`📊 Config Structure: {${keys.join(', ')}}`)
        
        // Show masked values for known configs
        if (setting.key === 'stripe_config') {
          const config = setting.value as any
          console.log('   Fields:')
          console.log(`   - secret_key: ${config.secret_key ? `${config.secret_key.substring(0, 8)}...` : 'not set'}`)
          console.log(`   - publishable_key: ${config.publishable_key ? `${config.publishable_key.substring(0, 8)}...` : 'not set'}`)
          console.log(`   - webhook_secret: ${config.webhook_secret ? `${config.webhook_secret.substring(0, 8)}...` : 'not set'}`)
          console.log(`   - mode: ${config.mode || 'not set'}`)
        } else if (setting.key === 'resend_config') {
          const config = setting.value as any
          console.log('   Fields:')
          console.log(`   - api_key: ${config.api_key ? `${config.api_key.substring(0, 8)}...` : 'not set'}`)
          console.log(`   - from_email: ${config.from_email || 'not set'}`)
          console.log(`   - from_name: ${config.from_name || 'not set'}`)
        } else if (setting.key === 'posthog_config') {
          const config = setting.value as any
          console.log('   Fields:')
          console.log(`   - project_api_key: ${config.project_api_key ? `${config.project_api_key.substring(0, 8)}...` : 'not set'}`)
          console.log(`   - host: ${config.host || 'not set'}`)
          console.log(`   - project_id: ${config.project_id || 'not set'}`)
          console.log(`   - personal_api_key: ${config.personal_api_key ? `${config.personal_api_key.substring(0, 8)}...` : 'not set'}`)
        } else {
          console.log(`   Keys: ${keys.join(', ')}`)
        }
      } else {
        console.log(`📊 Value: ${JSON.stringify(setting.value)}`)
      }
      
      console.log(`👤 Updated by: ${setting.updated_by || 'system'}`)
      console.log('─'.repeat(50))
    })
    
    // Check for missing expected configs
    const existingKeys = settings.map(s => s.key)
    const missingConfigs = expectedConfigs.filter(key => !existingKeys.includes(key))
    
    if (missingConfigs.length > 0) {
      console.log('\n❗ Missing expected configurations:')
      missingConfigs.forEach(key => {
        console.log(`   - ${key}`)
      })
    }
    
    console.log('\n✅ Admin configuration check completed.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkAdminConfigs().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})