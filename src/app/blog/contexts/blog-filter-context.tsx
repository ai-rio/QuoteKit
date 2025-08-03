'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BlogFilterContextType {
  searchTerm: string;
  selectedCategory: string;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
}

const BlogFilterContext = createContext<BlogFilterContextType | undefined>(undefined);

export function BlogFilterProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <BlogFilterContext.Provider
      value={{
        searchTerm,
        selectedCategory,
        setSearchTerm,
        setSelectedCategory,
      }}
    >
      {children}
    </BlogFilterContext.Provider>
  );
}

export function useBlogFilter() {
  const context = useContext(BlogFilterContext);
  if (context === undefined) {
    throw new Error('useBlogFilter must be used within a BlogFilterProvider');
  }
  return context;
}
