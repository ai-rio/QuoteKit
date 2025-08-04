#!/usr/bin/env tsx

/**
 * Migration script to convert existing blog posts to MDX format
 * Preserves all data and maintains backward compatibility
 */

import fs from 'fs';
import path from 'path';

// Import the existing blog posts
const blogPostsPath = path.join(process.cwd(), 'src', 'app', 'blog', 'data', 'blog-posts.ts');

// Read and parse the blog posts file
function extractBlogPosts() {
  const content = fs.readFileSync(blogPostsPath, 'utf8');
  
  // Extract the blogPosts array
  const blogPostsMatch = content.match(/export const blogPosts: BlogPost\[\] = (\[[\s\S]*?\]);/);
  
  if (!blogPostsMatch) {
    throw new Error('Could not find blogPosts array in blog-posts.ts');
  }
  
  // Use eval to parse the array (safe in this migration context)
  const blogPostsString = blogPostsMatch[1];
  const blogPosts = eval(blogPostsString);
  
  return blogPosts;
}

// Generate slug from filename with date prefix
function generateFilename(post: any, index: number): string {
  const date = new Date(post.publishedAt);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  // Create filename with date prefix
  const datePrefix = `${month}-${day}`;
  const filename = `${datePrefix}-${post.slug}.mdx`;
  
  return { filename, year: year.toString() };
}

// Generate sample content for each post
function generateSampleContent(post: any): string {
  const contentTemplates = {
    pricing: `
## Introduction

${post.summary}

## Key Pricing Strategies

When it comes to pricing in the landscaping industry, there are several key factors to consider:

### 1. Material Costs
Calculate all material costs including markup for handling and potential waste.

### 2. Labor Calculations  
Factor in your hourly rate plus overhead costs and profit margins.

### 3. Market Research
Understanding your local market rates helps position your pricing competitively.

## Best Practices

- Always provide detailed breakdowns
- Include contingency buffers
- Document your pricing methodology
- Regular review and adjustment

## Conclusion

Proper pricing is essential for business sustainability and growth in the landscaping industry.
`,
    operations: `
## Overview

${post.summary}

## Operational Excellence

Effective operations management is crucial for landscaping business success:

### 1. Process Standardization
Develop consistent processes for common tasks and project workflows.

### 2. Quality Control
Implement checkpoints and quality standards to ensure consistent results.

### 3. Client Communication
Maintain clear, professional communication throughout every project.

## Implementation Tips

- Document all procedures
- Train team members consistently  
- Regular process review and improvement
- Client feedback integration

## Key Takeaways

Strong operational processes lead to better client satisfaction and business growth.
`,
    tools: `
## Tool Overview

${post.summary}

## Why This Tool Matters

In today's competitive landscaping market, the right tools can make all the difference:

### 1. Efficiency Gains
Modern tools help streamline workflows and reduce manual tasks.

### 2. Cost Savings
Initial investment often pays for itself through time and labor savings.

### 3. Professional Image
Quality tools contribute to a more professional service offering.

## Getting Started

- Evaluate your current workflow
- Identify pain points and bottlenecks
- Research tool options and features
- Calculate ROI before purchasing

## Conclusion

Smart tool investments can significantly improve your business operations and profitability.
`
  };

  return contentTemplates[post.category as keyof typeof contentTemplates] || contentTemplates.operations;
}

// Generate MDX frontmatter
function generateFrontmatter(post: any): string {
  return `---
title: "${post.title}"
slug: "${post.slug}"
category: "${post.category}"
author: "${post.author}"
publishedAt: "${post.publishedAt}"
summary: "${post.summary}"
readTime: ${post.readTime}
image: "${post.image}"
${post.featured ? 'featured: true' : ''}
draft: false
tags: ["${post.category}", "landscaping", "business"]
seo:
  description: "${post.summary}"
  keywords: ["${post.category}", "landscaping", "business", "quoting"]
imageAlt: "${post.category.charAt(0).toUpperCase() + post.category.slice(1)} guide illustration"
---`;
}

// Create MDX file
function createMDXFile(post: any, index: number): void {
  const { filename, year } = generateFilename(post, index);
  const yearDir = path.join(process.cwd(), 'content', 'posts', year);
  
  // Create year directory if it doesn't exist
  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
  }
  
  const filepath = path.join(yearDir, filename);
  const frontmatter = generateFrontmatter(post);
  const content = generateSampleContent(post);
  
  const mdxContent = `${frontmatter}

${content}`;
  
  fs.writeFileSync(filepath, mdxContent, 'utf8');
  console.log(`✅ Created: ${path.relative(process.cwd(), filepath)}`);
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting blog post migration...\n');
  
  try {
    // Extract existing blog posts
    const blogPosts = extractBlogPosts();
    console.log(`📚 Found ${blogPosts.length} blog posts to migrate\n`);
    
    // Create backup of original file
    const backupPath = `${blogPostsPath}.backup`;
    fs.copyFileSync(blogPostsPath, backupPath);
    console.log(`💾 Created backup: ${path.relative(process.cwd(), backupPath)}\n`);
    
    // Migrate each post
    blogPosts.forEach((post: any, index: number) => {
      createMDXFile(post, index);
    });
    
    console.log(`\n✨ Migration completed successfully!`);
    console.log(`📁 ${blogPosts.length} MDX files created in content/posts/`);
    console.log(`💾 Original file backed up to: ${path.relative(process.cwd(), backupPath)}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated MDX files`);
    console.log(`2. Update the blog routing to use MDX`);
    console.log(`3. Test the blog functionality`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

export { migrate };