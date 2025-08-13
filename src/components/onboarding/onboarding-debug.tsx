'use client';

import { Play, RefreshCw, RotateCcw, SkipForward,Square } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOnboarding } from '@/contexts/onboarding-context';

export function OnboardingDebug() {
  const {
    progress,
    activeTour,
    isLoading,
    availableTours,
    startTour,
    completeTour,
    skipTour,
    exitTour,
    nextStep,
    previousStep,
    resetProgress,
    syncProgress,
    getNextRecommendedTour,
  } = useOnboarding();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading onboarding state...</p>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No onboarding progress found (user not authenticated)</p>
        </CardContent>
      </Card>
    );
  }

  const nextRecommendedTour = getNextRecommendedTour();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Onboarding Debug Panel
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={syncProgress}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
            <Button variant="destructive" size="sm" onClick={resetProgress}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor and control onboarding state for user: {progress.userId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Progress Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.sessionCount}</div>
              <div className="text-sm text-muted-foreground">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.completedTours.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{progress.skippedTours.length}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.hasSeenWelcome ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Welcomed</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Active Tour */}
        {activeTour && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Active Tour</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{activeTour.tourId}</span>
                <Badge variant="secondary">
                  Step {activeTour.currentStep + 1}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={previousStep} disabled={activeTour.currentStep === 0}>
                  Previous
                </Button>
                <Button size="sm" onClick={nextStep}>
                  Next
                </Button>
                <Button size="sm" variant="outline" onClick={exitTour}>
                  <Square className="h-4 w-4 mr-2" />
                  Exit
                </Button>
                <Button size="sm" variant="outline" onClick={() => skipTour(activeTour.tourId)}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Tour */}
        {nextRecommendedTour && !activeTour && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Recommended Tour</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{nextRecommendedTour.name}</div>
                  <div className="text-sm text-muted-foreground">{nextRecommendedTour.description}</div>
                </div>
                <Button size="sm" onClick={() => startTour(nextRecommendedTour.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Available Tours */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Available Tours</h3>
          <div className="grid gap-3">
            {availableTours.map((tour) => {
              const isCompleted = progress.completedTours.includes(tour.id);
              const isSkipped = progress.skippedTours.includes(tour.id);
              const isActive = activeTour?.tourId === tour.id;
              
              return (
                <div key={tour.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tour.name}</span>
                      {isCompleted && <Badge variant="default">Completed</Badge>}
                      {isSkipped && <Badge variant="secondary">Skipped</Badge>}
                      {isActive && <Badge variant="destructive">Active</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{tour.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {tour.steps.length} steps • Priority: {tour.priority || 0}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isCompleted && !isActive && (
                      <Button size="sm" variant="outline" onClick={() => startTour(tour.id)}>
                        Start
                      </Button>
                    )}
                    {isCompleted && (
                      <Button size="sm" variant="outline" onClick={() => startTour(tour.id)}>
                        Replay
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw Data */}
        <details className="border rounded-lg p-4">
          <summary className="cursor-pointer font-medium">Raw Progress Data</summary>
          <pre className="mt-4 text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(progress, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}