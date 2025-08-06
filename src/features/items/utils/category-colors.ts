import { GlobalCategory,ItemCategory } from '../types';

// Predefined color palette with good contrast ratios
const CATEGORY_COLOR_PALETTE = [
  { bg: '#EF4444', text: '#FFFFFF', lightBg: '#FEE2E2' }, // Red
  { bg: '#F97316', text: '#FFFFFF', lightBg: '#FED7AA' }, // Orange
  { bg: '#EAB308', text: '#000000', lightBg: '#FEF3C7' }, // Yellow
  { bg: '#22C55E', text: '#FFFFFF', lightBg: '#DCFCE7' }, // Green
  { bg: '#06B6D4', text: '#FFFFFF', lightBg: '#CFFAFE' }, // Cyan
  { bg: '#3B82F6', text: '#FFFFFF', lightBg: '#DBEAFE' }, // Blue
  { bg: '#8B5CF6', text: '#FFFFFF', lightBg: '#EDE9FE' }, // Purple
  { bg: '#EC4899', text: '#FFFFFF', lightBg: '#FCE7F3' }, // Pink
  { bg: '#10B981', text: '#FFFFFF', lightBg: '#D1FAE5' }, // Emerald
  { bg: '#F59E0B', text: '#000000', lightBg: '#FEF3C7' }, // Amber
  { bg: '#8B5A2B', text: '#FFFFFF', lightBg: '#FED7AA' }, // Brown
  { bg: '#6B7280', text: '#FFFFFF', lightBg: '#F3F4F6' }, // Gray
];

// Hash function to consistently assign colors to categories
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get color for a category with good contrast
export function getCategoryColors(categoryName: string | null | undefined, categories: (ItemCategory | GlobalCategory)[] = []) {
  if (!categoryName) {
    return {
      backgroundColor: '#F3F4F6',
      textColor: '#6B7280',
      lightBackgroundColor: '#F9FAFB'
    };
  }

  // First, check if the category has a custom color defined
  const category = categories.find(c => c.name === categoryName);
  if (category?.color) {
    // Use the custom color but ensure good contrast
    const customColor = category.color;
    return {
      backgroundColor: customColor,
      textColor: getContrastColor(customColor),
      lightBackgroundColor: `${customColor}20` // 20% opacity for light background
    };
  }

  // Use predefined palette based on category name hash
  const hash = hashString(categoryName);
  const colorIndex = hash % CATEGORY_COLOR_PALETTE.length;
  const colors = CATEGORY_COLOR_PALETTE[colorIndex];

  return {
    backgroundColor: colors.bg,
    textColor: colors.text,
    lightBackgroundColor: colors.lightBg
  };
}

// Determine if a color is light or dark to choose appropriate text color
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Enhanced category badge component props
export interface CategoryBadgeProps {
  categoryName: string | null | undefined;
  categories?: (ItemCategory | GlobalCategory)[];
  variant?: 'solid' | 'light' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Get styles for different badge variants
export function getCategoryBadgeStyles(
  categoryName: string | null | undefined,
  categories: (ItemCategory | GlobalCategory)[] = [],
  variant: 'solid' | 'light' | 'outline' = 'solid'
) {
  const colors = getCategoryColors(categoryName, categories);

  switch (variant) {
    case 'solid':
      return {
        backgroundColor: colors.backgroundColor,
        color: colors.textColor,
        border: 'none'
      };
    
    case 'light':
      return {
        backgroundColor: colors.lightBackgroundColor,
        color: colors.backgroundColor,
        border: 'none'
      };
    
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: colors.backgroundColor,
        border: `1px solid ${colors.backgroundColor}`
      };
    
    default:
      return {
        backgroundColor: colors.backgroundColor,
        color: colors.textColor,
        border: 'none'
      };
  }
}
