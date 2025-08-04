/**
 * Zod validation schemas for MDX blog system
 * Ensures type safety and data validation for blog posts
 */

import { z } from 'zod';

/**
 * Schema for blog post categories
 */
export const BlogCategorySchema = z.enum(['pricing', 'operations', 'tools']);

/**
 * Schema for SEO metadata
 */
export const SEOSchema = z.object({
  description: z.string().max(160, 'SEO description must be 160 characters or less').optional(),
  keywords: z.array(z.string()).optional(),
}).optional();

/**
 * Schema for blog post frontmatter
 * Validates all required and optional fields
 */
export const BlogPostFrontmatterSchema = z.object({
  // Required fields
  title: z.string().trim().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  category: BlogCategorySchema,
  author: z.string().min(1, 'Author is required'),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Published date must be in YYYY-MM-DD format'),
  summary: z.string().min(10, 'Summary must be at least 10 characters long'),
  readTime: z.number().positive('Read time must be a positive number'),
  image: z.string().url('Image must be a valid URL'),
  
  // Optional fields
  featured: z.boolean().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  seo: SEOSchema,
  imageAlt: z.string().optional(),
});

/**
 * Schema for complete MDX blog post
 */
export const MDXBlogPostSchema = z.object({
  frontmatter: BlogPostFrontmatterSchema,
  content: z.string().min(1, 'Content is required'),
  slug: z.string(),
  filepath: z.string(),
});

/**
 * Type-safe validation functions
 */
export const validateFrontmatter = (data: unknown) => {
  return BlogPostFrontmatterSchema.parse(data);
};

export const validateMDXPost = (data: unknown) => {
  return MDXBlogPostSchema.parse(data);
};

/**
 * Validation with error handling
 */
export const safeParseFrontmatter = (data: unknown) => {
  return BlogPostFrontmatterSchema.safeParse(data);
};

export const safeParseMDXPost = (data: unknown) => {
  return MDXBlogPostSchema.safeParse(data);
};