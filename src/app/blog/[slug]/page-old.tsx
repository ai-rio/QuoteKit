import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { 
  BashCode,
  Callout,
  CodeBlock,
  ErrorCallout,
  InfoCallout,
  JavaScriptCode,
  MowingCalculator,
  PricingCalculator,
  SeasonalCalculator,
  SQLCode,
  SuccessCallout,
  TipCallout,
  TypeScriptCode,
  WarningCallout
} from '@/components/mdx';

import { BlogPostHeader } from '../components/blog-post-header';
import { BlogPostNavigation } from '../components/blog-post-navigation';
import { RelatedPosts } from '../components/related-posts';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const { getAllPosts } = await import('@/lib/blog/content');
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { getPostBySlug } = await import('@/lib/blog/content');
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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { getPostBySlug, getRelatedPosts, getAllPosts } = await import('@/lib/blog/content');
  
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category, 3);
  const allPosts = await getAllPosts();
  
  // Define components for MDX
  const components = {
    // Style default HTML elements with LawnQuote design system
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-4xl font-bold text-forest-green mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-3xl font-semibold text-forest-green mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-2xl font-semibold text-forest-green mb-3 mt-6">
        {children}
      </h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-xl font-semibold text-forest-green mb-2 mt-4">
        {children}
      </h4>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="text-lg text-charcoal mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside text-lg text-charcoal mb-4 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside text-lg text-charcoal mb-4 space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="text-lg text-charcoal">
        {children}
      </li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-equipment-yellow pl-6 py-2 mb-4 bg-light-concrete italic text-lg text-charcoal">
        {children}
      </blockquote>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <code className="bg-stone-gray px-2 py-1 rounded text-sm font-mono text-charcoal">
        {children}
      </code>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="bg-charcoal text-paper-white p-4 rounded-lg mb-4 overflow-x-auto">
        {children}
      </pre>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a 
        href={href} 
        className="text-forest-green hover:text-equipment-yellow underline transition-colors font-medium"
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
        className="w-full rounded-lg mb-4 shadow-md"
      />
    ),
    hr: () => (
      <hr className="border-stone-gray my-8" />
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-semibold text-charcoal">
        {children}
      </strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="italic text-charcoal">
        {children}
      </em>
    ),

    // Custom MDX Components
    Callout,
    InfoCallout,
    WarningCallout,
    SuccessCallout,
    ErrorCallout,
    TipCallout,
    CodeBlock,
    JavaScriptCode,
    TypeScriptCode,
    BashCode,
    SQLCode,
    PricingCalculator,
    MowingCalculator,
    SeasonalCalculator,
  };

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
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <article className="bg-paper-white rounded-lg shadow-sm p-8 mb-8">
            {/* Pass our custom components to MDXRemote */}
            <MDXRemote source={post.content || ''} components={components} />
          </article>
        </div>
        
        <BlogPostNavigation currentSlug={post.slug} allPosts={allPosts} />
        <RelatedPosts posts={relatedPosts} />
      </div>
    </>
  );
}