'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineItem } from '@/features/items/types';

import { QuoteLineItem } from '../types';

interface LineItemsTableProps {
  availableItems: LineItem[];
  quoteLineItems: QuoteLineItem[];
  onAddItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function LineItemsTable({
  availableItems,
  quoteLineItems,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
}: LineItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Items</CardTitle>
        <div className="flex gap-2">
          <Select onValueChange={onAddItem}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Select an item to add" />
            </SelectTrigger>
            <SelectContent>
              {availableItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} - ${item.cost.toFixed(2)}/{item.unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {quoteLineItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items added yet. Select an item from the dropdown above to get started.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quoteLineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseFloat(e.target.value) || 0;
                          onUpdateQuantity(item.id, quantity);
                        }}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>${item.cost.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${(item.cost * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}