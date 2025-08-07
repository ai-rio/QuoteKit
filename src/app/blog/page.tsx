import { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/marketing-layout';
import { getAllPosts } from '@/lib/blog/content';

import { BlogGrid } from './components/blog-grid';
import { BlogHero } from './components/blog-hero';
import { BlogSearchAndFilter } from './components/blog-search-and-filter';
import { BlogFilterProvider } from './contexts/blog-filter-context';

export const metadata: Metadata = {
  title: 'Blog - LawnQuote | The Pro-Grade Resource Hub',
  description: 'Actionable advice for growing a more profitable landscaping business. Trade secrets, pricing guides, and professional tips from industry experts.',
  keywords: 'landscaping blog, pricing guides, business tips, landscaping advice, professional landscaping',
  openGraph: {
    title: 'Blog - LawnQuote | The Pro-Grade Resource Hub',
    description: 'Actionable advice for growing a more profitable landscaping business. Trade secrets, pricing guides, and professional tips from industry experts.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - LawnQuote | The Pro-Grade Resource Hub',
    description: 'Actionable advice for growing a more profitable landscaping business. Trade secrets, pricing guides, and professional tips from industry experts.',
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  
  return (
    <MarketingLayout 
      showBreadcrumbs={true}
      
    >
      <BlogFilterProvider>
        <div className="min-h-screen bg-light-concrete">
          <BlogHero />
          <BlogSearchAndFilter />
          <BlogGrid posts={posts} />
        </div>
      </BlogFilterProvider>
    </MarketingLayout>
  );
}
