'use client';

import { useEffect, useState } from 'react';

interface AccountPageWrapperProps {
  children: React.ReactNode;
}

export function AccountPageWrapper({ children }: AccountPageWrapperProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for plan change events and billing updates
  useEffect(() => {
    const handlePlanChange = (event: CustomEvent) => {
      setRefreshKey(prev => prev + 1);
      
      // Force page refresh to get latest subscription data
      // This ensures all server-side data is fresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    const handleBillingUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleBillingInvalidation = () => {
      // This will trigger re-fetch of billing data
      setRefreshKey(prev => prev + 1);
    };

    // Add event listeners
    window.addEventListener('plan-change-completed', handlePlanChange as EventListener);
    window.addEventListener('billing-history-updated', handleBillingUpdate);
    window.addEventListener('invalidate-billing-history', handleBillingInvalidation);

    return () => {
      window.removeEventListener('plan-change-completed', handlePlanChange as EventListener);
      window.removeEventListener('billing-history-updated', handleBillingUpdate);
      window.removeEventListener('invalidate-billing-history', handleBillingInvalidation);
    };
  }, []);

  return (
    <div data-refresh-key={refreshKey}>
      {children}
      {refreshKey > 0 && (
        <div className="fixed bottom-4 right-4 bg-forest-green text-paper-white px-4 py-2 rounded-lg shadow-lg">
          Plan updated! Refreshing...
        </div>
      )}
    </div>
  );
}
