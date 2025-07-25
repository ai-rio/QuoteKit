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
    className: 'bg-stone-gray text-charcoal border-stone-gray'
  },
  sent: {
    label: 'Sent',
    className: 'bg-info-blue text-paper-white border-info-blue'
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-success-green text-paper-white border-success-green'
  },
  declined: {
    label: 'Declined',
    className: 'bg-error-red text-paper-white border-error-red'
  },
  expired: {
    label: 'Expired',
    className: 'bg-charcoal/60 text-paper-white border-charcoal/60'
  },
  converted: {
    label: 'Converted',
    className: 'bg-forest-green text-paper-white border-forest-green'
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