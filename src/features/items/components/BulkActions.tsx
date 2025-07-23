'use client';

import { Star, StarOff, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import type { LineItem } from '../types';

interface BulkActionsProps {
  selectedItems: LineItem[];
  onClearSelection: () => void;
  onBulkFavorite: (items: LineItem[], favorite: boolean) => void;
  onBulkDelete: (items: LineItem[]) => void;
}

export function BulkActions({
  selectedItems,
  onClearSelection,
  onBulkFavorite,
  onBulkDelete,
}: BulkActionsProps) {
  const selectedCount = selectedItems.length;
  const allFavorited = selectedItems.every(item => item.is_favorite);
  const someFavorited = selectedItems.some(item => item.is_favorite);

  const handleBulkFavorite = () => {
    const shouldFavorite = !allFavorited;
    onBulkFavorite(selectedItems, shouldFavorite);
    
    toast({
      title: shouldFavorite ? 'Items favorited' : 'Items unfavorited',
      description: `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} updated`,
    });
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}? This action cannot be undone.`)) {
      onBulkDelete(selectedItems);
      
      toast({
        title: 'Items deleted',
        description: `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} removed from your library`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-equipment-yellow/10 border border-equipment-yellow/30 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-charcoal">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
            
            <Button
              size="sm"
              onClick={onClearSelection}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              Clear selection
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkFavorite}
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold"
            >
              {allFavorited ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Unfavorite
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  {someFavorited ? 'Favorite all' : 'Favorite'}
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={handleBulkDelete}
              className="bg-stone-gray text-charcoal hover:bg-stone-gray/80 active:bg-stone-gray/70 font-bold border border-stone-gray"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}