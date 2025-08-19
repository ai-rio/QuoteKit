/**
 * FB-022: Enhanced Trend Analysis Page
 * 
 * Advanced admin trend analysis with:
 * - Enhanced time-series visualization
 * - AI-powered insights and forecasting
 * - Comprehensive metrics dashboard
 * - Export and reporting capabilities
 */

import { Metadata } from 'next';

import { EnhancedTrendsPage } from './enhanced-trends-page';

export const metadata: Metadata = {
  title: 'Advanced Trend Analysis | Admin Analytics | QuoteKit',
  description: 'Advanced survey trend analysis with AI insights, forecasting, and comprehensive reporting.',
};

export default function TrendsPage() {
  return <EnhancedTrendsPage />;
}

/**
 * Loading skeleton for trend analysis page
 */
function TrendAnalysisPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-stone-gray/20 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-stone-gray/20 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-stone-gray/20 rounded w-32 animate-pulse"></div>
          <div className="h-9 bg-stone-gray/20 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-stone-gray/20 rounded w-3/4"></div>
              <div className="h-3 bg-stone-gray/20 rounded w-1/2"></div>
              <div className="h-8 bg-stone-gray/20 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-xl border p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-stone-gray/20 rounded w-1/3"></div>
          <div className="h-4 bg-stone-gray/20 rounded w-2/3"></div>
          <div className="h-64 bg-stone-gray/20 rounded"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1 bg-stone-gray/10 rounded-lg p-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-stone-gray/20 rounded flex-1 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-48 bg-stone-gray/20 rounded"></div>
        </div>
      </div>
    </div>
  );
}
