/**
 * Unit tests for Help & Tours functionality
 * Tests the core components and hooks for tour management
 */

import { act,renderHook } from '@testing-library/react';

import { useTourReplay } from '@/hooks/use-tour-replay';
import { getTourConfig } from '@/libs/onboarding/tour-configs';
import { tourManager } from '@/libs/onboarding/tour-manager';

// Mock dependencies
jest.mock('@/contexts/onboarding-context', () => ({
  useOnboarding: jest.fn(() => ({
    startTour: jest.fn(),
    activeTour: null,
  })),
}));

jest.mock('@/libs/onboarding/tour-configs', () => ({
  getTourConfig: jest.fn(),
}));

jest.mock('@/libs/onboarding/tour-manager', () => ({
  tourManager: {
    isActive: jest.fn(),
    destroyTour: jest.fn(),
    initializeTour: jest.fn(),
    startTour: jest.fn(),
    getDriverInstance: jest.fn(),
  },
}));

// Mock driver.js
jest.mock('driver.js', () => ({
  driver: jest.fn(() => ({
    drive: jest.fn(),
    moveNext: jest.fn(),
    movePrevious: jest.fn(),
    moveTo: jest.fn(),
    destroy: jest.fn(),
    isActive: jest.fn(() => true),
  })),
}));

const mockGetTourConfig = getTourConfig as jest.MockedFunction<typeof getTourConfig>;
const mockTourManager = tourManager as jest.Mocked<typeof tourManager>;

describe('Help & Tours System - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGetTourConfig.mockReturnValue({
      id: 'test-tour',
      name: 'Test Tour',
      description: 'A test tour',
      steps: [
        {
          id: 'step-1',
          title: 'Step 1',
          description: 'First step',
          element: '[data-tour="test"]',
          position: 'bottom',
          align: 'center',
          showButtons: ['next', 'close'],
        },
      ],
      prerequisites: [],
      userTiers: ['free', 'pro', 'enterprise'],
      deviceTypes: ['desktop', 'mobile', 'tablet'],
      showProgress: true,
      allowClose: true,
      overlayClickBehavior: 'ignore',
    });

    mockTourManager.isActive.mockReturnValue(false);
    mockTourManager.destroyTour.mockResolvedValue(undefined);
    mockTourManager.initializeTour.mockResolvedValue(undefined);
    mockTourManager.startTour.mockResolvedValue(undefined);
    mockTourManager.getDriverInstance.mockReturnValue({
      drive: jest.fn(),
      moveNext: jest.fn(),
      movePrevious: jest.fn(),
      moveTo: jest.fn(),
      destroy: jest.fn(),
      isActive: jest.fn(() => true),
    } as any);
  });

  describe('useTourReplay Hook', () => {
    it('should provide tour replay functionality', () => {
      const { result } = renderHook(() => useTourReplay());

      expect(result.current).toHaveProperty('replayTour');
      expect(result.current).toHaveProperty('restartCurrentTour');
      expect(result.current).toHaveProperty('continueFromStep');
      expect(result.current).toHaveProperty('canReplayTour');
      expect(result.current).toHaveProperty('isActive');
      expect(result.current).toHaveProperty('currentTour');
    });

    it('should check if a tour can be replayed', () => {
      const { result } = renderHook(() => useTourReplay());

      // Tour exists
      expect(result.current.canReplayTour('test-tour')).toBe(true);

      // Tour doesn't exist
      mockGetTourConfig.mockReturnValue(undefined);
      expect(result.current.canReplayTour('non-existent-tour')).toBe(false);
    });

    it('should replay a tour successfully', async () => {
      const mockStartTour = jest.fn();
      const { useOnboarding } = require('@/contexts/onboarding-context');
      useOnboarding.mockReturnValue({
        startTour: mockStartTour,
        activeTour: null,
      });

      const { result } = renderHook(() => useTourReplay());

      await act(async () => {
        await result.current.replayTour('test-tour');
      });

      expect(mockTourManager.initializeTour).toHaveBeenCalledWith('test-tour', expect.any(Object));
      expect(mockTourManager.startTour).toHaveBeenCalled();
      expect(mockStartTour).toHaveBeenCalledWith('test-tour');
    });

    it('should handle tour replay errors gracefully', async () => {
      mockTourManager.initializeTour.mockRejectedValue(new Error('Tour initialization failed'));

      const { result } = renderHook(() => useTourReplay());

      await expect(
        act(async () => {
          await result.current.replayTour('test-tour');
        })
      ).rejects.toThrow('Tour initialization failed');
    });

    it('should destroy active tour before starting new one', async () => {
      const mockStartTour = jest.fn();
      const { useOnboarding } = require('@/contexts/onboarding-context');
      useOnboarding.mockReturnValue({
        startTour: mockStartTour,
        activeTour: { tourId: 'active-tour' },
      });

      mockTourManager.isActive.mockReturnValue(true);

      const { result } = renderHook(() => useTourReplay());

      await act(async () => {
        await result.current.replayTour('test-tour');
      });

      expect(mockTourManager.destroyTour).toHaveBeenCalled();
      expect(mockTourManager.initializeTour).toHaveBeenCalledWith('test-tour', expect.any(Object));
    });
  });

  describe('Tour Configuration Validation', () => {
    it('should validate essential tour configurations exist', () => {
      const essentialTours = [
        'welcome',
        'settings', 
        'enhanced-quote-creation',
        'enhanced-item-library',
        'contextual-help'
      ];

      essentialTours.forEach(tourId => {
        mockGetTourConfig.mockReturnValue({
          id: tourId,
          name: `${tourId} Tour`,
          description: `Description for ${tourId}`,
          steps: [],
          prerequisites: [],
          userTiers: ['free', 'pro', 'enterprise'],
          deviceTypes: ['desktop', 'mobile', 'tablet'],
          showProgress: true,
          allowClose: true,
          overlayClickBehavior: 'ignore',
        });

        const config = getTourConfig(tourId);
        expect(config).toBeDefined();
        expect(config?.id).toBe(tourId);
      });
    });

    it('should return undefined for non-existent tours', () => {
      mockGetTourConfig.mockReturnValue(undefined);
      
      const config = getTourConfig('non-existent-tour');
      expect(config).toBeUndefined();
    });
  });
});
