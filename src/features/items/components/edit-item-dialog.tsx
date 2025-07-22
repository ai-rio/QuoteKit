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
import { toast } from '@/components/ui/use-toast';

import { updateLineItem } from '../actions';
import { LineItem } from '../types';

interface EditItemDialogProps {
  item: LineItem;
  onItemUpdated: () => void;
  children: React.ReactNode;
}

export function EditItemDialog({ item, onItemUpdated, children }: EditItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.append('id', item.id);

    const response = await updateLineItem(formData);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to update item',
      });
    } else {
      toast({
        description: 'Item updated successfully',
      });
      setOpen(false);
      onItemUpdated();
    }

    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-paper-white border-stone-gray">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-charcoal text-lg font-bold">Edit Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-item-name" className="text-label text-charcoal font-medium">Item Name</Label>
              <Input
                id="edit-item-name"
                name="name"
                defaultValue={item.name}
                placeholder="Enter item name"
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-unit" className="text-label text-charcoal font-medium">Unit</Label>
              <Input
                id="edit-unit"
                name="unit"
                defaultValue={item.unit || ''}
                placeholder="Enter unit (e.g., sq ft, hour)"
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-cost" className="text-label text-charcoal font-medium">Cost/Rate per Unit ($)</Label>
              <Input
                id="edit-cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item.cost}
                placeholder="0.00"
                className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green font-mono placeholder:text-charcoal/60"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="text-charcoal hover:bg-stone-gray/20 active:bg-stone-gray/30" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold">
              {pending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}