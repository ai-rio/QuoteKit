#!/usr/bin/env node

/**
 * Simple test for Formbricks error detection
 */

console.log('🧪 Testing Formbricks Error Detection');
console.log('=' .repeat(50));

// Simulate the error detection logic
function isFormbricksEmptyError(args) {
  return (
    args.length >= 2 &&
    typeof args[0] === 'string' &&
    args[0].includes('Formbricks - Global error:') &&
    args[1] !== null &&
    args[1] !== undefined &&
    typeof args[1] === 'object' &&
    Object.keys(args[1]).length === 0
  );
}

// Test cases
const testCases = [
  {
    name: 'Exact problematic error',
    args: ['🧱 Formbricks - Global error: ', {}],
    expected: true
  },
  {
    name: 'Error without emoji',
    args: ['Formbricks - Global error: ', {}],
    expected: true
  },
  {
    name: 'Error with data',
    args: ['🧱 Formbricks - Global error: ', {data: 'test'}],
    expected: false
  },
  {
    name: 'Different error',
    args: ['Some other error', {}],
    expected: false
  },
  {
    name: 'Null second argument',
    args: ['🧱 Formbricks - Global error: ', null],
    expected: false
  },
  {
    name: 'Single argument',
    args: ['🧱 Formbricks - Global error: '],
    expected: false
  }
];

console.log('\n🔍 Running Test Cases:');
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = isFormbricksEmptyError(testCase.args);
  const success = result === testCase.expected;
  
  console.log(`${index + 1}. ${testCase.name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
  
  if (success) {
    passed++;
  } else {
    failed++;
    console.log(`   Args: ${JSON.stringify(testCase.args)}`);
  }
});

console.log('\n📊 Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Error detection should work correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Check the logic above.');
}

console.log('\n' + '=' .repeat(50));
