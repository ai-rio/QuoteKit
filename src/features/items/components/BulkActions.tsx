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
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5"
            >
              Clear selection
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkFavorite}
              className="border-charcoal/20 text-charcoal hover:bg-charcoal/5"
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
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
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