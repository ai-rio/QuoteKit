/**
 * Example component demonstrating Formbricks integration usage
 * This file can be removed after testing
 */

'use client';

import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

export function FormbricksTestComponent() {
  const { trackEvent, isAvailable } = useFormbricksTracking();

  const handleTestEvent = () => {
    trackEvent(FORMBRICKS_EVENTS.DASHBOARD_VISIT, {
      testMode: true,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Formbricks Integration Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Status: {isAvailable ? '✅ Available' : '❌ Not Available'}
      </p>
      <button 
        onClick={handleTestEvent}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!isAvailable}
      >
        Test Event Tracking
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Check the browser console and Formbricks dashboard for event data.
      </p>
    </div>
  );
}