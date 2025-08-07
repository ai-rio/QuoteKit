'use client';

import { Plus, Search, Star, StarOff, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

import { ItemAccessTier, ItemCategory, ItemSearchFilters, LineItem } from '../types';
import { getUsableCategories, getUserTier } from '../utils/category-utils';
import { AddItemDialog } from './add-item-dialog';
import { BulkActions } from './BulkActions';
import { EmptyState } from './EmptyState';
import { ItemsCard } from './ItemsCard';
import { ItemsTable } from './ItemsTable';

interface ItemLibraryProps {
  items: LineItem[];
  categories: ItemCategory[];
  onItemsChange: () => void;
}

export function ItemLibrary({ items, categories, onItemsChange }: ItemLibraryProps) {
  const [filters, setFilters] = useState<ItemSearchFilters>({
    searchTerm: '',
    category: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    showFavoritesOnly: false,
  });
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<ItemAccessTier>('free');
  const [usableCategories, setUsableCategories] = useState<any[]>([]);

  // Load user tier and merge categories
  useEffect(() => {
    async function loadCategoriesWithTier() {
      try {
        const tier = await getUserTier();
        setUserTier(tier);
        const merged = getUsableCategories(categories, tier);
        setUsableCategories(merged);
      } catch (error) {
        console.error('Failed to load categories with tier:', error);
        setUsableCategories(categories.map(cat => ({ ...cat, is_preset: false })));
      }
    }
    loadCategoriesWithTier();
  }, [categories]);

  // Filter and sort items based on current filters
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.unit?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      filtered = filtered.filter(item => item.is_favorite === true);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'last_used_at':
          aValue = new Date(a.last_used_at || 0);
          bValue = new Date(b.last_used_at || 0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, filters]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, category: value }));
  }, []);

  const handleSortChange = useCallback((sortBy: string, sortOrder: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sortBy: sortBy as ItemSearchFilters['sortBy'],
      sortOrder: sortOrder as ItemSearchFilters['sortOrder']
    }));
  }, []);

  const toggleFavoritesFilter = useCallback(() => {
    setFilters(prev => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [filteredAndSortedItems]);

  const handleItemSelect = useCallback((itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  }, []);

  const handleBulkFavorite = useCallback(async (items: LineItem[], favorite: boolean) => {
    // TODO: Implement bulk favorite functionality
    toast({
      title: favorite ? 'Items favorited' : 'Items unfavorited',
      description: `${items.length} ${items.length === 1 ? 'item' : 'items'} updated`,
    });
    onItemsChange();
  }, [onItemsChange]);

  const handleBulkDelete = useCallback(async (items: LineItem[]) => {
    // TODO: Implement bulk delete functionality
    toast({
      title: 'Items deleted',
      description: `${items.length} ${items.length === 1 ? 'item' : 'items'} removed from your library`,
      variant: 'destructive',
    });
    onItemsChange();
  }, [onItemsChange]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal">Item Library</h1>
            <p className="text-charcoal/70">
              Manage your services and materials database for quick quote creation.
            </p>
          </div>
          <AddItemDialog onItemAdded={onItemsChange} categories={categories} />
        </div>
        <EmptyState 
          onAddItem={() => {}} 
          addItemDialog={
            <AddItemDialog onItemAdded={onItemsChange} categories={categories}>
              <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </AddItemDialog>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal">Item Library</h1>
          <p className="text-charcoal/70">
            Manage your services and materials database for quick quote creation.
          </p>
        </div>
        <AddItemDialog onItemAdded={onItemsChange} categories={categories} />
      </div>

      {/* Search and Filters */}
      <Card className="bg-paper-white border border-stone-gray shadow-sm mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Input - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-10 border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/60 hover:text-charcoal transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-1 rounded-sm"
                    aria-label="Clear search"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters Grid - Responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Category Filter */}
              <div className="w-full">
                <Select value={filters.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper-white border-stone-gray">
                    <SelectItem value="all" className="text-charcoal">All Categories</SelectItem>
                    {usableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name} className="text-charcoal">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                          {category.is_preset && (
                            <span className="text-xs text-charcoal/50 bg-stone-gray/20 px-1 py-0.5 rounded">
                              {category.access_tier === 'free' ? 'FREE' : 'PRO'}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="w-full">
                <Select 
                  value={`${filters.sortBy}-${filters.sortOrder}`} 
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    handleSortChange(sortBy, sortOrder);
                  }}
                >
                  <SelectTrigger className="w-full border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-paper-white border-stone-gray">
                    <SelectItem value="name-asc" className="text-charcoal">Name A-Z</SelectItem>
                    <SelectItem value="name-desc" className="text-charcoal">Name Z-A</SelectItem>
                    <SelectItem value="cost-asc" className="text-charcoal">Cost Low-High</SelectItem>
                    <SelectItem value="cost-desc" className="text-charcoal">Cost High-Low</SelectItem>
                    <SelectItem value="created_at-desc" className="text-charcoal">Newest First</SelectItem>
                    <SelectItem value="last_used_at-desc" className="text-charcoal">Recently Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Favorites Filter */}
              <div className="w-full sm:col-span-2 lg:col-span-2">
                <Button
                  variant={filters.showFavoritesOnly ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleFavoritesFilter}
                  className={`w-full font-bold transition-all ${
                    filters.showFavoritesOnly 
                      ? 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 active:bg-equipment-yellow/80' 
                      : 'text-charcoal/70 border border-stone-gray hover:bg-stone-gray/20 active:bg-stone-gray/30'
                  }`}
                >
                  {filters.showFavoritesOnly ? <Star className="h-4 w-4 mr-2 fill-current" /> : <StarOff className="h-4 w-4 mr-2" />}
                  Favorites
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.searchTerm || filters.category !== 'all' || filters.showFavoritesOnly) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-gray">
              <span className="text-sm text-charcoal/70 font-medium">Active filters:</span>
              {filters.searchTerm && (
                <Badge variant="secondary" className="bg-stone-gray/20 text-charcoal">
                  Search: {filters.searchTerm}
                </Badge>
              )}
              {filters.category !== 'all' && (
                <Badge variant="secondary" className="bg-stone-gray/20 text-charcoal">
                  Category: {filters.category}
                </Badge>
              )}
              {filters.showFavoritesOnly && (
                <Badge variant="secondary" className="bg-stone-gray/20 text-charcoal">
                  Favorites Only
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-charcoal/70 mb-4">
        <p className="text-sm text-charcoal/70">
          Showing {filteredAndSortedItems.length} of {items.length} items
        </p>
        {selectedItems.length > 0 && (
          <p className="text-sm text-charcoal/70">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedItems={items.filter(item => selectedItems.includes(item.id))}
          onClearSelection={clearSelection}
          onBulkFavorite={handleBulkFavorite}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Items Table */}
      {/* Desktop Table View */}
        <div className="hidden md:block">
          <ItemsTable
            items={filteredAndSortedItems}
            categories={categories}
            selectedItems={selectedItems}
            onItemsChange={onItemsChange}
            onSelectAll={handleSelectAll}
            onItemSelect={handleItemSelect}
          />
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden">
          <ItemsCard
            items={filteredAndSortedItems}
            categories={categories}
            selectedItems={selectedItems}
            onItemsChange={onItemsChange}
            onItemSelect={handleItemSelect}
          />
        </div>
    </div>
  );
}