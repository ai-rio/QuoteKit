#!/usr/bin/env tsx

/**
 * Content Analytics & Insights Tool
 * 
 * Usage:
 *   npm run blog:analytics
 *   npm run blog:analytics --detailed
 *   npm run blog:analytics --category=guides
 * 
 * Features:
 * - Content statistics and distribution
 * - Reading time analysis
 * - Category and tag insights
 * - Performance tracking
 * - Content gap analysis
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

// Types and schemas
const CategorySchema = z.enum(['pricing', 'operations', 'tools']);
type Category = z.infer<typeof CategorySchema>;

interface BlogPost {
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  author: string;
  publishedAt: string;
  readingTime: number;
  tags: string[];
  isDraft: boolean;
  wordCount: number;
  content: string;
}

interface ContentStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalWords: number;
  averageReadingTime: number;
  averageWordCount: number;
  categoryDistribution: Record<Category, number>;
  tagFrequency: Record<string, number>;
  authorDistribution: Record<string, number>;
  monthlyPublishing: Record<string, number>;
}

interface CategoryInsights {
  category: Category;
  postCount: number;
  averageReadingTime: number;
  averageWordCount: number;
  totalWords: number;
  popularTags: Array<{ tag: string; count: number }>;
  recentPosts: string[];
}

interface ContentGaps {
  underrepresentedCategories: Category[];
  suggestedTopics: string[];
  contentOpportunities: string[];
}

// Configuration
const CONTENT_DIR = join(process.cwd(), 'content', 'posts');

// Utility functions
function calculateWordCount(content: string): number {
  // Remove frontmatter and MDX components for accurate word count
  const cleanContent = content
    .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
    .replace(/<[^>]*>/g, '') // Remove HTML/JSX tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Convert links to text
    .replace(/[#*_~`]/g, '') // Remove markdown formatting
    .trim();
  
  return cleanContent.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Draft';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getMonthYear(dateString: string): string {
  if (!dateString) return 'Draft';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function loadAllPosts(): Promise<BlogPost[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    const posts: BlogPost[] = [];
    
    for (const file of mdxFiles) {
      const filePath = join(CONTENT_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      
      const wordCount = calculateWordCount(content);
      const calculatedReadingTime = calculateReadingTime(wordCount);
      
      posts.push({
        slug: data.slug || file.replace('.mdx', ''),
        title: data.title || 'Untitled',
        category: data.category || 'guides',
        excerpt: data.excerpt || '',
        author: data.author || 'Unknown',
        publishedAt: data.publishedAt || '',
        readingTime: data.readingTime || calculatedReadingTime,
        tags: data.tags || [],
        isDraft: data.isDraft || false,
        wordCount,
        content
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

function generateContentStats(posts: BlogPost[]): ContentStats {
  const publishedPosts = posts.filter(post => !post.isDraft);
  const draftPosts = posts.filter(post => post.isDraft);
  
  const categoryDistribution: Record<Category, number> = {
    'pricing': 0,
    'operations': 0,
    'tools': 0
  };
  
  const tagFrequency: Record<string, number> = {};
  const authorDistribution: Record<string, number> = {};
  const monthlyPublishing: Record<string, number> = {};
  
  let totalWords = 0;
  let totalReadingTime = 0;
  
  for (const post of posts) {
    // Category distribution
    categoryDistribution[post.category]++;
    
    // Tag frequency
    for (const tag of post.tags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    }
    
    // Author distribution
    authorDistribution[post.author] = (authorDistribution[post.author] || 0) + 1;
    
    // Monthly publishing (only for published posts)
    if (!post.isDraft && post.publishedAt) {
      const monthYear = getMonthYear(post.publishedAt);
      monthlyPublishing[monthYear] = (monthlyPublishing[monthYear] || 0) + 1;
    }
    
    // Word and reading time totals
    totalWords += post.wordCount;
    totalReadingTime += post.readingTime;
  }
  
  return {
    totalPosts: posts.length,
    publishedPosts: publishedPosts.length,
    draftPosts: draftPosts.length,
    totalWords,
    averageReadingTime: posts.length > 0 ? Math.round(totalReadingTime / posts.length) : 0,
    averageWordCount: posts.length > 0 ? Math.round(totalWords / posts.length) : 0,
    categoryDistribution,
    tagFrequency,
    authorDistribution,
    monthlyPublishing
  };
}

function generateCategoryInsights(posts: BlogPost[]): CategoryInsights[] {
  const categories: Category[] = ['pricing', 'operations', 'tools'];
  
  return categories.map(category => {
    const categoryPosts = posts.filter(post => post.category === category);
    const publishedCategoryPosts = categoryPosts.filter(post => !post.isDraft);
    
    const totalWords = categoryPosts.reduce((sum, post) => sum + post.wordCount, 0);
    const totalReadingTime = categoryPosts.reduce((sum, post) => sum + post.readingTime, 0);
    
    // Get tag frequency for this category
    const tagFreq: Record<string, number> = {};
    for (const post of categoryPosts) {
      for (const tag of post.tags) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    }
    
    const popularTags = Object.entries(tagFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    const recentPosts = publishedCategoryPosts
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 3)
      .map(post => post.title);
    
    return {
      category,
      postCount: categoryPosts.length,
      averageReadingTime: categoryPosts.length > 0 ? Math.round(totalReadingTime / categoryPosts.length) : 0,
      averageWordCount: categoryPosts.length > 0 ? Math.round(totalWords / categoryPosts.length) : 0,
      totalWords,
      popularTags,
      recentPosts
    };
  });
}

function identifyContentGaps(posts: BlogPost[], stats: ContentStats): ContentGaps {
  const categories: Category[] = ['pricing', 'operations', 'tools'];
  const averagePostsPerCategory = stats.publishedPosts / categories.length;
  
  const underrepresentedCategories = categories.filter(
    category => stats.categoryDistribution[category] < averagePostsPerCategory * 0.7
  );
  
  // Analyze tag patterns to suggest topics
  const topTags = Object.entries(stats.tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag);
  
  const suggestedTopics = [
    'Advanced techniques for ' + topTags[0],
    'Common mistakes in ' + topTags[1],
    'Best practices for ' + topTags[2],
    'Case study: Successful ' + topTags[0] + ' implementation',
    'Industry trends in ' + topTags[1]
  ];
  
  const contentOpportunities = [
    underrepresentedCategories.length > 0 ? 
      `Create more ${underrepresentedCategories[0]} content` : 
      'Content distribution is well balanced',
    stats.averageWordCount < 800 ? 
      'Consider creating more in-depth, longer-form content' : 
      'Content length is appropriate',
    Object.keys(stats.monthlyPublishing).length < 3 ? 
      'Establish a more consistent publishing schedule' : 
      'Publishing frequency is good'
  ];
  
  return {
    underrepresentedCategories,
    suggestedTopics,
    contentOpportunities
  };
}

function displayOverallStats(stats: ContentStats): void {
  console.log('\n📊 CONTENT OVERVIEW');
  console.log('═'.repeat(50));
  console.log(`📝 Total Posts: ${stats.totalPosts}`);
  console.log(`✅ Published: ${stats.publishedPosts}`);
  console.log(`📋 Drafts: ${stats.draftPosts}`);
  console.log(`📖 Total Words: ${stats.totalWords.toLocaleString()}`);
  console.log(`⏱️  Average Reading Time: ${stats.averageReadingTime} minutes`);
  console.log(`📄 Average Word Count: ${stats.averageWordCount} words`);
}

function displayCategoryDistribution(stats: ContentStats): void {
  console.log('\n📂 CATEGORY DISTRIBUTION');
  console.log('═'.repeat(50));
  
  const categories: Category[] = ['pricing', 'operations', 'tools'];
  const maxCount = Math.max(...Object.values(stats.categoryDistribution));
  
  for (const category of categories) {
    const count = stats.categoryDistribution[category];
    const percentage = stats.totalPosts > 0 ? Math.round((count / stats.totalPosts) * 100) : 0;
    const bar = '█'.repeat(Math.round((count / maxCount) * 20));
    
    console.log(`${category.padEnd(20)} ${bar.padEnd(20)} ${count} (${percentage}%)`);
  }
}

function displayTopTags(stats: ContentStats): void {
  console.log('\n🏷️  TOP TAGS');
  console.log('═'.repeat(50));
  
  const topTags = Object.entries(stats.tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  for (const [tag, count] of topTags) {
    const percentage = Math.round((count / stats.totalPosts) * 100);
    console.log(`${tag.padEnd(25)} ${count} posts (${percentage}%)`);
  }
}

function displayPublishingTrends(stats: ContentStats): void {
  console.log('\n📅 PUBLISHING TRENDS');
  console.log('═'.repeat(50));
  
  const months = Object.entries(stats.monthlyPublishing)
    .sort(([a], [b]) => a.localeCompare(b));
  
  if (months.length === 0) {
    console.log('No published posts with dates found.');
    return;
  }
  
  for (const [month, count] of months) {
    const date = new Date(month + '-01');
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    console.log(`${monthName.padEnd(20)} ${count} posts`);
  }
}

function displayCategoryInsights(insights: CategoryInsights[], category?: Category): void {
  const categoriesToShow = category ? insights.filter(i => i.category === category) : insights;
  
  console.log('\n🔍 CATEGORY INSIGHTS');
  console.log('═'.repeat(50));
  
  for (const insight of categoriesToShow) {
    console.log(`\n📂 ${insight.category.toUpperCase()}`);
    console.log(`   Posts: ${insight.postCount}`);
    console.log(`   Avg Reading Time: ${insight.averageReadingTime} min`);
    console.log(`   Avg Word Count: ${insight.averageWordCount} words`);
    console.log(`   Total Words: ${insight.totalWords.toLocaleString()}`);
    
    if (insight.popularTags.length > 0) {
      console.log(`   Popular Tags: ${insight.popularTags.map(t => `${t.tag} (${t.count})`).join(', ')}`);
    }
    
    if (insight.recentPosts.length > 0) {
      console.log(`   Recent Posts:`);
      for (const post of insight.recentPosts) {
        console.log(`     • ${post}`);
      }
    }
  }
}

function displayContentGaps(gaps: ContentGaps): void {
  console.log('\n🎯 CONTENT OPPORTUNITIES');
  console.log('═'.repeat(50));
  
  if (gaps.underrepresentedCategories.length > 0) {
    console.log('\n📈 Underrepresented Categories:');
    for (const category of gaps.underrepresentedCategories) {
      console.log(`   • ${category}`);
    }
  }
  
  console.log('\n💡 Suggested Topics:');
  for (const topic of gaps.suggestedTopics) {
    console.log(`   • ${topic}`);
  }
  
  console.log('\n🚀 Content Opportunities:');
  for (const opportunity of gaps.contentOpportunities) {
    console.log(`   • ${opportunity}`);
  }
}

async function generateReport(options: { detailed?: boolean; category?: Category } = {}): Promise<void> {
  console.log('🔄 Loading blog posts...');
  
  const posts = await loadAllPosts();
  
  if (posts.length === 0) {
    console.log('❌ No blog posts found in the content directory.');
    return;
  }
  
  console.log(`✅ Loaded ${posts.length} blog posts`);
  
  const stats = generateContentStats(posts);
  const insights = generateCategoryInsights(posts);
  const gaps = identifyContentGaps(posts, stats);
  
  // Display reports
  displayOverallStats(stats);
  displayCategoryDistribution(stats);
  displayTopTags(stats);
  displayPublishingTrends(stats);
  
  if (options.detailed || options.category) {
    displayCategoryInsights(insights, options.category);
  }
  
  if (options.detailed) {
    displayContentGaps(gaps);
  }
  
  console.log('\n✨ Analysis complete!');
  
  if (!options.detailed) {
    console.log('\n💡 Run with --detailed flag for more insights and content opportunities');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📊 Content Analytics & Insights Tool

Usage:
  npm run blog:analytics
  npm run blog:analytics --detailed
  npm run blog:analytics --category=guides
  npm run blog:analytics --detailed --category=tutorials

Options:
  --detailed            Show detailed insights and content opportunities
  --category=<category> Focus analysis on specific category
  --help, -h            Show this help message

Categories:
  pricing, operations, tools

Examples:
  npm run blog:analytics
  npm run blog:analytics --detailed
  npm run blog:analytics --category=pricing
  npm run blog:analytics --detailed --category=operations
`);
    return;
  }
  
  const options: { detailed?: boolean; category?: Category } = {};
  
  if (args.includes('--detailed')) {
    options.detailed = true;
  }
  
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  if (categoryArg) {
    const categoryValue = categoryArg.split('=')[1];
    try {
      options.category = CategorySchema.parse(categoryValue);
    } catch {
      console.error(`❌ Error: Invalid category "${categoryValue}"`);
      console.log('Valid categories: pricing, operations, tools');
      process.exit(1);
    }
  }
  
  await generateReport(options);
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { generateContentStats, generateCategoryInsights, identifyContentGaps };
