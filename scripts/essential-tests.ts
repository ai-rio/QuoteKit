#!/usr/bin/env tsx

/**
 * Essential Tests for MDX Blog System
 * 
 * Minimized test suite focusing on critical functionality only.
 * Validates that the system works end-to-end without comprehensive coverage.
 * 
 * Usage: npm run blog:test-essential
 */

import { getAllPosts, getPostBySlug } from '../src/lib/blog/content';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

class EssentialTester {
  private results: TestResult[] = [];
  
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = performance.now();
    try {
      await testFn();
      const duration = performance.now() - start;
      this.results.push({ name, passed: true, message: 'Passed', duration });
      console.log(`✅ ${name} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - start;
      this.results.push({ 
        name, 
        passed: false, 
        message: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });
      console.log(`❌ ${name} (${duration.toFixed(2)}ms): ${error}`);
    }
  }

  async testContentLoading(): Promise<void> {
    const posts = await getAllPosts();
    
    if (posts.length === 0) {
      throw new Error('No posts loaded');
    }
    
    if (posts.length !== 9) {
      throw new Error(`Expected 9 posts, got ${posts.length}`);
    }
    
    // Verify essential fields
    const firstPost = posts[0];
    const requiredFields = ['id', 'title', 'slug', 'category', 'content', 'publishedAt'];
    for (const field of requiredFields) {
      if (!firstPost[field as keyof typeof firstPost]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  async testSlugResolution(): Promise<void> {
    // Test the problematic slug that was fixed
    const post1 = await getPostBySlug('how-to-price-paver-patio-jobs-maximum-profit');
    if (!post1) {
      throw new Error('Failed to resolve SEO example post slug');
    }
    
    if (post1.title !== 'How to Price Paver Patio Jobs for Maximum Profit') {
      throw new Error('Incorrect post title for resolved slug');
    }
    
    // Test regular slug
    const post2 = await getPostBySlug('how-to-price-a-paver-patio');
    if (!post2) {
      throw new Error('Failed to resolve regular post slug');
    }
    
    // Test non-existent slug
    const post3 = await getPostBySlug('non-existent-slug');
    if (post3) {
      throw new Error('Non-existent slug should return null');
    }
  }

  async testPerformanceBaseline(): Promise<void> {
    // Clear cache to test cold performance
    const { clearBlogCache } = await import('../src/lib/blog/content');
    clearBlogCache();
    
    const coldStart = performance.now();
    const coldPosts = await getAllPosts();
    const coldTime = performance.now() - coldStart;
    
    const warmStart = performance.now();
    const warmPosts = await getAllPosts();
    const warmTime = performance.now() - warmStart;
    
    if (coldTime > 100) { // 100ms max for cold start
      throw new Error(`Cold start too slow: ${coldTime.toFixed(2)}ms`);
    }
    
    if (warmTime > 10) { // 10ms max for warm cache
      throw new Error(`Warm cache too slow: ${warmTime.toFixed(2)}ms`);
    }
    
    const speedup = ((coldTime - warmTime) / coldTime * 100);
    if (speedup < 80) { // At least 80% cache speedup
      throw new Error(`Cache speedup too low: ${speedup.toFixed(1)}%`);
    }
  }

  async testSEOMetadata(): Promise<void> {
    const posts = await getAllPosts();
    const seoPost = posts.find(p => p.slug === 'how-to-price-paver-patio-jobs-maximum-profit');
    
    if (!seoPost) {
      throw new Error('SEO example post not found');
    }
    

    // Verify SEO fields
    if (!seoPost.seo?.metaDescription) {
      throw new Error('Missing SEO description');
    }
    
    if (!seoPost.seo?.keywords || seoPost.seo.keywords.length === 0) {
      throw new Error('Missing SEO keywords');
    }
    
    if (!seoPost.imageAlt) {
      throw new Error('Missing image alt text');
    }
    
    // Verify structured data compatible fields
    if (!seoPost.publishedAt) {
      throw new Error('Missing publishedAt for structured data');
    }
    
    if (!seoPost.author) {
      throw new Error('Missing author for structured data');
    }
  }

  async testBuildIntegration(): Promise<void> {
    // Test that generateStaticParams would work
    const posts = await getAllPosts();
    const params = posts.map(post => ({ slug: post.slug }));
    
    if (params.length === 0) {
      throw new Error('No static params generated');
    }
    
    // Verify unique slugs
    const slugs = params.map(p => p.slug);
    const uniqueSlugs = new Set(slugs);
    if (slugs.length !== uniqueSlugs.size) {
      throw new Error('Duplicate slugs detected');
    }
    
    // Test that each slug can be resolved
    for (const { slug } of params.slice(0, 3)) { // Test first 3 to avoid timeout
      const post = await getPostBySlug(slug);
      if (!post) {
        throw new Error(`Cannot resolve slug for static generation: ${slug}`);
      }
    }
  }

  async runAllTests(): Promise<boolean> {
    console.log('🧪 Running Essential MDX Blog Tests\n');
    
    await this.runTest('Content Loading', () => this.testContentLoading());
    await this.runTest('Slug Resolution', () => this.testSlugResolution());
    await this.runTest('Performance Baseline', () => this.testPerformanceBaseline());
    await this.runTest('SEO Metadata', () => this.testSEOMetadata());
    await this.runTest('Build Integration', () => this.testBuildIntegration());
    
    this.printSummary();
    
    return this.results.every(r => r.passed);
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    console.log('\n📊 Test Summary:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Status: ${passed === total ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    
    if (passed === total) {
      console.log('\n🎉 Essential functionality validated!');
      console.log('   • All critical paths working');
      console.log('   • Performance within targets');
      console.log('   • SEO metadata preserved');
      console.log('   • Build integration ready');
    } else {
      console.log('\n❌ Issues found:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.name}: ${r.message}`);
      });
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EssentialTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export { EssentialTester };