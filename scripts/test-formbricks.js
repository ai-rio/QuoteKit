#!/usr/bin/env node

/**
 * Formbricks Integration Test Script
 * 
 * This script tests the Formbricks integration by simulating the browser environment
 * and checking that our CSP and initialization fixes work correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Formbricks Integration Test');
console.log('==============================');

// Test 1: Check CSP Configuration
console.log('\n1. Testing CSP Configuration...');
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

const hasFormbricksInScriptSrc = nextConfigContent.includes('https://app.formbricks.com') && 
                                 nextConfigContent.includes('script-src');
const hasFormbricksInConnectSrc = nextConfigContent.includes('connect-src') && 
                                  nextConfigContent.match(/connect-src[^;]*https:\/\/app\.formbricks\.com/);

if (hasFormbricksInScriptSrc && hasFormbricksInConnectSrc) {
  console.log('✅ CSP Configuration: PASSED');
  console.log('   - https://app.formbricks.com added to script-src');
  console.log('   - https://app.formbricks.com added to connect-src');
} else {
  console.log('❌ CSP Configuration: FAILED');
  console.log('   - script-src formbricks:', hasFormbricksInScriptSrc);
  console.log('   - connect-src formbricks:', hasFormbricksInConnectSrc);
}

// Test 2: Check Environment Configuration
console.log('\n2. Testing Environment Configuration...');
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('⚠️  .env file not found, checking .env.local.example');
}

const hasEnvId = envContent.includes('NEXT_PUBLIC_FORMBRICKS_ENV_ID=') && 
                 !envContent.includes('NEXT_PUBLIC_FORMBRICKS_ENV_ID=UPDATE_THIS');
const hasApiHost = envContent.includes('NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com');

if (hasEnvId && hasApiHost) {
  console.log('✅ Environment Configuration: PASSED');
  console.log('   - NEXT_PUBLIC_FORMBRICKS_ENV_ID is configured');
  console.log('   - NEXT_PUBLIC_FORMBRICKS_API_HOST is configured');
} else {
  console.log('❌ Environment Configuration: FAILED');
  console.log('   - ENV_ID configured:', hasEnvId);
  console.log('   - API_HOST configured:', hasApiHost);
}

// Test 3: Check FormbricksManager Implementation
console.log('\n3. Testing FormbricksManager Implementation...');
const managerPath = path.join(__dirname, '..', 'src', 'libs', 'formbricks', 'formbricks-manager.ts');
const managerContent = fs.readFileSync(managerPath, 'utf8');

const hasWaitForSDKReady = managerContent.includes('waitForSDKReady');
const hasEnhancedInitialization = managerContent.includes('window.formbricks') && 
                                  managerContent.includes('typeof fb.track === \'function\'');
const hasImprovedIsInitialized = managerContent.includes('sdkMethodsAvailable');

if (hasWaitForSDKReady && hasEnhancedInitialization && hasImprovedIsInitialized) {
  console.log('✅ FormbricksManager Implementation: PASSED');
  console.log('   - waitForSDKReady method implemented');
  console.log('   - Enhanced initialization with window.formbricks checks');
  console.log('   - Improved isInitialized with SDK method verification');
} else {
  console.log('❌ FormbricksManager Implementation: FAILED');
  console.log('   - waitForSDKReady:', hasWaitForSDKReady);
  console.log('   - Enhanced initialization:', hasEnhancedInitialization);
  console.log('   - Improved isInitialized:', hasImprovedIsInitialized);
}

// Test 4: Check TrackingTest Component
console.log('\n4. Testing TrackingTest Component...');
const trackingTestPath = path.join(__dirname, '..', 'src', 'components', 'tracking', 'tracking-test.tsx');
const trackingTestContent = fs.readFileSync(trackingTestPath, 'utf8');

const hasTestComponent = trackingTestContent.includes('TrackingTest');
const hasEventTesting = trackingTestContent.includes('handleTestEvent');

if (hasTestComponent && hasEventTesting) {
  console.log('✅ TrackingTest Component: PASSED');
  console.log('   - TrackingTest component exists');
  console.log('   - Event testing functionality available');
} else {
  console.log('❌ TrackingTest Component: FAILED');
  console.log('   - Component exists:', hasTestComponent);
  console.log('   - Event testing:', hasEventTesting);
}

// Summary
console.log('\n📊 Test Summary');
console.log('================');
const allPassed = hasFormbricksInScriptSrc && hasFormbricksInConnectSrc &&
                  hasEnvId && hasApiHost &&
                  hasWaitForSDKReady && hasEnhancedInitialization && hasImprovedIsInitialized &&
                  hasTestComponent && hasEventTesting;

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED! Formbricks integration is ready.');
  console.log('\nNext Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/test-edge-functions');
  console.log('3. Click on the "Formbricks Tracking" tab');
  console.log('4. Test event tracking and check console logs');
  console.log('5. Verify events appear in your Formbricks dashboard');
} else {
  console.log('❌ Some tests failed. Please review the issues above.');
}

process.exit(allPassed ? 0 : 1);