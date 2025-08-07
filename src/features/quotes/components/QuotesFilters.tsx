'use client';

import { 
  CalendarIcon,
  Filter, 
  Search, 
  X 
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { QuoteFilters, QuoteStatus } from '../types';

interface QuotesFiltersProps {
  filters: QuoteFilters;
  onFiltersChange: (filters: QuoteFilters) => void;
  uniqueClients: string[];
}

const statusOptions: Array<{ value: QuoteStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

export function QuotesFilters({ 
  filters, 
  onFiltersChange, 
  uniqueClients 
}: QuotesFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const updateFilter = (key: keyof QuoteFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearDateRange = () => {
    updateFilter('dateRange', { from: null, to: null });
  };

  const hasActiveFilters = filters.status !== 'all' || 
                          filters.client || 
                          filters.searchTerm ||
                          (filters.dateRange?.from || filters.dateRange?.to);

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      client: '',
      searchTerm: '',
      dateRange: { from: null, to: null }
    });
  };

  const formatDateRange = () => {
    if (!filters.dateRange?.from && !filters.dateRange?.to) {
      return "Select date range";
    }
    
    const from = filters.dateRange?.from?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const to = filters.dateRange?.to?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (from && to) {
      return `${from} - ${to}`;
    } else if (from) {
      return `From ${from}`;
    } else if (to) {
      return `Until ${to}`;
    }
    
    return "Select date range";
  };

  return (
    <div className="bg-paper-white border border-stone-gray rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/60" />
        <Input
          placeholder="Search quotes by client name, quote number..."
          value={filters.searchTerm || ''}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          className="pl-10 pr-10 bg-light-concrete border-stone-gray text-charcoal placeholder:text-charcoal/60 focus:border-forest-green focus:ring-forest-green"
        />
        {filters.searchTerm && (
          <button
            onClick={() => updateFilter('searchTerm', '')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/60 hover:text-charcoal transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-forest-green focus:ring-offset-1 rounded-sm"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray">
            {statusOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-charcoal hover:bg-light-concrete/50"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client Filter */}
        <Select
          value={filters.client || ''}
          onValueChange={(value) => updateFilter('client', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-light-concrete border-stone-gray text-charcoal focus:border-forest-green focus:ring-forest-green">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="bg-paper-white border-stone-gray max-h-[200px]">
            <SelectItem value="all" className="text-charcoal hover:bg-light-concrete/50">
              All Clients
            </SelectItem>
            {uniqueClients.map((client) => (
              <SelectItem 
                key={client} 
                value={client}
                className="text-charcoal hover:bg-light-concrete/50"
              >
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[200px] bg-light-concrete border-stone-gray text-charcoal hover:bg-stone-gray/20 justify-start"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-paper-white border-stone-gray" 
            align="start"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-charcoal">Date Range</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearDateRange();
                    setIsDatePickerOpen(false);
                  }}
                  className="h-auto p-1 text-charcoal/60 hover:text-charcoal hover:bg-light-concrete/50"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange?.from || undefined,
                  to: filters.dateRange?.to || undefined,
                }}
                onSelect={(range) => {
                  updateFilter('dateRange', {
                    from: range?.from || null,
                    to: range?.to || null,
                  });
                }}
                numberOfMonths={2}
                className="rounded-md border-stone-gray"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-charcoal/60 hover:text-charcoal hover:bg-stone-gray/20"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}