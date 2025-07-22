'use client';

import { Badge } from '@/components/ui/badge';

import { QuoteStatus } from '../types';

interface QuoteNumberingProps {
  quoteNumber?: string;
  status: QuoteStatus;
}

export function QuoteNumbering({ quoteNumber, status }: QuoteNumberingProps) {
  // Generate a placeholder quote number for drafts
  const displayNumber = quoteNumber || (status === 'draft' ? 'DRAFT' : 'Q0000');
  
  // Format date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-lg font-bold text-[#1C1C1C]">
        {displayNumber}
      </div>
      <div className="text-sm text-[#1C1C1C]/60">
        {currentDate}
      </div>
      {status === 'draft' && (
        <Badge variant="outline" className="border-[#D7D7D7] text-[#1C1C1C]/60">
          Draft
        </Badge>
      )}
    </div>
  );
}