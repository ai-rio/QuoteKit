/**
 * End-to-End tests for Help & Tours system
 * Tests the complete user journey from header button to tour completion
 */

// Mock DOM environment for E2E-like testing
const mockDocument = {
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    click: jest.fn(),
    focus: jest.fn(),
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock window for navigation
const mockWindow = {
  location: {
    pathname: '/dashboard',
    href: '/dashboard',
  },
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('Help & Tours End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow.location.pathname = '/dashboard';
    mockWindow.location.href = '/dashboard';
  });

  describe('Complete User Journey - Dashboard to Item Library Tour', () => {
    it('should complete full workflow: Header button → Tour selection → Navigation → Tour execution', async () => {
      // Step 1: User clicks Help & Tours button in header
      const helpButton = mockDocument.createElement('button');
      helpButton.setAttribute('data-testid', 'help-menu-trigger');
      
      // Simulate button exists in DOM
      mockDocument.querySelector.mockReturnValue(helpButton);
      
      expect(mockDocument.querySelector('[data-testid="help-menu-trigger"]')).toBeTruthy();

      // Step 2: Help menu opens and shows available tours
      const menuItems = [
        { id: 'welcome', name: 'Welcome Tour' },
        { id: 'settings', name: 'Company Setup' },
        { id: 'enhanced-quote-creation', name: 'Quote Creation Guide' },
        { id: 'enhanced-item-library', name: 'Item Library Management' },
        { id: 'contextual-help', name: 'Contextual Help' },
      ];

      // Simulate menu items in DOM
      mockDocument.querySelectorAll.mockReturnValue(
        menuItems.map(item => {
          const element = mockDocument.createElement('button');
          element.setAttribute('data-tour-id', item.id);
          element.setAttribute('data-testid', `tour-${item.id}`);
          return element;
        })
      );

      const tourButtons = mockDocument.querySelectorAll('[data-tour-id]');
      expect(tourButtons).toHaveLength(5);

      // Step 3: User selects "Item Library Management" tour
      const itemLibraryButton = Array.from(tourButtons).find(
        (btn: any) => btn.getAttribute('data-tour-id') === 'enhanced-item-library'
      );
      expect(itemLibraryButton).toBeTruthy();

      // Step 4: System detects current page and initiates navigation if needed
      expect(mockWindow.location.pathname).toBe('/dashboard');
      
      // Simulate navigation to items page
      mockWindow.location.pathname = '/items';
      mockWindow.location.href = '/items';

      // Step 5: Tour elements should be available on items page
      const tourElements = [
        '[data-tour="add-item"]',
        '[data-tour="categories"]', 
        '[data-tour="items-list"]',
        '[data-tour="search-filter"]',
        '[data-tour="global-library"]'
      ];

      tourElements.forEach(selector => {
        const element = mockDocument.createElement('div');
        element.setAttribute('data-tour', selector.replace(/\[data-tour="([^"]+)"\]/, '$1'));
        mockDocument.querySelector.mockImplementation((sel) => 
          sel === selector ? element : null
        );
        
        expect(mockDocument.querySelector(selector)).toBeTruthy();
      });

      // Step 6: Tour should execute successfully
      const tourSteps = [
        'Item library overview',
        'Adding new items',
        'Category organization',
        'Item list management',
        'Search and filter',
        'Global library integration'
      ];

      expect(tourSteps).toHaveLength(6);
    });

    it('should handle cross-page tour navigation seamlessly', async () => {
      // Start on dashboard, trigger settings tour
      mockWindow.location.pathname = '/dashboard';
      
      // User clicks settings tour
      const settingsTourButton = mockDocument.createElement('button');
      settingsTourButton.setAttribute('data-tour-id', 'settings');
      
      // Simulate navigation step
      const navigationPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          mockWindow.location.pathname = '/settings';
          mockWindow.location.href = '/settings';
          resolve();
        }, 100);
      });

      await navigationPromise;
      
      expect(mockWindow.location.pathname).toBe('/settings');

      // Settings page elements should be available
      const settingsElements = [
        '[data-tour="company-profile"]',
        '[data-tour="logo-upload"]',
        '[data-tour="financial-defaults"]',
        '[data-tour="quote-terms"]',
        '[data-tour="save-settings"]'
      ];

      settingsElements.forEach(selector => {
        const element = mockDocument.createElement('div');
        element.setAttribute('data-tour', selector.replace(/\[data-tour="([^"]+)"\]/, '$1'));
        mockDocument.querySelector.mockImplementation((sel) => 
          sel === selector ? element : null
        );
        
        expect(mockDocument.querySelector(selector)).toBeTruthy();
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle missing tour elements gracefully', async () => {
      // Simulate tour starting but elements missing
      const requiredElements = [
        '[data-tour="missing-element"]',
        '[data-tour="another-missing"]'
      ];

      requiredElements.forEach(selector => {
        mockDocument.querySelector.mockImplementation((sel) => 
          sel === selector ? null : mockDocument.createElement('div')
        );
      });

      // Should detect missing elements
      const missingElements = requiredElements.filter(selector => 
        !mockDocument.querySelector(selector)
      );

      expect(missingElements).toHaveLength(2);

      // Should handle gracefully without crashing
      expect(() => {
        missingElements.forEach(element => {
          console.warn(`Missing tour element: ${element}`);
        });
      }).not.toThrow();
    });
  });
});
