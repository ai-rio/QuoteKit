import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';
import { QuoteCreator } from '@/features/quotes/components/QuoteCreator';
import { getCompanySettings } from '@/features/settings/actions';

export default async function NewQuotePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const [itemsResponse, settingsResponse] = await Promise.all([
    getLineItems(),
    getCompanySettings(),
  ]);
  
  const items = itemsResponse?.data;
  const settings = settingsResponse?.data;

  return (
    <div className="min-h-screen bg-light-concrete py-8">
      <div className="container mx-auto px-4">
        <QuoteCreator 
          availableItems={items || []} 
          defaultSettings={settings || null}
        />
      </div>
    </div>
  );
}