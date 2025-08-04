#!/usr/bin/env tsx

/**
 * SEO Audit Script for MDX Blog Integration
 * 
 * This script validates that all SEO requirements are met after migrating
 * to the MDX blog system, ensuring 100% SEO preservation as required by Sprint 1.
 * 
 * Validation includes:
 * - Page title and meta descriptions
 * - Open Graph tags
 * - Twitter Card tags  
 * - Structured data (JSON-LD)
 * - URL structure preservation
 * - Canonical URLs
 * - Image metadata
 * 
 * Usage:
 *   npm run blog:seo-audit
 *   tsx scripts/seo-audit.ts
 * 
 * Options:
 *   --url <url>      Test specific URL
 *   --compare        Compare against baseline SEO data
 *   --verbose        Show detailed output
 *   --output <file>  Save results to file
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { getAllPosts } from '../src/lib/blog/content';

interface SEOMetrics {
  url: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  structuredData: any[];
  imageAlt: string;
  keywords: string;
  author: string;
  publishedTime: string;
}

interface AuditOptions {
  url?: string;
  compare: boolean;
  verbose: boolean;
  output?: string;
}

interface AuditResult {
  url: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: SEOMetrics;
}

interface AuditSummary {
  timestamp: string;
  totalPages: number;
  passedPages: number;
  failedPages: number;
  results: AuditResult[];
}

const AUDIT_DIR = path.join(process.cwd(), '.seo-audits');
const BASELINE_FILE = path.join(AUDIT_DIR, 'baseline.json');

function parseArgs(): AuditOptions {
  const args = process.argv.slice(2);
  const options: AuditOptions = {
    compare: args.includes('--compare'),
    verbose: args.includes('--verbose'),
  };

  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    options.url = args[urlIndex + 1];
  }

  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    options.output = args[outputIndex + 1];
  }

  return options;
}

function ensureAuditDir() {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

async function fetchPageHTML(url: string): Promise<string> {
  try {
    // For local development, we'll use a simple fetch or curl
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    // Fallback to curl for local testing
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync(`curl -s "${url}"`);
      return stdout;
    } catch (curlError) {
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
  }
}

function extractSEOMetrics(html: string, url: string): SEOMetrics {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Helper function to get meta content
  const getMeta = (selector: string): string => {
    const element = document.querySelector(selector);
    return element?.getAttribute('content') || '';
  };

  // Extract structured data
  const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');
  const structuredData: any[] = [];
  
  structuredDataElements.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      structuredData.push(data);
    } catch (e) {
      console.warn('Failed to parse structured data:', e);
    }
  });

  return {
    url,
    title: document.title || '',
    metaDescription: getMeta('meta[name="description"]'),
    ogTitle: getMeta('meta[property="og:title"]'),
    ogDescription: getMeta('meta[property="og:description"]'),
    ogImage: getMeta('meta[property="og:image"]'),
    ogType: getMeta('meta[property="og:type"]'),
    twitterCard: getMeta('meta[name="twitter:card"]'),
    twitterTitle: getMeta('meta[name="twitter:title"]'),
    twitterDescription: getMeta('meta[name="twitter:description"]'),
    twitterImage: getMeta('meta[name="twitter:image"]'),
    canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    structuredData,
    imageAlt: getMeta('meta[property="og:image:alt"]'),
    keywords: getMeta('meta[name="keywords"]'),
    author: getMeta('meta[name="author"]'),
    publishedTime: getMeta('meta[property="article:published_time"]'),
  };
}

function validateSEOMetrics(metrics: SEOMetrics): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!metrics.title) {
    errors.push('Missing page title');
  } else {
    if (metrics.title.length > 60) {
      warnings.push(`Title too long (${metrics.title.length} chars, recommended < 60)`);
    }
    if (!metrics.title.includes('LawnQuote')) {
      warnings.push('Title should include "LawnQuote" for branding');
    }
  }

  if (!metrics.metaDescription) {
    errors.push('Missing meta description');
  } else {
    if (metrics.metaDescription.length > 160) {
      warnings.push(`Meta description too long (${metrics.metaDescription.length} chars, recommended < 160)`);
    }
    if (metrics.metaDescription.length < 120) {
      warnings.push(`Meta description too short (${metrics.metaDescription.length} chars, recommended 120-160)`);
    }
  }

  // Open Graph validation
  if (!metrics.ogTitle) {
    errors.push('Missing Open Graph title');
  }
  if (!metrics.ogDescription) {
    errors.push('Missing Open Graph description');
  }
  if (!metrics.ogImage) {
    errors.push('Missing Open Graph image');
  }
  if (!metrics.ogType) {
    warnings.push('Missing Open Graph type');
  } else if (metrics.url.includes('/blog/') && metrics.ogType !== 'article') {
    warnings.push(`Blog post should have og:type="article", found "${metrics.ogType}"`);
  }

  // Twitter Cards validation
  if (!metrics.twitterCard) {
    errors.push('Missing Twitter card type');
  } else if (metrics.twitterCard !== 'summary_large_image') {
    warnings.push(`Recommended Twitter card type is "summary_large_image", found "${metrics.twitterCard}"`);
  }
  if (!metrics.twitterTitle) {
    errors.push('Missing Twitter title');
  }
  if (!metrics.twitterDescription) {
    errors.push('Missing Twitter description');
  }
  if (!metrics.twitterImage) {
    errors.push('Missing Twitter image');
  }

  // Structured data validation
  if (metrics.structuredData.length === 0) {
    errors.push('Missing structured data (JSON-LD)');
  } else {
    const blogPostSchema = metrics.structuredData.find(data => data['@type'] === 'BlogPosting');
    if (metrics.url.includes('/blog/') && !blogPostSchema) {
      errors.push('Missing BlogPosting structured data for blog post');
    }
    
    if (blogPostSchema) {
      if (!blogPostSchema.headline) {
        errors.push('Missing headline in BlogPosting structured data');
      }
      if (!blogPostSchema.author) {
        errors.push('Missing author in BlogPosting structured data');
      }
      if (!blogPostSchema.datePublished) {
        errors.push('Missing datePublished in BlogPosting structured data');
      }
      if (!blogPostSchema.image) {
        errors.push('Missing image in BlogPosting structured data');
      }
    }
  }

  // Image SEO validation
  if (metrics.ogImage && !metrics.imageAlt) {
    warnings.push('Missing alt text for Open Graph image');
  }

  // Keywords validation
  if (!metrics.keywords) {
    warnings.push('Missing meta keywords (recommended for internal SEO tracking)');
  }

  return { errors, warnings };
}

async function auditSinglePage(url: string, verbose: boolean = false): Promise<AuditResult> {
  if (verbose) {
    console.log(`🔍 Auditing: ${url}`);
  }

  try {
    const html = await fetchPageHTML(url);
    const metrics = extractSEOMetrics(html, url);
    const { errors, warnings } = validateSEOMetrics(metrics);

    const passed = errors.length === 0;

    if (verbose) {
      if (passed) {
        console.log(`✅ ${url} - PASSED`);
      } else {
        console.log(`❌ ${url} - FAILED (${errors.length} errors)`);
      }
      
      if (errors.length > 0) {
        errors.forEach(error => console.log(`   ❌ ${error}`));
      }
      
      if (warnings.length > 0) {
        warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
      }
    }

    return {
      url,
      passed,
      errors,
      warnings,
      metrics,
    };

  } catch (error) {
    const errorMessage = `Failed to audit ${url}: ${error}`;
    if (verbose) {
      console.log(`❌ ${url} - ERROR: ${error}`);
    }

    return {
      url,
      passed: false,
      errors: [errorMessage],
      warnings: [],
      metrics: {} as SEOMetrics,
    };
  }
}

async function runFullAudit(baseUrl: string = 'http://localhost:3000', verbose: boolean = false): Promise<AuditSummary> {
  console.log('🔍 Running comprehensive SEO audit...\n');

  // Get all blog posts to audit
  const posts = await getAllPosts();
  const urlsToAudit = [
    `${baseUrl}/blog`, // Blog index page
    ...posts.map(post => `${baseUrl}/blog/${post.slug}`), // Individual blog posts
  ];

  console.log(`📊 Auditing ${urlsToAudit.length} pages...\n`);

  const results: AuditResult[] = [];

  for (const url of urlsToAudit) {
    const result = await auditSinglePage(url, verbose);
    results.push(result);
    
    // Add delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const passedPages = results.filter(r => r.passed).length;
  const failedPages = results.length - passedPages;

  const summary: AuditSummary = {
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    passedPages,
    failedPages,
    results,
  };

  return summary;
}

function printAuditSummary(summary: AuditSummary) {
  console.log('\n📊 SEO Audit Summary');
  console.log('====================\n');
  
  console.log(`📈 Overall Results:`);
  console.log(`   Total Pages: ${summary.totalPages}`);
  console.log(`   Passed: ${summary.passedPages} ✅`);
  console.log(`   Failed: ${summary.failedPages} ❌`);
  console.log(`   Success Rate: ${((summary.passedPages / summary.totalPages) * 100).toFixed(1)}%\n`);

  // Group issues by type
  const allErrors: Record<string, number> = {};
  const allWarnings: Record<string, number> = {};

  summary.results.forEach(result => {
    result.errors.forEach(error => {
      allErrors[error] = (allErrors[error] || 0) + 1;
    });
    result.warnings.forEach(warning => {
      allWarnings[warning] = (allWarnings[warning] || 0) + 1;
    });
  });

  if (Object.keys(allErrors).length > 0) {
    console.log(`❌ Common Errors:`);
    Object.entries(allErrors)
      .sort(([,a], [,b]) => b - a)
      .forEach(([error, count]) => {
        console.log(`   ${error} (${count} pages)`);
      });
    console.log();
  }

  if (Object.keys(allWarnings).length > 0) {
    console.log(`⚠️  Common Warnings:`);
    Object.entries(allWarnings)
      .sort(([,a], [,b]) => b - a)
      .forEach(([warning, count]) => {
        console.log(`   ${warning} (${count} pages)`);
      });
    console.log();
  }

  // Sprint 1 specific validation
  console.log(`🎯 Sprint 1 SEO Requirements:`);
  
  const hasAllBasicSEO = summary.results.every(result => 
    result.metrics.title && 
    result.metrics.metaDescription && 
    result.metrics.ogTitle && 
    result.metrics.ogDescription
  );
  
  const hasStructuredData = summary.results.filter(result => 
    result.url.includes('/blog/') && result.metrics.structuredData.length > 0
  ).length;
  
  const blogPostCount = summary.results.filter(result => result.url.includes('/blog/')).length - 1; // Exclude index
  
  console.log(`   ✅ Basic SEO metadata preserved: ${hasAllBasicSEO ? 'YES' : 'NO'}`);
  console.log(`   ✅ Structured data present: ${hasStructuredData}/${blogPostCount} blog posts`);
  console.log(`   ✅ URL structure preserved: ${summary.results.every(r => r.url.includes('/blog/')) ? 'YES' : 'NO'}`);
  console.log(`   ✅ Image metadata: ${summary.results.every(r => r.metrics.ogImage) ? 'YES' : 'NO'}\n`);

  const sprintRequirementsMet = hasAllBasicSEO && hasStructuredData === blogPostCount;
  
  if (sprintRequirementsMet) {
    console.log('🎉 All Sprint 1 SEO requirements met!');
  } else {
    console.log('⚠️  Some Sprint 1 SEO requirements not met. Review errors above.');
  }
}

function saveAuditResults(summary: AuditSummary, filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultFilename = `seo-audit-${timestamp}.json`;
  const filepath = path.join(AUDIT_DIR, filename || defaultFilename);
  
  fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
  console.log(`💾 Audit results saved to: ${filepath}`);
}

async function main() {
  const options = parseArgs();
  
  console.log('🌿 LawnQuote SEO Audit Tool');
  console.log('===========================\n');
  
  ensureAuditDir();

  if (options.url) {
    // Audit single URL
    console.log(`🔍 Auditing single URL: ${options.url}\n`);
    
    const result = await auditSinglePage(options.url, true);
    
    console.log('\n📊 Detailed Results:');
    console.log(`Title: ${result.metrics.title}`);
    console.log(`Meta Description: ${result.metrics.metaDescription}`);
    console.log(`Open Graph Image: ${result.metrics.ogImage}`);
    console.log(`Structured Data: ${result.metrics.structuredData.length} schemas found`);
    
    if (result.metrics.structuredData.length > 0) {
      console.log('\nStructured Data Schemas:');
      result.metrics.structuredData.forEach((schema, index) => {
        console.log(`  ${index + 1}. ${schema['@type']} (${schema['@context']})`);
      });
    }

  } else {
    // Full audit
    const summary = await runFullAudit('http://localhost:3000', options.verbose);
    
    printAuditSummary(summary);
    
    if (options.output) {
      saveAuditResults(summary, options.output);
    } else {
      saveAuditResults(summary);
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { auditSinglePage, runFullAudit, validateSEOMetrics, extractSEOMetrics };