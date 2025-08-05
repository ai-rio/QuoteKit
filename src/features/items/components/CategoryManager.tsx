'use client';

import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

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
import { ItemCategory } from '../types';

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
      <CardContent className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-charcoal/60">
            <p className="mb-2">No categories yet</p>
            <p className="text-sm">Create your first category to organize your items</p>
          </div>
        ) : (
          <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}