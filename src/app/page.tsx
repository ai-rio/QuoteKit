import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import HomePageClient from './home-page-client';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function HomePage({ searchParams }: Props) {
  // Allow bypass for testing with ?preview=true
  const isPreview = searchParams.preview === 'true';
  
  if (!isPreview) {
    // Check if user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is authenticated, redirect to dashboard
    if (user) {
      redirect('/dashboard');
    }
  }

  // Show the public marketing page
  return <HomePageClient />;
}
