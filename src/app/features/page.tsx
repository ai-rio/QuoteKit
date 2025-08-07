import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { FeaturesCTA } from './components/features-cta';
import { FeaturesGrid } from './components/features-grid';
import { FeaturesHero } from './components/features-hero';

export const metadata: Metadata = {
  title: 'Features - LawnQuote | Professional Landscaping Tools',
  description: 'Discover the powerful features that make LawnQuote the go-to quoting tool for professional landscapers. From smart pricing to client management.',
  keywords: 'landscaping features, quoting tools, professional landscaping software, pricing calculator',
};

export default function FeaturesPage() {
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      breadcrumbClassName="container mx-auto px-4 pt-4 pb-2"
    >
      <div className="min-h-screen bg-light-concrete">
        <FeaturesHero />
        <FeaturesGrid />
        <FeaturesCTA />
      </div>
    </MarketingLayout>
  );
}
