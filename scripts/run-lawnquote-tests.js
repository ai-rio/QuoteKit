#!/usr/bin/env node

/**
 * LawnQuote Integration Test Runner
 * 
 * Runs comprehensive tests for the core LawnQuote business functionality
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running LawnQuote Integration Tests');
console.log('=====================================\n');

const testSuites = [
  {
    name: 'Quote Management',
    file: 'tests/integration/quote-management.test.ts',
    description: 'Core quote creation, calculation, and management functionality'
  },
  {
    name: 'Item Library',
    file: 'tests/integration/item-library.test.ts',
    description: 'Service and material catalog management'
  },
  {
    name: 'Company Settings',
    file: 'tests/integration/company-settings.test.ts',
    description: 'Business information and branding configuration'
  },
  {
    name: 'PDF Generation',
    file: 'tests/integration/pdf-generation.test.ts',
    description: 'Professional quote document generation'
  },
  {
    name: 'End-to-End Workflow',
    file: 'tests/integration/end-to-end-workflow.test.ts',
    description: 'Complete user workflows and business scenarios'
  }
];

async function runTests() {
  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  for (const suite of testSuites) {
    console.log(`📋 Running ${suite.name} Tests`);
    console.log(`   ${suite.description}`);
    console.log(`   File: ${suite.file}\n`);

    try {
      const command = `npx jest ${suite.file} --verbose --no-cache`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });

      // Parse Jest output for pass/fail counts
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;

      totalPassed += passed;
      totalFailed += failed;

      results.push({
        suite: suite.name,
        passed,
        failed,
        status: failed === 0 ? '✅ PASSED' : '❌ FAILED'
      });

      console.log(`   ✅ ${suite.name}: ${passed} passed, ${failed} failed\n`);

    } catch (error) {
      console.log(`   ❌ ${suite.name}: Test execution failed`);
      console.log(`   Error: ${error.message}\n`);
      
      results.push({
        suite: suite.name,
        passed: 0,
        failed: 1,
        status: '❌ ERROR'
      });
      totalFailed += 1;
    }
  }

  // Print summary
  console.log('📊 Test Results Summary');
  console.log('=======================');
  
  results.forEach(result => {
    console.log(`${result.status} ${result.suite}: ${result.passed} passed, ${result.failed} failed`);
  });

  console.log('\n🎯 Overall Results');
  console.log(`Total Tests Passed: ${totalPassed}`);
  console.log(`Total Tests Failed: ${totalFailed}`);
  console.log(`Success Rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 All LawnQuote integration tests passed!');
    console.log('The core business functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run with coverage if --coverage flag is provided
if (process.argv.includes('--coverage')) {
  console.log('📈 Running tests with coverage report...\n');
  
  try {
    const command = 'npx jest tests/integration/ --coverage --coverageDirectory=coverage/integration';
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('Coverage report generation failed:', error.message);
    process.exit(1);
  }
} else {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}
