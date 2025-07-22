import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';

export default async function QuotesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-light-concrete py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-charcoal mb-2">All Quotes</h1>
            <p className="text-charcoal/60">Manage all your quotes in one place</p>
          </div>
          
          <div className="bg-paper-white border border-stone-gray rounded-lg p-8 text-center">
            <div className="text-charcoal/60 text-lg mb-4">
              Quotes management coming soon
            </div>
            <p className="text-charcoal/60 mb-6">
              This feature is under development. For now, you can create new quotes.
            </p>
            <a 
              href="/quotes/new"
              className="inline-flex items-center justify-center px-6 py-3 bg-forest-green text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
              Create New Quote
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}