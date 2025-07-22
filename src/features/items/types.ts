// src/features/items/types.ts
export interface LineItem {
  id: string;
  user_id: string;
  name: string;
  unit: string | null;
  cost: number;
  category?: string | null;
  tags?: string[] | null;
  is_favorite?: boolean | null;
  last_used_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ItemCategory {
  id: string;
  user_id: string;
  name: string;
  color?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ItemSearchFilters {
  searchTerm: string;
  category: string;
  sortBy: 'name' | 'cost' | 'created_at' | 'last_used_at';
  sortOrder: 'asc' | 'desc';
  showFavoritesOnly: boolean;
}