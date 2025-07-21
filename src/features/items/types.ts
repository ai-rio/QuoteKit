// src/features/items/types.ts
export interface LineItem {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  cost: number;
  created_at?: string;
}