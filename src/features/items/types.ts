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

// Extended category interface that includes preset categories
export interface MergedCategory {
  id: string;
  name: string;
  color: string;
  is_preset: boolean;
  access_tier?: ItemAccessTier;
  user_id?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
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

// Global (prepopulated) item types
export type ItemAccessTier = 'free' | 'premium' | 'pro';

export interface GlobalCategory {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  access_tier: ItemAccessTier;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalItem {
  id: string;
  name: string;
  category_id: string;
  subcategory?: string | null;
  unit?: string | null;
  cost?: number | null;
  description?: string | null;
  notes?: string | null;
  access_tier: ItemAccessTier;
  tags?: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional category info when joined
  category?: GlobalCategory;
}

export interface UserGlobalItemUsage {
  id: string;
  user_id: string;
  global_item_id: string;
  is_favorite: boolean;
  last_used_at: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
  // Optional global item info when joined
  global_item?: GlobalItem;
}

export interface GlobalItemSearchFilters {
  searchTerm: string;
  category_id: string;
  access_tier: ItemAccessTier | 'all';
  sortBy: 'name' | 'cost' | 'created_at' | 'sort_order';
  sortOrder: 'asc' | 'desc';
  showFavoritesOnly: boolean;
}