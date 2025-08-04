#!/usr/bin/env tsx

/**
 * Content Validation Script
 * Validates all MDX blog posts for errors and warnings
 * Can be run during build time to catch issues early
 */

import fs from 'fs';
import path from 'path';
import { validateBlogPost, ValidationResult } from '../src/lib/blog/validation';

interface ValidationSummary {
  totalFiles: number;
  validFiles: number;
  filesWithErrors: number;
  filesWithWarnings: number;
  errors: Array<{ file: string; errors: any[] }>;
  warnings: Array<{ file: string; warnings: any[] }>;
}

async function getAllMDXFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getAllMDXFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return files;
}

async function validateAllContent(): Promise<ValidationSummary> {
  const contentDir = path.join(process.cwd(), 'content', 'posts');
  const files = await getAllMDXFiles(contentDir);
  
  const summary: ValidationSummary = {
    totalFiles: files.length,
    validFiles: 0,
    filesWithErrors: 0,
    filesWithWarnings: 0,
    errors: [],
    warnings: []
  };
  
  console.log(`🔍 Validating ${files.length} MDX files...\n`);
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);
      
      console.log(`Validating: ${relativePath}`);
      
      const result: ValidationResult = await validateBlogPost(file, content);
      
      if (result.errors.length > 0) {
        summary.filesWithErrors++;
        summary.errors.push({
          file: relativePath,
          errors: result.errors
        });
        
        console.log(`  ❌ ${result.errors.length} error(s) found`);
        result.errors.forEach(error => {
          console.log(`     • ${error.field}: ${error.message}`);
        });
      } else {
        summary.validFiles++;
        console.log(`  ✅ Valid`);
      }
      
      if (result.warnings.length > 0) {
        summary.filesWithWarnings++;
        summary.warnings.push({
          file: relativePath,
          warnings: result.warnings
        });
        
        console.log(`  ⚠️  ${result.warnings.length} warning(s)`);
        result.warnings.forEach(warning => {
          console.log(`     • ${warning.field}: ${warning.message}`);
        });
      }
      
      console.log('');
      
    } catch (error) {
      summary.filesWithErrors++;
      const relativePath = path.relative(process.cwd(), file);
      
      summary.errors.push({
        file: relativePath,
        errors: [{
          field: 'general',
          message: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'validation_failed'
        }]
      });
      
      console.log(`  ❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }
  
  return summary;
}

function printSummary(summary: ValidationSummary) {
  console.log('📊 Validation Summary');
  console.log('='.repeat(50));
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Valid files: ${summary.validFiles}`);
  console.log(`Files with errors: ${summary.filesWithErrors}`);
  console.log(`Files with warnings: ${summary.filesWithWarnings}`);
  console.log('');
  
  if (summary.errors.length > 0) {
    console.log('❌ Files with errors:');
    summary.errors.forEach(({ file, errors }) => {
      console.log(`  ${file}:`);
      errors.forEach(error => {
        console.log(`    • ${error.field}: ${error.message}`);
      });
    });
    console.log('');
  }
  
  if (summary.warnings.length > 0) {
    console.log('⚠️  Files with warnings:');
    summary.warnings.forEach(({ file, warnings }) => {
      console.log(`  ${file}:`);
      warnings.forEach(warning => {
        console.log(`    • ${warning.field}: ${warning.message}`);
      });
    });
    console.log('');
  }
  
  if (summary.filesWithErrors === 0) {
    console.log('🎉 All files passed validation!');
  } else {
    console.log(`💥 ${summary.filesWithErrors} file(s) have errors that need to be fixed.`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting content validation...\n');
    
    const summary = await validateAllContent();
    printSummary(summary);
    
    // Exit with error code if there are validation errors
    if (summary.filesWithErrors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { validateAllContent, ValidationSummary };
