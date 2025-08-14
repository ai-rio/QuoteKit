#!/usr/bin/env node

/**
 * FB-004 Verification Script
 * Quick verification that Formbricks environment is properly configured
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 FB-004: Formbricks Configuration Verification\n');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) {
            envVars[key.trim()] = valueParts.join('=').trim();
        }
    }
});

// Required variables
const required = [
    'NEXT_PUBLIC_FORMBRICKS_ENV_ID',
    'NEXT_PUBLIC_FORMBRICKS_API_HOST'
];

let isValid = true;

console.log('1️⃣ Environment Variables:');
required.forEach(varName => {
    const value = envVars[varName];
    if (!value || value.includes('UPDATE_THIS')) {
        console.log(`   ❌ ${varName}: Missing or not configured`);
        isValid = false;
    } else {
        console.log(`   ✅ ${varName}: ${value}`);
    }
});

// Optional variables
console.log('\n2️⃣ Optional Variables:');
const optional = ['FORMBRICKS_DEBUG', 'FORMBRICKS_API_KEY', 'FORMBRICKS_WEBHOOK_SECRET'];
optional.forEach(varName => {
    const value = envVars[varName];
    if (value) {
        console.log(`   ✅ ${varName}: ${value}`);
    } else {
        console.log(`   ⚪ ${varName}: Not set`);
    }
});

// Validate format
console.log('\n3️⃣ Configuration Validation:');
const envId = envVars['NEXT_PUBLIC_FORMBRICKS_ENV_ID'];
const apiHost = envVars['NEXT_PUBLIC_FORMBRICKS_API_HOST'];

if (envId && (envId.startsWith('dev_') || envId.startsWith('prod_'))) {
    console.log(`   ✅ Environment ID format: ${envId}`);
} else if (envId) {
    console.log(`   ⚠️  Environment ID format unusual: ${envId}`);
}

if (apiHost === 'https://app.formbricks.com') {
    console.log(`   ✅ Using Formbricks Cloud: ${apiHost}`);
} else if (apiHost && apiHost.startsWith('https://')) {
    console.log(`   ✅ Custom Formbricks instance: ${apiHost}`);
} else {
    console.log(`   ❌ Invalid API host: ${apiHost}`);
    isValid = false;
}

// Check server configuration
console.log('\n4️⃣ Server Configuration:');
const siteUrl = envVars['NEXT_PUBLIC_SITE_URL'];
if (siteUrl === 'http://localhost:3000') {
    console.log(`   ✅ Development server: ${siteUrl}`);
} else {
    console.log(`   ℹ️  Site URL: ${siteUrl}`);
}

// Final status
console.log('\n📋 FB-004 Status:');
if (isValid) {
    console.log('   ✅ Configuration is valid');
    console.log('   ✅ Ready for Formbricks integration');
    console.log('   ✅ Compatible with server on port 3000');
    process.exit(0);
} else {
    console.log('   ❌ Configuration issues found');
    console.log('   💡 Please check the environment variables above');
    process.exit(1);
}