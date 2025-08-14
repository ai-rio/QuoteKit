'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormbricksTracking } from '@/hooks/use-formbricks-tracking';
import { FORMBRICKS_EVENTS } from '@/libs/formbricks/types';

export function TrackingTest() {
  const { trackEvent, isAvailable } = useFormbricksTracking();

  const testEvents = [
    {
      name: 'Dashboard Visit',
      event: FORMBRICKS_EVENTS.DASHBOARD_VISIT,
      data: { source: 'test_component' },
    },
    {
      name: 'Quote Created',
      event: FORMBRICKS_EVENTS.QUOTE_CREATED,
      data: { 
        quoteId: 'test-quote-123',
        quoteValue: 1500,
        itemCount: 3,
        complexity: 'simple',
      },
    },
    {
      name: 'Feature Used',
      event: FORMBRICKS_EVENTS.FEATURE_USED,
      data: { 
        featureName: 'tracking_test',
        testTimestamp: new Date().toISOString(),
      },
    },
    {
      name: 'Page View',
      event: FORMBRICKS_EVENTS.PAGE_VIEW,
      data: { 
        page: '/tracking-test',
        source: 'test_component',
      },
    },
  ];

  const handleTestEvent = (eventName: string, eventData: Record<string, any>) => {
    console.log(`Testing event: ${eventName}`, eventData);
    trackEvent(eventName, eventData);
  };

  if (!isAvailable) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-600">Formbricks Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Formbricks tracking is not initialized or available. Check your environment configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Formbricks Tracking Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test event tracking functionality. Check your Formbricks dashboard for events.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Formbricks is available and initialized
            </p>
          </div>
          
          <div className="grid gap-3">
            {testEvents.map((test, index) => (
              <Button
                key={index}
                onClick={() => handleTestEvent(test.event, test.data)}
                variant="outline"
                className="text-left justify-start h-auto p-4"
              >
                <div>
                  <div className="font-semibold">{test.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Event: {test.event}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Click the buttons above to fire test events</li>
              <li>2. Open your browser&apos;s dev tools to see console logs</li>
              <li>3. Check your Formbricks dashboard for the events</li>
              <li>4. Events should appear within 5 minutes</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}