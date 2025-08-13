'use client';

import { useCallback, useEffect, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategories, getLineItems } from '@/features/items/actions';
import { AddItemDialog } from '@/features/items/components/add-item-dialog';
import { CategoryManager } from '@/features/items/components/CategoryManager';
import { ItemLibrary } from '@/features/items/components/ItemLibrary';
import { ItemCategory, LineItem } from '@/features/items/types';

interface ItemsPageClientProps {
  initialItems: LineItem[];
}

export function ItemsPageClient({ initialItems }: ItemsPageClientProps) {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  const refreshItems = useCallback(async () => {
    const response = await getLineItems();
    if (response?.data) {
      setItems(response.data);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    const response = await getCategories();
    if (response?.data) {
      setCategories(response.data);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <div className="w-full">
      <Tabs defaultValue="items" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-paper-white border border-stone-gray">
          <TabsTrigger 
            value="items" 
            className="text-charcoal data-[state=active]:bg-forest-green data-[state=active]:text-white text-sm sm:text-base"
          >
            Items Library
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="text-charcoal data-[state=active]:bg-forest-green data-[state=active]:text-white text-sm sm:text-base"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="global" 
            className="text-charcoal data-[state=active]:bg-forest-green data-[state=active]:text-white text-sm sm:text-base"
          >
            Global Library
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="space-y-4 sm:space-y-6">
          <ItemLibrary 
            items={items}
            categories={categories}
            onItemsChange={refreshItems}
          />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4 sm:space-y-6">
          <CategoryManager 
            categories={categories}
            onCategoriesChange={refreshCategories}
          />
        </TabsContent>
        
        <TabsContent value="global" className="space-y-4 sm:space-y-6" data-tour="global-library">
          <div className="bg-paper-white border border-stone-gray rounded-lg p-6">
            <h2 className="text-xl font-bold text-charcoal mb-4">Professional Items Library</h2>
            <p className="text-charcoal/70 mb-4">
              Browse our curated collection of professional landscaping services and materials. 
              Copy items to your personal library to save time on quote creation.
            </p>
            <div className="bg-light-concrete p-4 rounded-lg">
              <p className="text-sm text-charcoal/60">
                🚀 Global library integration coming soon! This will include hundreds of pre-configured 
                landscaping services, materials, and equipment with professional pricing.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}