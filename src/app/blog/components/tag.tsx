/**
 * Tag Component
 * Displays individual tags with consistent styling
 */

import React from 'react';

import { cn } from '@/utils/cn';

interface TagProps {
  tag: string;
  variant?: 'default' | 'selected' | 'clickable';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: string) => void;
  className?: string;
}

const tagVariants = {
  default: 'bg-stone-gray/10 text-charcoal border-stone-gray/20',
  selected: 'bg-forest-green text-paper-white border-forest-green',
  clickable: 'bg-stone-gray/10 text-charcoal border-stone-gray/20 hover:bg-forest-green/10 hover:border-forest-green/30 cursor-pointer transition-colors'
};

const tagSizes = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-1.5 text-base',
  lg: 'px-4 py-2 text-lg'
};

export function Tag({ 
  tag, 
  variant = 'default', 
  size = 'sm', 
  onClick, 
  className 
}: TagProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(tag);
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        tagVariants[variant],
        tagSizes[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {tag}
    </span>
  );
}

interface TagListProps {
  tags: string[];
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
  variant?: 'default' | 'clickable';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TagList({ 
  tags, 
  selectedTags = [], 
  onTagClick, 
  variant = 'default',
  size = 'sm',
  className 
}: TagListProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <Tag
          key={tag}
          tag={tag}
          variant={
            selectedTags.includes(tag) 
              ? 'selected' 
              : onTagClick 
                ? 'clickable' 
                : variant
          }
          size={size}
          onClick={onTagClick}
        />
      ))}
    </div>
  );
}
