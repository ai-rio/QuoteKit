'use client';

import { MoreHorizontal, Star, StarOff } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

import { toggleItemFavorite } from '../actions';
import { ItemCategory, LineItem } from '../types';
import { CategoryBadge } from './CategoryBadge';
import { DeleteItemButton } from './delete-item-button';
import { EditItemDialog } from './edit-item-dialog';

interface ItemsCardProps {
  items: LineItem[];
  categories: ItemCategory[];
  selectedItems: string[];
  onItemsChange: () => void;
  onItemSelect: (itemId: string, checked: boolean) => void;
}

export function ItemsCard({
  items,
  categories,
  selectedItems,
  onItemsChange,
  onItemSelect,
}: ItemsCardProps) {
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);

  const handleToggleFavorite = async (item: LineItem) => {
    setFavoriteLoading(item.id);
    try {
      const response = await toggleItemFavorite(item.id, item.is_favorite !== true);
      if (response?.error) {
        toast({
          variant: 'destructive',
          description: response.error.message || 'Failed to update favorite status',
        });
      } else {
        onItemsChange();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to update favorite status',
      });
    } finally {
      setFavoriteLoading(null);
    }
  };



  const formatLastUsed = (lastUsedAt: string | null | undefined) => {
    if (!lastUsedAt) return 'Never';
    const date = new Date(lastUsedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (items.length === 0) {
    return (
      <div className="bg-paper-white border border-stone-gray shadow-sm rounded-md p-6">
        <div className="text-center py-8 text-charcoal/70">
          <p>No items match your current filters.</p>
          <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        const isFavoriteLoading = favoriteLoading === item.id;
        
        return (
          <div 
            key={item.id} 
            className={`
              bg-paper-white border border-stone-gray shadow-sm rounded-lg p-4
              transition-all duration-200
              ${isSelected ? 'ring-2 ring-forest-green/20 border-forest-green/30 bg-forest-green/5' : 'hover:shadow-md'}
            `}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked: boolean) => onItemSelect(item.id, checked)}
                  className="border-stone-gray data-[state=checked]:bg-forest-green data-[state=checked]:border-forest-green mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-charcoal text-base leading-tight truncate">
                    {item.name}
                  </h3>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs bg-stone-gray/20 text-charcoal/70"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-stone-gray/20 text-charcoal/70"
                        >
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFavorite(item)}
                  disabled={isFavoriteLoading}
                  className="h-9 w-9 p-0 text-charcoal/60 hover:text-equipment-yellow hover:bg-transparent"
                >
                  {item.is_favorite === true ? (
                    <Star className="h-4 w-4 fill-current text-equipment-yellow" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0 text-charcoal/60 hover:bg-stone-gray/20 active:bg-stone-gray/30"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-paper-white border-stone-gray">
                    <EditItemDialog item={item} onItemUpdated={onItemsChange} categories={categories}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-charcoal hover:bg-stone-gray/20">
                        Edit Item
                      </DropdownMenuItem>
                    </EditItemDialog>
                    <DropdownMenuItem 
                      onClick={() => handleToggleFavorite(item)}
                      disabled={isFavoriteLoading}
                      className="text-charcoal hover:bg-stone-gray/20"
                    >
                      {item.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </DropdownMenuItem>
                    <DeleteItemButton
                      itemId={item.id}
                      itemName={item.name}
                      onItemDeleted={onItemsChange}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-charcoal/60 font-medium block mb-1">Category</span>
                <CategoryBadge 
                  categoryName={item.category}
                  categories={categories}
                  variant="solid"
                  size="sm"
                />
              </div>
              
              <div>
                <span className="text-charcoal/60 font-medium block mb-1">Unit</span>
                <span className="text-charcoal">{item.unit || '—'}</span>
              </div>
              
              <div>
                <span className="text-charcoal/60 font-medium block mb-1">Cost/Rate</span>
                <span className="font-mono text-charcoal font-medium">
                  ${item.cost.toFixed(2)}
                </span>
              </div>
              
              <div>
                <span className="text-charcoal/60 font-medium block mb-1">Last Used</span>
                <span className="text-charcoal/70">
                  {formatLastUsed(item.last_used_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}