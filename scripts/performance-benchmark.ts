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
      stdio: 'pipe',
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
  ] = await Promise.all([
    measureBuildTime(),
    measureBundleSize(),
    measureMemoryUsage(),
    measurePageMetrics(),
    measureDependencies(),
  ]);
  
  const metrics: PerformanceMetrics = {
    timestamp: new Date().toISOString(),
    buildTime,
    bundleSize,
    memoryUsage,
    pageMetrics,
    dependencies,
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

async function main() {
  const options = parseArgs();
  
  console.log('🌿 LawnQuote Blog Performance Benchmark');
  console.log('=======================================\n');
  
  ensureBenchmarkDir();
  
  if (options.baseline) {
    console.log('📊 Recording baseline performance metrics...\n');
    
    const metrics = await runFullBenchmark();
    saveMetrics(metrics, 'baseline.json');
    
    console.log('\n✅ Baseline metrics recorded successfully!');
    console.log('💡 Run with --compare flag after MDX migration to compare performance.');
    
  } else if (options.compare) {
    console.log('📊 Comparing current performance against baseline...\n');
    
    const baseline = loadMetrics('baseline.json');
    if (!baseline) {
      console.error('❌ No baseline metrics found. Run with --baseline first.');
      process.exit(1);
    }
    
    const current = await runFullBenchmark();
    saveMetrics(current, 'current.json');
    
    compareMetrics(baseline, current);
    
  } else {
    // Default: run current benchmark only
    console.log('📊 Running performance benchmark (current state)...\n');
    
    const metrics = await runFullBenchmark();
    saveMetrics(metrics, `benchmark-${Date.now()}.json`);
    
    console.log('\n💡 To compare performance:');
    console.log('1. Run with --baseline before migration');
    console.log('2. Run with --compare after migration');
  }
}

// Run benchmark if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runFullBenchmark, compareMetrics, loadMetrics, saveMetrics };