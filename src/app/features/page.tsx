import { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';

import { FeaturesCTA } from './components/features-cta';
import { FeaturesGrid } from './components/features-grid';
import { FeaturesHero } from './components/features-hero';

export const metadata: Metadata = {
  title: 'Features - LawnQuote | Professional Quoting Tools for Landscapers',
  description: 'Discover LawnQuote\'s powerful features: item library, quote management, professional PDFs, and business dashboard. Built for landscaping professionals.',
  keywords: 'landscaping quotes, lawn care software, professional quoting, business tools, landscaping management',
  openGraph: {
    title: 'Features - LawnQuote | Professional Quoting Tools',
    description: 'The complete toolkit for landscaping professionals. Save time, look professional, and win more jobs.',
    type: 'website',
  },
};

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <FeaturesHero />
      <FeaturesGrid />
      <FeaturesCTA />
    </MarketingLayout>
  );
}
