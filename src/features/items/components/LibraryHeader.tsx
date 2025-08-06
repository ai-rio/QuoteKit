'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LibraryHeaderProps {
  onAddItem: () => void;
  itemCount: number;
}

export function LibraryHeader({ onAddItem, itemCount }: LibraryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-2">
          Item Library
        </h1>
        <p className="text-charcoal/70">
          Manage your services and materials for faster quote creation
          {itemCount > 0 && (
            <span className="ml-2 text-sm">
              • {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </p>
      </div>
      
      <Button 
        onClick={onAddItem}
        className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}