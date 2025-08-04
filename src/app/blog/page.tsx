import { Metadata } from 'next';

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
  try {
    const posts = await getAllPosts();
    console.log('Posts loaded successfully:', posts.length);
    
    return (
      <BlogFilterProvider>
        <div className="min-h-screen bg-light-concrete">
          <BlogHero />
          <BlogSearchAndFilter />
          <BlogGrid posts={posts} />
        </div>
      </BlogFilterProvider>
    );
  } catch (error) {
    console.error('Error loading blog posts:', error);
    // Fallback UI
    return (
      <BlogFilterProvider>
        <div className="min-h-screen bg-light-concrete">
          <BlogHero />
          <div className="container mx-auto px-4 py-8">
            <p className="text-center text-gray-600">Unable to load blog posts. Please try again later.</p>
          </div>
        </div>
      </BlogFilterProvider>
    );
  }
}
