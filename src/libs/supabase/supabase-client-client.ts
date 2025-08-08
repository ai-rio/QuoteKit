// Client-side Supabase client for browser usage

import { createBrowserClient } from '@supabase/ssr';

import { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';

export function createSupabaseClientClient(url?: string, key?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  // Simplified client options that work with browser security
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      debug: process.env.NODE_ENV === 'development',
      // Set proper storage for browser environment
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    // Remove problematic fetch customization that violates CORS
    global: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  };
  
  console.log('🔧 Creating Supabase client with URL:', supabaseUrl);
  console.log('🔑 Using API key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
  
  return createBrowserClient<Database>(supabaseUrl, supabaseKey, options);
}