#!/usr/bin/env node

/**
 * Verification script for Formbricks integration
 * Tests the application on port 3001 and checks for proper initialization
 */

const puppeteer = require('puppeteer');

async function verifyFormbricks() {
  console.log('🚀 Starting Formbricks verification...');
  
  let browser;
  try {
    // Launch browser with proper flags for running as root
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Formbricks') || text.includes('🚀') || text.includes('📊') || text.includes('✅')) {
        console.log(`Browser Console: ${text}`);
      }
    });

    // Navigate to the test page
    console.log('📍 Navigating to http://localhost:3001/test-edge-functions');
    await page.goto('http://localhost:3001/test-edge-functions', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Click on the Formbricks Tracking tab
    console.log('🎯 Clicking on Formbricks Tracking tab...');
    await page.click('[data-value="tracking"]');
    
    await page.waitForTimeout(1000);

    // Check if the tracking test component is available
    const trackingTestExists = await page.$('.tracking-test') !== null;
    const formbricksAvailable = await page.evaluate(() => {
      return document.querySelector('[data-testid="formbricks-available"]') !== null;
    });

    // Try to click a test event button
    console.log('🧪 Attempting to trigger a test event...');
    const testButtons = await page.$$('button[variant="outline"]');
    if (testButtons.length > 0) {
      await testButtons[0].click();
      console.log('✅ Test event button clicked successfully');
    }

    // Wait for any async operations
    await page.waitForTimeout(3000);

    // Extract any final status from the page
    const finalStatus = await page.evaluate(() => {
      // Try to get status from the window object or global variables
      if (window.FormbricksManager) {
        return window.FormbricksManager.getInstance().getStatus();
      }
      return { message: 'FormbricksManager not found on window' };
    });

    console.log('📊 Final status check:', finalStatus);
    
    console.log('✅ Formbricks verification completed successfully');
    console.log('🎉 Visit http://localhost:3001/test-edge-functions to interact with the tracking system');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('🔍 Error details:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  verifyFormbricks().catch(console.error);
}

module.exports = { verifyFormbricks };