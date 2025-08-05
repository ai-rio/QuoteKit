'use client';

import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

import { createLineItem } from '../actions';
import { ItemCategory } from '../types';
import { GlobalItemsBrowser } from './GlobalItemsBrowser';

interface AddItemDialogProps {
  onItemAdded: () => void;
  children?: React.ReactNode;
  categories: ItemCategory[];
}

export function AddItemDialog({ onItemAdded, children, categories }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'browse'>('browse');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Add selected category to form data
    if (selectedCategory && selectedCategory !== 'none') {
      formData.append('category', selectedCategory);
    }

    console.log('Submitting item creation with data:', {
      name: formData.get('name'),
      unit: formData.get('unit'),
      cost: formData.get('cost'),
      category: formData.get('category')
    });

    const response = await createLineItem(formData);

    console.log('Create item response:', response);

    if (response?.error) {
      console.error('Error creating item:', response.error);
      toast({
        variant: 'destructive',
        title: 'Failed to create item',
        description: response.error.message || 'Unknown error occurred',
      });
    } else if (response) {
      console.log('Item created successfully:', response.data);
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
      form.reset();
      setSelectedCategory('');
      setOpen(false);
      onItemAdded();
    }

    setPending(false);
  }

  const handleGlobalItemAdded = () => {
    setOpen(false);
    onItemAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal active:bg-equipment-yellow/80 font-bold">
            Add New Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1200px] bg-paper-white border-stone-gray max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-lg font-bold">Add Item to Library</DialogTitle>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-light-concrete rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-paper-white text-charcoal shadow-sm'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              Browse Professional Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-paper-white text-charcoal shadow-sm'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              Create New Item
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'browse' ? (
            <div className="h-full overflow-auto">
              <GlobalItemsBrowser onItemAdded={handleGlobalItemAdded} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 overflow-auto py-4">
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="item-name" className="text-label text-charcoal font-medium">Item Name</Label>
                    <Input
                      id="item-name"
                      name="name"
                      placeholder="Enter item name"
                      className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="unit" className="text-label text-charcoal font-medium">Unit</Label>
                    <Input
                      id="unit"
                      name="unit"
                      placeholder="Enter unit (e.g., sq ft, hour)"
                      className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-label text-charcoal font-medium">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green">
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-paper-white border-stone-gray">
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color || undefined }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="cost" className="text-label text-charcoal font-medium">Cost/Rate per Unit ($)</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60"
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-stone-gray pt-4 mt-4">
                <Button type="button" variant="ghost" className="text-charcoal hover:bg-stone-gray/20 active:bg-stone-gray/30" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending} className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold">
                  {pending ? 'Saving...' : 'Save Item'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}