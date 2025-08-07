import { PropsWithChildren } from 'react';

import { BreadcrumbProvider } from '@/components/breadcrumb-provider';
import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingHeader } from '@/components/layout/marketing-header';

interface MarketingLayoutProps extends PropsWithChildren {
  showBreadcrumbs?: boolean;
  breadcrumbClassName?: string;
  customBreadcrumbs?: Array<{ label: string; href?: string }>;
}

export function MarketingLayout({ 
  children, 
  showBreadcrumbs = true,
  breadcrumbClassName,
  customBreadcrumbs
}: MarketingLayoutProps) {
  return (
    <>
      <MarketingHeader />
      <main className="flex-1">
        {showBreadcrumbs ? (
          <BreadcrumbProvider 
            customItems={customBreadcrumbs}
            className={breadcrumbClassName}
          >
            {children}
          </BreadcrumbProvider>
        ) : (
          children
        )}
      </main>
      <MarketingFooter />
    </>
  );
}
