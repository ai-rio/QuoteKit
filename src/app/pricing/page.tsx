import { Suspense } from 'react';

import { PricingSection } from '@/features/pricing/components/pricing-section';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-light-concrete">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<PricingPageSkeleton />}>
          <PricingSection isPricingPage={true} />
        </Suspense>
      </div>
    </div>
  );
}

function PricingPageSkeleton() {
  return (
    <div className="rounded-lg bg-paper-white py-8">
      <div className="relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-16">
        <div className="h-12 w-96 bg-light-concrete animate-pulse rounded"></div>
        <div className="h-6 w-80 bg-light-concrete animate-pulse rounded"></div>
        <div className="grid w-full gap-4 grid-cols-2 md:grid-cols-4 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 bg-light-concrete animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}