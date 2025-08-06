import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';
import { QuoteCreator } from '@/features/quotes/components/QuoteCreator';
import type { Quote } from '@/features/quotes/types';
import { convertDatabaseQuoteToQuote } from '@/features/quotes/types';
import { getCompanySettings } from '@/features/settings/actions';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

interface EditQuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  // Fetch quote, items, and company data
  const [quoteResult, itemsResponse, settingsResponse] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    getLineItems(),
    getCompanySettings(),
  ]);

  if (quoteResult.error || !quoteResult.data) {
    if (quoteResult.error?.code === 'PGRST116') {
      redirect('/quotes?error=not-found');
    }
    throw new Error('Failed to fetch quote');
  }

  // Convert database quote to application quote using utility function
  const typedQuote = convertDatabaseQuoteToQuote(quoteResult.data);
  const items = itemsResponse?.data;
  const settings = settingsResponse?.data;

  return (
    <div className="min-h-screen bg-light-concrete py-4 sm:py-6 lg:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PageBreadcrumbs customQuoteName={typedQuote.client_name ? `Edit Quote for ${typedQuote.client_name}` : 'Edit Quote'} />
        <QuoteCreator 
          availableItems={items || []} 
          defaultSettings={settings || null}
          initialDraft={typedQuote}
        />
      </div>
    </div>
  );
}