import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
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
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <PageBreadcrumbs />
        <ItemsPageClient initialItems={items || []} />
      </div>
    </div>
  );
}