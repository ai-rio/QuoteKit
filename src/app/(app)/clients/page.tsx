import { Suspense } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { ClientList } from '@/features/clients/components/ClientList';

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-light-concrete p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<ClientsLoadingSkeleton />}>
          <ClientList />
        </Suspense>
      </div>
    </div>
  );
}

function ClientsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="h-8 w-48 bg-stone-gray animate-pulse rounded"></div>
        <div className="h-10 w-32 bg-stone-gray animate-pulse rounded-lg"></div>
      </div>

      {/* Filters Card Skeleton */}
      <Card className="bg-paper-white border border-stone-gray shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="h-10 bg-stone-gray animate-pulse rounded-lg"></div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-10 bg-stone-gray animate-pulse rounded-lg flex-1"></div>
              <div className="h-10 bg-stone-gray animate-pulse rounded-lg flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card className="bg-paper-white border border-stone-gray shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4">
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
              <div className="h-6 bg-stone-gray animate-pulse rounded"></div>
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
                <div className="h-12 bg-stone-gray/50 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}