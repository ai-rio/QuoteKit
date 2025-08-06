import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

import { GlobalCategory,ItemCategory } from '../types';
import { CategoryBadgeProps, getCategoryBadgeStyles } from '../utils/category-colors';

export function CategoryBadge({
  categoryName,
  categories = [],
  variant = 'solid',
  size = 'md',
  className
}: CategoryBadgeProps) {
  if (!categoryName) {
    return (
      <span className={cn("text-charcoal/50 text-sm", className)}>
        Uncategorized
      </span>
    );
  }

  const styles = getCategoryBadgeStyles(categoryName, categories, variant);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={cn(
        "font-medium border-0 transition-all duration-200 hover:opacity-90",
        sizeClasses[size],
        className
      )}
      style={styles}
    >
      {categoryName}
    </Badge>
  );
}
