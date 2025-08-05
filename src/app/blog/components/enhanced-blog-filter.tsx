/**
 * Enhanced Blog Filter Component
 * Advanced filtering with search, categories, tags, and featured posts
 */

'use client';

import { FilterIcon, SearchIcon, XIcon } from 'lucide-react';
import React, { useEffect,useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';

import { TagList } from './tag';

export interface BlogFilters {
  query: string;
  category: string;
  tags: string[];
  featured: boolean | null;
}

interface EnhancedBlogFilterProps {
  filters: BlogFilters;
  onFiltersChange: (filters: BlogFilters) => void;
  availableCategories: string[];
  availableTags: string[];
  className?: string;
}

export function EnhancedBlogFilter({
  filters,
  onFiltersChange,
  availableCategories,
  availableTags,
  className
}: EnhancedBlogFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, query: searchQuery });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ 
      ...filters, 
      category: category === 'all' ? '' : category 
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleFeaturedToggle = () => {
    const newFeatured = filters.featured === true ? null : true;
    onFiltersChange({ ...filters, featured: newFeatured });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    onFiltersChange({
      query: '',
      category: '',
      tags: [],
      featured: null
    });
  };

  const hasActiveFilters = filters.query || filters.category || filters.tags.length > 0 || filters.featured !== null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-gray w-4 h-4" />
        <Input
          type="text"
          placeholder="Search blog posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <FilterIcon className="w-4 h-4" />
          Filters
        </Button>

        {/* Featured Toggle */}
        <Button
          variant={filters.featured ? "default" : "outline"}
          size="sm"
          onClick={handleFeaturedToggle}
        >
          Featured
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-stone-gray hover:text-charcoal"
          >
            <XIcon className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 p-8 bg-light-concrete rounded-2xl border border-stone-gray/20">
          {/* Category Filter */}
          <div>
            <label className="block text-lg font-bold text-charcoal mb-3">
              Category
            </label>
            <Select
              value={filters.category || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-lg font-bold text-charcoal mb-3">
              Tags
            </label>
            <TagList
              tags={availableTags}
              selectedTags={filters.tags}
              onTagClick={handleTagToggle}
              variant="clickable"
              size="md"
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-lg">
          <span className="text-charcoal">Active filters:</span>
          
          {filters.category && (
            <span className="px-2 py-1 bg-forest-green/10 text-forest-green rounded-full">
              Category: {filters.category}
            </span>
          )}
          
          {filters.featured && (
            <span className="px-2 py-1 bg-equipment-yellow/10 text-equipment-yellow rounded-full">
              Featured
            </span>
          )}
          
          {filters.tags.map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 bg-forest-green/10 text-forest-green rounded-full flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="hover:text-forest-green/70"
                aria-label={`Remove ${tag} filter`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
