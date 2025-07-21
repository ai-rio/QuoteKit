import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getQuotes } from '@/features/quotes/actions';

import { QuotesPageClient } from './quotes-page-client';

export default async function QuotesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: quotes } = await getQuotes();

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <QuotesPageClient initialQuotes={quotes || []} />
    </div>
  );
}