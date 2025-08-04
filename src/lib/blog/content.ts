/**
 * Content fetching utilities for MDX blog system
 * Provides functions to read, parse, and process MDX blog posts
 */

import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

import { BlogPost, BlogPostFrontmatter, MDXBlogPost, ProcessedBlogPost } from './types';
import { safeParseFrontmatter,validateFrontmatter } from './validation';

// Content directory path
const CONTENT_DIR = path.join(process.cwd(), 'content', 'posts');

/**
 * Get all MDX files from the content directory
 */
export async function getAllMDXFiles(): Promise<string[]> {
  try {
    const files: string[] = [];
    
    // Read all years directories
    const years = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Get all .mdx files from each year directory
    for (const year of years) {
      const yearPath = path.join(CONTENT_DIR, year);
      const yearFiles = fs.readdirSync(yearPath)
        .filter(file => file.endsWith('.mdx'))
        .map(file => path.join(year, file));
      
      files.push(...yearFiles);
    }
    
    return files;
  } catch (error) {
    console.warn('Content directory not found or empty:', error);
    return [];
  }
}

/**
 * Read and parse a single MDX file
 */
export async function readMDXFile(filepath: string): Promise<MDXBlogPost | null> {
  try {
    const fullPath = path.join(CONTENT_DIR, filepath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Validate the frontmatter
    const validationResult = safeParseFrontmatter(data);
    
    if (!validationResult.success) {
      console.error(`Invalid frontmatter in ${filepath}:`, validationResult.error);
      return null;
    }
    
    const frontmatter = validationResult.data;
    const slug = path.basename(filepath, '.mdx').replace(/^\d{2}-/, ''); // Remove date prefix
    
    return {
      frontmatter,
      content,
      slug,
      filepath,
    };
  } catch (error) {
    console.error(`Error reading MDX file ${filepath}:`, error);
    return null;
  }
}

/**
 * Convert MDX blog post to legacy BlogPost interface
 * Maintains backward compatibility
 */
export function mdxToLegacyBlogPost(mdxPost: MDXBlogPost): ProcessedBlogPost {
  const { frontmatter } = mdxPost;
  
  // Generate ID from slug for backward compatibility
  const id = frontmatter.slug;
  
  return {
    id,
    title: frontmatter.title,
    slug: frontmatter.slug,
    category: frontmatter.category,
    image: frontmatter.image,
    summary: frontmatter.summary,
    author: frontmatter.author,
    publishedAt: frontmatter.publishedAt,
    readTime: frontmatter.readTime,
    featured: frontmatter.featured,
    content: mdxPost.content,
    filepath: mdxPost.filepath,
    tags: frontmatter.tags,
    seo: frontmatter.seo,
    imageAlt: frontmatter.imageAlt,
    draft: frontmatter.draft,
  };
}

/**
 * Get all published blog posts
 * Returns posts in legacy BlogPost format for backward compatibility
 */
export async function getAllPosts(): Promise<ProcessedBlogPost[]> {
  const files = await getAllMDXFiles();
  const posts: ProcessedBlogPost[] = [];
  
  for (const file of files) {
    const mdxPost = await readMDXFile(file);
    
    if (mdxPost) {
      const legacyPost = mdxToLegacyBlogPost(mdxPost);
      
      // Only include published posts (not drafts)
      if (!legacyPost.draft) {
        posts.push(legacyPost);
      }
    }
  }
  
  // Sort by published date (newest first)
  return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<ProcessedBlogPost | null> {
  const files = await getAllMDXFiles();
  
  for (const file of files) {
    const mdxPost = await readMDXFile(file);
    
    if (mdxPost && mdxPost.frontmatter.slug === slug) {
      const legacyPost = mdxToLegacyBlogPost(mdxPost);
      
      // Return post even if it's a draft (for preview purposes)
      return legacyPost;
    }
  }
  
  return null;
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: 'pricing' | 'operations' | 'tools'): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.category === category);
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.featured);
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(currentSlug: string, category: string, limit: number = 3): Promise<ProcessedBlogPost[]> {
  // Get current post to access its tags
  const currentPost = await getPostBySlug(currentSlug);
  const tags = currentPost?.tags || [];
  
  return getRelatedPostsAdvanced(currentSlug, category, tags, limit);
}

/**
 * Get posts by tags
 */
export async function getPostsByTags(tags: string[]): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.tags && tags.some(tag => 
      post.tags!.some(postTag => 
        postTag.toLowerCase() === tag.toLowerCase()
      )
    )
  );
}

/**
 * Get all unique tags from all posts
 */
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const tagSet = new Set<string>();
  
  allPosts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet).sort();
}

/**
 * Get all unique categories from all posts
 */
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const categorySet = new Set<string>();
  
  allPosts.forEach(post => {
    categorySet.add(post.category);
  });
  
  return Array.from(categorySet).sort();
}

/**
 * Advanced search with filters
 */
export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchPostsAdvanced(filters: SearchFilters = {}): Promise<{
  posts: ProcessedBlogPost[];
  total: number;
  hasMore: boolean;
}> {
  let posts = await getAllPosts();
  
  // Apply query filter
  if (filters.query) {
    const lowercaseQuery = filters.query.toLowerCase();
    posts = posts.filter(post => 
      post.title.toLowerCase().includes(lowercaseQuery) ||
      post.summary.toLowerCase().includes(lowercaseQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  // Apply category filter
  if (filters.category) {
    posts = posts.filter(post => post.category === filters.category);
  }
  
  // Apply tags filter
  if (filters.tags && filters.tags.length > 0) {
    posts = posts.filter(post => 
      post.tags && filters.tags!.some(tag => 
        post.tags!.some(postTag => 
          postTag.toLowerCase() === tag.toLowerCase()
        )
      )
    );
  }
  
  // Apply featured filter
  if (filters.featured !== undefined) {
    posts = posts.filter(post => !!post.featured === filters.featured);
  }
  
  const total = posts.length;
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || posts.length;
  const paginatedPosts = posts.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  
  return {
    posts: paginatedPosts,
    total,
    hasMore
  };
}

/**
 * Get improved related posts based on category and tags
 */
export async function getRelatedPostsAdvanced(
  currentSlug: string, 
  category: string, 
  tags: string[] = [], 
  limit: number = 3
): Promise<ProcessedBlogPost[]> {
  const allPosts = await getAllPosts();
  const currentPost = allPosts.find(post => post.slug === currentSlug);
  
  if (!currentPost) return [];
  
  // Score posts based on relevance
  const scoredPosts = allPosts
    .filter(post => post.slug !== currentSlug)
    .map(post => {
      let score = 0;
      
      // Same category gets high score
      if (post.category === category) {
        score += 10;
      }
      
      // Shared tags get points
      if (post.tags && tags.length > 0) {
        const sharedTags = post.tags.filter(tag => 
          tags.some(currentTag => 
            currentTag.toLowerCase() === tag.toLowerCase()
          )
        );
        score += sharedTags.length * 5;
      }
      
      // Featured posts get bonus points
      if (post.featured) {
        score += 2;
      }
      
      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
  
  return scoredPosts;
}

/**
 * Get content analytics and insights
 */
export async function getContentAnalytics() {
  const allPosts = await getAllPosts();
  const categories = await getAllCategories();
  const tags = await getAllTags();
  
  // Category distribution
  const categoryDistribution = categories.map(category => ({
    category,
    count: allPosts.filter(post => post.category === category).length
  }));
  
  // Tag usage
  const tagUsage = tags.map(tag => ({
    tag,
    count: allPosts.filter(post => 
      post.tags?.some(postTag => 
        postTag.toLowerCase() === tag.toLowerCase()
      )
    ).length
  })).sort((a, b) => b.count - a.count);
  
  // Reading time distribution
  const readingTimes = allPosts.map(post => post.readTime);
  const avgReadingTime = readingTimes.reduce((sum, time) => sum + time, 0) / readingTimes.length;
  
  // Featured posts ratio
  const featuredCount = allPosts.filter(post => post.featured).length;
  const featuredRatio = featuredCount / allPosts.length;
  
  return {
    totalPosts: allPosts.length,
    categories: categoryDistribution,
    tags: tagUsage,
    avgReadingTime: Math.round(avgReadingTime),
    featuredRatio: Math.round(featuredRatio * 100),
    recentPosts: allPosts.slice(0, 5)
  };
}

/**
 * Search posts by title or summary
 */
export async function searchPosts(query: string): Promise<ProcessedBlogPost[]> {
  const result = await searchPostsAdvanced({ query });
  return result.posts;
}

/**
 * Get post statistics
 */
export async function getPostStats() {
  const allPosts = await getAllPosts();
  
  return {
    total: allPosts.length,
    featured: allPosts.filter(post => post.featured).length,
    byCategory: {
      pricing: allPosts.filter(post => post.category === 'pricing').length,
      operations: allPosts.filter(post => post.category === 'operations').length,
      tools: allPosts.filter(post => post.category === 'tools').length,
    },
  };
}