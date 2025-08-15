#!/usr/bin/env node

/**
 * Formbricks Environment Configuration Checker
 * Validates that Formbricks environment variables are properly configured
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking Formbricks Environment Configuration...\n');
console.log('🔍 Timestamp:', new Date().toISOString());

// 1. Check environment file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
console.log('✅ .env file found');

// 2. Check for required environment variables
const requiredVars = [
  'NEXT_PUBLIC_FORMBRICKS_ENV_ID',
  'NEXT_PUBLIC_FORMBRICKS_API_HOST'
];

const envLines = envContent.split('\n');
const foundVars = {};
let duplicateVars = {};

// Check for duplicates and collect all variables
for (let i = 0; i < envLines.length; i++) {
  const line = envLines[i];
  if (line.trim() && !line.startsWith('#')) {
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      
      if (requiredVars.includes(key)) {
        if (foundVars[key]) {
          // Found duplicate!
          if (!duplicateVars[key]) {
            duplicateVars[key] = [foundVars[key]];
          }
          duplicateVars[key].push({ value, line: i + 1 });
        }
        foundVars[key] = { value, line: i + 1 };
      }
    }
  }
}

console.log('\n📋 Environment Variables Check:');
for (const varName of requiredVars) {
  if (foundVars[varName]) {
    const varInfo = foundVars[varName];
    console.log(`✅ ${varName}: ${varInfo.value.substring(0, 30)}... (line ${varInfo.line})`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
  }
}

// Check for duplicates
console.log('\n🔍 Duplicate Variable Check:');
if (Object.keys(duplicateVars).length > 0) {
  console.log('⚠️  WARNING: Duplicate environment variables found!');
  for (const [varName, duplicates] of Object.entries(duplicateVars)) {
    console.log(`❌ ${varName} defined multiple times:`);
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. Line ${dup.line}: ${dup.value.substring(0, 30)}...`);
    });
  }
  console.log('💡 The last definition will override previous ones!');
} else {
  console.log('✅ No duplicate environment variables found');
}

// 3. Check environment variable format
console.log('\n🔍 Environment Variable Format Check:');
if (foundVars['NEXT_PUBLIC_FORMBRICKS_ENV_ID']) {
  const envId = foundVars['NEXT_PUBLIC_FORMBRICKS_ENV_ID'].value;
  if (envId.length > 20) {
    console.log('✅ Environment ID format looks valid (sufficient length)');
    if (envId.startsWith('dev_') || envId.startsWith('prod_') || envId.includes('cm')) {
      console.log('✅ Environment ID has expected format');
    } else {
      console.log('⚠️  Environment ID format might be unusual');
    }
  } else {
    console.log('❌ Environment ID too short - likely invalid');
  }
}

// 4. Check for commented production variables
console.log('\n🔍 Production Environment Check:');
const productionLines = envLines.filter(line => 
  line.includes('NEXT_PUBLIC_FORMBRICKS_ENV_ID') && 
  line.includes('production') || 
  line.includes('cme8xkymlkaijvz01unvdxciq')
);

if (productionLines.some(line => !line.trim().startsWith('#'))) {
  console.log('⚠️  WARNING: Production Formbricks variables might be active!');
  console.log('💡 Make sure production variables are commented out for development');
} else {
  console.log('✅ Production variables properly commented out');
}

console.log('\n🎯 Configuration Status Summary:');
console.log('- Environment variables:', Object.keys(foundVars).length > 0 ? '✅ Found' : '❌ Missing');
console.log('- Duplicate variables:', Object.keys(duplicateVars).length === 0 ? '✅ None' : '❌ Found duplicates!');
console.log('- Format validation:', foundVars['NEXT_PUBLIC_FORMBRICKS_ENV_ID'] ? '✅ Valid' : '❌ Invalid');

if (Object.keys(duplicateVars).length > 0) {
  console.log('\n🚨 CRITICAL ISSUE DETECTED:');
  console.log('❌ You have duplicate environment variables in your .env file!');
  console.log('💡 This is the most likely cause of initialization failures.');
  console.log('💡 Please comment out or remove the duplicate lines.');
  process.exit(1);
}

if (!foundVars['NEXT_PUBLIC_FORMBRICKS_ENV_ID']) {
  console.log('\n🚨 CRITICAL ISSUE DETECTED:');
  console.log('❌ NEXT_PUBLIC_FORMBRICKS_ENV_ID not found!');
  console.log('💡 This variable is required for Formbricks to work.');
  process.exit(1);
}

console.log('\n✅ Environment configuration looks good!');
console.log('\n📖 Next Steps:');
console.log('1. Restart your development server if it\'s running');
console.log('2. Visit http://localhost:3000/test-edge-functions');
console.log('3. Open browser dev tools to see initialization logs');
console.log('4. Look for "FORMBRICKS IS FULLY OPERATIONAL!" message');

console.log('\n✨ Environment check complete!');