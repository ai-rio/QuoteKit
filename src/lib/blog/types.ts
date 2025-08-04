/**
 * TypeScript interfaces for MDX blog system
 * Maintains backward compatibility with existing BlogPost interface
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: 'pricing' | 'operations' | 'tools';
  image: string;
  summary: string;
  author: string;
  publishedAt: string;
  readTime: number;
  featured?: boolean;
}

/**
 * Extended frontmatter interface for MDX files
 * Maps to existing BlogPost interface with additional MDX-specific fields
 */
export interface BlogPostFrontmatter {
  // Required fields (map to current BlogPost interface)
  title: string;
  slug: string;
  category: 'pricing' | 'operations' | 'tools';
  author: string;
  publishedAt: string;
  summary: string;
  readTime: number;
  image: string;
  
  // Optional fields
  featured?: boolean;
  draft?: boolean;
  tags?: string[];
  
  // SEO enhancements
  seo?: {
    description?: string;
    keywords?: string[];
  };
  imageAlt?: string;
}

/**
 * MDX blog post with content and frontmatter
 */
export interface MDXBlogPost {
  frontmatter: BlogPostFrontmatter;
  content: string;
  slug: string;
  filepath: string;
}

/**
 * Processed blog post ready for rendering
 * Maintains compatibility with existing BlogPost interface
 */
export interface ProcessedBlogPost extends BlogPost {
  content?: string;
  filepath?: string;
  tags?: string[];
  seo?: {
    description?: string;
    keywords?: string[];
  };
  imageAlt?: string;
  draft?: boolean;
}