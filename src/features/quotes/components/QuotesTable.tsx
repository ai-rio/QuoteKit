'use client';

import { useState } from 'react';
import { 
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Quote, QuoteSortOptions, QuoteStatus } from '../types';

import { QuoteStatusBadge } from './QuoteStatusBadge';
import { StatusUpdateDropdown } from './StatusUpdateDropdown';

interface QuotesTableProps {
  quotes: Quote[];
  selectedQuotes: string[];
  onQuoteSelect: (quoteId: string) => void;
  onSelectAll: () => void;
  sortOptions: QuoteSortOptions;
  onSort: (field: QuoteSortOptions['field']) => void;
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDuplicate: (quote: Quote) => void;
  onDownload: (quote: Quote) => void;
  onStatusUpdate: (quoteId: string, newStatus: QuoteStatus) => void;
}

export function QuotesTable({
  quotes,
  selectedQuotes,
  onQuoteSelect,
  onSelectAll,
  sortOptions,
  onSort,
  onView,
  onEdit,
  onDuplicate,
  onDownload,
  onStatusUpdate
}: QuotesTableProps) {
  const allSelected = quotes.length > 0 && selectedQuotes.length === quotes.length;
  const someSelected = selectedQuotes.length > 0;

  const getSortIcon = (field: QuoteSortOptions['field']) => {
    if (sortOptions.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-charcoal/40" />;
    }
    return sortOptions.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-charcoal" /> :
      <ArrowDown className="w-4 h-4 text-charcoal" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-paper-white border border-stone-gray rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-light-concrete/50 border-stone-gray">
              <TableHead className="w-12 px-4">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onCheckedChange={onSelectAll}
                  className="border-2"
                />
              </TableHead>
              <TableHead className="px-4">
                <Button
                  variant="ghost"
                  onClick={() => onSort('quote_number')}
                  className="h-auto p-0 font-bold text-charcoal hover:bg-transparent hover:text-charcoal"
                >
                  Quote #
                  {getSortIcon('quote_number')}
                </Button>
              </TableHead>
              <TableHead className="px-4">
                <Button
                  variant="ghost"
                  onClick={() => onSort('client_name')}
                  className="h-auto p-0 font-bold text-charcoal hover:bg-transparent hover:text-charcoal"
                >
                  Client
                  {getSortIcon('client_name')}
                </Button>
              </TableHead>
              <TableHead className="px-4">
                <Button
                  variant="ghost"
                  onClick={() => onSort('created_at')}
                  className="h-auto p-0 font-bold text-charcoal hover:bg-transparent hover:text-charcoal"
                >
                  Date
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className="px-4 text-right">
                <Button
                  variant="ghost"
                  onClick={() => onSort('total')}
                  className="h-auto p-0 font-bold text-charcoal hover:bg-transparent hover:text-charcoal"
                >
                  Total
                  {getSortIcon('total')}
                </Button>
              </TableHead>
              <TableHead className="px-4">
                <Button
                  variant="ghost"
                  onClick={() => onSort('status')}
                  className="h-auto p-0 font-bold text-charcoal hover:bg-transparent hover:text-charcoal"
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="w-12 px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow 
                key={quote.id}
                className="border-stone-gray hover:bg-stone-gray/20 transition-colors"
              >
                <TableCell className="px-4">
                  <Checkbox
                    checked={selectedQuotes.includes(quote.id)}
                    onCheckedChange={() => onQuoteSelect(quote.id)}
                    className="border-2"
                  />
                </TableCell>
                <TableCell className="px-4 font-mono text-charcoal">
                  {quote.quote_number || `Q-${quote.id.slice(-6).toUpperCase()}`}
                </TableCell>
                <TableCell className="px-4 text-charcoal font-medium">
                  <div>
                    <div className="font-medium">{quote.client_name}</div>
                    {quote.client_contact && (
                      <div className="text-sm text-charcoal/60">{quote.client_contact}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 text-charcoal">
                  {formatDate(quote.created_at)}
                </TableCell>
                <TableCell className="px-4 text-right font-mono text-charcoal">
                  {formatCurrency(quote.total)}
                </TableCell>
                <TableCell className="px-4">
                  <QuoteStatusBadge status={quote.status || 'draft'} />
                </TableCell>
                <TableCell className="px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-stone-gray/20"
                      >
                        <MoreHorizontal className="h-4 w-4 text-charcoal" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="bg-paper-white border-stone-gray"
                    >
                      <DropdownMenuItem 
                        onClick={() => onView(quote)}
                        className="text-charcoal hover:bg-stone-gray/20"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onEdit(quote)}
                        className="text-charcoal hover:bg-stone-gray/20"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <StatusUpdateDropdown 
                        quote={quote} 
                        onStatusUpdate={onStatusUpdate}
                      >
                        <DropdownMenuItem 
                          className="text-charcoal hover:bg-stone-gray/20"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                      </StatusUpdateDropdown>
                      <DropdownMenuItem 
                        onClick={() => onDuplicate(quote)}
                        className="text-charcoal hover:bg-stone-gray/20"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDownload(quote)}
                        className="text-charcoal hover:bg-stone-gray/20"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-4">
        {quotes.map((quote) => (
          <div 
            key={quote.id}
            className="bg-light-concrete/30 border border-stone-gray rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedQuotes.includes(quote.id)}
                  onCheckedChange={() => onQuoteSelect(quote.id)}
                  className="border-2"
                />
                <div>
                  <div className="font-mono text-sm text-charcoal font-medium">
                    {quote.quote_number || `Q-${quote.id.slice(-6).toUpperCase()}`}
                  </div>
                  <QuoteStatusBadge status={quote.status || 'draft'} className="mt-1" />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-stone-gray/20"
                  >
                    <MoreHorizontal className="h-4 w-4 text-charcoal" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-paper-white border-stone-gray"
                >
                  <DropdownMenuItem 
                    onClick={() => onView(quote)}
                    className="text-charcoal hover:bg-stone-gray/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onEdit(quote)}
                    className="text-charcoal hover:bg-stone-gray/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <StatusUpdateDropdown 
                    quote={quote} 
                    onStatusUpdate={onStatusUpdate}
                  >
                    <DropdownMenuItem 
                      className="text-charcoal hover:bg-stone-gray/20"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Status
                    </DropdownMenuItem>
                  </StatusUpdateDropdown>
                  <DropdownMenuItem 
                    onClick={() => onDuplicate(quote)}
                    className="text-charcoal hover:bg-stone-gray/20"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDownload(quote)}
                    className="text-charcoal hover:bg-stone-gray/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="font-medium text-charcoal">{quote.client_name}</div>
                {quote.client_contact && (
                  <div className="text-sm text-charcoal/60">{quote.client_contact}</div>
                )}
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-charcoal/60">
                  {formatDate(quote.created_at)}
                </span>
                <span className="font-mono text-charcoal font-medium">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {quotes.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="text-charcoal/60 text-lg mb-2">No quotes found</div>
          <p className="text-charcoal/60 text-sm">
            Try adjusting your search or filters, or create a new quote.
          </p>
        </div>
      )}
    </div>
  );
}