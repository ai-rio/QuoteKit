import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getLineItems } from '@/features/items/actions';

import { ItemsPageClient } from './items-page-client';

export default async function ItemsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: items } = await getLineItems();

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <ItemsPageClient initialItems={items || []} />
    </div>
  );
}