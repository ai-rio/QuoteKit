import { redirect } from 'next/navigation';

import { MarketingLayout } from '@/components/layout/marketing-layout';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import HomePageClient from './home-page-client';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  // Allow bypass for testing with ?preview=true
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  
  if (!isPreview) {
    // Check if user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user is authenticated, redirect to dashboard
    if (user) {
      redirect('/dashboard');
    }
  }

  // Show the public marketing page without breadcrumbs (it's the home page)
  return (
    <MarketingLayout showBreadcrumbs={false}>
      <HomePageClient />
    </MarketingLayout>
  );
}
