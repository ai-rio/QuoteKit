import { ItemAccessTier } from '../types';

export interface PresetCategory {
  id: string;
  name: string;
  color: string;
  access_tier: ItemAccessTier;
  sort_order: number;
  description: string;
  icon?: string;
}

// Professional preset categories with tiered access
export const PRESET_CATEGORIES: PresetCategory[] = [
  // FREE TIER CATEGORIES
  {
    id: 'preset-lawn-care',
    name: 'Lawn Care',
    color: '#22c55e', // Green
    access_tier: 'free',
    sort_order: 1,
    description: 'Mowing, fertilizing, and basic lawn maintenance services',
    icon: '🌱'
  },
  {
    id: 'preset-landscaping',
    name: 'Landscaping',
    color: '#3b82f6', // Blue
    access_tier: 'free',
    sort_order: 2,
    description: 'General landscaping and garden design services',
    icon: '🌿'
  },
  {
    id: 'preset-materials',
    name: 'Materials',
    color: '#f59e0b', // Amber
    access_tier: 'free',
    sort_order: 3,
    description: 'Soil, mulch, plants, and basic landscaping materials',
    icon: '🪨'
  },
  {
    id: 'preset-maintenance',
    name: 'Maintenance',
    color: '#8b5cf6', // Purple
    access_tier: 'free',
    sort_order: 4,
    description: 'Regular upkeep and maintenance services',
    icon: '🔧'
  },

  // PREMIUM TIER CATEGORIES
  {
    id: 'preset-equipment',
    name: 'Equipment',
    color: '#ef4444', // Red
    access_tier: 'premium',
    sort_order: 5,
    description: 'Professional landscaping equipment and tools',
    icon: '⚙️'
  },
  {
    id: 'preset-irrigation',
    name: 'Irrigation',
    color: '#06b6d4', // Cyan
    access_tier: 'premium',
    sort_order: 6,
    description: 'Sprinkler systems, drip irrigation, and water management',
    icon: '💧'
  },
  {
    id: 'preset-hardscaping',
    name: 'Hardscaping',
    color: '#f97316', // Orange
    access_tier: 'premium',
    sort_order: 7,
    description: 'Patios, walkways, retaining walls, and stone work',
    icon: '🧱'
  },
  {
    id: 'preset-design',
    name: 'Design',
    color: '#ec4899', // Pink
    access_tier: 'premium',
    sort_order: 8,
    description: 'Landscape design, planning, and consultation services',
    icon: '🎨'
  },
  {
    id: 'preset-pest-control',
    name: 'Pest Control',
    color: '#84cc16', // Lime
    access_tier: 'premium',
    sort_order: 9,
    description: 'Insect control, weed management, and pest prevention',
    icon: '🐛'
  },
  {
    id: 'preset-tree-services',
    name: 'Tree Services',
    color: '#10b981', // Emerald
    access_tier: 'premium',
    sort_order: 10,
    description: 'Tree trimming, removal, planting, and arborist services',
    icon: '🌳'
  },
  {
    id: 'preset-snow-removal',
    name: 'Snow Removal',
    color: '#64748b', // Slate
    access_tier: 'premium',
    sort_order: 11,
    description: 'Winter snow plowing, salting, and ice management',
    icon: '❄️'
  },
  {
    id: 'preset-lighting',
    name: 'Lighting',
    color: '#fbbf24', // Yellow
    access_tier: 'premium',
    sort_order: 12,
    description: 'Outdoor lighting installation and landscape illumination',
    icon: '💡'
  }
];

// Helper functions
export function getPresetCategoriesByTier(userTier: ItemAccessTier): PresetCategory[] {
  const tierHierarchy = { free: 0, premium: 1, pro: 1 };
  const userLevel = tierHierarchy[userTier] || 0;
  
  return PRESET_CATEGORIES.filter(category => {
    const categoryLevel = tierHierarchy[category.access_tier] || 0;
    return userLevel >= categoryLevel;
  });
}

export function getAllPresetCategories(): PresetCategory[] {
  return PRESET_CATEGORIES.sort((a, b) => a.sort_order - b.sort_order);
}

export function getPresetCategoryById(id: string): PresetCategory | undefined {
  return PRESET_CATEGORIES.find(category => category.id === id);
}

export function isPresetCategory(categoryId: string): boolean {
  return categoryId.startsWith('preset-');
}
