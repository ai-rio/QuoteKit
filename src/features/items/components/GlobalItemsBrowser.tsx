'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  AlertCircle,
  CheckCircle2,
  Copy,
  Crown,
  Filter, 
  Heart,
  Plus, 
  Search, 
  Star,
  Users} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { GlobalCategory, GlobalItem, ItemAccessTier } from '../types';

const TIER_CONFIG = {
  free: {
    icon: Users,
    label: 'Free',
    color: 'bg-success-green text-paper-white',
    description: 'Available to all users'
  },
  paid: {
    icon: Star,
    label: 'Paid',
    color: 'bg-equipment-yellow text-charcoal',
    description: 'Requires paid subscription'
  },
  premium: {
    icon: Crown,
    label: 'Premium',
    color: 'bg-forest-green text-paper-white',
    description: 'Premium subscribers only'
  }
} as const;

interface GlobalItemsBrowserProps {
  onItemAdded?: () => void;
}

export function GlobalItemsBrowser({ onItemAdded }: GlobalItemsBrowserProps) {
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [items, setItems] = useState<GlobalItem[]>([]);
  const [userTier, setUserTier] = useState<ItemAccessTier>('free');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GlobalItem | null>(null);
  const [customCost, setCustomCost] = useState<string>('');
  const [copying, setCopying] = useState(false);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user tier
      const tierResponse = await fetch('/api/global-items/user-tier');
      if (tierResponse.ok) {
        const tierData = await tierResponse.json();
        setUserTier(tierData.data.tier);
      }

      // Load categories
      const categoriesResponse = await fetch('/api/global-items/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
      }

      // Load items
      const itemsResponse = await fetch('/api/global-items');
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const canAccessItem = (itemTier: ItemAccessTier) => {
    const tierHierarchy = { free: 0, paid: 1, premium: 2 };
    return tierHierarchy[userTier] >= tierHierarchy[itemTier];
  };

  // Generate search suggestions based on current search term
  const getSearchSuggestions = () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    const suggestions = new Set<string>();
    const searchLower = searchTerm.toLowerCase();
    
    items.forEach(item => {
      // Add item names that match
      if (item.name.toLowerCase().includes(searchLower)) {
        suggestions.add(item.name);
      }
      
      // Add subcategories that match
      if (item.subcategory?.toLowerCase().includes(searchLower)) {
        suggestions.add(item.subcategory);
      }
      
      // Add category names that match
      const categoryName = getCategoryName(item.category_id);
      if (categoryName.toLowerCase().includes(searchLower)) {
        suggestions.add(categoryName);
      }
      
      // Add description matches (first few words)
      if (item.description?.toLowerCase().includes(searchLower)) {
        const words = item.description.split(' ').slice(0, 4).join(' ');
        if (words.length > 10) {
          suggestions.add(words);
        }
      }
    });
    
    return Array.from(suggestions)
      .filter(suggestion => suggestion.toLowerCase().includes(searchLower))
      .sort((a, b) => {
        // Prioritize exact matches at the beginning
        const aStartsWith = a.toLowerCase().startsWith(searchLower);
        const bStartsWith = b.toLowerCase().startsWith(searchLower);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.length - b.length; // Prefer shorter matches
      })
      .slice(0, 6); // Limit to 6 suggestions
  };

  const searchSuggestions = getSearchSuggestions();

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.length >= 2);
  };

  // Handle keyboard navigation in search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          setSearchTerm(searchSuggestions[selectedSuggestionIndex]);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyItem = async () => {
    if (!selectedItem) return;
    
    try {
      setCopying(true);
      
      console.log('Copying item:', {
        globalItemId: selectedItem.id,
        customCost: customCost ? parseFloat(customCost) : undefined,
        itemName: selectedItem.name
      });
      
      const response = await fetch('/api/global-items/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalItemId: selectedItem.id,
          customCost: customCost ? parseFloat(customCost) : undefined,
        }),
      });

      console.log('Copy response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Copy successful:', result);
        setShowCopyDialog(false);
        setSelectedItem(null);
        setCustomCost('');
        onItemAdded?.();
      } else {
        let errorMessage = 'Failed to copy item';
        try {
          const errorData = await response.json();
          console.error('Copy error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.error('Raw response text:', await response.text());
        }
        
        // Show user-friendly error
        alert(`Error copying item: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Network error copying item:', error);
      alert('Network error occurred while copying item. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  const handleToggleFavorite = async (item: GlobalItem) => {
    try {
      const response = await fetch('/api/global-items/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalItemId: item.id,
        }),
      });

      if (response.ok) {
        // Refresh data to show updated favorite status
        loadData();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header - Simplified for modal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Professional Items Library</h3>
          <p className="text-sm text-charcoal/60">
            Browse and add professional landscaping items to your personal library
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-charcoal/60">Your Plan:</div>
          <Badge className={TIER_CONFIG[userTier].color}>
            {(() => {
              const IconComponent = TIER_CONFIG[userTier].icon;
              return <IconComponent className="w-3 h-3 mr-1" />;
            })()}
            {TIER_CONFIG[userTier].label}
          </Badge>
        </div>
      </div>

      {/* Filters - Streamlined for modal */}
      <div className="space-y-3 p-4 bg-light-concrete/30 rounded-lg border border-stone-gray">
        {/* Search with Autocomplete */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4 z-10" />
          <Input
            ref={searchInputRef}
            placeholder="Search professional items..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
            className="pl-10 bg-paper-white text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 h-10"
            autoComplete="off"
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-[60] mt-1 bg-paper-white border border-stone-gray rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                    index === selectedSuggestionIndex
                      ? 'bg-forest-green text-paper-white'
                      : 'text-charcoal hover:bg-light-concrete'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div className="flex items-center">
                    <Search className="h-3 w-3 mr-2 opacity-60" />
                    <span className="truncate">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Filter dropdown and results count */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-paper-white text-charcoal border-stone-gray h-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-paper-white border-stone-gray">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-charcoal/60 whitespace-nowrap">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Items List - Responsive */}
      <div className="bg-paper-white border border-stone-gray rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-light-concrete/50 sticky top-0 z-10">
                <tr className="border-b border-stone-gray">
                  <th className="text-left p-3 text-charcoal font-semibold">Item</th>
                  <th className="text-left p-3 text-charcoal font-semibold">Category</th>
                  <th className="text-left p-3 text-charcoal font-semibold">Tier</th>
                  <th className="text-right p-3 text-charcoal font-semibold">Cost</th>
                  <th className="text-right p-3 text-charcoal font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filteredItems.map((item) => {
                    const canAccess = canAccessItem(item.access_tier);
                    const tierConfig = TIER_CONFIG[item.access_tier];
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-stone-gray hover:bg-light-concrete/50 ${
                          !canAccess ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-charcoal">{item.name}</p>
                            {item.subcategory && (
                              <p className="text-sm text-charcoal/60">{item.subcategory}</p>
                            )}
                            {item.description && (
                              <p className="text-sm text-charcoal/70 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-charcoal">
                          {getCategoryName(item.category_id)}
                        </td>
                        <td className="p-3">
                          <Badge className={tierConfig.color}>
                            {(() => {
                              const IconComponent = tierConfig.icon;
                              return <IconComponent className="w-3 h-3 mr-1" />;
                            })()}
                            {tierConfig.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div>
                            {item.cost && (
                              <span className="font-mono font-semibold text-charcoal">
                                ${item.cost.toFixed(2)}
                              </span>
                            )}
                            {item.unit && (
                              <span className="text-charcoal/60 text-sm block">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end space-x-2">
                            {canAccess && (
                              <button
                                onClick={() => handleToggleFavorite(item)}
                                className="w-8 h-8 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                                title="Add to favorites"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                            )}
                            {canAccess ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setCustomCost(item.cost?.toString() || '');
                                  setShowCopyDialog(true);
                                }}
                                className="bg-forest-green text-paper-white hover:opacity-90"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled
                                className="bg-stone-gray text-charcoal opacity-60 cursor-not-allowed"
                              >
                                Upgrade Required
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden max-h-[400px] overflow-y-auto space-y-3 p-3">
            {filteredItems.map((item) => {
              const canAccess = canAccessItem(item.access_tier);
              const tierConfig = TIER_CONFIG[item.access_tier];
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-light-concrete/50 rounded-lg p-4 border border-stone-gray ${
                    !canAccess ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal">{item.name}</h3>
                      {item.subcategory && (
                        <p className="text-sm text-charcoal/60">{item.subcategory}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-3">
                      {canAccess && (
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                          title="Add to favorites"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      )}
                      {canAccess ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setCustomCost(item.cost?.toString() || '');
                            setShowCopyDialog(true);
                          }}
                          className="bg-forest-green text-paper-white hover:opacity-90"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="bg-stone-gray text-charcoal opacity-60 cursor-not-allowed"
                        >
                          Upgrade Required
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-charcoal/60">Category:</span>
                      <p className="text-charcoal font-medium">{getCategoryName(item.category_id)}</p>
                    </div>
                    <div>
                      <span className="text-charcoal/60">Tier:</span>
                      <div className="mt-1">
                        <Badge className={tierConfig.color}>
                          {(() => {
                            const IconComponent = tierConfig.icon;
                            return <IconComponent className="w-3 h-3 mr-1" />;
                          })()}
                          {tierConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-charcoal/60">Cost:</span>
                      <div>
                        {item.cost && (
                          <span className="font-mono font-semibold text-charcoal">
                            ${item.cost.toFixed(2)}
                          </span>
                        )}
                        {item.unit && (
                          <span className="text-charcoal/60 ml-1">
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.description && (
                    <div className="mt-3 pt-3 border-t border-stone-gray">
                      <span className="text-charcoal/60 text-sm">Description:</span>
                      <p className="text-charcoal/70 text-sm mt-1">{item.description}</p>
                    </div>
                  )}

                  {!canAccess && (
                    <div className="mt-3 text-xs text-charcoal/60 bg-light-concrete p-2 rounded">
                      {tierConfig.description} - Upgrade your plan to access this item
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-charcoal/40" />
              <h3 className="mt-2 text-lg font-semibold text-charcoal">No items found</h3>
              <p className="mt-1 text-charcoal/60">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No professional items are available at this time'
                }
              </p>
            </div>
          )}
          </div>
      </div>

      {/* Copy Item Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Add Item to Library</DialogTitle>
            <DialogDescription className="text-charcoal/60">
              Copy &ldquo;{selectedItem?.name}&rdquo; to your personal items library
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-3">
              <label className="text-label text-charcoal font-medium">
                Custom Cost (optional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder="Enter custom cost"
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 font-mono"
              />
              <p className="text-xs text-charcoal/60">
                Leave empty to use the default cost of ${selectedItem?.cost?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCopyDialog(false)}
              className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopyItem}
              disabled={copying}
              className="bg-forest-green text-paper-white hover:opacity-90"
            >
              {copying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-paper-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Add to Library
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}