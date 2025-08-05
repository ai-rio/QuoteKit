// Client-side Supabase client for browser usage

import { createBrowserClient } from '@supabase/ssr';

import { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';

export function createSupabaseClientClient() {
  return createBrowserClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}