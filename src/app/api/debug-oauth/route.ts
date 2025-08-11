import { NextResponse } from 'next/server';

import { getURL } from '@/utils/get-url';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      // Show only first and last 10 chars of sensitive vars for security
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 10)}...${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(-10)}` : 
        undefined
    },
    getURL_tests: {
      base: getURL(),
      callback: getURL('/auth/callback'),
      dashboard: getURL('/dashboard')
    }
  });
}