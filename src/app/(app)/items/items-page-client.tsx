'use client';

import { useCallback, useState } from 'react';

import { getLineItems } from '@/features/items/actions';
import { AddItemDialog } from '@/features/items/components/add-item-dialog';
import { ItemsTable } from '@/features/items/components/items-table';
import { LineItem } from '@/features/items/types';

interface ItemsPageClientProps {
  initialItems: LineItem[];
}

export function ItemsPageClient({ initialItems }: ItemsPageClientProps) {
  const [items, setItems] = useState<LineItem[]>(initialItems);

  const refreshItems = useCallback(async () => {
    const response = await getLineItems();
    if (response?.data) {
      setItems(response.data);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">My Items</h1>
          <p className="text-charcoal/70">
            Manage your services and materials database for quick quote creation.
          </p>
        </div>
        <AddItemDialog onItemAdded={refreshItems} />
      </div>
      
      <ItemsTable items={items} onItemsChange={refreshItems} />
    </div>
  );
}