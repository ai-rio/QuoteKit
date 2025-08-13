/**
 * Test suite for onboarding system
 */

import {
  type TourConfig,
  TourError,
  tourStorage,
  validateTourConfig,
} from '@/libs/onboarding/driver-config';

// Mock driver.js since it requires a DOM environment
jest.mock('driver.js', () => ({
  driver: jest.fn(() => ({
    drive: jest.fn(),
    moveNext: jest.fn(),
    movePrevious: jest.fn(),
    destroy: jest.fn(),
  })),
}));

// Mock localStorage for Node environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Onboarding System', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    jest.clearAllMocks();
  });

  describe('validateTourConfig', () => {
    it('should pass validation for valid tour config', () => {
      const validConfig: TourConfig = {
        tourId: 'test-tour',
        steps: [
          {
            id: 'step-1',
            element: '#test-element',
            title: 'Test Step',
            description: 'This is a test step',
          },
        ],
      };

      const errors = validateTourConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for missing tour ID', () => {
      const invalidConfig: TourConfig = {
        tourId: '',
        steps: [
          {
            id: 'step-1',
            element: '#test-element',
            title: 'Test Step',
            description: 'This is a test step',
          },
        ],
      };

      const errors = validateTourConfig(invalidConfig);
      expect(errors).toContain('Tour ID is required');
    });

    it('should fail validation for empty steps array', () => {
      const invalidConfig: TourConfig = {
        tourId: 'test-tour',
        steps: [],
      };

      const errors = validateTourConfig(invalidConfig);
      expect(errors).toContain('At least one step is required');
    });

    it('should fail validation for step without ID', () => {
      const invalidConfig: TourConfig = {
        tourId: 'test-tour',
        steps: [
          {
            id: '',
            element: '#test-element',
            title: 'Test Step',
            description: 'This is a test step',
          },
        ],
      };

      const errors = validateTourConfig(invalidConfig);
      expect(errors).toContain('Step 1: ID is required');
    });

    it('should fail validation for step without title', () => {
      const invalidConfig: TourConfig = {
        tourId: 'test-tour',
        steps: [
          {
            id: 'step-1',
            element: '#test-element',
            title: '',
            description: 'This is a test step',
          },
        ],
      };

      const errors = validateTourConfig(invalidConfig);
      expect(errors).toContain('Step 1: Title is required');
    });

    it('should fail validation for step without description', () => {
      const invalidConfig: TourConfig = {
        tourId: 'test-tour',
        steps: [
          {
            id: 'step-1',
            element: '#test-element',
            title: 'Test Step',
            description: '',
          },
        ],
      };

      const errors = validateTourConfig(invalidConfig);
      expect(errors).toContain('Step 1: Description is required');
    });
  });

  describe('TourError', () => {
    it('should create error with correct properties', () => {
      const error = new TourError('Test error', 'test-tour', 'step-1');
      
      expect(error.message).toBe('Test error');
      expect(error.tourId).toBe('test-tour');
      expect(error.stepId).toBe('step-1');
      expect(error.name).toBe('TourError');
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original error');
      const error = new TourError('Test error', 'test-tour', 'step-1', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('tourStorage', () => {
    it('should return empty array when no completed tours', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const completed = tourStorage.getCompletedTours();
      expect(completed).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('lawnquote_completed_tours');
    });

    it('should store and retrieve completed tours', () => {
      const existingTours = ['tour-0'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTours));
      
      tourStorage.markTourCompleted('tour-1');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lawnquote_completed_tours',
        JSON.stringify(['tour-0', 'tour-1'])
      );
    });

    it('should not duplicate completed tours', () => {
      const existingTours = ['tour-1'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTours));
      
      tourStorage.markTourCompleted('tour-1');
      
      // Should not call setItem since tour-1 already exists
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should check if tour is completed', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['tour-1']));
      
      expect(tourStorage.isTourCompleted('tour-1')).toBe(true);
      expect(tourStorage.isTourCompleted('tour-2')).toBe(false);
    });

    it('should reset specific tour progress', () => {
      const existingTours = ['tour-1', 'tour-2'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingTours));
      
      tourStorage.resetTourProgress('tour-1');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lawnquote_completed_tours',
        JSON.stringify(['tour-2'])
      );
    });

    it('should reset all tour progress', () => {
      tourStorage.resetTourProgress();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('lawnquote_completed_tours');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      // Should not throw
      expect(() => tourStorage.markTourCompleted('tour-1')).not.toThrow();
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Should return empty array instead of throwing
      const completed = tourStorage.getCompletedTours();
      expect(completed).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should work with a complete tour workflow', () => {
      const tourConfig: TourConfig = {
        tourId: 'integration-test-tour',
        steps: [
          {
            id: 'step-1',
            element: '#element-1',
            title: 'Step 1',
            description: 'First step',
          },
          {
            id: 'step-2',
            element: '#element-2',
            title: 'Step 2',
            description: 'Second step',
          },
        ],
      };

      // Validate config
      const errors = validateTourConfig(tourConfig);
      expect(errors).toHaveLength(0);

      // Mock empty localStorage initially
      localStorageMock.getItem.mockReturnValue(null);

      // Mark as completed
      tourStorage.markTourCompleted(tourConfig.tourId);
      
      // Verify setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lawnquote_completed_tours',
        JSON.stringify([tourConfig.tourId])
      );
    });
  });
});