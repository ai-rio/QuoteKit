import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import React from 'react';

import { BlogBreadcrumb } from '@/components/blog-breadcrumb';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog/content';
import { extractHeadingsFromContent, resetGeneratedIds } from '@/lib/blog/headings';

import { useMDXComponents } from '../../../../mdx-components';
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
  try {
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
  } catch (error) {
    // Safely handle metadata generation errors
    console.error('Blog metadata generation error:', {
      message: error instanceof Error ? error.message : 'Unknown metadata error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return {
      title: 'Blog Post - LawnQuote Blog',
      description: 'Professional landscaping blog post',
    };
  }
}

// Component to handle MDX rendering with proper hook usage
function BlogPostContent({ content }: { content: string }) {
  const components = useMDXComponents({});
  return <MDXRemote source={content} components={components} />;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const resolvedParams = await params;
    const post = await getPostBySlug(resolvedParams.slug);
    
    if (!post) {
      notFound();
    }

    // Validate post content
    if (!post.content || typeof post.content !== 'string') {
      console.error('Invalid blog post content:', { slug: resolvedParams.slug, hasContent: !!post.content, contentType: typeof post.content });
      notFound();
    }

    // Reset heading IDs to prevent SSR/client mismatches
    resetGeneratedIds();
    
    // Get all posts for navigation
    const allPosts = await getAllPosts();
    const relatedPosts = await getRelatedPosts(post.slug, post.category, 3);
    
    // Extract headings for table of contents
    const headings = extractHeadingsFromContent(post.content || '');

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
          {/* Add breadcrumbs at the top */}
          <BlogBreadcrumb 
            post={{
              title: post.title,
              category: post.category,
              slug: post.slug
            }}
            
          />
          
          <BlogPostHeader post={post} />
          
          {/* Main Content Area with proper styling */}
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex gap-8">
              {/* Main Article Content */}
              <article className="
                flex-1
                bg-paper-white 
                rounded-2xl 
                border 
                border-stone-gray/20 
                shadow-lg 
                p-8 
                mb-8
                min-w-0
              ">
                {/* Use BlogPostContent component for proper hook usage */}
                {post.content ? (
                  <BlogPostContent content={post.content} />
                ) : (
                  <div className="text-lg text-charcoal p-8 text-center">
                    <p>Content is currently unavailable.</p>
                  </div>
                )}
              </article>
              
              {/* Table of Contents Sidebar */}
              {headings.length > 0 && (
                <aside className="hidden lg:block lg:w-80 flex-shrink-0">
                  <div className="sticky top-8">
                    <TableOfContentsWrapper headings={headings} />
                  </div>
                </aside>
              )}
            </div>
          </div>
          
          <BlogPostNavigation currentSlug={post.slug} allPosts={allPosts} />
          <RelatedPosts posts={relatedPosts} />
        </div>
      </>
    );
  } catch (error) {
    // Safely handle error logging to prevent undefined access issues
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('Blog page error:', errorDetails);
    notFound();
  }
}

// Component to handle Table of Contents with proper hook usage
function TableOfContentsWrapper({ headings }: { headings: any[] }) {
  const components = useMDXComponents({});
  const TableOfContents = components.TableOfContents;
  
  if (!TableOfContents) {
    return null;
  }
  
  return React.createElement(TableOfContents, { headings });
}
