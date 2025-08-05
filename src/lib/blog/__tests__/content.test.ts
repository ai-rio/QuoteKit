import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '../content';
import { BlogPostFrontmatterSchema } from '../validation';

// Mock fs module for testing
jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock gray-matter
jest.mock('gray-matter', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockFs = require('fs');
const mockPath = require('path');
const mockMatter = require('gray-matter').default;

describe('Blog Content Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({ isDirectory: () => true });
  });

  describe('getAllPosts', () => {
    test('should return all valid posts', async () => {
      // Mock directory structure
      mockFs.readdirSync
        .mockReturnValueOnce(['2025']) // years
        .mockReturnValueOnce(['01-test-post.mdx', '02-another-post.mdx']); // files in 2025

      // Mock file content
      const mockFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      mockMatter.mockReturnValue({
        data: mockFrontmatter,
        content: '# Test Content\n\nThis is test content.',
      });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const posts = await getAllPosts();

      expect(posts).toBeInstanceOf(Array);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0]).toHaveProperty('frontmatter');
      expect(posts[0]).toHaveProperty('content');
      expect(posts[0]).toHaveProperty('slug');
    });

    test('should filter out draft posts in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce(['01-draft-post.mdx']);

      const draftFrontmatter = {
        title: 'Draft Post',
        slug: 'draft-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Draft summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: true, // This should be filtered out
      };

      mockMatter.mockReturnValue({
        data: draftFrontmatter,
        content: '# Draft Content',
      });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const posts = await getAllPosts();

      expect(posts).toHaveLength(0);

      (process.env as any).NODE_ENV = originalEnv;
    });

    test('should sort posts by publication date (newest first)', async () => {
      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce(['01-old-post.mdx', '02-new-post.mdx']);

      const oldPost = {
        title: 'Old Post',
        slug: 'old-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-01',
        summary: 'Old post summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      const newPost = {
        title: 'New Post',
        slug: 'new-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'New post summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      mockMatter
        .mockReturnValueOnce({ data: oldPost, content: 'Old content' })
        .mockReturnValueOnce({ data: newPost, content: 'New content' });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const posts = await getAllPosts();

      expect(posts[0].frontmatter.slug).toBe('new-post');
      expect(posts[1].frontmatter.slug).toBe('old-post');
    });
  });

  describe('getPostBySlug', () => {
    test('should return correct post for valid slug', async () => {
      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce(['01-test-post.mdx']);

      const mockFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      mockMatter.mockReturnValue({
        data: mockFrontmatter,
        content: '# Test Content',
      });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const post = await getPostBySlug('test-post');

      expect(post).toBeDefined();
      expect(post?.frontmatter.slug).toBe('test-post');
      expect(post?.frontmatter.title).toBe('Test Post');
    });

    test('should return null for non-existent slug', async () => {
      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce(['01-test-post.mdx']);

      const mockFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      mockMatter.mockReturnValue({
        data: mockFrontmatter,
        content: '# Test Content',
      });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const post = await getPostBySlug('non-existent-post');

      expect(post).toBeNull();
    });
  });

  describe('getRelatedPosts', () => {
    test('should return posts from same category', async () => {
      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce([
          '01-current-post.mdx',
          '02-related-post.mdx',
          '03-different-category.mdx'
        ]);

      const currentPost = {
        title: 'Current Post',
        slug: 'current-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Current post summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      const relatedPost = {
        title: 'Related Post',
        slug: 'related-post',
        category: 'pricing' as const,
        author: 'Test Author',
        publishedAt: '2025-01-10',
        summary: 'Related post summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      const differentCategoryPost = {
        title: 'Different Category Post',
        slug: 'different-category',
        category: 'operations' as const,
        author: 'Test Author',
        publishedAt: '2025-01-05',
        summary: 'Different category summary',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        draft: false,
      };

      mockMatter
        .mockReturnValueOnce({ data: currentPost, content: 'Current content' })
        .mockReturnValueOnce({ data: relatedPost, content: 'Related content' })
        .mockReturnValueOnce({ data: differentCategoryPost, content: 'Different content' });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const relatedPosts = await getRelatedPosts('current-post', 'pricing', 3);

      expect(relatedPosts).toHaveLength(1);
      expect(relatedPosts[0].frontmatter.slug).toBe('related-post');
      expect(relatedPosts[0].frontmatter.category).toBe('pricing');
    });

    test('should respect limit parameter', async () => {
      mockFs.readdirSync
        .mockReturnValueOnce(['2025'])
        .mockReturnValueOnce([
          '01-current-post.mdx',
          '02-related-1.mdx',
          '03-related-2.mdx',
          '04-related-3.mdx',
          '05-related-4.mdx'
        ]);

      // Mock multiple related posts in same category
      const posts = [
        { slug: 'current-post', category: 'pricing' },
        { slug: 'related-1', category: 'pricing' },
        { slug: 'related-2', category: 'pricing' },
        { slug: 'related-3', category: 'pricing' },
        { slug: 'related-4', category: 'pricing' },
      ];

      posts.forEach((post, index) => {
        mockMatter.mockReturnValueOnce({
          data: {
            title: `Post ${index}`,
            slug: post.slug,
            category: post.category as const,
            author: 'Test Author',
            publishedAt: '2025-01-15',
            summary: `Summary ${index}`,
            readTime: 5,
            image: 'https://example.com/test.jpg',
            draft: false,
          },
          content: `Content ${index}`,
        });
      });

      mockFs.readFileSync.mockReturnValue('mock file content');

      const relatedPosts = await getRelatedPosts('current-post', 'pricing', 2);

      expect(relatedPosts).toHaveLength(2);
      expect(relatedPosts.every(post => post.frontmatter.slug !== 'current-post')).toBe(true);
    });
  });

  describe('Frontmatter Validation', () => {
    test('should validate required fields', () => {
      const validFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(validFrontmatter)).not.toThrow();
    });

    test('should reject invalid slug format', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'Test Post With Spaces', // Invalid slug
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject invalid category', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'invalid-category', // Invalid category
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject summary that is too short', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Short', // Too short
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });
  });
});