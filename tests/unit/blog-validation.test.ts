import { describe, test, expect } from '@jest/globals';
import { BlogPostFrontmatterSchema } from '@/lib/blog/validation';

describe('Blog Post Frontmatter Validation', () => {
  describe('Valid frontmatter', () => {
    test('should accept valid frontmatter with all required fields', () => {
      const validFrontmatter = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'This is a test summary that is long enough to pass validation requirements.',
        readTime: 5,
        image: 'https://example.com/test-image.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(validFrontmatter)).not.toThrow();
    });

    test('should accept valid frontmatter with optional fields', () => {
      const validFrontmatter = {
        title: 'Test Post Title',
        slug: 'test-post-title',
        category: 'operations',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'This is a test summary that is long enough to pass validation requirements.',
        readTime: 5,
        image: 'https://example.com/test-image.jpg',
        featured: true,
        draft: false,
        tags: ['landscaping', 'business'],
        seo: {
          description: 'Custom SEO description for better search results.',
          keywords: ['landscaping', 'business', 'operations'],
        },
        imageAlt: 'Test image description',
      };

      expect(() => BlogPostFrontmatterSchema.parse(validFrontmatter)).not.toThrow();
    });

    test('should accept all valid categories', () => {
      const categories = ['pricing', 'operations', 'tools'];

      categories.forEach(category => {
        const frontmatter = {
          title: 'Test Post',
          slug: 'test-post',
          category,
          author: 'Test Author',
          publishedAt: '2025-01-15',
          summary: 'Test summary that is long enough for validation.',
          readTime: 5,
          image: 'https://example.com/test.jpg',
        };

        expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).not.toThrow();
      });
    });
  });

  describe('Invalid frontmatter - required fields', () => {
    test('should reject frontmatter missing title', () => {
      const invalidFrontmatter = {
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        // title missing
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject frontmatter missing slug', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        // slug missing
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject frontmatter missing category', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        // category missing
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject frontmatter missing author', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        // author missing
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });
  });

  describe('Invalid frontmatter - field formats', () => {
    test('should reject invalid slug format with spaces', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'Test Post With Spaces', // Invalid - contains spaces and capitals
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject invalid slug format with uppercase', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'Test-Post-Title', // Invalid - contains uppercase
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
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
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject invalid date format', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: 'January 15, 2025', // Invalid format
        summary: 'Test summary that is long enough.',
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

    test('should reject negative read time', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: -5, // Negative read time
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });

    test('should reject invalid image URL', () => {
      const invalidFrontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'not-a-valid-url', // Invalid URL
      };

      expect(() => BlogPostFrontmatterSchema.parse(invalidFrontmatter)).toThrow();
    });
  });

  describe('Optional fields validation', () => {
    test('should accept valid SEO fields', () => {
      const frontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        seo: {
          description: 'Custom SEO description under 160 chars.',
          keywords: ['keyword1', 'keyword2'],
        },
      };

      expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).not.toThrow();
    });

    test('should reject SEO description that is too long', () => {
      const frontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
        seo: {
          description: 'This is a very long SEO description that exceeds the maximum allowed length of 160 characters and should therefore be rejected by the validation schema because it is too long for proper SEO optimization.',
          keywords: ['keyword1', 'keyword2'],
        },
      };

      expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).toThrow();
    });

    test('should set default values for optional fields', () => {
      const frontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      const parsed = BlogPostFrontmatterSchema.parse(frontmatter);
      
      expect(parsed.draft).toBe(false); // Should default to false
    });
  });

  describe('Edge cases', () => {
    test('should handle empty string fields appropriately', () => {
      const frontmatter = {
        title: '', // Empty title should fail
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).toThrow();
    });

    test('should handle whitespace-only fields', () => {
      const frontmatter = {
        title: '   ', // Whitespace-only title will be trimmed and become empty
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 5,
        image: 'https://example.com/test.jpg',
      };

      // After trimming, empty title should fail validation
      expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).toThrow();
    });

    test('should handle zero read time', () => {
      const frontmatter = {
        title: 'Test Post',
        slug: 'test-post',
        category: 'pricing',
        author: 'Test Author',
        publishedAt: '2025-01-15',
        summary: 'Test summary that is long enough.',
        readTime: 0, // Zero read time should fail
        image: 'https://example.com/test.jpg',
      };

      expect(() => BlogPostFrontmatterSchema.parse(frontmatter)).toThrow();
    });
  });
});