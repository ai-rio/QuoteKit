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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

import { toggleItemFavorite } from '../actions';
import { ItemCategory, LineItem } from '../types';
import { CategoryBadge } from './CategoryBadge';
import { DeleteItemButton } from './delete-item-button';
import { EditItemDialog } from './edit-item-dialog';

interface ItemsTableProps {
  items: LineItem[];
  categories: ItemCategory[];
  selectedItems: string[];
  onItemsChange: () => void;
  onSelectAll: (checked: boolean) => void;
  onItemSelect: (itemId: string, checked: boolean) => void;
}

export function ItemsTable({
  items,
  categories,
  selectedItems,
  onItemsChange,
  onSelectAll,
  onItemSelect,
}: ItemsTableProps) {
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

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
      <div className="bg-paper-white border border-stone-gray shadow-sm rounded-md p-8">
        <div className="text-center py-8 text-charcoal/70">
          <p>No items match your current filters.</p>
          <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-white border border-stone-gray shadow-sm rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="border-stone-gray">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onCheckedChange={(checked: boolean) => onSelectAll(checked)}
                className="border-stone-gray data-[state=checked]:bg-forest-green data-[state=checked]:border-forest-green"
              />
            </TableHead>
            <TableHead className="w-8"></TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">ITEM NAME</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">CATEGORY</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">UNIT</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60 text-right">COST/RATE</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">LAST USED</TableHead>
            <TableHead className="text-right font-bold text-sm text-charcoal/60">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const isFavoriteLoading = favoriteLoading === item.id;
            
            return (
              <TableRow 
                key={item.id} 
                className={`
                  border-stone-gray hover:bg-stone-gray/10 transition-colors
                  ${isSelected ? 'bg-stone-gray/20' : ''}
                `}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked: boolean) => onItemSelect(item.id, checked)}
                    className="border-stone-gray data-[state=checked]:bg-forest-green data-[state=checked]:border-forest-green"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(item)}
                    disabled={isFavoriteLoading}
                    className="h-8 w-8 p-0 text-charcoal/60 hover:text-equipment-yellow hover:bg-transparent"
                  >
                    {item.is_favorite === true ? (
                      <Star className="h-4 w-4 fill-current text-equipment-yellow" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium text-charcoal">
                  {item.name}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs bg-stone-gray/20 text-charcoal/70"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-stone-gray/20 text-charcoal/70"
                        >
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <CategoryBadge 
                    categoryName={item.category}
                    categories={categories}
                    variant="solid"
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-charcoal">{item.unit || '—'}</TableCell>
                <TableCell className="font-mono text-charcoal text-right">
                  ${item.cost.toFixed(2)}
                </TableCell>
                <TableCell className="text-charcoal/70 text-sm">
                  {formatLastUsed(item.last_used_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-charcoal/60 hover:bg-stone-gray/20 active:bg-stone-gray/30"
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}