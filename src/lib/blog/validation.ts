/**
 * Zod validation schemas for MDX blog system
 * Ensures type safety and data validation for blog posts
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Schema for blog post categories
 */
export const BlogCategorySchema = z.enum(['pricing', 'operations', 'tools']);

/**
 * Schema for SEO metadata
 */
export const SEOSchema = z.object({
  description: z.string().max(160, 'SEO description must be 160 characters or less').optional(),
  keywords: z.array(z.string()).max(10, 'Maximum 10 SEO keywords allowed').optional(),
}).optional();

/**
 * Enhanced schema for blog post frontmatter
 * Validates all required and optional fields with comprehensive rules
 */
export const BlogPostFrontmatterSchema = z.object({
  // Required fields
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be 50 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphens'),
  category: BlogCategorySchema,
  author: z.string()
    .min(1, 'Author is required')
    .max(50, 'Author name must be 50 characters or less'),
  publishedAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Published date must be in YYYY-MM-DD format')
    .refine(date => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    }, 'Published date must be a valid date not in the future'),
  summary: z.string()
    .min(10, 'Summary must be at least 10 characters long')
    .max(300, 'Summary must be 300 characters or less'),
  readTime: z.number()
    .positive('Read time must be a positive number')
    .max(60, 'Read time cannot exceed 60 minutes'),
  image: z.string()
    .url('Image must be a valid URL')
    .refine(url => {
      // Check for common image extensions or placeholder services
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || 
             url.includes('placehold.co') || 
             url.includes('placeholder.com') ||
             url.includes('unsplash.com');
    }, 'Image URL must point to a valid image file or placeholder service'),
  
  // Optional fields
  featured: z.boolean().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .refine(tags => {
      if (!tags) return true;
      // Check for duplicate tags (case insensitive)
      const lowercaseTags = tags.map(tag => tag.toLowerCase());
      return lowercaseTags.length === new Set(lowercaseTags).size;
    }, 'Tags must be unique (case insensitive)')
    .optional(),
  seo: SEOSchema,
  imageAlt: z.string()
    .max(125, 'Image alt text must be 125 characters or less')
    .optional(),
});

/**
 * Schema for complete MDX blog post
 */
export const MDXBlogPostSchema = z.object({
  frontmatter: BlogPostFrontmatterSchema,
  content: z.string()
    .min(100, 'Content must be at least 100 characters long')
    .max(50000, 'Content cannot exceed 50,000 characters'),
  slug: z.string(),
  filepath: z.string(),
});

/**
 * Validation error types
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Enhanced validation functions
 */
export const validateFrontmatter = (data: unknown): ValidationResult => {
  const result = BlogPostFrontmatterSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
      warnings: generateWarnings(result.data)
    };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    })),
    warnings: []
  };
};

export const validateMDXPost = (data: unknown): ValidationResult => {
  const result = MDXBlogPostSchema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
      warnings: generateContentWarnings(result.data)
    };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    })),
    warnings: []
  };
};

/**
 * Generate warnings for potential issues
 */
function generateWarnings(frontmatter: any): ValidationError[] {
  const warnings: ValidationError[] = [];
  
  // Check for missing optional but recommended fields
  if (!frontmatter.imageAlt) {
    warnings.push({
      field: 'imageAlt',
      message: 'Image alt text is recommended for accessibility',
      code: 'missing_alt_text'
    });
  }
  
  if (!frontmatter.seo?.description) {
    warnings.push({
      field: 'seo.description',
      message: 'SEO description is recommended for better search visibility',
      code: 'missing_seo_description'
    });
  }
  
  if (!frontmatter.tags || frontmatter.tags.length === 0) {
    warnings.push({
      field: 'tags',
      message: 'Tags are recommended for better content organization',
      code: 'missing_tags'
    });
  }
  
  // Check for very short or long content
  if (frontmatter.readTime < 2) {
    warnings.push({
      field: 'readTime',
      message: 'Very short read time may indicate insufficient content',
      code: 'short_read_time'
    });
  }
  
  if (frontmatter.readTime > 15) {
    warnings.push({
      field: 'readTime',
      message: 'Long read time may affect reader engagement',
      code: 'long_read_time'
    });
  }
  
  return warnings;
}

function generateContentWarnings(post: any): ValidationError[] {
  const warnings = generateWarnings(post.frontmatter);
  
  // Check content length vs read time
  const wordsPerMinute = 200;
  const estimatedReadTime = Math.ceil(post.content.split(/\s+/).length / wordsPerMinute);
  const declaredReadTime = post.frontmatter.readTime;
  
  if (Math.abs(estimatedReadTime - declaredReadTime) > 2) {
    warnings.push({
      field: 'readTime',
      message: `Declared read time (${declaredReadTime}min) differs significantly from estimated time (${estimatedReadTime}min)`,
      code: 'read_time_mismatch'
    });
  }
  
  return warnings;
}

/**
 * Duplicate slug detection
 */
export async function checkDuplicateSlug(slug: string, currentFilepath?: string): Promise<boolean> {
  try {
    const contentDir = path.join(process.cwd(), 'content', 'posts');
    const files = await getAllMDXFilesRecursive(contentDir);
    
    for (const file of files) {
      if (currentFilepath && file === currentFilepath) continue;
      
      const content = fs.readFileSync(file, 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      
      if (frontmatterMatch) {
        const frontmatterText = frontmatterMatch[1];
        const slugMatch = frontmatterText.match(/^slug:\s*["']?([^"'\n]+)["']?$/m);
        
        if (slugMatch && slugMatch[1] === slug) {
          return true; // Duplicate found
        }
      }
    }
    
    return false; // No duplicate
  } catch (error) {
    console.warn('Error checking for duplicate slugs:', error);
    return false;
  }
}

/**
 * Image reference validation
 */
export async function validateImageReferences(content: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const altText = match[1];
    const imagePath = match[2];
    
    // Check for missing alt text
    if (!altText.trim()) {
      errors.push({
        field: 'content',
        message: `Image at "${imagePath}" is missing alt text`,
        code: 'missing_image_alt'
      });
    }
    
    // Check for local image references
    if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
      const fullPath = path.join(process.cwd(), 'public', imagePath);
      if (!fs.existsSync(fullPath)) {
        errors.push({
          field: 'content',
          message: `Local image not found: "${imagePath}"`,
          code: 'missing_local_image'
        });
      }
    }
  }
  
  return errors;
}

/**
 * Comprehensive content validation
 */
export async function validateBlogPost(filepath: string, content: string): Promise<ValidationResult> {
  try {
    // Use gray-matter to parse frontmatter properly
    const parsed = matter(content);
    const frontmatter = parsed.data;
    const postContent = parsed.content;
    
    // Validate frontmatter
    const frontmatterResult = validateFrontmatter(frontmatter);
    if (!frontmatterResult.success) {
      return frontmatterResult;
    }
    
    // Check for duplicate slug
    const isDuplicate = await checkDuplicateSlug(frontmatter.slug, filepath);
    if (isDuplicate) {
      frontmatterResult.errors.push({
        field: 'slug',
        message: 'Slug already exists in another post',
        code: 'duplicate_slug'
      });
      frontmatterResult.success = false;
    }
    
    // Validate image references
    const imageErrors = await validateImageReferences(postContent);
    frontmatterResult.warnings.push(...imageErrors);
    
    // Validate complete post
    const postData = {
      frontmatter,
      content: postContent,
      slug: frontmatter.slug,
      filepath
    };
    
    const postResult = validateMDXPost(postData);
    
    return {
      success: frontmatterResult.success && postResult.success,
      data: postResult.data,
      errors: [...frontmatterResult.errors, ...postResult.errors],
      warnings: [...frontmatterResult.warnings, ...postResult.warnings]
    };
    
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'validation_error'
      }],
      warnings: []
    };
  }
}

/**
 * Helper function to get all MDX files recursively
 */
async function getAllMDXFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllMDXFilesRecursive(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

/**
 * Legacy validation functions for backward compatibility
 */
export const safeParseFrontmatter = (data: unknown) => {
  return BlogPostFrontmatterSchema.safeParse(data);
};

export const safeParseMDXPost = (data: unknown) => {
  return MDXBlogPostSchema.safeParse(data);
};