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
 * SEO/GEO specific interfaces
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export interface MaterialCostItem {
  item: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  notes?: string;
}

export interface AuthorInfo {
  name: string;
  avatar?: string;
  url?: string;
}

export interface SEOData {
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
}

export interface SchemaData {
  author: AuthorInfo;
  publisher: {
    name: string;
    logo: string;
    url?: string;
  };
}

export interface ContentStructure {
  keyTakeaways?: string[];
  faqs?: FAQItem[];
  materialCostTable?: MaterialCostItem[];
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
  seo?: SEOData;
  imageAlt?: string;
  
  // SEO/GEO specific fields
  schema?: SchemaData;
  contentStructure?: ContentStructure;
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
  seo?: SEOData;
  imageAlt?: string;
  draft?: boolean;
  schema?: SchemaData;
  contentStructure?: ContentStructure;
  frontmatter?: BlogPost; // Add frontmatter property for test compatibility
}

/**
 * Table of Contents heading interface
 */
export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Blog post with extracted headings for TOC
 */
export interface BlogPostWithTOC extends ProcessedBlogPost {
  headings: TOCHeading[];
}