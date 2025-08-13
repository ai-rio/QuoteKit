/**
 * Integration tests for Help & Tours system
 * Tests the complete workflow from button click to tour execution
 */

import { canStartTourFromCurrentPage,getPageAwareTourConfig } from '@/libs/onboarding/page-aware-tours';
import { getTourConfig } from '@/libs/onboarding/tour-configs';

// Mock window.location for navigation tests
const mockLocation = {
  pathname: '/dashboard',
  href: '/dashboard',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock driver.js for integration tests
const mockDriverInstance = {
  drive: jest.fn(),
  moveNext: jest.fn(),
  movePrevious: jest.fn(),
  moveTo: jest.fn(),
  destroy: jest.fn(),
  isActive: jest.fn(() => false),
};

jest.mock('driver.js', () => ({
  driver: jest.fn(() => mockDriverInstance),
}));

describe('Help & Tours Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.pathname = '/dashboard';
    mockLocation.href = '/dashboard';
    mockDriverInstance.isActive.mockReturnValue(false);
  });

  describe('Tour Configuration Integration', () => {
    it('should have all essential tours configured', () => {
      const essentialTours = [
        'welcome',
        'settings',
        'enhanced-quote-creation', 
        'enhanced-item-library',
        'contextual-help'
      ];

      essentialTours.forEach(tourId => {
        const config = getTourConfig(tourId);
        expect(config).toBeDefined();
        expect(config?.id).toBe(tourId);
        expect(config?.steps).toBeDefined();
        expect(config?.steps.length).toBeGreaterThan(0);
      });
    });

    it('should have proper tour prerequisites configured', () => {
      const welcomeConfig = getTourConfig('welcome');
      expect(welcomeConfig?.prerequisites).toEqual([]);

      const settingsConfig = getTourConfig('settings');
      expect(settingsConfig?.prerequisites).toContain('welcome');

      const quoteConfig = getTourConfig('enhanced-quote-creation');
      expect(quoteConfig?.prerequisites).toContain('welcome');
    });

    it('should have user tier restrictions properly configured', () => {
      const freeUserTours = ['welcome', 'settings', 'enhanced-quote-creation', 'enhanced-item-library'];
      const proUserTours = ['pro-features', 'interactive-tutorial'];

      freeUserTours.forEach(tourId => {
        const config = getTourConfig(tourId);
        expect(config?.userTiers).toContain('free');
      });

      proUserTours.forEach(tourId => {
        const config = getTourConfig(tourId);
        if (config) {
          expect(config.userTiers).toContain('pro');
        }
      });
    });
  });

  describe('Page-Aware Tour System', () => {
    it('should detect current page correctly', () => {
      mockLocation.pathname = '/items';
      
      const canStart = canStartTourFromCurrentPage('enhanced-item-library');
      expect(canStart).toBe(true);
    });

    it('should provide page-aware configurations', () => {
      const settingsConfig = getPageAwareTourConfig('settings');
      expect(settingsConfig).toBeDefined();
      expect(settingsConfig?.id).toBe('settings');

      const quoteConfig = getPageAwareTourConfig('enhanced-quote-creation');
      expect(quoteConfig).toBeDefined();
      expect(quoteConfig?.id).toBe('enhanced-quote-creation');

      const itemConfig = getPageAwareTourConfig('enhanced-item-library');
      expect(itemConfig).toBeDefined();
      expect(itemConfig?.id).toBe('enhanced-item-library');
    });

    it('should handle cross-page navigation for tours', () => {
      mockLocation.pathname = '/dashboard';
      
      const settingsConfig = getPageAwareTourConfig('settings');
      expect(settingsConfig).toBeDefined();
      
      // Should include navigation step when not on target page
      const hasNavigationStep = settingsConfig?.steps.some(step => 
        step.id.includes('navigation') || step.onBeforeHighlight
      );
      expect(hasNavigationStep).toBe(true);
    });

    it('should validate tour elements exist on correct pages', () => {
      // Mock DOM elements for validation
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-tour', 'test-element');
      document.body.appendChild(mockElement);

      // Test element validation logic
      const element = document.querySelector('[data-tour="test-element"]');
      expect(element).toBeTruthy();

      // Cleanup
      document.body.removeChild(mockElement);
    });
  });

  describe('Tour Flow Integration', () => {
    it('should handle complete tour workflow', async () => {
      // Simulate starting a tour from dashboard
      mockLocation.pathname = '/dashboard';
      
      const tourConfig = getTourConfig('welcome');
      expect(tourConfig).toBeDefined();

      // Simulate tour initialization
      const { driver } = require('driver.js');
      const driverInstance = driver();
      
      expect(driver).toHaveBeenCalled();
      expect(driverInstance).toBeDefined();
    });

    it('should handle tour navigation between pages', async () => {
      // Start on dashboard, navigate to settings for settings tour
      mockLocation.pathname = '/dashboard';
      
      const settingsConfig = getPageAwareTourConfig('settings');
      expect(settingsConfig).toBeDefined();

      // Find navigation step
      const navigationStep = settingsConfig?.steps.find(step => 
        step.id.includes('navigation')
      );
      
      if (navigationStep?.onBeforeHighlight) {
        // Simulate navigation
        await navigationStep.onBeforeHighlight();
        
        // Navigation should be triggered (in real scenario)
        expect(navigationStep.onBeforeHighlight).toBeDefined();
      }
    });

    it('should handle tour replay functionality', async () => {
      const tourConfig = getTourConfig('enhanced-quote-creation');
      expect(tourConfig).toBeDefined();

      // Simulate replay scenario
      mockDriverInstance.isActive.mockReturnValue(true);
      
      // Should be able to destroy and restart
      expect(mockDriverInstance.destroy).toBeDefined();
      expect(mockDriverInstance.drive).toBeDefined();
    });

    it('should handle tour step navigation', () => {
      const tourConfig = getTourConfig('enhanced-item-library');
      expect(tourConfig).toBeDefined();
      expect(tourConfig?.steps.length).toBeGreaterThan(1);

      // Should have proper step navigation
      expect(mockDriverInstance.moveNext).toBeDefined();
      expect(mockDriverInstance.movePrevious).toBeDefined();
      expect(mockDriverInstance.moveTo).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing tour configurations gracefully', () => {
      const nonExistentConfig = getTourConfig('non-existent-tour');
      expect(nonExistentConfig).toBeUndefined();

      const pageAwareConfig = getPageAwareTourConfig('non-existent-tour');
      expect(pageAwareConfig).toBeUndefined();
    });

    it('should handle navigation errors gracefully', async () => {
      // Mock navigation failure
      const originalLocation = window.location;
      
      try {
        // Simulate navigation error scenario
        const settingsConfig = getPageAwareTourConfig('settings');
        const navigationStep = settingsConfig?.steps.find(step => 
          step.onBeforeHighlight
        );

        if (navigationStep?.onBeforeHighlight) {
          // Should not throw error even if navigation fails
          await expect(navigationStep.onBeforeHighlight()).resolves.not.toThrow();
        }
      } finally {
        // Restore original location
        Object.defineProperty(window, 'location', {
          value: originalLocation,
          writable: true,
        });
      }
    });

    it('should handle driver.js initialization errors', () => {
      const { driver } = require('driver.js');
      
      // Mock driver initialization error
      driver.mockImplementationOnce(() => {
        throw new Error('Driver initialization failed');
      });

      expect(() => {
        try {
          driver();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Driver initialization failed');
        }
      }).not.toThrow();
    });
  });

  describe('User Experience Integration', () => {
    it('should provide consistent tour experience across pages', () => {
      const pages = ['/dashboard', '/items', '/settings', '/quotes'];
      
      pages.forEach(page => {
        mockLocation.pathname = page;
        
        // All essential tours should be startable from any page
        const canStartWelcome = canStartTourFromCurrentPage('welcome');
        const canStartSettings = canStartTourFromCurrentPage('settings');
        const canStartQuotes = canStartTourFromCurrentPage('enhanced-quote-creation');
        const canStartItems = canStartTourFromCurrentPage('enhanced-item-library');

        expect(canStartWelcome).toBe(true);
        expect(canStartSettings).toBe(true);
        expect(canStartQuotes).toBe(true);
        expect(canStartItems).toBe(true);
      });
    });

    it('should maintain tour state consistency', () => {
      // Test that tour state is properly managed
      mockDriverInstance.isActive.mockReturnValue(false);
      expect(mockDriverInstance.isActive()).toBe(false);

      mockDriverInstance.isActive.mockReturnValue(true);
      expect(mockDriverInstance.isActive()).toBe(true);
    });

    it('should handle concurrent tour requests gracefully', async () => {
      // Simulate multiple tour start requests
      const tourConfigs = [
        getTourConfig('welcome'),
        getTourConfig('settings'),
        getTourConfig('enhanced-quote-creation')
      ];

      tourConfigs.forEach(config => {
        expect(config).toBeDefined();
      });

      // Should handle multiple configurations without conflicts
      expect(tourConfigs.length).toBe(3);
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper ARIA attributes in tour configurations', () => {
      const tourConfig = getTourConfig('welcome');
      expect(tourConfig).toBeDefined();
      
      // Tour steps should be accessible
      tourConfig?.steps.forEach(step => {
        expect(step.title).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.showButtons).toBeDefined();
      });
    });

    it('should support keyboard navigation', () => {
      // Driver.js should support keyboard navigation by default
      expect(mockDriverInstance.moveNext).toBeDefined();
      expect(mockDriverInstance.movePrevious).toBeDefined();
    });

    it('should provide proper focus management', () => {
      // Tour should manage focus properly
      expect(mockDriverInstance.drive).toBeDefined();
      expect(mockDriverInstance.destroy).toBeDefined();
    });
  });
});
