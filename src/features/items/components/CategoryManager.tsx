'use client';

import { Crown, Lock, Plus, Trash2, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

import { createCategory, deleteCategory } from '../actions';
import { getAllPresetCategories } from '../data/preset-categories';
import { ItemAccessTier, ItemCategory } from '../types';
import { getUserTier } from '../utils/category-utils';

interface CategoryManagerProps {
  categories: ItemCategory[];
  onCategoriesChange: () => void;
}

// Predefined colors for categories
const CATEGORY_COLORS = [
  '#22c55e', // Green - Lawn Care
  '#3b82f6', // Blue - Landscaping
  '#f59e0b', // Amber - Materials
  '#ef4444', // Red - Equipment
  '#8b5cf6', // Purple - Maintenance
  '#06b6d4', // Cyan - Irrigation
  '#f97316', // Orange - Hardscaping
  '#84cc16', // Lime - Plant Care
  '#ec4899', // Pink - Design
  '#64748b', // Slate - Other
];

export function CategoryManager({ categories, onCategoriesChange }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<ItemAccessTier>('free');
  const [loadingTier, setLoadingTier] = useState(true);

  // Load user tier on component mount
  useEffect(() => {
    async function loadUserTier() {
      try {
        const tier = await getUserTier();
        setUserTier(tier);
      } catch (error) {
        console.error('Failed to load user tier:', error);
        setUserTier('free');
      } finally {
        setLoadingTier(false);
      }
    }
    loadUserTier();
  }, []);

  const presetCategories = getAllPresetCategories();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.append('color', selectedColor);

    const response = await createCategory(formData);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to create category',
      });
    } else {
      toast({
        description: 'Category created successfully',
      });
      form.reset();
      setSelectedColor(CATEGORY_COLORS[0]);
      setOpen(false);
      onCategoriesChange();
    }

    setPending(false);
  }

  async function handleDelete(categoryId: string) {
    setDeletingId(categoryId);

    const response = await deleteCategory(categoryId);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to delete category',
      });
    } else {
      toast({
        description: 'Category deleted successfully',
      });
      onCategoriesChange();
    }

    setDeletingId(null);
  }

  return (
    <Card className="bg-paper-white border border-stone-gray shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-charcoal">Manage Categories</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-paper-white border-stone-gray">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-charcoal text-lg font-bold">Add New Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-3">
                    <Label htmlFor="category-name" className="text-label text-charcoal font-medium">Category Name</Label>
                    <Input
                      id="category-name"
                      name="name"
                      placeholder="Enter category name"
                      className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-label text-charcoal font-medium">Category Color</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {CATEGORY_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`
                            w-8 h-8 rounded-full border-2 transition-all
                            ${selectedColor === color 
                              ? 'border-charcoal scale-110' 
                              : 'border-stone-gray hover:scale-105'
                            }
                          `}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" className="text-charcoal hover:bg-stone-gray/20 active:bg-stone-gray/30" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending} className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold">
                    {pending ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingTier ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-forest-green mx-auto"></div>
            <p className="text-charcoal/60 mt-2">Loading categories...</p>
          </div>
        ) : (
          <>
            {/* Professional Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-gray">
                <Users className="h-4 w-4 text-charcoal/60" />
                <h3 className="font-semibold text-charcoal">Professional Categories</h3>
                <span className="text-xs text-charcoal/50 bg-stone-gray/20 px-2 py-1 rounded">
                  Preset
                </span>
              </div>
              
              <div className="space-y-2">
                {presetCategories.map((preset) => {
                  const hasAccess = userTier === 'premium' || userTier === 'pro' || preset.access_tier === 'free';
                  const tierConfig = {
                    free: { icon: Users, label: 'FREE', color: 'bg-stone-gray text-paper-white' },
                    premium: { icon: Crown, label: 'PRO', color: 'bg-forest-green text-paper-white' },
                    pro: { icon: Crown, label: 'PRO', color: 'bg-forest-green text-paper-white' }
                  };
                  const config = tierConfig[preset.access_tier];
                  
                  return (
                    <div
                      key={preset.id}
                      className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                        hasAccess 
                          ? 'bg-light-concrete border-stone-gray' 
                          : 'bg-stone-gray/10 border-stone-gray/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: preset.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${hasAccess ? 'text-charcoal' : 'text-charcoal/50'}`}>
                              {preset.icon} {preset.name}
                            </span>
                            <div className={`text-xs px-2 py-0.5 rounded font-medium ${config.color}`}>
                              {(() => {
                                const IconComponent = config.icon;
                                return <IconComponent className="w-3 h-3 mr-1 inline" />;
                              })()}
                              {config.label}
                            </div>
                          </div>
                          {preset.description && (
                            <p className={`text-xs mt-1 ${hasAccess ? 'text-charcoal/60' : 'text-charcoal/40'}`}>
                              {preset.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {!hasAccess && (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-charcoal/40" />
                          <Button
                            size="sm"
                            className="bg-forest-green text-white hover:opacity-90 text-xs"
                            onClick={() => {
                              // TODO: Implement upgrade flow
                              alert('Upgrade to Premium to access this category!');
                            }}
                          >
                            Upgrade
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-gray">
                <Plus className="h-4 w-4 text-charcoal/60" />
                <h3 className="font-semibold text-charcoal">Your Personal Categories</h3>
                <span className="text-xs text-charcoal/50 bg-stone-gray/20 px-2 py-1 rounded">
                  Custom
                </span>
              </div>
              
              {categories.length === 0 ? (
                <div className="text-center py-6 text-charcoal/60 bg-stone-gray/10 rounded-lg border-2 border-dashed border-stone-gray/30">
                  <p className="mb-2">No personal categories yet</p>
                  <p className="text-sm">Create your first custom category to organize your items</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-light-concrete rounded-md border border-stone-gray"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || '#64748b' }}
                        />
                        <span className="font-medium text-charcoal">{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}