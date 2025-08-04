#!/usr/bin/env tsx

/**
 * Performance Benchmarking Script for MDX Blog Integration
 * 
 * This script measures and compares performance metrics before and after
 * the MDX blog migration to ensure Sprint 1 requirements are met.
 * 
 * Target Requirements:
 * - Build time increase < 20%
 * - Bundle size increase < 50KB
 * - Memory usage increase < 100MB
 * - Page load times maintained
 * 
 * Usage:
 *   npm run blog:benchmark
 *   tsx scripts/performance-benchmark.ts
 * 
 * Options:
 *   --baseline    Record baseline performance metrics
 *   --compare     Compare current metrics against baseline
 *   --full        Run comprehensive benchmark suite
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PerformanceMetrics {
  timestamp: string;
  buildTime: number;
  bundleSize: {
    total: number;
    js: number;
    css: number;
  };
  memoryUsage: {
    peak: number;
    average: number;
  };
  pageMetrics: {
    blogIndex: PageMetrics;
    blogPost: PageMetrics;
  };
  dependencies: {
    count: number;
    size: number;
  };
  // Enhanced MDX performance metrics
  mdxPerformance: {
    contentCacheHitRate: number;
    indexBuildTime: number;
    parallelProcessingTime: number;
    avgPostLoadTime: number;
  };
}

interface PageMetrics {
  loadTime: number;
  bundleSize: number;
  requests: number;
}

interface BenchmarkOptions {
  baseline: boolean;
  compare: boolean;
  full: boolean;
}

const BENCHMARK_DIR = path.join(process.cwd(), '.performance-benchmarks');
const BASELINE_FILE = path.join(BENCHMARK_DIR, 'baseline.json');
const CURRENT_FILE = path.join(BENCHMARK_DIR, 'current.json');

function parseArgs(): BenchmarkOptions {
  const args = process.argv.slice(2);
  return {
    baseline: args.includes('--baseline'),
    compare: args.includes('--compare'),
    full: args.includes('--full'),
  };
}

function ensureBenchmarkDir() {
  if (!fs.existsSync(BENCHMARK_DIR)) {
    fs.mkdirSync(BENCHMARK_DIR, { recursive: true });
  }
}

async function measureBuildTime(): Promise<number> {
  console.log('📊 Measuring build time...');
  
  // Clean build
  await execAsync('rm -rf .next');
  
  const startTime = Date.now();
  
  try {
    await execAsync('npm run build', { 
      timeout: 300000 // 5 minute timeout
    });
    
    const buildTime = Date.now() - startTime;
    console.log(`⏱️  Build completed in ${buildTime}ms (${(buildTime / 1000).toFixed(2)}s)`);
    
    return buildTime;
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
}

async function measureBundleSize(): Promise<{ total: number; js: number; css: number }> {
  console.log('📦 Measuring bundle size...');
  
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    throw new Error('Build directory not found. Run build first.');
  }
  
  // Get total build size
  const { stdout: totalSizeOutput } = await execAsync(`du -sb ${buildDir}`);
  const totalSize = parseInt(totalSizeOutput.split('\t')[0]);
  
  // Get JS bundle size
  const staticDir = path.join(buildDir, 'static');
  let jsSize = 0;
  let cssSize = 0;
  
  if (fs.existsSync(staticDir)) {
    try {
      const { stdout: jsSizeOutput } = await execAsync(`find ${staticDir} -name "*.js" -exec du -cb {} + | tail -1`);
      jsSize = parseInt(jsSizeOutput.split('\t')[0]) || 0;
    } catch (e) {
      console.warn('Could not measure JS size:', e);
    }
    
    try {
      const { stdout: cssSizeOutput } = await execAsync(`find ${staticDir} -name "*.css" -exec du -cb {} + | tail -1`);
      cssSize = parseInt(cssSizeOutput.split('\t')[0]) || 0;
    } catch (e) {
      console.warn('Could not measure CSS size:', e);
    }
  }
  
  const bundleSize = {
    total: totalSize,
    js: jsSize,
    css: cssSize,
  };
  
  console.log(`📦 Bundle sizes - Total: ${(totalSize / 1024 / 1024).toFixed(2)}MB, JS: ${(jsSize / 1024).toFixed(2)}KB, CSS: ${(cssSize / 1024).toFixed(2)}KB`);
  
  return bundleSize;
}

async function measureMemoryUsage(): Promise<{ peak: number; average: number }> {
  console.log('🧠 Measuring memory usage during build...');
  
  // This is a simplified memory measurement
  // In production, you'd want more sophisticated monitoring
  const { stdout } = await execAsync('ps -eo pid,vsz,rss,comm | grep node || echo "0 0 0 node"');
  const lines = stdout.trim().split('\n');
  
  let totalVSZ = 0;
  let totalRSS = 0;
  let nodeProcesses = 0;
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4 && parts[3].includes('node')) {
      totalVSZ += parseInt(parts[1]) || 0;
      totalRSS += parseInt(parts[2]) || 0;
      nodeProcesses++;
    }
  });
  
  const memoryUsage = {
    peak: totalRSS * 1024, // Convert from KB to bytes
    average: nodeProcesses > 0 ? (totalRSS * 1024) / nodeProcesses : 0,
  };
  
  console.log(`🧠 Memory usage - Peak: ${(memoryUsage.peak / 1024 / 1024).toFixed(2)}MB, Average: ${(memoryUsage.average / 1024 / 1024).toFixed(2)}MB`);
  
  return memoryUsage;
}

async function measurePageMetrics(): Promise<{ blogIndex: PageMetrics; blogPost: PageMetrics }> {
  console.log('🌐 Measuring page metrics...');
  
  // Start development server for testing
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    detached: false,
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    // Measure blog index page
    const blogIndexMetrics = await measureSinglePageMetrics('http://localhost:3000/blog');
    
    // Measure individual blog post
    const blogPostMetrics = await measureSinglePageMetrics('http://localhost:3000/blog/how-to-price-a-paver-patio');
    
    return {
      blogIndex: blogIndexMetrics,
      blogPost: blogPostMetrics,
    };
  } finally {
    // Clean up server process
    serverProcess.kill('SIGTERM');
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Enhanced MDX performance measurements  
async function measureMDXPerformance(): Promise<{
  contentCacheHitRate: number;
  indexBuildTime: number;
  parallelProcessingTime: number;
  avgPostLoadTime: number;
}> {
  console.log('📚 Measuring MDX performance...');
  
  const { getAllPosts, getPostBySlug, clearBlogCache } = await import('../src/lib/blog/content');
  
  // Clear cache to measure cold performance
  clearBlogCache();
  
  // Measure index build time
  const indexStart = performance.now();
  await getAllPosts();
  const indexBuildTime = performance.now() - indexStart;
  
  // Measure cache hit rate
  const testSlugs = ['pricing-guide', 'lawn-care-tips', 'seasonal-maintenance'];
  let cacheHits = 0;
  let totalRequests = 0;
  
  // First pass - cold cache
  const coldStart = performance.now();
  for (const slug of testSlugs) {
    await getPostBySlug(slug);
    totalRequests++;
  }
  const coldTime = performance.now() - coldStart;
  
  // Second pass - warm cache
  const warmStart = performance.now();
  for (const slug of testSlugs) {
    const post = await getPostBySlug(slug);
    if (post) cacheHits++;
    totalRequests++;
  }
  const warmTime = performance.now() - warmStart;
  
  const cacheHitRate = (cacheHits / totalRequests) * 100;
  const avgPostLoadTime = (coldTime + warmTime) / (testSlugs.length * 2);
  const parallelProcessingTime = warmTime - coldTime;
  
  return {
    contentCacheHitRate: cacheHitRate,
    indexBuildTime: Math.round(indexBuildTime * 100) / 100,
    parallelProcessingTime: Math.round(parallelProcessingTime * 100) / 100,
    avgPostLoadTime: Math.round(avgPostLoadTime * 100) / 100,
  };
}

// Standalone MDX performance test (no build required)
async function testMDXPerformanceStandalone(): Promise<void> {
  console.log('🔬 Testing MDX Performance Optimizations (Standalone)\n');
  
  try {
    const { getAllPosts, getPostBySlug, clearBlogCache } = await import('../src/lib/blog/content');
    
    // Test 1: Cold vs Warm Cache Performance
    console.log('📊 Test 1: Cache Performance');
    console.log('   Clearing cache...');
    clearBlogCache();
    
    const coldStart = performance.now();
    const coldPosts = await getAllPosts();
    const coldTime = performance.now() - coldStart;
    console.log(`   Cold cache: ${coldTime.toFixed(2)}ms (${coldPosts.length} posts)`);
    
    const warmStart = performance.now();
    const warmPosts = await getAllPosts();
    const warmTime = performance.now() - warmStart;
    console.log(`   Warm cache: ${warmTime.toFixed(2)}ms (${warmPosts.length} posts)`);
    
    const speedup = ((coldTime - warmTime) / coldTime * 100);
    console.log(`   🚀 Cache speedup: ${speedup.toFixed(1)}%\n`);
    
    // Test 2: Single Post Lookup Performance
    console.log('📊 Test 2: Post Lookup Performance');
    let lookupSpeedup = 0;
    if (coldPosts.length > 0) {
      const testSlug = coldPosts[0].slug;
      
      // Cold lookup
      clearBlogCache();
      const lookupColdStart = performance.now();
      const coldPost = await getPostBySlug(testSlug);
      const lookupColdTime = performance.now() - lookupColdStart;
      console.log(`   Cold lookup: ${lookupColdTime.toFixed(2)}ms`);
      
      // Warm lookup
      const lookupWarmStart = performance.now();
      const warmPost = await getPostBySlug(testSlug);
      const lookupWarmTime = performance.now() - lookupWarmStart;
      console.log(`   Warm lookup: ${lookupWarmTime.toFixed(2)}ms`);
      
      lookupSpeedup = ((lookupColdTime - lookupWarmTime) / lookupColdTime * 100);
      console.log(`   🚀 Lookup speedup: ${lookupSpeedup.toFixed(1)}%\n`);
    } else {
      console.log('   ⚠️  No posts found for lookup test\n');
    }
    
    // Test 3: Parallel Processing
    console.log('📊 Test 3: Parallel Processing Test');
    clearBlogCache();
    
    const parallelStart = performance.now();
    const testSlugs = coldPosts.slice(0, Math.min(3, coldPosts.length)).map(p => p.slug);
    const parallelPromises = testSlugs.map(slug => getPostBySlug(slug));
    const parallelResults = await Promise.all(parallelPromises);
    const parallelTime = performance.now() - parallelStart;
    
    console.log(`   ${testSlugs.length} posts in parallel: ${parallelTime.toFixed(2)}ms`);
    console.log(`   Average per post: ${(parallelTime / testSlugs.length).toFixed(2)}ms\n`);
    
    // Results Summary
    console.log('✅ MDX Performance Test Results:');
    console.log(`   Posts Available: ${coldPosts.length}`);
    console.log(`   Cache Effectiveness: ${speedup.toFixed(1)}% faster`);
    console.log(`   Lookup Optimization: ${lookupSpeedup.toFixed(1)}% faster`);
    console.log(`   Parallel Processing: ${(parallelTime / testSlugs.length).toFixed(2)}ms per post`);
    
    // Performance Score
    let score = 100;
    if (coldTime > 1000) score -= 20; // Penalty for slow cold starts
    if (warmTime > 100) score -= 15;  // Penalty for slow warm cache
    if (speedup < 50) score -= 25;    // Penalty for poor cache effectiveness
    
    console.log(`   🎯 Performance Score: ${Math.max(0, score)}/100`);
    
  } catch (error) {
    console.error('❌ MDX Performance Test Failed:', error);
  }
}

async function measureSinglePageMetrics(url: string): Promise<PageMetrics> {
  // Simple curl-based measurement
  // In production, you'd use tools like Puppeteer or Lighthouse
  
  const startTime = Date.now();
  
  try {
    const { stdout } = await execAsync(`curl -w "%{time_total},%{size_download},%{num_connects}" -s -o /dev/null "${url}"`);
    const [timeTotal, sizeDownload, numConnects] = stdout.trim().split(',').map(Number);
    
    const loadTime = Math.round(timeTotal * 1000); // Convert to ms
    
    return {
      loadTime,
      bundleSize: sizeDownload,
      requests: numConnects,
    };
  } catch (error) {
    console.warn(`Could not measure metrics for ${url}:`, error);
    return {
      loadTime: 0,
      bundleSize: 0,
      requests: 0,
    };
  }
}

async function measureDependencies(): Promise<{ count: number; size: number }> {
  console.log('📚 Measuring dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageLockPath = path.join(process.cwd(), 'package-lock.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  const dependencyCount = Object.keys(dependencies).length;
  
  // Measure node_modules size
  let nodeModulesSize = 0;
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    try {
      const { stdout } = await execAsync(`du -sb ${nodeModulesPath}`);
      nodeModulesSize = parseInt(stdout.split('\t')[0]);
    } catch (e) {
      console.warn('Could not measure node_modules size:', e);
    }
  }
  
  console.log(`📚 Dependencies - Count: ${dependencyCount}, Size: ${(nodeModulesSize / 1024 / 1024).toFixed(2)}MB`);
  
  return {
    count: dependencyCount,
    size: nodeModulesSize,
  };
}

async function runFullBenchmark(): Promise<PerformanceMetrics> {
  console.log('🚀 Running comprehensive performance benchmark...\n');
  
  const startTime = Date.now();
  
  const [
    buildTime,
    bundleSize,
    memoryUsage,
    pageMetrics,
    dependencies,
    mdxPerformance,
  ] = await Promise.all([
    measureBuildTime(),
    measureBundleSize(),
    measureMemoryUsage(),
    measurePageMetrics(),
    measureDependencies(),
    measureMDXPerformance(),
  ]);
  
  const metrics: PerformanceMetrics = {
    timestamp: new Date().toISOString(),
    buildTime,
    bundleSize,
    memoryUsage,
    pageMetrics,
    dependencies,
    mdxPerformance,
  };
  
  const totalTime = Date.now() - startTime;
  console.log(`\n✅ Benchmark completed in ${(totalTime / 1000).toFixed(2)}s`);
  
  return metrics;
}

function saveMetrics(metrics: PerformanceMetrics, filename: string) {
  const filepath = path.join(BENCHMARK_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
  console.log(`💾 Metrics saved to: ${filepath}`);
}

function loadMetrics(filename: string): PerformanceMetrics | null {
  const filepath = path.join(BENCHMARK_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading metrics from ${filepath}:`, error);
    return null;
  }
}

function compareMetrics(baseline: PerformanceMetrics, current: PerformanceMetrics) {
  console.log('\n📊 Performance Comparison Report');
  console.log('=====================================\n');
  
  // Build time comparison
  const buildTimeDiff = current.buildTime - baseline.buildTime;
  const buildTimePercent = (buildTimeDiff / baseline.buildTime) * 100;
  const buildTimeStatus = buildTimePercent < 20 ? '✅' : '❌';
  
  console.log(`⏱️  Build Time:`);
  console.log(`   Baseline: ${(baseline.buildTime / 1000).toFixed(2)}s`);
  console.log(`   Current:  ${(current.buildTime / 1000).toFixed(2)}s`);
  console.log(`   Change:   ${buildTimePercent > 0 ? '+' : ''}${buildTimePercent.toFixed(1)}% ${buildTimeStatus}`);
  console.log(`   Target:   < 20% increase\n`);
  
  // Bundle size comparison
  const bundleSizeDiff = current.bundleSize.total - baseline.bundleSize.total;
  const bundleSizeKB = bundleSizeDiff / 1024;
  const bundleSizeStatus = bundleSizeKB < 50 ? '✅' : '❌';
  
  console.log(`📦 Bundle Size:`);
  console.log(`   Baseline: ${(baseline.bundleSize.total / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Current:  ${(current.bundleSize.total / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Change:   ${bundleSizeKB > 0 ? '+' : ''}${bundleSizeKB.toFixed(1)}KB ${bundleSizeStatus}`);
  console.log(`   Target:   < 50KB increase\n`);
  
  // Memory usage comparison
  const memoryDiff = current.memoryUsage.peak - baseline.memoryUsage.peak;
  const memoryMB = memoryDiff / 1024 / 1024;
  const memoryStatus = memoryMB < 100 ? '✅' : '❌';
  
  console.log(`🧠 Memory Usage:`);
  console.log(`   Baseline: ${(baseline.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Current:  ${(current.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Change:   ${memoryMB > 0 ? '+' : ''}${memoryMB.toFixed(1)}MB ${memoryStatus}`);
  console.log(`   Target:   < 100MB increase\n`);
  
  // Page performance comparison
  console.log(`🌐 Page Performance:`);
  console.log(`   Blog Index Load Time:`);
  console.log(`     Baseline: ${baseline.pageMetrics.blogIndex.loadTime}ms`);
  console.log(`     Current:  ${current.pageMetrics.blogIndex.loadTime}ms`);
  
  console.log(`   Blog Post Load Time:`);
  console.log(`     Baseline: ${baseline.pageMetrics.blogPost.loadTime}ms`);
  console.log(`     Current:  ${current.pageMetrics.blogPost.loadTime}ms\n`);
  
  // Overall assessment
  const allTargetsMet = buildTimePercent < 20 && bundleSizeKB < 50 && memoryMB < 100;
  
  console.log(`🎯 Sprint 1 Performance Requirements:`);
  console.log(`   Build Time < 20% increase: ${buildTimeStatus}`);
  console.log(`   Bundle Size < 50KB increase: ${bundleSizeStatus}`);
  console.log(`   Memory Usage < 100MB increase: ${memoryStatus}`);
  console.log(`   Overall Status: ${allTargetsMet ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  if (!allTargetsMet) {
    console.log('⚠️  Performance targets not met. Consider optimization before completing Sprint 1.');
  } else {
    console.log('🎉 All performance targets met! Sprint 1 requirements satisfied.');
  }
}

// Performance monitoring utilities
function generatePerformanceReport(current: PerformanceMetrics, baseline?: PerformanceMetrics): string {
  let report = '\n📊 PERFORMANCE REPORT\n';
  report += '=' .repeat(50) + '\n\n';
  
  // Build Time
  report += `🏗️  BUILD PERFORMANCE\n`;
  report += `   Build Time: ${current.buildTime.toFixed(2)}s`;
  if (baseline) {
    const diff = current.buildTime - baseline.buildTime;
    const percent = ((diff / baseline.buildTime) * 100).toFixed(1);
    report += ` (${diff > 0 ? '+' : ''}${diff.toFixed(2)}s, ${percent}%)`;
  }
  report += '\n\n';
  
  // Bundle Size
  report += `📦 BUNDLE SIZE\n`;
  report += `   Total: ${(current.bundleSize.total / 1024).toFixed(1)} KB`;
  if (baseline) {
    const diff = current.bundleSize.total - baseline.bundleSize.total;
    const percent = ((diff / baseline.bundleSize.total) * 100).toFixed(1);
    report += ` (${diff > 0 ? '+' : ''}${(diff / 1024).toFixed(1)} KB, ${percent}%)`;
  }
  report += `\n   JS: ${(current.bundleSize.js / 1024).toFixed(1)} KB`;
  report += `\n   CSS: ${(current.bundleSize.css / 1024).toFixed(1)} KB\n\n`;
  
  // MDX Performance
  report += `📚 MDX PERFORMANCE\n`;
  report += `   Cache Hit Rate: ${current.mdxPerformance.contentCacheHitRate.toFixed(1)}%\n`;
  report += `   Index Build Time: ${current.mdxPerformance.indexBuildTime.toFixed(2)}ms\n`;
  report += `   Avg Post Load: ${current.mdxPerformance.avgPostLoadTime.toFixed(2)}ms\n`;
  report += `   Parallel Processing: ${current.mdxPerformance.parallelProcessingTime.toFixed(2)}ms\n\n`;
  
  // Memory Usage
  report += `💾 MEMORY USAGE\n`;
  report += `   Peak: ${current.memoryUsage.peak.toFixed(1)} MB\n`;
  report += `   Average: ${current.memoryUsage.average.toFixed(1)} MB\n\n`;
  
  // Page Metrics
  report += `⚡ PAGE PERFORMANCE\n`;
  report += `   Blog Index: ${current.pageMetrics.blogIndex.loadTime.toFixed(0)}ms\n`;
  report += `   Blog Post: ${current.pageMetrics.blogPost.loadTime.toFixed(0)}ms\n\n`;
  
  // Performance Score
  const performanceScore = calculatePerformanceScore(current);
  report += `🎯 PERFORMANCE SCORE: ${performanceScore}/100\n`;
  
  if (performanceScore >= 90) {
    report += `✅ Excellent performance!\n`;
  } else if (performanceScore >= 70) {
    report += `⚠️  Good performance, minor optimizations needed\n`;
  } else {
    report += `🚨 Performance improvements required\n`;
  }
  
  return report;
}

function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // Build time penalty (target: <30s)
  if (metrics.buildTime > 30) score -= Math.min(20, (metrics.buildTime - 30) * 2);
  
  // Bundle size penalty (target: <2MB total)
  const bundleMB = metrics.bundleSize.total / (1024 * 1024);
  if (bundleMB > 2) score -= Math.min(15, (bundleMB - 2) * 5);
  
  // Cache hit rate bonus/penalty (target: >80%)
  if (metrics.mdxPerformance.contentCacheHitRate < 80) {
    score -= (80 - metrics.mdxPerformance.contentCacheHitRate) * 0.5;
  }
  
  // Page load time penalty (target: <1000ms)
  const avgPageLoad = (metrics.pageMetrics.blogIndex.loadTime + metrics.pageMetrics.blogPost.loadTime) / 2;
  if (avgPageLoad > 1000) score -= Math.min(15, (avgPageLoad - 1000) / 100);
  
  // Memory usage penalty (target: <500MB peak)
  if (metrics.memoryUsage.peak > 500) score -= Math.min(10, (metrics.memoryUsage.peak - 500) / 50);
  
  return Math.max(0, Math.round(score));
}

async function main() {
  const options = parseArgs();
  
  console.log('🌿 LawnQuote Blog Performance Benchmark');
  console.log('=======================================\n');
  
  // Add standalone MDX test option
  if (process.argv.includes('--mdx-only')) {
    await testMDXPerformanceStandalone();
    return;
  }
  
  ensureBenchmarkDir();
  
  if (options.baseline) {
    console.log('📊 Recording baseline performance metrics...\n');
    
    const metrics = await runFullBenchmark();
    saveMetrics(metrics, 'baseline.json');
    
    console.log(generatePerformanceReport(metrics));
    console.log('\n✅ Baseline metrics recorded successfully!');
    console.log('💡 Run with --compare flag after optimizations to compare performance.');
    
  } else if (options.compare) {
    console.log('📊 Comparing current performance against baseline...\n');
    
    const baseline = loadMetrics('baseline.json');
    if (!baseline) {
      console.error('❌ No baseline metrics found. Run with --baseline first.');
      process.exit(1);
    }
    
    const current = await runFullBenchmark();
    saveMetrics(current, 'current.json');
    
    console.log(generatePerformanceReport(current, baseline));
    compareMetrics(baseline, current);
    
  } else {
    // Default: run current benchmark with enhanced reporting
    console.log('📊 Running performance benchmark (current state)...\n');
    
    const metrics = await runFullBenchmark();
    const timestamp = Date.now();
    saveMetrics(metrics, `benchmark-${timestamp}.json`);
    
    console.log(generatePerformanceReport(metrics));
    
    console.log('\n💡 Performance Commands:');
    console.log('• npm run blog:perf-test -- --mdx-only     (test MDX only, no build)');
    console.log('• npm run blog:perf-test -- --baseline     (record baseline)');
    console.log('• npm run blog:perf-test -- --compare      (compare vs baseline)');
    console.log('• npm run analyze                          (bundle analysis)');
  }
}

// Run benchmark if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runFullBenchmark, compareMetrics, loadMetrics, saveMetrics };