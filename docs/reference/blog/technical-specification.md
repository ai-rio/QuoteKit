# **MDX Blog Integration - Technical Specification**

## **Implementation Status: Sprint 1 COMPLETED ✅**

## **Overview**

This document provides detailed technical specifications for implementing the MDX blog system based on the MoSCoW requirements analysis. It defines the exact implementation approach, file structures, APIs, and integration patterns.

---

## **Architecture Overview**

### **Design Pattern: Local MDX Content as Data**
Following the research recommendations, we implement the "filesystem as CMS" pattern where:
- Local `.mdx` files serve as the single source of truth
- Git workflow manages content lifecycle
- Next.js static generation provides performance
- No external dependencies or services required

### **Technology Stack**
```typescript
// Core Dependencies
"gray-matter": "^4.0.3",           // Frontmatter parsing
"next-mdx-remote": "^4.4.1",       // MDX rendering
"zod": "^3.22.4",                  // Schema validation

// Optional Enhancements
"rehype-pretty-code": "^0.10.0",   // Syntax highlighting
"rehype-slug": "^6.0.0",           // Heading anchors
"remark-gfm": "^4.0.0",            // GitHub Flavored Markdown
```

---

## **File Structure Specification**

### **Content Directory Structure**
```
/content/
├── posts/
│   ├── 2025/
│   │   ├── 01-how-to-price-paver-patio.mdx
│   │   ├── 02-build-client-trust.mdx
│   │   └── 03-software-roi-analysis.mdx
│   └── drafts/
│       └── upcoming-post.mdx
├── templates/
│   ├── pricing-post.mdx
│   ├── operations-post.mdx
│   └── tools-post.mdx
└── assets/
    └── images/
        └── blog/
            ├── pricing-guide.jpg
            └── trust-building.jpg
```

### **Source Code Structure**
```
/src/
├── lib/
│   └── blog/
│       ├── content.ts          # Content fetching utilities
│       ├── validation.ts       # Schema validation
│       ├── types.ts           # TypeScript interfaces
│       └── utils.ts           # Helper functions
├── components/
│   └── mdx/
│       ├── callout.tsx        # Custom MDX components
│       ├── code-block.tsx
│       └── pricing-calculator.tsx
├── app/
│   └── blog/
│       ├── [slug]/
│       │   └── page.tsx       # Dynamic blog post page
│       └── page.tsx           # Blog index page
└── mdx-components.tsx         # MDX component mapping
```

---

## **Data Schema Specifications**

### **Frontmatter Schema (TypeScript)**
```typescript
// src/lib/blog/types.ts
export interface BlogPostFrontmatter {
  // Required fields
  title: string;
  slug: string;
  category: 'pricing' | 'operations' | 'tools';
  author: string;
  publishedAt: string; // ISO 8601 date
  summary: string;
  readTime: number; // minutes
  image: string; // URL or path
  
  // Optional fields
  featured?: boolean;
  draft?: boolean;
  tags?: string[];
  updatedAt?: string;
  
  // SEO fields
  seo?: {
    description?: string;
    keywords?: string[];
  };
  
  // Image metadata
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface BlogPost {
  frontmatter: BlogPostFrontmatter;
  content: string;
  slug: string;
  filePath: string;
}
```

### **Zod Validation Schema**
```typescript
// src/lib/blog/validation.ts
import { z } from 'zod';

export const BlogPostFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  category: z.enum(['pricing', 'operations', 'tools']),
  author: z.string().min(1, "Author is required"),
  publishedAt: z.string().datetime("Invalid date format"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  readTime: z.number().positive("Read time must be positive"),
  image: z.string().url("Image must be a valid URL"),
  
  // Optional fields
  featured: z.boolean().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  updatedAt: z.string().datetime().optional(),
  
  // SEO fields
  seo: z.object({
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  
  // Image metadata
  imageAlt: z.string().optional(),
  imageWidth: z.number().positive().optional(),
  imageHeight: z.number().positive().optional(),
});
```

---

## **Core Implementation Specifications**

### **Content Fetching Utilities**
```typescript
// src/lib/blog/content.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost, BlogPostFrontmatter } from './types';
import { BlogPostFrontmatterSchema } from './validation';

const POSTS_DIRECTORY = path.join(process.cwd(), 'content/posts');

export async function getAllPosts(): Promise<BlogPost[]> {
  const years = fs.readdirSync(POSTS_DIRECTORY);
  const posts: BlogPost[] = [];
  
  for (const year of years) {
    const yearPath = path.join(POSTS_DIRECTORY, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const files = fs.readdirSync(yearPath);
    
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      
      const filePath = path.join(yearPath, file);
      const post = await getPostByPath(filePath);
      
      // Skip drafts in production
      if (post.frontmatter.draft && process.env.NODE_ENV === 'production') {
        continue;
      }
      
      posts.push(post);
    }
  }
  
  // Sort by publication date (newest first)
  return posts.sort((a, b) => 
    new Date(b.frontmatter.publishedAt).getTime() - 
    new Date(a.frontmatter.publishedAt).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(post => post.frontmatter.slug === slug) || null;
}

async function getPostByPath(filePath: string): Promise<BlogPost> {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  // Validate frontmatter
  const frontmatter = BlogPostFrontmatterSchema.parse(data);
  
  return {
    frontmatter,
    content,
    slug: frontmatter.slug,
    filePath,
  };
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter(post => post.frontmatter.category === category);
}

export async function getRelatedPosts(currentSlug: string, limit = 3): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const currentPost = posts.find(post => post.frontmatter.slug === currentSlug);
  
  if (!currentPost) return [];
  
  // Find posts in same category, excluding current post
  const relatedPosts = posts.filter(post => 
    post.frontmatter.slug !== currentSlug &&
    post.frontmatter.category === currentPost.frontmatter.category
  );
  
  return relatedPosts.slice(0, limit);
}
```

### **Updated Blog Post Page**
```typescript
// src/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog/content';
import { BlogPostHeader } from '../components/blog-post-header';
import { BlogPostNavigation } from '../components/blog-post-navigation';
import { RelatedPosts } from '../components/related-posts';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.frontmatter.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found - LawnQuote Blog',
    };
  }

  const { frontmatter } = post;

  return {
    title: `${frontmatter.title} - LawnQuote Blog`,
    description: frontmatter.seo?.description || frontmatter.summary,
    keywords: frontmatter.seo?.keywords?.join(', ') || `${frontmatter.category}, landscaping, ${frontmatter.title.toLowerCase()}`,
    authors: [{ name: frontmatter.author }],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.summary,
      type: 'article',
      publishedTime: frontmatter.publishedAt,
      authors: [frontmatter.author],
      images: [
        {
          url: frontmatter.image,
          width: frontmatter.imageWidth || 1200,
          height: frontmatter.imageHeight || 630,
          alt: frontmatter.imageAlt || frontmatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.summary,
      images: [frontmatter.image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.frontmatter.slug);

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lawnquote.com/blog/${post.frontmatter.slug}`,
    },
    headline: post.frontmatter.title,
    description: post.frontmatter.summary,
    image: post.frontmatter.image,
    author: {
      '@type': 'Person',
      name: post.frontmatter.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LawnQuote',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lawnquote.com/logo.png',
      },
    },
    datePublished: post.frontmatter.publishedAt,
    dateModified: post.frontmatter.updatedAt || post.frontmatter.publishedAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-light-concrete">
        <BlogPostHeader post={post.frontmatter} />
        
        <article className="max-w-4xl mx-auto px-4 py-8">
          <MDXRemote source={post.content} />
        </article>
        
        <BlogPostNavigation currentSlug={post.frontmatter.slug} />
        {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
      </div>
    </>
  );
}
```

### **MDX Components Configuration**
```typescript
// mdx-components.tsx
import type { MDXComponents } from 'mdx/types';
import { Callout } from '@/components/mdx/callout';
import { CodeBlock } from '@/components/mdx/code-block';
import { PricingCalculator } from '@/components/mdx/pricing-calculator';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override default HTML elements
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-forest-green mb-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold text-forest-green mb-4 mt-8">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold text-forest-green mb-3 mt-6">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 text-gray-700 space-y-2">{children}</ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-golden-yellow pl-4 italic text-gray-600 mb-4">
        {children}
      </blockquote>
    ),
    
    // Custom components
    Callout,
    CodeBlock,
    PricingCalculator,
    
    ...components,
  };
}
```

---

## **Custom MDX Components Specifications**

### **Callout Component**
```typescript
// src/components/mdx/callout.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CalloutProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
}

export function Callout({ children, type = 'info', title }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={cn(
      'border-l-4 p-4 mb-6 rounded-r-lg',
      styles[type]
    )}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      <div className="prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
}
```

### **Code Block Component**
```typescript
// src/components/mdx/code-block.tsx
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ children, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mb-6">
      {title && (
        <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium rounded-t-lg">
          {title}
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          'bg-gray-900 text-gray-100 p-4 overflow-x-auto',
          title ? 'rounded-b-lg' : 'rounded-lg'
        )}>
          <code className={language ? `language-${language}` : ''}>
            {children}
          </code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
```

---

## **Content Migration Specifications**

### **Migration Script**
```typescript
// scripts/migrate-blog-posts.ts
import fs from 'fs';
import path from 'path';
import { blogPosts } from '../src/app/blog/data/blog-posts';

const CONTENT_DIR = path.join(process.cwd(), 'content/posts/2025');

// Ensure directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

blogPosts.forEach((post, index) => {
  const frontmatter = `---
title: "${post.title}"
slug: "${post.slug}"
category: "${post.category}"
author: "${post.author}"
publishedAt: "${post.publishedAt}"
summary: "${post.summary}"
readTime: ${post.readTime}
image: "${post.image}"
featured: ${post.featured || false}
draft: false
tags: ["${post.category}"]
---

# ${post.title}

${post.summary}

<!-- Add your MDX content here -->

This post was migrated from the original TypeScript data structure. Please update with actual content.

## Key Points

- Point 1
- Point 2
- Point 3

<Callout type="info" title="Pro Tip">
Add helpful tips and insights for your readers.
</Callout>

## Conclusion

Wrap up your post with actionable takeaways.
`;

  const filename = `${String(index + 1).padStart(2, '0')}-${post.slug}.mdx`;
  const filepath = path.join(CONTENT_DIR, filename);
  
  fs.writeFileSync(filepath, frontmatter);
  console.log(`Created: ${filename}`);
});

console.log('Migration complete!');
```

### **Content Validation Script**
```typescript
// scripts/validate-content.ts
import { getAllPosts } from '../src/lib/blog/content';
import { BlogPostFrontmatterSchema } from '../src/lib/blog/validation';

async function validateContent() {
  try {
    const posts = await getAllPosts();
    const errors: string[] = [];
    const slugs = new Set<string>();

    for (const post of posts) {
      // Check for duplicate slugs
      if (slugs.has(post.frontmatter.slug)) {
        errors.push(`Duplicate slug found: ${post.frontmatter.slug}`);
      }
      slugs.add(post.frontmatter.slug);

      // Validate frontmatter schema
      try {
        BlogPostFrontmatterSchema.parse(post.frontmatter);
      } catch (error) {
        errors.push(`Invalid frontmatter in ${post.filePath}: ${error.message}`);
      }

      // Check for empty content
      if (post.content.trim().length < 100) {
        errors.push(`Content too short in ${post.filePath}`);
      }
    }

    if (errors.length > 0) {
      console.error('Content validation failed:');
      errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    } else {
      console.log(`✅ All ${posts.length} posts validated successfully`);
    }
  } catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
  }
}

validateContent();
```

---

## **Build Integration Specifications**

### **Package.json Scripts**
```json
{
  "scripts": {
    "blog:migrate": "tsx scripts/migrate-blog-posts.ts",
    "blog:validate": "tsx scripts/validate-content.ts",
    "blog:new": "tsx scripts/create-blog-post.ts",
    "build": "npm run blog:validate && next build",
    "dev": "next dev"
  }
}
```

### **Next.js Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable MDX support
  experimental: {
    mdxRs: true,
  },
  
  // Optimize for static generation
  output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true, // For static export
  },
};

module.exports = nextConfig;
```

---

## **Performance Specifications**

### **Build Performance Targets**
- **Build Time**: < 20% increase from current baseline
- **Bundle Size**: < 50KB increase for MDX dependencies
- **Memory Usage**: < 100MB additional during build
- **Static Generation**: All blog pages pre-rendered

### **Runtime Performance Targets**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### **Caching Strategy**
```typescript
// src/lib/blog/cache.ts
const postCache = new Map<string, BlogPost>();
const allPostsCache = new Map<string, BlogPost[]>();

export function getCachedPost(slug: string): BlogPost | undefined {
  return postCache.get(slug);
}

export function setCachedPost(slug: string, post: BlogPost): void {
  postCache.set(slug, post);
}

export function clearCache(): void {
  postCache.clear();
  allPostsCache.clear();
}
```

---

## **Testing Specifications**

### **Unit Tests**
```typescript
// src/lib/blog/__tests__/content.test.ts
import { getAllPosts, getPostBySlug } from '../content';
import { BlogPostFrontmatterSchema } from '../validation';

describe('Blog Content', () => {
  test('getAllPosts returns valid posts', async () => {
    const posts = await getAllPosts();
    expect(posts).toBeInstanceOf(Array);
    expect(posts.length).toBeGreaterThan(0);
    
    posts.forEach(post => {
      expect(() => BlogPostFrontmatterSchema.parse(post.frontmatter)).not.toThrow();
    });
  });

  test('getPostBySlug returns correct post', async () => {
    const post = await getPostBySlug('how-to-price-paver-patio');
    expect(post).toBeDefined();
    expect(post?.frontmatter.slug).toBe('how-to-price-paver-patio');
  });

  test('getPostBySlug returns null for non-existent post', async () => {
    const post = await getPostBySlug('non-existent-post');
    expect(post).toBeNull();
  });
});
```

### **Integration Tests**
```typescript
// src/app/blog/__tests__/blog-page.test.tsx
import { render, screen } from '@testing-library/react';
import BlogPostPage from '../[slug]/page';

// Mock the content functions
jest.mock('@/lib/blog/content', () => ({
  getPostBySlug: jest.fn(),
  getRelatedPosts: jest.fn(),
}));

describe('Blog Post Page', () => {
  test('renders blog post correctly', async () => {
    const mockPost = {
      frontmatter: {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-01',
        summary: 'Test summary',
        readTime: 5,
        image: 'https://example.com/image.jpg',
      },
      content: '# Test Content\n\nThis is test content.',
    };

    (require('@/lib/blog/content').getPostBySlug as jest.Mock)
      .mockResolvedValue(mockPost);
    (require('@/lib/blog/content').getRelatedPosts as jest.Mock)
      .mockResolvedValue([]);

    render(await BlogPostPage({ params: { slug: 'test-post' } }));
    
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
```

This technical specification provides the complete implementation blueprint for the MDX blog integration, ensuring all requirements from the MoSCoW analysis are properly addressed with concrete technical solutions.
