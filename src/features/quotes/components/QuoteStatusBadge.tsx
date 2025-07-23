'use client';

import { Badge } from '@/components/ui/badge';

import { QuoteStatus } from '../types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-stone-gray/30 text-charcoal border-stone-gray'
  },
  sent: {
    label: 'Sent',
    className: 'bg-equipment-yellow/20 text-charcoal border-equipment-yellow/30'
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-forest-green/20 text-forest-green border-forest-green/30'
  },
  declined: {
    label: 'Declined',
    className: 'bg-stone-gray text-charcoal border-stone-gray'
  },
  expired: {
    label: 'Expired',
    className: 'bg-stone-gray/20 text-charcoal/60 border-stone-gray/30'
  },
  converted: {
    label: 'Converted',
    className: 'bg-forest-green/30 text-forest-green border-forest-green/40'
  }
} as const;

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  
  return (
    <Badge 
      className={`${config.className} ${className || ''}`}
      variant="outline"
    >
      {config.label}
    </Badge>
  );
}