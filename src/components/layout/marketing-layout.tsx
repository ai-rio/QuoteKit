import { PropsWithChildren } from 'react';

import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingHeader } from '@/components/layout/marketing-header';

export function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </>
  );
}