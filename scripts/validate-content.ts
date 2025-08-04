#!/usr/bin/env tsx

/**
 * Content Validation Script for MDX Blog System
 * 
 * This script validates all blog content to ensure data integrity,
 * proper formatting, and compliance with Sprint 1 requirements.
 * 
 * Validation includes:
 * - Frontmatter schema validation
 * - Duplicate slug detection
 * - Required field validation
 * - Date format validation
 * - Category validation
 * - Image reference validation
 * - Content length validation
 * - SEO metadata validation
 * 
 * Usage:
 *   npm run blog:validate
 *   tsx scripts/validate-content.ts
 * 
 * Options:
 *   --fix         Attempt to auto-fix common issues
 *   --verbose     Show detailed validation output
 *   --output      Save validation report to file
 *   --strict      Fail on warnings (not just errors)
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getAllPosts } from '../src/lib/blog/content';
import { BlogPostFrontmatterSchema } from '../src/lib/blog/validation';

interface ValidationOptions {
  fix: boolean;
  verbose: boolean;
  output: boolean;
  strict: boolean;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  file: string;
  field?: string;
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  file: string;
  valid: boolean;
  issues: ValidationIssue[];
  post?: any;
}

interface ValidationSummary {
  timestamp: string;
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  results: ValidationResult[];
  duplicateSlugs: string[];
}

const VALIDATION_DIR = path.join(process.cwd(), '.validation-reports');
const CONTENT_DIR = path.join(process.cwd(), 'content/posts');

function parseArgs(): ValidationOptions {
  const args = process.argv.slice(2);
  return {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
    output: args.includes('--output'),
    strict: args.includes('--strict'),
  };
}

function ensureValidationDir() {
  if (!fs.existsSync(VALIDATION_DIR)) {
    fs.mkdirSync(VALIDATION_DIR, { recursive: true });
  }
}

async function getAllMDXFiles(): Promise<string[]> {
  const files: string[] = [];
  
  if (!fs.existsSync(CONTENT_DIR)) {
    return files;
  }

  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    });
  }

  scanDirectory(CONTENT_DIR);
  return files;
}

function validateFrontmatter(frontmatter: any, filepath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    // Use Zod schema for validation
    BlogPostFrontmatterSchema.parse(frontmatter);
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        issues.push({
          type: 'error',
          file: filepath,
          field: err.path.join('.'),
          message: `${err.path.join('.')}: ${err.message}`,
          suggestion: getFieldSuggestion(err.path[0], err.code),
        });
      });
    } else {
      issues.push({
        type: 'error',
        file: filepath,
        message: `Frontmatter validation failed: ${error.message}`,
      });
    }
  }

  return issues;
}

function getFieldSuggestion(field: string, code: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    slug: {
      invalid_string: 'Slug must be lowercase with hyphens only (e.g., "how-to-price-patio")',
    },
    category: {
      invalid_enum_value: 'Category must be one of: "pricing", "operations", "tools"',
    },
    publishedAt: {
      invalid_string: 'Date must be in ISO format (YYYY-MM-DD)',
    },
    summary: {
      too_small: 'Summary must be at least 10 characters long',
    },
    readTime: {
      invalid_type: 'Read time must be a positive number',
    },
    image: {
      invalid_string: 'Image must be a valid URL',
    },
  };

  return suggestions[field]?.[code] || 'Please check the field format';
}

function validateContent(content: string, filepath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check content length
  const trimmedContent = content.trim();
  if (trimmedContent.length < 100) {
    issues.push({
      type: 'warning',
      file: filepath,
      message: `Content is very short (${trimmedContent.length} characters). Consider adding more content.`,
      suggestion: 'Aim for at least 300-500 words for better SEO and user value',
    });
  }

  // Check for common MDX issues
  if (content.includes('```') && !content.includes('```\n')) {
    issues.push({
      type: 'warning',
      file: filepath,
      message: 'Code blocks should end with a newline after ```',
      suggestion: 'Add a newline after closing ```',
    });
  }

  // Check for HTML tags that should be JSX
  const htmlTags = content.match(/<(\w+)[^>]*>/g);
  if (htmlTags) {
    htmlTags.forEach(tag => {
      if (tag.includes('class=')) {
        issues.push({
          type: 'warning',
          file: filepath,
          message: `HTML tag with 'class' attribute found: ${tag}`,
          suggestion: 'Use className instead of class in JSX',
        });
      }
    });
  }

  // Check for broken internal links
  const internalLinks = content.match(/\[([^\]]+)\]\(\/[^)]+\)/g);
  if (internalLinks) {
    internalLinks.forEach(link => {
      const url = link.match(/\(([^)]+)\)/)?.[1];
      if (url && !url.startsWith('/blog/') && !url.startsWith('/contact') && !url.startsWith('/about')) {
        issues.push({
          type: 'info',
          file: filepath,
          message: `Internal link may be broken: ${url}`,
          suggestion: 'Verify that the linked page exists',
        });
      }
    });
  }

  return issues;
}

function validateImageReferences(frontmatter: any, content: string, filepath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check frontmatter image
  if (frontmatter.image) {
    if (!frontmatter.image.startsWith('http') && !frontmatter.image.startsWith('/')) {
      issues.push({
        type: 'warning',
        file: filepath,
        field: 'image',
        message: 'Image URL should be absolute (start with http or /)',
        suggestion: 'Use full URLs or absolute paths for images',
      });
    }

    // Check for missing alt text
    if (!frontmatter.imageAlt) {
      issues.push({
        type: 'warning',
        file: filepath,
        field: 'imageAlt',
        message: 'Missing alt text for featured image',
        suggestion: 'Add imageAlt field for accessibility',
      });
    }
  }

  // Check content images
  const imageRefs = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
  if (imageRefs) {
    imageRefs.forEach(imageRef => {
      const altMatch = imageRef.match(/!\[([^\]]*)\]/);
      const srcMatch = imageRef.match(/\(([^)]+)\)/);
      
      const alt = altMatch?.[1] || '';
      const src = srcMatch?.[1] || '';

      if (!alt.trim()) {
        issues.push({
          type: 'warning',
          file: filepath,
          message: `Image missing alt text: ${src}`,
          suggestion: 'Add descriptive alt text for accessibility',
        });
      }

      if (!src.startsWith('http') && !src.startsWith('/')) {
        issues.push({
          type: 'warning',
          file: filepath,
          message: `Relative image path may not work: ${src}`,
          suggestion: 'Use absolute paths or full URLs for images',
        });
      }
    });
  }

  return issues;
}

function validateSEOFields(frontmatter: any, filepath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Title length check
  if (frontmatter.title && frontmatter.title.length > 60) {
    issues.push({
      type: 'warning',
      file: filepath,
      field: 'title',
      message: `Title too long for SEO (${frontmatter.title.length} chars, recommended < 60)`,
      suggestion: 'Shorten title for better search engine display',
    });
  }

  // Summary/description length check
  if (frontmatter.summary) {
    if (frontmatter.summary.length > 160) {
      issues.push({
        type: 'warning',
        file: filepath,
        field: 'summary',
        message: `Summary too long for meta description (${frontmatter.summary.length} chars, recommended < 160)`,
        suggestion: 'Shorten summary for better search engine display',
      });
    } else if (frontmatter.summary.length < 120) {
      issues.push({
        type: 'info',
        file: filepath,
        field: 'summary',
        message: `Summary could be longer for SEO (${frontmatter.summary.length} chars, recommended 120-160)`,
        suggestion: 'Expand summary to use more of the meta description space',
      });
    }
  }

  // SEO field validation
  if (frontmatter.seo) {
    if (frontmatter.seo.description && frontmatter.seo.description.length > 160) {
      issues.push({
        type: 'warning',
        file: filepath,
        field: 'seo.description',
        message: `SEO description too long (${frontmatter.seo.description.length} chars, recommended < 160)`,
        suggestion: 'Shorten SEO description for better search display',
      });
    }

    if (frontmatter.seo.keywords && frontmatter.seo.keywords.length > 10) {
      issues.push({
        type: 'info',
        file: filepath,
        field: 'seo.keywords',
        message: `Many SEO keywords (${frontmatter.seo.keywords.length}), consider focusing on top 5-7`,
        suggestion: 'Focus on the most relevant keywords',
      });
    }
  }

  return issues;
}

async function validateSingleFile(filepath: string, options: ValidationOptions): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  let post: any = null;

  try {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);
    post = { frontmatter, content, filepath };

    // Validate frontmatter schema
    issues.push(...validateFrontmatter(frontmatter, filepath));

    // Validate content
    issues.push(...validateContent(content, filepath));

    // Validate image references
    issues.push(...validateImageReferences(frontmatter, content, filepath));

    // Validate SEO fields
    issues.push(...validateSEOFields(frontmatter, filepath));

    // File-specific validations
    const filename = path.basename(filepath);
    const expectedSlug = filename.replace(/^\d{2}-/, '').replace('.mdx', '');
    
    if (frontmatter.slug && frontmatter.slug !== expectedSlug) {
      issues.push({
        type: 'warning',
        file: filepath,
        field: 'slug',
        message: `Slug "${frontmatter.slug}" doesn't match filename "${expectedSlug}"`,
        suggestion: 'Ensure slug matches filename for consistency',
      });
    }

  } catch (error) {
    issues.push({
      type: 'error',
      file: filepath,
      message: `Failed to parse file: ${error}`,
    });
  }

  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');
  const valid = !hasErrors && (!options.strict || !hasWarnings);

  if (options.verbose) {
    const status = valid ? '✅' : '❌';
    const relativePath = path.relative(process.cwd(), filepath);
    console.log(`${status} ${relativePath}`);
    
    issues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} ${issue.message}`);
      if (issue.suggestion) {
        console.log(`      💡 ${issue.suggestion}`);
      }
    });
    
    if (issues.length === 0) {
      console.log('   ✨ No issues found');
    }
    console.log();
  }

  return {
    file: filepath,
    valid,
    issues,
    post,
  };
}

function detectDuplicateSlugs(results: ValidationResult[]): string[] {
  const slugCounts: Record<string, string[]> = {};
  const duplicates: string[] = [];

  results.forEach(result => {
    if (result.post?.frontmatter?.slug) {
      const slug = result.post.frontmatter.slug;
      if (!slugCounts[slug]) {
        slugCounts[slug] = [];
      }
      slugCounts[slug].push(result.file);
    }
  });

  Object.entries(slugCounts).forEach(([slug, files]) => {
    if (files.length > 1) {
      duplicates.push(slug);
      files.forEach(file => {
        const result = results.find(r => r.file === file);
        if (result) {
          result.issues.push({
            type: 'error',
            file,
            field: 'slug',
            message: `Duplicate slug "${slug}" found in multiple files`,
            suggestion: 'Each post must have a unique slug',
          });
          result.valid = false;
        }
      });
    }
  });

  return duplicates;
}

async function runValidation(options: ValidationOptions): Promise<ValidationSummary> {
  console.log('🔍 Running content validation...\n');

  const files = await getAllMDXFiles();
  
  if (files.length === 0) {
    console.log('⚠️  No MDX files found in content/posts/ directory');
    return {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      results: [],
      duplicateSlugs: [],
    };
  }

  console.log(`📊 Validating ${files.length} MDX files...\n`);

  const results: ValidationResult[] = [];

  for (const file of files) {
    const result = await validateSingleFile(file, options);
    results.push(result);
  }

  // Check for duplicate slugs
  const duplicateSlugs = detectDuplicateSlugs(results);

  // Calculate summary statistics
  const validFiles = results.filter(r => r.valid).length;
  const invalidFiles = results.length - validFiles;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const errors = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0);
  const warnings = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0);

  return {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    validFiles,
    invalidFiles,
    totalIssues,
    errors,
    warnings,
    results,
    duplicateSlugs,
  };
}

function printValidationSummary(summary: ValidationSummary, options: ValidationOptions) {
  console.log('📊 Validation Summary');
  console.log('====================\n');
  
  console.log(`📈 Overall Results:`);
  console.log(`   Total Files: ${summary.totalFiles}`);
  console.log(`   Valid Files: ${summary.validFiles} ✅`);
  console.log(`   Invalid Files: ${summary.invalidFiles} ❌`);
  console.log(`   Success Rate: ${((summary.validFiles / summary.totalFiles) * 100).toFixed(1)}%\n`);

  console.log(`🔍 Issue Breakdown:`);
  console.log(`   Errors: ${summary.errors} ❌`);
  console.log(`   Warnings: ${summary.warnings} ⚠️`);
  console.log(`   Total Issues: ${summary.totalIssues}\n`);

  if (summary.duplicateSlugs.length > 0) {
    console.log(`🔄 Duplicate Slugs Found:`);
    summary.duplicateSlugs.forEach(slug => {
      console.log(`   - "${slug}"`);
    });
    console.log();
  }

  // Sprint 1 specific validation
  console.log(`🎯 Sprint 1 Content Requirements:`);
  
  const hasRequiredFields = summary.results.every(result => 
    result.post?.frontmatter?.title &&
    result.post?.frontmatter?.slug &&
    result.post?.frontmatter?.category &&
    result.post?.frontmatter?.summary
  );
  
  const validCategories = summary.results.filter(result => 
    ['pricing', 'operations', 'tools'].includes(result.post?.frontmatter?.category)
  ).length;
  
  console.log(`   ✅ All required fields present: ${hasRequiredFields ? 'YES' : 'NO'}`);
  console.log(`   ✅ Valid categories: ${validCategories}/${summary.totalFiles}`);
  console.log(`   ✅ No duplicate slugs: ${summary.duplicateSlugs.length === 0 ? 'YES' : 'NO'}`);
  console.log(`   ✅ Schema validation: ${summary.errors === 0 ? 'PASSED' : 'FAILED'}\n`);

  const sprintRequirementsMet = hasRequiredFields && validCategories === summary.totalFiles && 
                               summary.duplicateSlugs.length === 0 && summary.errors === 0;
  
  if (sprintRequirementsMet) {
    console.log('🎉 All Sprint 1 content requirements met!');
  } else {
    console.log('⚠️  Some Sprint 1 content requirements not met. Review issues above.');
  }

  if (options.strict && summary.warnings > 0) {
    console.log('\n⚠️  Strict mode enabled: Warnings treated as failures.');
  }
}

function saveValidationReport(summary: ValidationSummary) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `validation-report-${timestamp}.json`;
  const filepath = path.join(VALIDATION_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
  console.log(`💾 Validation report saved to: ${filepath}`);
}

async function main() {
  const options = parseArgs();
  
  console.log('🌿 LawnQuote Content Validation Tool');
  console.log('====================================\n');
  
  ensureValidationDir();

  const summary = await runValidation(options);
  
  if (!options.verbose) {
    printValidationSummary(summary, options);
  } else {
    console.log('\n' + '='.repeat(50));
    printValidationSummary(summary, options);
  }

  if (options.output) {
    saveValidationReport(summary);
  }

  // Exit with error code if validation failed
  const failed = summary.invalidFiles > 0 || (options.strict && summary.warnings > 0);
  if (failed) {
    console.log('\n❌ Validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ Content validation passed!');
  }
}

// Run validation if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runValidation, validateSingleFile, detectDuplicateSlugs };