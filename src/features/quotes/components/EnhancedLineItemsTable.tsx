'use client';

import { useState } from 'react';
import { Plus,Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineItem } from '@/features/items/types';

import { QuoteLineItem } from '../types';

interface EnhancedLineItemsTableProps {
  availableItems: LineItem[];
  quoteLineItems: QuoteLineItem[];
  onAddItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof QuoteLineItem, value: any) => void;
  onRemoveItem: (itemId: string) => void;
}

export function EnhancedLineItemsTable({
  availableItems,
  quoteLineItems,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: EnhancedLineItemsTableProps) {
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter available items based on search term
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItemFromDialog = (item: LineItem) => {
    onAddItem(item.id);
    setIsItemSelectorOpen(false);
    setSearchTerm('');
  };

  // Handle inline editing for quantities and names
  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseFloat(value) || 0;
    if (quantity > 0) {
      onUpdateItem(itemId, 'quantity', quantity);
    }
  };

  const handleNameChange = (itemId: string, value: string) => {
    onUpdateItem(itemId, 'name', value);
  };

  if (quoteLineItems.length === 0) {
    return (
      <div className="border-2 border-dashed border-stone-gray rounded-lg p-8 text-center">
        <div className="text-charcoal/60 text-lg mb-4">No items added yet</div>
        <Dialog open={isItemSelectorOpen} onOpenChange={setIsItemSelectorOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </DialogTrigger>
          <ItemSelectorDialog
            availableItems={availableItems.filter(item =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddItem={handleAddItemFromDialog}
          />
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-stone-gray">
              <TableHead className="font-bold text-charcoal/60 w-[40%]">ITEM</TableHead>
              <TableHead className="font-bold text-charcoal/60 text-right w-[15%]">QTY</TableHead>
              <TableHead className="font-bold text-charcoal/60 text-right w-[15%]">PRICE</TableHead>
              <TableHead className="font-bold text-charcoal/60 text-right w-[20%]">TOTAL</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quoteLineItems.map((item) => (
              <TableRow key={item.id} className="border-stone-gray/50">
                <TableCell>
                  <Input
                    value={item.name}
                    onChange={(e) => handleNameChange(item.id, e.target.value)}
                    className="border-0 bg-transparent p-0 text-base font-medium text-charcoal focus:bg-light-concrete focus:border focus:border-forest-green focus:ring-forest-green rounded-md focus:px-3 focus:py-2"
                  />
                  <div className="text-sm text-charcoal/60 mt-1">{item.unit || 'unit'}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-20 text-right font-mono border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green ml-auto"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-lg">${item.cost.toFixed(2)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-lg font-bold">
                    ${(item.quantity * item.cost).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-charcoal/50 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {quoteLineItems.map((item) => (
          <div key={item.id} className="bg-light-concrete p-4 rounded-lg border border-stone-gray">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <Input
                  value={item.name}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-medium text-charcoal focus:bg-light-concrete focus:border focus:border-forest-green focus:ring-forest-green rounded-md focus:px-3 focus:py-2"
                />
                <div className="text-sm text-charcoal/60 mt-1">{item.unit || 'unit'}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="text-charcoal/50 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-charcoal/60 mb-1">QTY</div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  className="text-center font-mono border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green"
                />
              </div>
              <div>
                <div className="text-xs text-charcoal/60 mb-1">PRICE</div>
                <div className="h-10 flex items-center justify-center font-mono text-sm">
                  ${item.cost.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-charcoal/60 mb-1">TOTAL</div>
                <div className="h-10 flex items-center justify-center font-mono text-sm font-bold">
                  ${(item.quantity * item.cost).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      <div className="flex justify-center pt-4">
        <Dialog open={isItemSelectorOpen} onOpenChange={setIsItemSelectorOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Item
            </Button>
          </DialogTrigger>
          <ItemSelectorDialog
            availableItems={availableItems.filter(item =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddItem={handleAddItemFromDialog}
          />
        </Dialog>
      </div>
    </div>
  );
}

// Item Selector Dialog Component
function ItemSelectorDialog({
  availableItems,
  searchTerm,
  onSearchChange,
  onAddItem,
}: {
  availableItems: LineItem[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddItem: (item: LineItem) => void;
}) {
  return (
    <DialogContent className="max-w-md bg-paper-white border-stone-gray">
      <DialogHeader>
        <DialogTitle className="text-charcoal font-bold">Select Item to Add</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
        />
        <div className="max-h-60 overflow-y-auto space-y-2">
          {availableItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="text-center text-charcoal/60 py-4">
              No items found
            </div>
          ) : (
            availableItems.filter(item =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-stone-gray rounded-lg hover:bg-light-concrete cursor-pointer"
                onClick={() => onAddItem(item)}
              >
                <div>
                  <div className="font-medium text-charcoal">{item.name}</div>
                  <div className="text-sm text-charcoal/60">{item.unit || 'unit'}</div>
                </div>
                <div className="font-mono font-bold text-charcoal">${item.cost.toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DialogContent>
  );
}