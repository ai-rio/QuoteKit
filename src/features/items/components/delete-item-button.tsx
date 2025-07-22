'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import { deleteLineItem } from '../actions';

interface DeleteItemButtonProps {
  itemId: string;
  itemName: string;
  onItemDeleted: () => void;
}

export function DeleteItemButton({ itemId, itemName, onItemDeleted }: DeleteItemButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    setPending(true);

    const response = await deleteLineItem(itemId);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: response.error.message || 'Failed to delete item',
      });
    } else {
      toast({
        description: 'Item deleted successfully',
      });
      onItemDeleted();
    }

    setPending(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      className="text-charcoal hover:bg-stone-gray/20 active:bg-stone-gray/30"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}