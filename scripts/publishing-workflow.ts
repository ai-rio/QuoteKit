#!/usr/bin/env tsx

/**
 * Publishing Workflow Enhancement Tool
 * 
 * Usage:
 *   npm run blog:publish <slug>
 *   npm run blog:draft <slug>
 *   npm run blog:schedule <slug> <date>
 *   npm run blog:status
 * 
 * Features:
 * - Draft status management
 * - Scheduled publishing
 * - Content preview functionality
 * - Editorial workflow states
 * - Publishing automation
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

// Types and schemas
const WorkflowStatusSchema = z.enum(['draft', 'review', 'scheduled', 'published', 'archived']);
type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

interface BlogPostWorkflow {
  slug: string;
  title: string;
  status: WorkflowStatus;
  isDraft: boolean;
  publishedAt: string;
  scheduledFor?: string;
  lastModified: string;
  wordCount: number;
  readingTime: number;
  author: string;
  category: string;
  tags: string[];
}

interface WorkflowSummary {
  totalPosts: number;
  drafts: number;
  inReview: number;
  scheduled: number;
  published: number;
  archived: number;
  upcomingPublications: BlogPostWorkflow[];
  recentlyPublished: BlogPostWorkflow[];
}

// Configuration
const CONTENT_DIR = join(process.cwd(), 'content', 'posts');

// Utility functions
function calculateWordCount(content: string): number {
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
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function determineWorkflowStatus(frontmatter: any): WorkflowStatus {
  if (frontmatter.workflowStatus) {
    return frontmatter.workflowStatus;
  }
  
  if (frontmatter.isDraft) {
    return 'draft';
  }
  
  if (frontmatter.publishedAt) {
    const publishDate = new Date(frontmatter.publishedAt);
    const now = new Date();
    
    if (publishDate > now) {
      return 'scheduled';
    } else {
      return 'published';
    }
  }
  
  return 'draft';
}

async function loadPostWorkflow(slug: string): Promise<BlogPostWorkflow | null> {
  try {
    const filePath = join(CONTENT_DIR, `${slug}.mdx`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    const stats = await fs.stat(filePath);
    const wordCount = calculateWordCount(content);
    
    return {
      slug,
      title: data.title || 'Untitled',
      status: determineWorkflowStatus(data),
      isDraft: data.isDraft || false,
      publishedAt: data.publishedAt || '',
      scheduledFor: data.scheduledFor,
      lastModified: stats.mtime.toISOString(),
      wordCount,
      readingTime: calculateReadingTime(wordCount),
      author: data.author || 'Unknown',
      category: data.category || 'guides',
      tags: data.tags || []
    };
  } catch (error) {
    return null;
  }
}

async function loadAllPostWorkflows(): Promise<BlogPostWorkflow[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    const workflows: BlogPostWorkflow[] = [];
    
    for (const file of mdxFiles) {
      const slug = file.replace('.mdx', '');
      const workflow = await loadPostWorkflow(slug);
      if (workflow) {
        workflows.push(workflow);
      }
    }
    
    return workflows;
  } catch (error) {
    console.error('Error loading post workflows:', error);
    return [];
  }
}

async function updatePostFrontmatter(slug: string, updates: Record<string, any>): Promise<boolean> {
  try {
    const filePath = join(CONTENT_DIR, `${slug}.mdx`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    // Apply updates
    const updatedData = { ...data, ...updates };
    
    // Generate new frontmatter
    const frontmatterLines = ['---'];
    for (const [key, value] of Object.entries(updatedData)) {
      if (Array.isArray(value)) {
        frontmatterLines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
      } else if (typeof value === 'string') {
        frontmatterLines.push(`${key}: "${value}"`);
      } else {
        frontmatterLines.push(`${key}: ${value}`);
      }
    }
    frontmatterLines.push('---');
    
    const newContent = frontmatterLines.join('\n') + '\n\n' + content;
    await fs.writeFile(filePath, newContent, 'utf-8');
    
    return true;
  } catch (error) {
    console.error(`Error updating post ${slug}:`, error);
    return false;
  }
}

async function publishPost(slug: string): Promise<boolean> {
  console.log(`📝 Publishing post: ${slug}`);
  
  const workflow = await loadPostWorkflow(slug);
  if (!workflow) {
    console.error(`❌ Post not found: ${slug}`);
    return false;
  }
  
  const updates = {
    isDraft: false,
    publishedAt: new Date().toISOString().split('T')[0],
    workflowStatus: 'published'
  };
  
  const success = await updatePostFrontmatter(slug, updates);
  
  if (success) {
    console.log(`✅ Post "${workflow.title}" published successfully!`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📅 Published: ${updates.publishedAt}`);
    return true;
  } else {
    console.error(`❌ Failed to publish post: ${slug}`);
    return false;
  }
}

async function draftPost(slug: string): Promise<boolean> {
  console.log(`📋 Converting post to draft: ${slug}`);
  
  const workflow = await loadPostWorkflow(slug);
  if (!workflow) {
    console.error(`❌ Post not found: ${slug}`);
    return false;
  }
  
  const updates = {
    isDraft: true,
    publishedAt: '',
    workflowStatus: 'draft'
  };
  
  const success = await updatePostFrontmatter(slug, updates);
  
  if (success) {
    console.log(`✅ Post "${workflow.title}" converted to draft!`);
    console.log(`🔗 Slug: ${slug}`);
    return true;
  } else {
    console.error(`❌ Failed to convert post to draft: ${slug}`);
    return false;
  }
}

async function schedulePost(slug: string, publishDate: string): Promise<boolean> {
  console.log(`⏰ Scheduling post: ${slug} for ${publishDate}`);
  
  if (!isValidDate(publishDate)) {
    console.error(`❌ Invalid date format: ${publishDate}`);
    console.log('Use format: YYYY-MM-DD or YYYY-MM-DD HH:MM');
    return false;
  }
  
  const workflow = await loadPostWorkflow(slug);
  if (!workflow) {
    console.error(`❌ Post not found: ${slug}`);
    return false;
  }
  
  const scheduleDate = new Date(publishDate);
  const now = new Date();
  
  if (scheduleDate <= now) {
    console.error(`❌ Scheduled date must be in the future`);
    return false;
  }
  
  const updates = {
    isDraft: false,
    publishedAt: publishDate,
    scheduledFor: publishDate,
    workflowStatus: 'scheduled'
  };
  
  const success = await updatePostFrontmatter(slug, updates);
  
  if (success) {
    console.log(`✅ Post "${workflow.title}" scheduled successfully!`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📅 Scheduled for: ${formatDate(publishDate)}`);
    return true;
  } else {
    console.error(`❌ Failed to schedule post: ${slug}`);
    return false;
  }
}

async function generateWorkflowSummary(): Promise<WorkflowSummary> {
  const workflows = await loadAllPostWorkflows();
  
  const summary: WorkflowSummary = {
    totalPosts: workflows.length,
    drafts: 0,
    inReview: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
    upcomingPublications: [],
    recentlyPublished: []
  };
  
  const now = new Date();
  
  for (const workflow of workflows) {
    switch (workflow.status) {
      case 'draft':
        summary.drafts++;
        break;
      case 'review':
        summary.inReview++;
        break;
      case 'scheduled':
        summary.scheduled++;
        if (workflow.scheduledFor) {
          const scheduleDate = new Date(workflow.scheduledFor);
          if (scheduleDate > now) {
            summary.upcomingPublications.push(workflow);
          }
        }
        break;
      case 'published':
        summary.published++;
        if (workflow.publishedAt) {
          const publishDate = new Date(workflow.publishedAt);
          const daysSincePublished = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSincePublished <= 30) {
            summary.recentlyPublished.push(workflow);
          }
        }
        break;
      case 'archived':
        summary.archived++;
        break;
    }
  }
  
  // Sort upcoming publications by schedule date
  summary.upcomingPublications.sort((a, b) => {
    const dateA = new Date(a.scheduledFor || '');
    const dateB = new Date(b.scheduledFor || '');
    return dateA.getTime() - dateB.getTime();
  });
  
  // Sort recent publications by publish date (newest first)
  summary.recentlyPublished.sort((a, b) => {
    const dateA = new Date(a.publishedAt || '');
    const dateB = new Date(b.publishedAt || '');
    return dateB.getTime() - dateA.getTime();
  });
  
  return summary;
}

function displayWorkflowStatus(summary: WorkflowSummary): void {
  console.log('\n📊 PUBLISHING WORKFLOW STATUS');
  console.log('═'.repeat(50));
  console.log(`📝 Total Posts: ${summary.totalPosts}`);
  console.log(`📋 Drafts: ${summary.drafts}`);
  console.log(`👀 In Review: ${summary.inReview}`);
  console.log(`⏰ Scheduled: ${summary.scheduled}`);
  console.log(`✅ Published: ${summary.published}`);
  console.log(`📦 Archived: ${summary.archived}`);
  
  if (summary.upcomingPublications.length > 0) {
    console.log('\n⏰ UPCOMING PUBLICATIONS');
    console.log('═'.repeat(50));
    for (const post of summary.upcomingPublications.slice(0, 5)) {
      console.log(`📅 ${formatDate(post.scheduledFor || '')}`);
      console.log(`   "${post.title}"`);
      console.log(`   ${post.category} • ${post.readingTime} min read • ${post.wordCount} words`);
      console.log('');
    }
  }
  
  if (summary.recentlyPublished.length > 0) {
    console.log('\n📰 RECENTLY PUBLISHED');
    console.log('═'.repeat(50));
    for (const post of summary.recentlyPublished.slice(0, 5)) {
      console.log(`📅 ${formatDate(post.publishedAt)}`);
      console.log(`   "${post.title}"`);
      console.log(`   ${post.category} • ${post.readingTime} min read • ${post.wordCount} words`);
      console.log('');
    }
  }
}

async function processScheduledPosts(): Promise<void> {
  console.log('🔄 Processing scheduled posts...');
  
  const workflows = await loadAllPostWorkflows();
  const now = new Date();
  let processedCount = 0;
  
  for (const workflow of workflows) {
    if (workflow.status === 'scheduled' && workflow.scheduledFor) {
      const scheduleDate = new Date(workflow.scheduledFor);
      
      if (scheduleDate <= now) {
        console.log(`📝 Auto-publishing: "${workflow.title}"`);
        
        const updates = {
          isDraft: false,
          publishedAt: now.toISOString().split('T')[0],
          workflowStatus: 'published'
        };
        
        const success = await updatePostFrontmatter(workflow.slug, updates);
        
        if (success) {
          console.log(`✅ Published: ${workflow.title}`);
          processedCount++;
        } else {
          console.error(`❌ Failed to publish: ${workflow.title}`);
        }
      }
    }
  }
  
  if (processedCount === 0) {
    console.log('ℹ️  No scheduled posts ready for publication');
  } else {
    console.log(`✅ Processed ${processedCount} scheduled posts`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Publishing Workflow Enhancement Tool

Usage:
  npm run blog:publish <slug>          Publish a draft post
  npm run blog:draft <slug>            Convert post to draft
  npm run blog:schedule <slug> <date>  Schedule post for future publication
  npm run blog:status                  Show workflow status overview
  npm run blog:process-scheduled       Process scheduled posts (auto-publish)

Options:
  --help, -h                          Show this help message

Examples:
  npm run blog:publish my-awesome-post
  npm run blog:draft my-awesome-post
  npm run blog:schedule my-awesome-post 2025-08-15
  npm run blog:schedule my-awesome-post "2025-08-15 09:00"
  npm run blog:status
  npm run blog:process-scheduled

Date Formats:
  YYYY-MM-DD                          Date only (publishes at midnight)
  YYYY-MM-DD HH:MM                    Date and time
  "2025-08-15"                        Quoted for exact parsing
  "2025-08-15 14:30"                  Quoted date with time
`);
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'publish':
      if (args.length < 2) {
        console.error('❌ Error: Post slug is required');
        console.log('Usage: npm run blog:publish <slug>');
        process.exit(1);
      }
      await publishPost(args[1]);
      break;
      
    case 'draft':
      if (args.length < 2) {
        console.error('❌ Error: Post slug is required');
        console.log('Usage: npm run blog:draft <slug>');
        process.exit(1);
      }
      await draftPost(args[1]);
      break;
      
    case 'schedule':
      if (args.length < 3) {
        console.error('❌ Error: Post slug and date are required');
        console.log('Usage: npm run blog:schedule <slug> <date>');
        process.exit(1);
      }
      await schedulePost(args[1], args[2]);
      break;
      
    case 'status':
      const summary = await generateWorkflowSummary();
      displayWorkflowStatus(summary);
      break;
      
    case 'process-scheduled':
      await processScheduledPosts();
      break;
      
    default:
      console.error(`❌ Error: Unknown command "${command}"`);
      console.log('Run with --help to see available commands');
      process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { 
  publishPost, 
  draftPost, 
  schedulePost, 
  generateWorkflowSummary, 
  processScheduledPosts 
};
