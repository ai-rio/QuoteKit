'use client';

import { useState } from 'react';

export function useBlogFilter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return {
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
  };
}
