#!/usr/bin/env node

/**
 * Test runner for Help & Tours functionality
 * Runs all Help & Tours related tests with proper setup
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Help & Tours Test Suite...\n');

const testFiles = [
  'tests/unit/help-tours.test.ts',
  'tests/unit/help-menu-components.test.tsx', 
  'tests/integration/help-tours-integration.test.ts',
  'tests/integration/help-tours-e2e.test.ts'
];

const runTests = (files, options = '') => {
  const filePattern = files.join(' ');
  const command = `npx jest --config jest.config.help-tours.js ${filePattern} ${options}`;
  
  console.log(`Running: ${command}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    console.error(`❌ Tests failed with exit code: ${error.status}`);
    return false;
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  const coverage = args.includes('--coverage');
  const verbose = args.includes('--verbose');
  
  let options = '';
  if (watchMode) options += ' --watch';
  if (coverage) options += ' --coverage';
  if (verbose) options += ' --verbose';
  
  console.log('📋 Test Files:');
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  if (watchMode) {
    console.log('👀 Running in watch mode...');
  }
  
  if (coverage) {
    console.log('📊 Generating coverage report...');
  }
  
  console.log('🚀 Starting tests...\n');
  
  const success = runTests(testFiles, options);
  
  if (success) {
    console.log('\n✅ All Help & Tours tests passed!');
    
    if (coverage) {
      console.log('\n📊 Coverage report generated in coverage/ directory');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('  - Unit Tests: Hook functionality, tour configurations');
    console.log('  - Component Tests: UI interactions, button clicks');
    console.log('  - Integration Tests: Complete tour workflows');
    console.log('  - E2E Tests: User journey from header to tour completion');
    
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
};

// Handle CLI arguments
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testFiles };
