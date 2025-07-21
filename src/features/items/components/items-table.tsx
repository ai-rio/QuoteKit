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
      <div className="text-center py-8 text-muted-foreground">
        <p>No items found. Create your first item to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Cost/Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>${item.cost.toFixed(2)}</TableCell>
              <TableCell className="text-right space-x-2">
                <EditItemDialog item={item} onItemUpdated={onItemsChange}>
                  <Button variant="ghost" size="sm">
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