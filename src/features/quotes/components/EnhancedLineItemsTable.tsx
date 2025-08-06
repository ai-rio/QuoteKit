'use client';

import { Plus,Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
      <div className="border-2 border-dashed border-stone-gray rounded-lg p-6 sm:p-8 text-center">
        <div className="text-charcoal/60 text-base sm:text-lg mb-4">No items added yet</div>
        <Dialog open={isItemSelectorOpen} onOpenChange={setIsItemSelectorOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal font-bold min-h-[44px] touch-manipulation w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Item
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                <p className="text-xs">
                  Choose from your {availableItems.length} personal items or add new ones to your library
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                    className="text-charcoal/50 hover:text-charcoal hover:bg-stone-gray/20"
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
      <div className="md:hidden space-y-4">
        {quoteLineItems.map((item) => (
          <div key={item.id} className="bg-light-concrete p-4 rounded-lg border border-stone-gray">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-2">
                <Input
                  value={item.name}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                  className="border-0 bg-transparent p-0 text-base font-medium text-charcoal focus:bg-light-concrete focus:border focus:border-forest-green focus:ring-forest-green rounded-md focus:px-3 focus:py-2 w-full"
                />
                <div className="text-sm text-charcoal/60 mt-1">{item.unit || 'unit'}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="text-charcoal/50 hover:text-charcoal hover:bg-stone-gray/20 min-h-[44px] min-w-[44px] touch-manipulation"
              >
                <Trash2 className="w-5 h-5" />
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
                  className="text-center font-mono border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green min-h-[44px] touch-manipulation"
                />
              </div>
              <div>
                <div className="text-xs text-charcoal/60 mb-1">PRICE</div>
                <div className="h-11 flex items-center justify-center font-mono text-sm">
                  ${item.cost.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-charcoal/60 mb-1">TOTAL</div>
                <div className="h-11 flex items-center justify-center font-mono text-sm font-bold">
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 hover:text-charcoal font-bold min-h-[44px] touch-manipulation w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Item
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                <p className="text-xs">
                  Browse your {availableItems.length} items or search by name, category, or unit type
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItemsCount = availableItems.length;
  const hasSearchResults = filteredItems.length > 0;
  const isSearching = searchTerm.trim().length > 0;

  return (
    <DialogContent className="max-w-md bg-paper-white border-stone-gray sm:max-w-lg w-[calc(100%-32px)] p-4 sm:p-6">
      <DialogHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-base sm:text-lg text-charcoal font-bold">
            Select Item to Add
          </DialogTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-charcoal/60 bg-light-concrete px-2 py-1 rounded-md">
                  <span className="font-mono font-bold">{totalItemsCount}</span>
                  <span>items</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal">
                <p className="text-xs">
                  You have {totalItemsCount} items in your personal library
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </DialogHeader>
      
      <div className="space-y-3 sm:space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="border-stone-gray bg-light-concrete text-charcoal focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 min-h-[44px] touch-manipulation"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
              <p className="text-xs">
                Search by item name, category, or unit type. Try &ldquo;mulch&rdquo;, &ldquo;labor&rdquo;, or &ldquo;sq ft&rdquo;
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="max-h-[50vh] sm:max-h-60 overflow-y-auto space-y-2">
          {!hasSearchResults ? (
            <div className="text-center text-charcoal/60 py-6 space-y-3">
              {isSearching ? (
                <>
                  <div className="text-sm">
                    No items found for &ldquo;{searchTerm}&rdquo;
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-charcoal/50">
                      Can&apos;t find what you&apos;re looking for?
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-stone-gray text-charcoal hover:bg-light-concrete"
                            onClick={() => {
                              // Navigate to items library to add new item
                              window.open('/items', '_blank');
                            }}
                          >
                            Add New Item to Library
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                          <p className="text-xs">
                            Opens your Item Library in a new tab where you can add new services, materials, or labor items
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  Start typing to search your {totalItemsCount} items
                </div>
              )}
            </div>
          ) : (
            <>
              {isSearching && (
                <div className="text-xs text-charcoal/60 pb-2 border-b border-stone-gray/50">
                  Found {filteredItems.length} of {totalItemsCount} items
                </div>
              )}
              {filteredItems.map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center justify-between p-3 border border-stone-gray rounded-lg hover:bg-light-concrete cursor-pointer min-h-[44px] touch-manipulation transition-colors"
                        onClick={() => onAddItem(item)}
                      >
                        <div className="flex-1 mr-2">
                          <div className="font-medium text-charcoal text-sm sm:text-base">{item.name}</div>
                          <div className="text-xs sm:text-sm text-charcoal/60">
                            {item.unit || 'unit'}
                            {item.category && (
                              <span className="ml-2 text-charcoal/40">• {item.category}</span>
                            )}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-charcoal text-sm sm:text-base whitespace-nowrap">
                          ${item.cost.toFixed(2)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                      <div className="text-xs space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p>Cost: ${item.cost.toFixed(2)} per {item.unit || 'unit'}</p>
                        {item.category && <p>Category: {item.category}</p>}
                        <p className="text-paper-white/70 italic">Click to add to quote</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </>
          )}
        </div>

        {/* Help section at bottom */}
        <div className="pt-3 border-t border-stone-gray/50">
          <div className="flex items-center justify-between text-xs text-charcoal/50">
            <span>Need help organizing items?</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-charcoal/50 hover:text-charcoal p-1 h-auto"
                    onClick={() => {
                      window.open('/items', '_blank');
                    }}
                  >
                    Manage Library →
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-charcoal text-paper-white border-charcoal max-w-xs">
                  <p className="text-xs">
                    Visit your Item Library to organize items by category, set favorites, and add new services or materials
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}