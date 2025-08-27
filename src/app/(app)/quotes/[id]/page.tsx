import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { QuoteViewer } from '@/features/quotes/components/QuoteViewer';
import type { Quote } from '@/features/quotes/types';
import { convertDatabaseQuoteToQuote } from '@/features/quotes/types';
import type { CompanySettings } from '@/features/settings/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface QuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch quote and company data
  const [quoteResult, companyResult] = await Promise.all([
    supabase
      .from('quotes')
      .select(`
        *,
        properties (
          service_address,
          property_name
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('company_settings')
      .select('*')
      .eq('id', user.id) // Fixed: use 'id' instead of 'user_id'
      .single(),
  ]);

  if (quoteResult.error || !quoteResult.data) {
    if (quoteResult.error?.code === 'PGRST116') {
      redirect('/quotes?error=not-found');
    }
    throw new Error('Failed to fetch quote');
  }

  // Skip company error handling - we can work with null company settings

  // Convert database quote to application quote using utility function
  const typedQuote = convertDatabaseQuoteToQuote(quoteResult.data);
  const company = companyResult.data as CompanySettings | null;

  return (
    <div className="min-h-screen bg-light-concrete py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PageBreadcrumbs customQuoteName={typedQuote.client_name ? `Quote for ${typedQuote.client_name}` : 'Quote Details'} />
        <QuoteViewer quote={typedQuote} company={company} />
      </div>
    </div>
  );
}