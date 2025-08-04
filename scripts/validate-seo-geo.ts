#!/usr/bin/env npx tsx

/**
 * SEO/GEO Validation Script
 * 
 * Validates blog posts against advanced SEO and GEO requirements
 * identified in the SEO/GEO requirements document.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

// Enhanced validation schema for SEO/GEO requirements
const SEOGEOSchema = z.object({
  // Required basic fields
  title: z.string().min(10, "Title must be at least 10 characters").max(60, "Title should be under 60 characters for SEO"),
  slug: z.string().max(50, "Slug must be under 50 characters"),
  category: z.enum(['pricing', 'operations', 'tools']),
  author: z.string().min(1, "Author is required"),
  publishedAt: z.string().min(1, "Published date is required"),
  summary: z.string().min(50, "Summary must be at least 50 characters").max(160, "Summary should be under 160 characters for SEO"),
  readTime: z.number().min(1, "Read time must be at least 1 minute"),
  image: z.string().url("Image must be a valid URL"),
  
  // SEO/GEO specific requirements
  seo: z.object({
    metaDescription: z.string().min(120, "Meta description should be at least 120 characters").max(160, "Meta description should be under 160 characters").optional(),
    keywords: z.array(z.string()).min(3, "Need at least 3 SEO keywords").max(10, "Too many keywords (max 10)").optional(),
    canonicalUrl: z.string().url("Canonical URL must be valid").optional()
  }).optional(),
  
  // Content structure for GEO optimization
  contentStructure: z.object({
    keyTakeaways: z.array(z.string().min(10, "Key takeaways must be substantial")).min(3, "Need at least 3 key takeaways for GEO").max(7, "Too many key takeaways (max 7)").optional(),
    faqs: z.array(z.object({
      question: z.string().min(10, "FAQ questions must be substantial"),
      answer: z.string().min(50, "FAQ answers must be at least 50 characters for rich snippets")
    })).min(2, "Need at least 2 FAQs for GEO optimization").optional(),
    materialCostTable: z.array(z.object({
      item: z.string().min(1, "Item name required"),
      quantity: z.string().min(1, "Quantity required"),
      unitCost: z.string().min(1, "Unit cost required"),
      totalCost: z.string().min(1, "Total cost required"),
      notes: z.string().optional()
    })).optional()
  }).optional(),
  
  // Schema markup data
  schema: z.object({
    author: z.object({
      name: z.string().min(1, "Author name required for schema"),
      url: z.string().url("Author URL must be valid").optional(),
      avatar: z.string().url("Author avatar must be valid URL").optional()
    }),
    publisher: z.object({
      name: z.string().min(1, "Publisher name required"),
      logo: z.string().url("Publisher logo must be valid URL"),
      url: z.string().url("Publisher URL must be valid").optional()
    })
  }).optional(),
  
  // Optional fields
  featured: z.boolean().optional(),
  draft: z.boolean().optional(),
  tags: z.array(z.string()).min(2, "Need at least 2 tags").max(8, "Too many tags (max 8)").optional(),
  imageAlt: z.string().min(10, "Image alt text must be descriptive").optional()
});

interface ValidationResult {
  file: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  seoScore: number;
  geoScore: number;
}

interface ValidationSummary {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  averageSEOScore: number;
  averageGEOScore: number;
  results: ValidationResult[];
}

function validateContent(content: string): { hasHeadings: boolean; headingCount: number; wordCount: number } {
  const lines = content.split('\n');
  let headingCount = 0;
  let hasHeadings = false;
  
  for (const line of lines) {
    if (line.trim().match(/^#{2,3}\s+/)) {
      headingCount++;
      hasHeadings = true;
    }
  }
  
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  
  return { hasHeadings, headingCount, wordCount };
}

function calculateSEOScore(frontmatter: any, contentAnalysis: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Title optimization (20 points)
  if (frontmatter.title && frontmatter.title.length >= 30 && frontmatter.title.length <= 60) {
    score += 20;
  } else if (frontmatter.title && frontmatter.title.length >= 10) {
    score += 10;
  }
  
  // Meta description (20 points)
  if (frontmatter.seo?.metaDescription && frontmatter.seo.metaDescription.length >= 120 && frontmatter.seo.metaDescription.length <= 160) {
    score += 20;
  } else if (frontmatter.summary && frontmatter.summary.length >= 50) {
    score += 10;
  }
  
  // Keywords (15 points)
  if (frontmatter.seo?.keywords && frontmatter.seo.keywords.length >= 3) {
    score += 15;
  } else if (frontmatter.tags && frontmatter.tags.length >= 2) {
    score += 8;
  }
  
  // Content structure (15 points)
  if (contentAnalysis.hasHeadings && contentAnalysis.headingCount >= 3) {
    score += 15;
  } else if (contentAnalysis.hasHeadings) {
    score += 8;
  }
  
  // Content length (10 points)
  if (contentAnalysis.wordCount >= 800) {
    score += 10;
  } else if (contentAnalysis.wordCount >= 500) {
    score += 5;
  }
  
  // Image optimization (10 points)
  if (frontmatter.image && frontmatter.imageAlt) {
    score += 10;
  } else if (frontmatter.image) {
    score += 5;
  }
  
  // Schema markup (10 points)
  if (frontmatter.schema?.author && frontmatter.schema?.publisher) {
    score += 10;
  }
  
  return Math.min(score, maxScore);
}

function calculateGEOScore(frontmatter: any, contentAnalysis: any): number {
  let score = 0;
  const maxScore = 100;
  
  // Key takeaways (30 points)
  if (frontmatter.contentStructure?.keyTakeaways && frontmatter.contentStructure.keyTakeaways.length >= 3) {
    score += 30;
  }
  
  // FAQ section (30 points)
  if (frontmatter.contentStructure?.faqs && frontmatter.contentStructure.faqs.length >= 2) {
    score += 30;
  }
  
  // Structured content (20 points)
  if (contentAnalysis.hasHeadings && contentAnalysis.headingCount >= 4) {
    score += 20;
  } else if (contentAnalysis.hasHeadings) {
    score += 10;
  }
  
  // Answer-focused content (10 points)
  if (frontmatter.contentStructure?.faqs && frontmatter.contentStructure.faqs.some((faq: any) => faq.answer.length >= 100)) {
    score += 10;
  }
  
  // Professional data presentation (10 points)
  if (frontmatter.contentStructure?.materialCostTable && frontmatter.contentStructure.materialCostTable.length >= 3) {
    score += 10;
  }
  
  return Math.min(score, maxScore);
}

function validateBlogPost(filepath: string): ValidationResult {
  const content = readFileSync(filepath, 'utf-8');
  const { data: frontmatter, content: mdxContent } = matter(content);
  
  const result: ValidationResult = {
    file: filepath,
    isValid: true,
    errors: [],
    warnings: [],
    seoScore: 0,
    geoScore: 0
  };
  
  // Validate against schema
  try {
    SEOGEOSchema.parse(frontmatter);
  } catch (error) {
    result.isValid = false;
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
  }
  
  // Content analysis
  const contentAnalysis = validateContent(mdxContent);
  
  // Calculate scores
  result.seoScore = calculateSEOScore(frontmatter, contentAnalysis);
  result.geoScore = calculateGEOScore(frontmatter, contentAnalysis);
  
  // Add warnings for optimization opportunities
  if (result.seoScore < 80) {
    result.warnings.push(`SEO score is ${result.seoScore}/100. Consider optimizing title, meta description, and content structure.`);
  }
  
  if (result.geoScore < 60) {
    result.warnings.push(`GEO score is ${result.geoScore}/100. Add key takeaways and FAQ sections for better AI optimization.`);
  }
  
  if (!frontmatter.contentStructure?.keyTakeaways) {
    result.warnings.push("Missing key takeaways section - important for GEO optimization");
  }
  
  if (!frontmatter.contentStructure?.faqs) {
    result.warnings.push("Missing FAQ section - important for rich snippets and GEO");
  }
  
  if (!frontmatter.seo?.metaDescription) {
    result.warnings.push("Missing custom meta description - using summary as fallback");
  }
  
  if (contentAnalysis.wordCount < 500) {
    result.warnings.push(`Content is only ${contentAnalysis.wordCount} words - consider expanding for better SEO`);
  }
  
  return result;
}

function main() {
  console.log('🔍 SEO/GEO Validation Starting...\n');
  
  const contentDir = join(process.cwd(), 'content', 'posts');
  const files = readdirSync(contentDir).filter(file => file.endsWith('.mdx'));
  
  const results: ValidationResult[] = [];
  
  for (const file of files) {
    const filepath = join(contentDir, file);
    const result = validateBlogPost(filepath);
    results.push(result);
    
    // Print individual results
    const status = result.isValid ? '✅' : '❌';
    const seoIndicator = result.seoScore >= 80 ? '🟢' : result.seoScore >= 60 ? '🟡' : '🔴';
    const geoIndicator = result.geoScore >= 60 ? '🟢' : result.geoScore >= 40 ? '🟡' : '🔴';
    
    console.log(`${status} ${file}`);
    console.log(`   SEO Score: ${seoIndicator} ${result.seoScore}/100`);
    console.log(`   GEO Score: ${geoIndicator} ${result.geoScore}/100`);
    
    if (result.errors.length > 0) {
      console.log('   ❌ Errors:');
      result.errors.forEach(error => console.log(`      • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`      • ${warning}`));
    }
    
    console.log('');
  }
  
  // Summary
  const summary: ValidationSummary = {
    totalFiles: results.length,
    validFiles: results.filter(r => r.isValid).length,
    invalidFiles: results.filter(r => !r.isValid).length,
    averageSEOScore: Math.round(results.reduce((sum, r) => sum + r.seoScore, 0) / results.length),
    averageGEOScore: Math.round(results.reduce((sum, r) => sum + r.geoScore, 0) / results.length),
    results
  };
  
  console.log('📊 SEO/GEO Validation Summary');
  console.log('═'.repeat(50));
  console.log(`Total Files: ${summary.totalFiles}`);
  console.log(`Valid Files: ${summary.validFiles}`);
  console.log(`Invalid Files: ${summary.invalidFiles}`);
  console.log(`Average SEO Score: ${summary.averageSEOScore}/100`);
  console.log(`Average GEO Score: ${summary.averageGEOScore}/100`);
  
  if (summary.invalidFiles > 0) {
    console.log('\n❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All files passed validation!');
    
    if (summary.averageSEOScore < 80 || summary.averageGEOScore < 60) {
      console.log('⚠️  Consider addressing the warnings above to improve SEO/GEO scores.');
    }
  }
}

if (require.main === module) {
  main();
}
