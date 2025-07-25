'use client';

import { useEffect,useState } from 'react';
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

  const handleCopyItem = async () => {
    if (!selectedItem) return;
    
    try {
      setCopying(true);
      
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

      if (response.ok) {
        setShowCopyDialog(false);
        setSelectedItem(null);
        setCustomCost('');
        onItemAdded?.();
      } else {
        const error = await response.json();
        console.error('Error copying item:', error);
      }
    } catch (error) {
      console.error('Error copying item:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-paper-white border-stone-gray">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-charcoal">Professional Items Library</CardTitle>
              <CardDescription className="text-charcoal/60">
                Browse and add professional landscaping items to your personal library
              </CardDescription>
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
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="bg-paper-white border-stone-gray">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
                <Input
                  placeholder="Search professional items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-light-concrete text-charcoal border-stone-gray">
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
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const canAccess = canAccessItem(item.access_tier);
          const tierConfig = TIER_CONFIG[item.access_tier];
          
          return (
            <Card 
              key={item.id} 
              className={`bg-paper-white border-stone-gray transition-all duration-200 ${
                canAccess ? 'hover:shadow-md' : 'opacity-60'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold text-charcoal line-clamp-2">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={tierConfig.color}>
                        {(() => {
                          const IconComponent = tierConfig.icon;
                          return <IconComponent className="w-3 h-3 mr-1" />;
                        })()}
                        {tierConfig.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {canAccess && (
                    <button
                      onClick={() => handleToggleFavorite(item)}
                      className="p-1 text-charcoal/60 hover:text-equipment-yellow transition-colors"
                      title="Add to favorites"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-charcoal/60 font-medium">
                      {getCategoryName(item.category_id)}
                      {item.subcategory && ` • ${item.subcategory}`}
                    </p>
                    
                    {item.description && (
                      <p className="text-sm text-charcoal/70 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
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

                  {!canAccess && (
                    <div className="text-xs text-charcoal/60 bg-light-concrete p-2 rounded">
                      {tierConfig.description} - Upgrade your plan to access this item
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-charcoal/40" />
            <h3 className="mt-2 text-lg font-semibold text-charcoal">No items found</h3>
            <p className="mt-1 text-charcoal/60">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No professional items are available at this time'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Copy Item Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="bg-paper-white border-stone-gray">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Add Item to Library</DialogTitle>
            <DialogDescription className="text-charcoal/60">
              Copy &ldquo;{selectedItem?.name}&rdquo; to your personal items library
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-charcoal block mb-2">
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
              <p className="text-xs text-charcoal/60 mt-1">
                Leave empty to use the default cost of ${selectedItem?.cost?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <DialogFooter>
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
    </div>
  );
}