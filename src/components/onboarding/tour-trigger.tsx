'use client';

import { HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/onboarding-context';

type TourTriggerProps = {
  tourId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
};

export function TourTrigger({ 
  tourId, 
  variant = 'outline', 
  size = 'sm',
  children 
}: TourTriggerProps) {
  const { startTour, shouldShowTour, availableTours } = useOnboarding();

  const tour = availableTours.find(t => t.id === tourId);
  const canShowTour = shouldShowTour(tourId);

  if (!tour || !canShowTour) {
    return null;
  }

  const handleStartTour = () => {
    startTour(tourId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartTour}
      className="flex items-center gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      {children || 'Start Tour'}
    </Button>
  );
}