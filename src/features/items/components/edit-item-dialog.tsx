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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                name="name"
                defaultValue={item.name}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-unit">Unit</Label>
              <Input
                id="edit-unit"
                name="unit"
                defaultValue={item.unit || ''}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="edit-cost">Cost/Rate per Unit ($)</Label>
              <Input
                id="edit-cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item.cost}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}