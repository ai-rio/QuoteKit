import { getAllPresetCategories, getPresetCategoriesByTier, isPresetCategory } from '../data/preset-categories';
import { ItemAccessTier, ItemCategory, MergedCategory } from '../types';

/**
 * Get user's subscription tier from API
 */
export async function getUserTier(): Promise<ItemAccessTier> {
  try {
    const response = await fetch('/api/global-items/user-tier');
    if (response.ok) {
      const data = await response.json();
      return data.data?.tier || 'free';
    }
  } catch (error) {
    console.error('Failed to fetch user tier:', error);
  }
  return 'free'; // Default to free on error
}

/**
 * Merge personal categories with accessible preset categories
 */
export function mergeCategories(
  personalCategories: ItemCategory[],
  userTier: ItemAccessTier
): MergedCategory[] {
  const presetCategories = getAllPresetCategories();
  const accessiblePresets = getPresetCategoriesByTier(userTier);
  
  // Convert personal categories to MergedCategory format
  const personalMerged: MergedCategory[] = personalCategories.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color || '#64748b',
    is_preset: false,
    user_id: category.user_id,
    created_at: category.created_at,
    updated_at: category.updated_at,
  }));

  // Convert preset categories to MergedCategory format
  const presetMerged: MergedCategory[] = presetCategories.map(preset => ({
    id: preset.id,
    name: preset.name,
    color: preset.color,
    is_preset: true,
    access_tier: preset.access_tier,
    description: preset.description,
    icon: preset.icon,
    sort_order: preset.sort_order,
  }));

  // Combine and sort: presets first (by sort_order), then personal (alphabetically)
  const sortedPresets = presetMerged.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const sortedPersonal = personalMerged.sort((a, b) => a.name.localeCompare(b.name));

  return [...sortedPresets, ...sortedPersonal];
}

/**
 * Get only categories that user can actually use (accessible presets + personal)
 */
export function getUsableCategories(
  personalCategories: ItemCategory[],
  userTier: ItemAccessTier
): MergedCategory[] {
  const accessiblePresets = getPresetCategoriesByTier(userTier);
  
  // Convert accessible presets to MergedCategory format
  const presetMerged: MergedCategory[] = accessiblePresets.map(preset => ({
    id: preset.id,
    name: preset.name,
    color: preset.color,
    is_preset: true,
    access_tier: preset.access_tier,
    description: preset.description,
    icon: preset.icon,
    sort_order: preset.sort_order,
  }));

  // Convert personal categories to MergedCategory format
  const personalMerged: MergedCategory[] = personalCategories.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color || '#64748b',
    is_preset: false,
    user_id: category.user_id,
    created_at: category.created_at,
    updated_at: category.updated_at,
  }));

  // Combine and sort
  const sortedPresets = presetMerged.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const sortedPersonal = personalMerged.sort((a, b) => a.name.localeCompare(b.name));

  return [...sortedPresets, ...sortedPersonal];
}

/**
 * Check if user has access to a specific category
 */
export function canAccessCategory(categoryId: string, userTier: ItemAccessTier): boolean {
  if (!isPresetCategory(categoryId)) {
    return true; // Personal categories are always accessible
  }

  const accessiblePresets = getPresetCategoriesByTier(userTier);
  return accessiblePresets.some(preset => preset.id === categoryId);
}

/**
 * Get category display info (name, color, etc.) from either preset or personal
 */
export function getCategoryInfo(
  categoryId: string,
  personalCategories: ItemCategory[]
): { name: string; color: string; is_preset: boolean } | null {
  // Check if it's a preset category
  if (isPresetCategory(categoryId)) {
    const allPresets = getAllPresetCategories();
    const preset = allPresets.find(p => p.id === categoryId);
    if (preset) {
      return {
        name: preset.name,
        color: preset.color,
        is_preset: true
      };
    }
  }

  // Check personal categories
  const personal = personalCategories.find(c => c.id === categoryId);
  if (personal) {
    return {
      name: personal.name,
      color: personal.color || '#64748b',
      is_preset: false
    };
  }

  return null;
}
