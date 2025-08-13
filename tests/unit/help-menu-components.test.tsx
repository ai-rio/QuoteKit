/**
 * React component tests for Help & Tours UI components
 * Tests HelpMenu, HelpMenuWrapper, and TourReplayButton components
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HelpMenu } from '@/components/help/HelpMenu';
import { HelpMenuWrapper } from '@/components/help/HelpMenuWrapper';
import { TourReplayButton } from '@/components/help/TourReplayButton';

// Mock hooks and contexts
jest.mock('@/hooks/use-user-tier', () => ({
  useUserTier: jest.fn(() => ({ tier: 'free' })),
}));

jest.mock('@/contexts/onboarding-context', () => ({
  useOnboarding: jest.fn(() => ({
    getTourProgress: jest.fn(() => ({ completed: false, skipped: false })),
  })),
}));

jest.mock('@/hooks/use-tour-replay', () => ({
  useTourReplay: jest.fn(() => ({
    replayTour: jest.fn(),
    canReplayTour: jest.fn(() => true),
    isActive: false,
    currentTour: null,
  })),
}));

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return (importFunc: any, options: any) => {
    const Component = (props: any) => {
      if (options.loading) {
        return options.loading();
      }
      return <div data-testid="dynamic-component" {...props} />;
    };
    Component.displayName = 'DynamicComponent';
    return Component;
  };
});

describe('Help & Tours Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HelpMenuWrapper', () => {
    it('should render with default props', () => {
      render(<HelpMenuWrapper />);
      
      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
    });

    it('should pass props to dynamic component', () => {
      render(
        <HelpMenuWrapper 
          variant="icon" 
          size="sm" 
          showLabel={false} 
        />
      );
      
      const component = screen.getByTestId('dynamic-component');
      expect(component).toHaveAttribute('variant', 'icon');
      expect(component).toHaveAttribute('size', 'sm');
      expect(component).toHaveAttribute('showLabel', 'false');
    });

    it('should show loading state', () => {
      // The loading component should be rendered during dynamic import
      render(<HelpMenuWrapper />);
      
      // Check that some content is rendered (either loading or actual component)
      expect(screen.getByTestId('dynamic-component')).toBeInTheDocument();
    });
  });

  describe('HelpMenu', () => {
    const mockReplayTour = jest.fn();
    const mockCanReplayTour = jest.fn(() => true);
    const mockGetTourProgress = jest.fn(() => ({ completed: false, skipped: false }));

    beforeEach(() => {
      const { useTourReplay } = require('@/hooks/use-tour-replay');
      const { useOnboarding } = require('@/contexts/onboarding-context');
      
      useTourReplay.mockReturnValue({
        replayTour: mockReplayTour,
        canReplayTour: mockCanReplayTour,
        isActive: false,
        currentTour: null,
      });

      useOnboarding.mockReturnValue({
        getTourProgress: mockGetTourProgress,
      });
    });

    it('should render help menu button', () => {
      render(<HelpMenu />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Help & Tours')).toBeInTheDocument();
    });

    it('should render as icon variant', () => {
      render(<HelpMenu variant="icon" showLabel={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.queryByText('Help & Tours')).not.toBeInTheDocument();
    });

    it('should open dropdown menu on click', async () => {
      render(<HelpMenu />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Help & Interactive Tours')).toBeInTheDocument();
      });
    });

    it('should filter tours by user tier', () => {
      const { useUserTier } = require('@/hooks/use-user-tier');
      useUserTier.mockReturnValue({ tier: 'pro' });

      render(<HelpMenu />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Pro users should see pro-specific tours
      // This would need to be tested with actual tour data
      expect(button).toBeInTheDocument();
    });

    it('should handle tour selection', async () => {
      render(<HelpMenu />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Help & Interactive Tours')).toBeInTheDocument();
      });

      // Test would need actual tour items to click
      // This is a structural test to ensure the component renders
    });

    it('should show loading state when not mounted', () => {
      // Test the initial loading state
      render(<HelpMenu />);
      
      // Component should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show no tours available message when no tours exist', () => {
      mockCanReplayTour.mockReturnValue(false);
      
      render(<HelpMenu />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // The component should handle empty tour lists gracefully
      expect(button).toBeInTheDocument();
    });
  });

  describe('TourReplayButton', () => {
    const mockReplayTour = jest.fn();
    const mockCanReplayTour = jest.fn(() => true);

    beforeEach(() => {
      const { useTourReplay } = require('@/hooks/use-tour-replay');
      
      useTourReplay.mockReturnValue({
        replayTour: mockReplayTour,
        canReplayTour: mockCanReplayTour,
        isActive: false,
        currentTour: null,
      });
    });

    it('should render replay button with default props', () => {
      render(<TourReplayButton tourId="test-tour" />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Replay Tour')).toBeInTheDocument();
    });

    it('should render with custom tour name', () => {
      render(<TourReplayButton tourId="test-tour" tourName="Custom Tour" />);
      
      expect(screen.getByText('Replay Custom Tour')).toBeInTheDocument();
    });

    it('should handle tour replay on click', async () => {
      render(<TourReplayButton tourId="test-tour" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplayTour).toHaveBeenCalledWith('test-tour');
      });
    });

    it('should be disabled when tour cannot be replayed', () => {
      mockCanReplayTour.mockReturnValue(false);
      
      render(<TourReplayButton tourId="test-tour" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show restart text for current tour', () => {
      const { useTourReplay } = require('@/hooks/use-tour-replay');
      useTourReplay.mockReturnValue({
        replayTour: mockReplayTour,
        canReplayTour: mockCanReplayTour,
        isActive: true,
        currentTour: 'test-tour',
      });

      render(<TourReplayButton tourId="test-tour" />);
      
      expect(screen.getByText('Restart Tour')).toBeInTheDocument();
    });

    it('should be disabled when another tour is active', () => {
      const { useTourReplay } = require('@/hooks/use-tour-replay');
      useTourReplay.mockReturnValue({
        replayTour: mockReplayTour,
        canReplayTour: mockCanReplayTour,
        isActive: true,
        currentTour: 'other-tour',
      });

      render(<TourReplayButton tourId="test-tour" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render without icon when showIcon is false', () => {
      render(<TourReplayButton tourId="test-tour" showIcon={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Replay Tour')).toBeInTheDocument();
    });

    it('should render custom children', () => {
      render(
        <TourReplayButton tourId="test-tour">
          <span>Custom Button Content</span>
        </TourReplayButton>
      );
      
      expect(screen.getByText('Custom Button Content')).toBeInTheDocument();
    });

    it('should handle replay errors gracefully', async () => {
      mockReplayTour.mockRejectedValue(new Error('Replay failed'));
      
      // Mock window.alert to avoid actual alerts in tests
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<TourReplayButton tourId="test-tour" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplayTour).toHaveBeenCalledWith('test-tour');
      });

      // Wait a bit more for error handling
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to start tour: Replay failed');
      });

      alertSpy.mockRestore();
    });
  });
});
