'use client';

import { useEffect,useState } from 'react';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <DialogContent className="bg-paper-white border-stone-gray max-w-2xl">
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
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
                    <Input
                      placeholder="Search items..."
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

                <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as ItemAccessTier | 'all')}>
                  <SelectTrigger className="w-36 bg-light-concrete text-charcoal border-stone-gray">
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
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="bg-paper-white border-stone-gray">
            <CardContent className="p-0">
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
        <DialogContent className="bg-paper-white border-stone-gray max-w-2xl">
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
      
      // Here you would call your API to create the item
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit();
    } catch (error) {
      console.error('Error creating item:', error);
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

      <div className="grid grid-cols-2 gap-4">
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