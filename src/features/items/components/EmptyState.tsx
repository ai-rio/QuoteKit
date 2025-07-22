'use client';

import { Package, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  onAddItem: () => void;
  addItemDialog?: React.ReactNode;
}

export function EmptyState({ onAddItem, addItemDialog }: EmptyStateProps) {
  return (
    <Card className="bg-paper-white border border-stone-gray shadow-sm">
      <CardContent className="p-12">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-charcoal/30 mb-6">
            <Package className="h-full w-full" />
          </div>
          
          <h3 className="text-xl font-bold text-charcoal mb-2">
            Your library is empty
          </h3>
          
          <p className="text-charcoal/70 mb-6 max-w-md mx-auto">
            Start building your item library by adding services and materials. 
            This will make creating quotes faster and more consistent.
          </p>
          
          <div className="space-y-4">
            {addItemDialog || (
              <Button 
                onClick={onAddItem}
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            )}
            
            <div className="text-sm text-charcoal/60">
              <p className="mb-2">Popular item types to get started:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-stone-gray/20 text-charcoal rounded-full text-xs">
                  Lawn Mowing
                </span>
                <span className="px-3 py-1 bg-stone-gray/20 text-charcoal rounded-full text-xs">
                  Mulch Installation
                </span>
                <span className="px-3 py-1 bg-stone-gray/20 text-charcoal rounded-full text-xs">
                  Shrub Trimming
                </span>
                <span className="px-3 py-1 bg-stone-gray/20 text-charcoal rounded-full text-xs">
                  Fertilizer Application
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}