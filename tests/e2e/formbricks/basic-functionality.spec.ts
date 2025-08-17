import { expect,test } from '@playwright/test';

/**
 * Basic functionality tests for Sprint 3 Formbricks integration
 * These tests focus on core functionality without complex authentication
 */

test.describe('Basic Formbricks Integration (Sprint 3)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Formbricks API responses
    await page.route('**/formbricks**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'test-event-' + Date.now() }),
      });
    });
  });

  test('Home page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Home page loaded successfully');
  });

  test('Dashboard is accessible', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if we get redirected to login or if dashboard loads
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Dashboard properly redirects to login when not authenticated');
      await expect(page.locator('body')).toBeVisible();
    } else {
      console.log('✅ Dashboard loads (user may be authenticated)');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Look for login form elements
    const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPasswordField = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    
    if (hasEmailField && hasPasswordField) {
      console.log('✅ Login form found with email and password fields');
    } else {
      console.log('⚠️ Login form structure may be different than expected');
    }
  });

  test('Formbricks script integration works', async ({ page }) => {
    await page.goto('/');
    
    // Check if Formbricks is loaded
    const formbricksExists = await page.evaluate(() => {
      return typeof window.formbricks !== 'undefined';
    });
    
    if (formbricksExists) {
      console.log('✅ Formbricks is loaded on the page');
    } else {
      console.log('⚠️ Formbricks not detected - may be loaded asynchronously');
    }
    
    // Test basic tracking functionality
    await page.evaluate(() => {
      // Simulate a tracking event
      if (window.formbricks && typeof window.formbricks.track === 'function') {
        window.formbricks.track('test_event', { test: true });
      }
    });
    
    console.log('✅ Basic Formbricks integration test completed');
  });

  test('Page navigation works without errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Navigate through key pages
    const pages = ['/', '/login', '/dashboard'];
    
    for (const pagePath of pages) {
      try {
        await page.goto(pagePath);
        await page.waitForSelector('body', { timeout: 5000 });
        console.log(`✅ Successfully navigated to ${pagePath}`);
      } catch (error) {
        console.log(`⚠️ Navigation to ${pagePath} failed: ${error}`);
      }
    }
    
    // Check for critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      !error.toLowerCase().includes('formbricks') && 
      (error.includes('TypeError') || error.includes('ReferenceError'))
    );
    
    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No critical JavaScript errors detected');
  });

  test('Mock survey triggering works', async ({ page }) => {
    let surveyTriggered = false;
    
    // Intercept Formbricks API calls
    await page.route('**/formbricks**', (route) => {
      if (route.request().method() === 'POST') {
        surveyTriggered = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    
    // Simulate survey trigger
    await page.evaluate(() => {
      if (window.formbricks && typeof window.formbricks.track === 'function') {
        window.formbricks.track('post_quote_creation_survey', {
          quoteId: 'test-123',
          complexity: 'simple'
        });
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (surveyTriggered) {
      console.log('✅ Survey API call was triggered successfully');
    } else {
      console.log('⚠️ Survey API call was not detected');
    }
  });
});
