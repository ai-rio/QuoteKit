import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPostHeader } from '../components/blog-post-header';
import { BlogPostNavigation } from '../components/blog-post-navigation';
import { RelatedPosts } from '../components/related-posts';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
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
    description: post.seo?.description || post.summary,
    keywords: post.seo?.keywords?.join(', ') || `${post.category}, landscaping, ${post.title.toLowerCase()}`,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.seo?.description || post.summary,
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
      description: post.seo?.description || post.summary,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { getPostBySlug, getRelatedPosts } = await import('@/lib/blog/content');
  const { MDXRemote } = await import('next-mdx-remote/rsc');
  const { useMDXComponents } = await import('../../../../mdx-components');
  
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category, 3);
  
  // Get our custom components
  const components = useMDXComponents({});

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lawnquote.com/blog/${post.slug}`,
    },
    headline: post.title,
    description: post.seo?.description || post.summary,
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
            <MDXRemote source={post.content} components={components} />
          </article>
        </div>
        
        <BlogPostNavigation />
        <RelatedPosts posts={relatedPosts} />
      </div>
    </>
  );
}