'use client';

import { Search } from 'lucide-react';
import { useBlogFilter } from '../contexts/blog-filter-context';
import { cn } from '@/utils/cn';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'operations', label: 'Operations' },
  { id: 'tools', label: 'Tools' },
];

export function BlogSearchAndFilter() {
  const { searchTerm, setSearchTerm, selectedCategory, setSelectedCategory } = useBlogFilter();

  return (
    <section className="bg-light-concrete py-12 sticky top-[73px] z-40 border-b border-stone-gray/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-1/2 lg:w-2/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles (e.g., 'pricing', 'clients'...)"
              className="w-full bg-paper-white border-2 border-stone-gray/30 rounded-full py-3 pl-12 pr-4 text-charcoal focus:ring-2 focus:ring-forest-green focus:border-forest-green transition-all"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "font-bold px-4 py-2 rounded-full text-sm transition-all",
                  selectedCategory === category.id
                    ? "bg-forest-green text-paper-white"
                    : "bg-paper-white text-charcoal hover:bg-stone-gray/20"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
