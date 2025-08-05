'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { LineItem } from '../types';
import { DeleteItemButton } from './delete-item-button';
import { EditItemDialog } from './edit-item-dialog';

interface ItemsTableProps {
  items: LineItem[];
  onItemsChange: () => void;
}

export function ItemsTable({ items, onItemsChange }: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-charcoal/70">
        <p>No items found. Create your first item to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper-white border border-stone-gray shadow-sm rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-sm text-charcoal/60">ITEM NAME</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">UNIT</TableHead>
            <TableHead className="font-bold text-sm text-charcoal/60">COST/RATE</TableHead>
            <TableHead className="text-right font-bold text-sm text-charcoal/60">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-charcoal">{item.name}</TableCell>
              <TableCell className="text-charcoal">{item.unit}</TableCell>
              <TableCell className="font-mono text-charcoal">${item.cost.toFixed(2)}</TableCell>
              <TableCell className="text-right space-x-2">
                <EditItemDialog item={item} onItemUpdated={onItemsChange} categories={[]}>
                  <Button variant="ghost" size="sm" className="text-charcoal hover:bg-stone-gray/20 active:bg-stone-gray/30">
                    Edit
                  </Button>
                </EditItemDialog>
                <DeleteItemButton
                  itemId={item.id}
                  itemName={item.name}
                  onItemDeleted={onItemsChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}