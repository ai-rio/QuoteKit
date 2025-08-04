import { PropsWithChildren } from 'react';

import { MarketingHeader } from '@/components/layout/marketing-header';
import { MarketingFooter } from '@/components/layout/marketing-footer';

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