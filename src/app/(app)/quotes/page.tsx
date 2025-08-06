import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { getSession } from '@/features/account/controllers/get-session';
import { QuotesManager } from '@/features/quotes/components/QuotesManager';
import { convertDatabaseQuoteToQuote,Quote } from '@/features/quotes/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function QuotesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch quotes on server side
  const supabase = await createSupabaseServerClient();
  let quotes: Quote[] = [];

  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      quotes = (data || []).map(convertDatabaseQuoteToQuote);
    }
  } catch (err) {
    console.error('Error fetching quotes:', err);
  }

  return (
    <div className="min-h-screen bg-light-concrete py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <PageBreadcrumbs />
          <QuotesManager initialQuotes={quotes} />
        </div>
      </div>
    </div>
  );
}