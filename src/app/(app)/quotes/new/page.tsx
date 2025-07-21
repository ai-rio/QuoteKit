import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';
import { getCompanySettings } from '@/features/settings/actions';

import { QuoteCreatorClient } from './quote-creator-client';

export default async function NewQuotePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const [{ data: items }, { data: settings }] = await Promise.all([
    getLineItems(),
    getCompanySettings(),
  ]);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Quote</h1>
          <p className="text-muted-foreground">
            Create a professional quote for your client with automatic calculations.
          </p>
        </div>
        
        <QuoteCreatorClient 
          availableItems={items || []} 
          defaultSettings={settings}
        />
      </div>
    </div>
  );
}