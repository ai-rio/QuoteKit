'use client';

import { useCallback, useState } from 'react';

import { getLineItems } from '@/features/items/actions';
import { AddItemDialog } from '@/features/items/components/add-item-dialog';
import { ItemLibrary } from '@/features/items/components/ItemLibrary';
import { ItemCategory, LineItem } from '@/features/items/types';

interface ItemsPageClientProps {
  initialItems: LineItem[];
}

// Mock categories data - in a real app, this would come from the database
const mockCategories: ItemCategory[] = [
  { id: '1', user_id: 'mock-user', name: 'Lawn Care', color: '#22c55e', created_at: new Date().toISOString() },
  { id: '2', user_id: 'mock-user', name: 'Landscaping', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: '3', user_id: 'mock-user', name: 'Materials', color: '#f59e0b', created_at: new Date().toISOString() },
  { id: '4', user_id: 'mock-user', name: 'Equipment', color: '#ef4444', created_at: new Date().toISOString() },
  { id: '5', user_id: 'mock-user', name: 'Maintenance', color: '#8b5cf6', created_at: new Date().toISOString() },
];

export function ItemsPageClient({ initialItems }: ItemsPageClientProps) {
  const [items, setItems] = useState<LineItem[]>(initialItems);

  const refreshItems = useCallback(async () => {
    const response = await getLineItems();
    if (response?.data) {
      setItems(response.data);
    }
  }, []);

  return (
    <div className="min-h-screen bg-light-concrete p-6">
      <div className="max-w-7xl mx-auto">
        <ItemLibrary 
          items={items}
          categories={mockCategories}
          onItemsChange={refreshItems}
        />
      </div>
    </div>
  );
}