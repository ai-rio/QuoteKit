import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';

import { ItemsPageClient } from './items-page-client';

export default async function ItemsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const response = await getLineItems();
  const items = response?.data;

  return (
    <div className="bg-light-concrete min-h-screen">
      <div className="container mx-auto max-w-4xl py-8">
        <ItemsPageClient initialItems={items || []} />
      </div>
    </div>
  );
}