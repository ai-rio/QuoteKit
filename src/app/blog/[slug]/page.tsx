import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

// Import components individually to avoid chunk loading issues
import { Callout } from '@/components/mdx/Callout';
import { CodeBlock } from '@/components/mdx/CodeBlock';
import { PricingCalculator } from '@/components/mdx/PricingCalculator';
import { KeyTakeaways } from '@/components/mdx/KeyTakeaways';
import { FAQAccordion } from '@/components/mdx/FAQAccordion';
import { MaterialCostTable } from '@/components/mdx/MaterialCostTable';

import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog/content';
import { BlogPostHeader } from '../components/blog-post-header';
import { BlogPostNavigation } from '../components/blog-post-navigation';
import { RelatedPosts } from '../components/related-posts';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found - LawnQuote Blog',
    };
  }

  return {
    title: `${post.title} - LawnQuote Blog`,
    description: post.seo?.metaDescription || post.summary,
    keywords: post.seo?.keywords?.join(', ') || `${post.category}, landscaping, ${post.title.toLowerCase()}`,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.seo?.metaDescription || post.summary,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.seo?.metaDescription || post.summary,
      images: [post.image],
    },
  };
}

// Optimize component imports for better bundle splitting
const MDXComponents = {
  // Style default HTML elements with LawnQuote design system per style guide
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-4xl md:text-6xl font-black text-forest-green mb-8 mt-12 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl md:text-4xl font-black text-forest-green mb-6 mt-10">
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl md:text-2xl font-bold text-forest-green mb-4 mt-8">
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-lg md:text-xl font-bold text-forest-green mb-3 mt-6">
      {children}
    </h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-lg text-charcoal mb-6 leading-relaxed">
      {children}
    </p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside text-lg text-charcoal mb-6 space-y-2 ml-4">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside text-lg text-charcoal mb-6 space-y-2 ml-4">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-lg text-charcoal leading-relaxed">
      {children}
    </li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-equipment-yellow pl-8 py-4 mb-6 bg-light-concrete italic text-lg text-charcoal rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-light-concrete px-2 py-1 rounded text-base font-mono text-charcoal border border-stone-gray/20">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-charcoal text-paper-white p-6 rounded-2xl mb-6 overflow-x-auto border border-stone-gray/20 shadow-lg">
      {children}
    </pre>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a 
      href={href} 
      className="text-forest-green hover:text-equipment-yellow underline transition-colors duration-200 font-medium"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img 
      src={src} 
      alt={alt} 
      className="w-full rounded-2xl mb-6 shadow-lg border border-stone-gray/20"
    />
  ),
  hr: () => (
    <hr className="border-stone-gray/30 my-12" />
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-bold text-charcoal">
      {children}
    </strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-charcoal">
      {children}
    </em>
  ),

  // Custom MDX Components - individually imported to avoid chunk issues
  Callout,
  CodeBlock,
  PricingCalculator,
  KeyTakeaways,
  FAQAccordion,
  MaterialCostTable,
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  // Get all posts for navigation
  const allPosts = await getAllPosts();
  const relatedPosts = await getRelatedPosts(post.slug, post.category, 3);
  
  // Use pre-optimized components
  const components = MDXComponents;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lawnquote.com/blog/${post.slug}`,
    },
    headline: post.title,
    description: post.seo?.metaDescription || post.summary,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LawnQuote',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lawnquote.com/logo.png',
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-light-concrete">
        <BlogPostHeader post={post} />
        
        {/* Main Content Area with proper styling */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <article className="
            bg-paper-white 
            rounded-2xl 
            border 
            border-stone-gray/20 
            shadow-lg 
            p-8 
            mb-8
          ">
            {/* Pass our custom components to MDXRemote */}
            <MDXRemote source={post.content} components={components} />
          </article>
        </div>
        
        <BlogPostNavigation currentSlug={post.slug} allPosts={allPosts} />
        <RelatedPosts posts={relatedPosts} />
      </div>
    </>
  );
}
