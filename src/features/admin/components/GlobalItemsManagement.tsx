'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  AlertCircle,
  Archive,
  CheckCircle,
  DollarSign,
  Edit, 
  Filter, 
  Package,
  Plus, 
  Search, 
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
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GlobalCategory, GlobalItem, ItemAccessTier } from '@/features/items/types';

const TIER_COLORS = {
  free: 'bg-success-green text-paper-white',
  paid: 'bg-equipment-yellow text-charcoal',
  premium: 'bg-forest-green text-paper-white'
} as const;

const TIER_LABELS = {
  free: 'Free',
  paid: 'Paid',
  premium: 'Premium'
} as const;

export function GlobalItemsManagement() {
  const [categories, setCategories] = useState<GlobalCategory[]>([]);
  const [items, setItems] = useState<GlobalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<ItemAccessTier | 'all'>('all');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<GlobalItem | null>(null);
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
      
      // Load categories
      const categoriesResponse = await fetch('/api/admin/global-items/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.data || []);
      }

      // Load items
      const itemsResponse = await fetch('/api/admin/global-items');
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
    const matchesTier = selectedTier === 'all' || item.access_tier === selectedTier;
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
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

  const handleArchiveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to archive this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/global-items?id=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData(); // Refresh the data
      } else {
        const error = await response.json();
        console.error('Error archiving item:', error);
        alert('Failed to archive item: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error archiving item:', error);
      alert('Failed to archive item');
    }
  };

  const getItemStats = () => {
    const total = items.length;
    const byTier = {
      free: items.filter(item => item.access_tier === 'free').length,
      paid: items.filter(item => item.access_tier === 'paid').length,
      premium: items.filter(item => item.access_tier === 'premium').length,
    };
    const active = items.filter(item => item.is_active).length;
    
    return { total, byTier, active };
  };

  const stats = getItemStats();

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-forest-green" />
              <div className="ml-4">
                <p className="text-sm font-medium text-charcoal/60">Total Items</p>
                <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success-green" />
              <div className="ml-4">
                <p className="text-sm font-medium text-charcoal/60">Active Items</p>
                <p className="text-2xl font-bold text-charcoal">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-equipment-yellow" />
              <div className="ml-4">
                <p className="text-sm font-medium text-charcoal/60">Free Tier</p>
                <p className="text-2xl font-bold text-charcoal">{stats.byTier.free}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-forest-green" />
              <div className="ml-4">
                <p className="text-sm font-medium text-charcoal/60">Paid/Premium</p>
                <p className="text-2xl font-bold text-charcoal">{stats.byTier.paid + stats.byTier.premium}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Interface */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="bg-light-concrete">
          <TabsTrigger value="items" className="text-charcoal">Items</TabsTrigger>
          <TabsTrigger value="categories" className="text-charcoal">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card className="bg-paper-white border-stone-gray">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-charcoal">Global Items</CardTitle>
                  <CardDescription className="text-charcoal/60">
                    Manage prepopulated items available to users
                  </CardDescription>
                </div>
                
                <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-forest-green text-paper-white hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-charcoal">Add New Global Item</DialogTitle>
                      <DialogDescription className="text-charcoal/60">
                        Create a new item for the global library
                      </DialogDescription>
                    </DialogHeader>
                    <AddItemForm 
                      categories={categories} 
                      onSubmit={() => {
                        setShowItemDialog(false);
                        loadData();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Search with Autocomplete - Full width on all devices */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4 z-10" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    className="pl-10 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                    autoComplete="off"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 z-50 mt-1 bg-paper-white border border-stone-gray rounded-lg shadow-lg max-h-48 overflow-y-auto"
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
                
                {/* Filter dropdowns - Stack on mobile, side by side on desktop */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
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

                  <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as ItemAccessTier | 'all')}>
                    <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
                      <SelectValue placeholder="Filter by tier" />
                    </SelectTrigger>
                    <SelectContent className="bg-paper-white border-stone-gray">
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List - Responsive */}
          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-stone-gray">
                        <TableHead className="text-charcoal font-semibold">Name</TableHead>
                        <TableHead className="text-charcoal font-semibold">Category</TableHead>
                        <TableHead className="text-charcoal font-semibold">Tier</TableHead>
                        <TableHead className="text-charcoal font-semibold">Unit</TableHead>
                        <TableHead className="text-charcoal font-semibold text-right">Cost</TableHead>
                        <TableHead className="text-charcoal font-semibold">Status</TableHead>
                        <TableHead className="text-charcoal font-semibold w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id} className="border-stone-gray hover:bg-light-concrete/50">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-charcoal">{item.name}</p>
                              {item.subcategory && (
                                <p className="text-sm text-charcoal/60">{item.subcategory}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-charcoal">
                            {getCategoryName(item.category_id)}
                          </TableCell>
                          <TableCell>
                            <Badge className={TIER_COLORS[item.access_tier]}>
                              {TIER_LABELS[item.access_tier]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-charcoal">
                            {item.unit || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-charcoal">
                            {item.cost ? `$${item.cost.toFixed(2)}` : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={item.is_active ? 'bg-success-green text-paper-white' : 'bg-stone-gray text-charcoal'}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <button 
                                className="w-8 h-8 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                                title="Edit item"
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                className="w-8 h-8 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                                title="Archive item"
                                onClick={() => handleArchiveItem(item.id)}
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3 p-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-light-concrete/50 rounded-lg p-4 border border-stone-gray">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-charcoal">{item.name}</h3>
                        {item.subcategory && (
                          <p className="text-sm text-charcoal/60">{item.subcategory}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <button 
                          className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                          title="Edit item"
                          onClick={() => {
                            setEditingItem(item);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="w-10 h-10 bg-light-concrete text-charcoal rounded-lg inline-flex items-center justify-center hover:bg-stone-gray/20"
                          title="Archive item"
                          onClick={() => handleArchiveItem(item.id)}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
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
                          <Badge className={TIER_COLORS[item.access_tier]}>
                            {TIER_LABELS[item.access_tier]}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-charcoal/60">Unit:</span>
                        <p className="text-charcoal font-medium">{item.unit || '—'}</p>
                      </div>
                      <div>
                        <span className="text-charcoal/60">Cost:</span>
                        <p className="text-charcoal font-medium font-mono">
                          {item.cost ? `$${item.cost.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-stone-gray">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-charcoal/60 text-sm">Status:</span>
                          <div className="mt-1">
                            <Badge className={item.is_active ? 'bg-success-green text-paper-white' : 'bg-stone-gray text-charcoal'}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredItems.length === 0 && (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-charcoal/40" />
                  <h3 className="mt-2 text-lg font-semibold text-charcoal">No items found</h3>
                  <p className="mt-1 text-charcoal/60">
                    {searchTerm || selectedCategory !== 'all' || selectedTier !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first item'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab categories={categories} onUpdate={loadData} />
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-paper-white border-stone-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Edit Global Item</DialogTitle>
            <DialogDescription className="text-charcoal/60">
              Update the item information
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <EditItemForm 
              item={editingItem}
              categories={categories} 
              onSubmit={() => {
                setShowEditDialog(false);
                setEditingItem(null);
                loadData();
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingItem(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Item Form Component
function AddItemForm({ 
  categories, 
  onSubmit 
}: { 
  categories: GlobalCategory[]; 
  onSubmit: () => void; 
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const response = await fetch('/api/admin/global-items', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onSubmit();
      } else {
        const error = await response.json();
        console.error('Error creating item:', error);
        alert('Failed to create item: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="name" className="text-label text-charcoal font-medium">
          Item Name
        </Label>
        <Input
          id="name"
          name="name"
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Enter item name"
          required
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="category" className="text-label text-charcoal font-medium">
          Category
        </Label>
        <Select name="category_id" required>
          <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray">
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="unit" className="text-label text-charcoal font-medium">
            Unit
          </Label>
          <Input
            id="unit"
            name="unit"
            className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="e.g., per Hour, Each"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="cost" className="text-label text-charcoal font-medium">
            Cost
          </Label>
          <Input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 font-mono"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="access_tier" className="text-label text-charcoal font-medium">
          Access Tier
        </Label>
        <Select name="access_tier" defaultValue="free">
          <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray">
            <SelectItem value="free">Free Tier</SelectItem>
            <SelectItem value="paid">Paid Tier</SelectItem>
            <SelectItem value="premium">Premium Tier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="subcategory" className="text-label text-charcoal font-medium">
          Subcategory
        </Label>
        <Input
          id="subcategory"
          name="subcategory"
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="e.g., Mowing & Edging"
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="description" className="text-label text-charcoal font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Enter item description"
          rows={3}
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="notes" className="text-label text-charcoal font-medium">
          Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Additional notes"
          rows={2}
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="tags" className="text-label text-charcoal font-medium">
          Tags (comma separated)
        </Label>
        <Input
          id="tags"
          name="tags"
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="e.g., mowing, weekly, maintenance"
        />
      </div>

      <DialogFooter>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-forest-green text-paper-white hover:opacity-90"
        >
          {loading ? 'Creating...' : 'Create Item'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Edit Item Form Component
function EditItemForm({ 
  item,
  categories, 
  onSubmit,
  onCancel
}: { 
  item: GlobalItem;
  categories: GlobalCategory[]; 
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Convert form data to JSON
      const updateData = {
        id: item.id,
        name: formData.get('name') as string,
        category_id: formData.get('category_id') as string,
        subcategory: formData.get('subcategory') as string || null,
        unit: formData.get('unit') as string || null,
        cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
        description: formData.get('description') as string || null,
        notes: formData.get('notes') as string || null,
        access_tier: formData.get('access_tier') as string,
        tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : [],
        is_active: formData.get('is_active') === 'true'
      };

      const response = await fetch('/api/admin/global-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const error = await response.json();
        console.error('Error updating item:', error);
        alert('Failed to update item: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3">
        <Label htmlFor="edit-name" className="text-label text-charcoal font-medium">
          Item Name
        </Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={item.name}
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Enter item name"
          required
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-category" className="text-label text-charcoal font-medium">
          Category
        </Label>
        <Select name="category_id" defaultValue={item.category_id} required>
          <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray">
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-subcategory" className="text-label text-charcoal font-medium">
          Subcategory
        </Label>
        <Input
          id="edit-subcategory"
          name="subcategory"
          defaultValue={item.subcategory || ''}
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="e.g., Mowing & Edging"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-3">
          <Label htmlFor="edit-unit" className="text-label text-charcoal font-medium">
            Unit
          </Label>
          <Input
            id="edit-unit"
            name="unit"
            defaultValue={item.unit || ''}
            className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            placeholder="e.g., per Hour, Each"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="edit-cost" className="text-label text-charcoal font-medium">
            Cost
          </Label>
          <Input
            id="edit-cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item.cost || ''}
            className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 font-mono"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-access_tier" className="text-label text-charcoal font-medium">
          Access Tier
        </Label>
        <Select name="access_tier" defaultValue={item.access_tier}>
          <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray">
            <SelectItem value="free">Free Tier</SelectItem>
            <SelectItem value="paid">Paid Tier</SelectItem>
            <SelectItem value="premium">Premium Tier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-description" className="text-label text-charcoal font-medium">
          Description
        </Label>
        <Textarea
          id="edit-description"
          name="description"
          defaultValue={item.description || ''}
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Enter item description"
          rows={3}
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-notes" className="text-label text-charcoal font-medium">
          Notes
        </Label>
        <Textarea
          id="edit-notes"
          name="notes"
          defaultValue={item.notes || ''}
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Additional notes"
          rows={2}
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="edit-tags" className="text-label text-charcoal font-medium">
          Tags (comma separated)
        </Label>
        <Input
          id="edit-tags"
          name="tags"
          defaultValue={item.tags?.join(', ') || ''}
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="e.g., mowing, weekly, maintenance"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="edit-is_active"
          name="is_active"
          value="true"
          defaultChecked={item.is_active}
          className="w-4 h-4 text-forest-green bg-light-concrete border-stone-gray rounded focus:ring-forest-green focus:ring-2"
        />
        <Label htmlFor="edit-is_active" className="text-sm text-charcoal">
          Item is active
        </Label>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-forest-green text-paper-white hover:opacity-90"
        >
          {loading ? 'Updating...' : 'Update Item'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Categories Tab Component (placeholder)
function CategoriesTab({ 
  categories, 
  onUpdate 
}: { 
  categories: GlobalCategory[]; 
  onUpdate: () => void; 
}) {
  return (
    <Card className="bg-paper-white border-stone-gray">
      <CardHeader>
        <CardTitle className="text-charcoal">Categories Management</CardTitle>
        <CardDescription className="text-charcoal/60">
          Manage global categories and their access tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-4 bg-light-concrete rounded-lg">
              <div>
                <h3 className="font-semibold text-charcoal">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-charcoal/60">{category.description}</p>
                )}
              </div>
              <Badge className={TIER_COLORS[category.access_tier]}>
                {TIER_LABELS[category.access_tier]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}