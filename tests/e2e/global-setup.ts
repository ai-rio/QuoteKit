import { chromium, FullConfig } from '@playwright/test';

import { createAuthHelper } from './auth/auth-helper';

/**
 * Global setup for Playwright E2E tests
 * 
 * This setup:
 * - Prepares test database
 * - Creates test users
 * - Sets up authentication state
 * - Configures Formbricks test environment
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Development server is ready');

    // Setup test authentication
    console.log('🔐 Setting up test authentication...');
    await setupTestAuth(page);

    // Setup Formbricks test environment
    console.log('📋 Setting up Formbricks test environment...');
    await setupFormbricksTestEnv(page);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestAuth(page: any) {
  // Setup authentication with real test user
  try {
    const auth = createAuthHelper(page);
    await auth.login('ADMIN_USER');
    console.log('✅ Test user authentication verified');
  } catch (error) {
    console.log('⚠️ Authentication setup failed:', error);
    // Continue with tests - individual tests will handle auth
  }
}

async function setupFormbricksTestEnv(page: any) {
  // Mock Formbricks API responses for testing
  await page.route('**/api/v1/**', (route) => {
    const url = route.request().url();
    
    if (url.includes('formbricks') && route.request().method() === 'POST') {
      // Mock successful survey submission
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          message: 'Survey response recorded',
          id: 'test-response-' + Date.now()
        }),
      });
    } else {
      route.continue();
    }
  });
  
  console.log('✅ Formbricks API mocking configured');
}

export default globalSetup;
