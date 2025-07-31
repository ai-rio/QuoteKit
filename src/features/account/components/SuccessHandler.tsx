'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SuccessHandlerProps {
  onSuccess?: () => void;
}

export function SuccessHandler({ onSuccess }: SuccessHandlerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade');
    const message = searchParams.get('message');
    
    // Prevent multiple processing of the same success event
    if (hasProcessed) return;

    if (upgradeStatus === 'success') {
      setHasProcessed(true);
      
      // Show success toast
      toast.success('🎉 Plan upgraded successfully!', {
        description: 'Your subscription has been updated. Please refresh if you don\'t see the changes immediately.',
        duration: 5000,
      });
      
      // Force refresh the page data after a short delay to allow webhook processing
      setTimeout(() => {
        router.refresh();
        onSuccess?.();
      }, 2000);
      
      // Clean up URL parameters after processing
      const url = new URL(window.location.href);
      url.searchParams.delete('upgrade');
      window.history.replaceState({}, '', url.toString());
      
    } else if (upgradeStatus === 'cancelled') {
      setHasProcessed(true);
      
      toast.info('Plan change cancelled', {
        description: 'No changes were made to your subscription.',
      });
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('upgrade');
      window.history.replaceState({}, '', url.toString());
      
    } else if (message) {
      setHasProcessed(true);
      
      // Handle other message types
      switch (message) {
        case 'same_plan':
          toast.info('Already subscribed', {
            description: 'You are already subscribed to this plan.',
          });
          break;
        case 'subscription_synced':
          toast.success('Subscription synced', {
            description: 'Your subscription data has been updated.',
          });
          router.refresh();
          break;
        case 'use_plan_change':
          toast.info('Use plan change', {
            description: 'Please use the "Change Plan" button to modify your existing subscription.',
          });
          break;
        default:
          break;
      }
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, router, hasProcessed, onSuccess]);

  return null; // This component doesn't render anything
}