# Component Specifications: Driver.js React Components

## Overview

This document specifies the React components needed for the driver.js integration in LawnQuote. Each component is designed to be reusable, type-safe, and consistent with the existing design system.

## Core Components

### 1. OnboardingProvider

**File**: `src/contexts/onboarding/OnboardingProvider.tsx`

```typescript
interface OnboardingProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
  enableAnalytics?: boolean;
  debugMode?: boolean;
}

interface OnboardingContextValue {
  // State
  isActive: boolean;
  currentTour: string | null;
  currentStep: number;
  userProgress: OnboardingProgress;
  
  // Actions
  startTour: (tourId: string, options?: TourOptions) => Promise<void>;
  pauseTour: () => Promise<void>;
  resumeTour: () => Promise<void>;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  resetProgress: () => Promise<void>;
  
  // Utilities
  isTourCompleted: (tourId: string) => boolean;
  shouldShowTour: (tourId: string) => boolean;
  getTourProgress: (tourId: string) => TourProgress | null;
}

export function OnboardingProvider({ 
  children, 
  autoStart = true,
  enableAnalytics = true,
  debugMode = false 
}: OnboardingProviderProps) {
  // Implementation details
}
```

**Usage Example:**
```typescript
// In app layout
<OnboardingProvider autoStart={true} enableAnalytics={true}>
  <App />
</OnboardingProvider>
```

### 2. TourTrigger

**File**: `src/components/onboarding/TourTrigger.tsx`

```typescript
interface TourTriggerProps {
  tourId: string;
  trigger?: 'click' | 'hover' | 'focus' | 'auto' | 'manual';
  delay?: number;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onTourStart?: () => void;
  onTourComplete?: () => void;
}

export function TourTrigger({
  tourId,
  trigger = 'click',
  delay = 0,
  children,
  className,
  disabled = false,
  onTourStart,
  onTourComplete
}: TourTriggerProps) {
  const { startTour, isTourCompleted } = useOnboarding();
  
  const handleTrigger = useCallback(async () => {
    if (disabled || isTourCompleted(tourId)) return;
    
    if (delay > 0) {
      setTimeout(() => startTour(tourId), delay);
    } else {
      await startTour(tourId);
    }
    
    onTourStart?.();
  }, [tourId, delay, disabled, startTour, onTourStart]);

  // Implementation based on trigger type
}
```

**Usage Examples:**
```typescript
// Click trigger
<TourTrigger tourId="welcome" trigger="click">
  <Button>Start Tour</Button>
</TourTrigger>

// Auto trigger with delay
<TourTrigger tourId="dashboard-intro" trigger="auto" delay={2000} />

// Hover trigger
<TourTrigger tourId="feature-preview" trigger="hover">
  <HelpIcon />
</TourTrigger>
```

### 3. TourProgress

**File**: `src/components/onboarding/TourProgress.tsx`

```typescript
interface TourProgressProps {
  tourId?: string;
  showSteps?: boolean;
  showPercentage?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
}

export function TourProgress({
  tourId,
  showSteps = true,
  showPercentage = false,
  className,
  variant = 'default'
}: TourProgressProps) {
  const { currentTour, currentStep, getTourProgress } = useOnboarding();
  
  const activeTourId = tourId || currentTour;
  const progress = activeTourId ? getTourProgress(activeTourId) : null;
  
  if (!progress) return null;

  const percentage = (progress.completedSteps / progress.totalSteps) * 100;

  return (
    <div className={cn("tour-progress", className)}>
      {variant === 'detailed' && (
        <div className="tour-progress-header">
          <h4 className="tour-progress-title">{progress.tourName}</h4>
          <span className="tour-progress-status">
            {progress.isCompleted ? 'Completed' : 'In Progress'}
          </span>
        </div>
      )}
      
      <div className="tour-progress-bar">
        <div 
          className="tour-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showSteps && (
        <div className="tour-progress-steps">
          Step {progress.currentStep + 1} of {progress.totalSteps}
        </div>
      )}
      
      {showPercentage && (
        <div className="tour-progress-percentage">
          {Math.round(percentage)}% Complete
        </div>
      )}
    </div>
  );
}
```

### 4. OnboardingChecklist

**File**: `src/components/onboarding/OnboardingChecklist.tsx`

```typescript
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  tourId?: string;
  isCompleted: boolean;
  isOptional?: boolean;
  estimatedTime?: string;
}

interface OnboardingChecklistProps {
  items?: ChecklistItem[];
  showProgress?: boolean;
  allowManualCompletion?: boolean;
  onItemClick?: (item: ChecklistItem) => void;
  className?: string;
}

export function OnboardingChecklist({
  items,
  showProgress = true,
  allowManualCompletion = false,
  onItemClick,
  className
}: OnboardingChecklistProps) {
  const { startTour, isTourCompleted } = useOnboarding();
  
  const defaultItems: ChecklistItem[] = [
    {
      id: 'welcome',
      title: 'Welcome Tour',
      description: 'Get familiar with your dashboard',
      tourId: 'welcome',
      isCompleted: isTourCompleted('welcome'),
      estimatedTime: '2 min'
    },
    {
      id: 'company-setup',
      title: 'Company Setup',
      description: 'Configure your company information',
      tourId: 'settings',
      isCompleted: isTourCompleted('settings'),
      estimatedTime: '5 min'
    },
    {
      id: 'first-quote',
      title: 'Create First Quote',
      description: 'Learn the quote creation process',
      tourId: 'quote-creation',
      isCompleted: isTourCompleted('quote-creation'),
      estimatedTime: '3 min'
    }
  ];

  const checklistItems = items || defaultItems;
  const completedCount = checklistItems.filter(item => item.isCompleted).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  return (
    <Card className={cn("onboarding-checklist", className)}>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        {showProgress && (
          <div className="checklist-progress">
            <Progress value={progressPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {completedCount} of {checklistItems.length} completed
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="checklist-items space-y-3">
          {checklistItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onItemClick={onItemClick}
              allowManualCompletion={allowManualCompletion}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. TourTooltip

**File**: `src/components/onboarding/TourTooltip.tsx`

```typescript
interface TourTooltipProps {
  content: string;
  tourId?: string;
  stepId?: string;
  children: React.ReactNode;
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'right' | 'bottom' | 'left';
  showOnlyOnce?: boolean;
  className?: string;
}

export function TourTooltip({
  content,
  tourId,
  stepId,
  children,
  trigger = 'hover',
  position = 'top',
  showOnlyOnce = false,
  className
}: TourTooltipProps) {
  const [hasShown, setHasShown] = useState(false);
  const { trackTooltipView } = useOnboarding();
  
  const shouldShow = !showOnlyOnce || !hasShown;
  
  const handleShow = useCallback(() => {
    if (showOnlyOnce) {
      setHasShown(true);
    }
    
    if (tourId && stepId) {
      trackTooltipView(tourId, stepId);
    }
  }, [showOnlyOnce, tourId, stepId, trackTooltipView]);

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={position}
          className={cn("tour-tooltip", className)}
          onOpenChange={(open) => open && handleShow()}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Specialized Components

### 6. FeatureSpotlight

**File**: `src/components/onboarding/FeatureSpotlight.tsx`

```typescript
interface FeatureSpotlightProps {
  feature: {
    name: string;
    description: string;
    benefits: string[];
    tier: 'free' | 'pro' | 'enterprise';
    isNew?: boolean;
  };
  onTryFeature?: () => void;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function FeatureSpotlight({
  feature,
  onTryFeature,
  onUpgrade,
  onDismiss,
  className
}: FeatureSpotlightProps) {
  const { user } = useUser();
  const canAccess = user?.tier === feature.tier || 
                   (feature.tier === 'free' && ['pro', 'enterprise'].includes(user?.tier));

  return (
    <Card className={cn("feature-spotlight", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{feature.name}</CardTitle>
            {feature.isNew && (
              <Badge variant="secondary">New</Badge>
            )}
            <Badge variant={feature.tier === 'free' ? 'default' : 'premium'}>
              {feature.tier}
            </Badge>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-2 mb-4">
          {feature.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              {benefit}
            </li>
          ))}
        </ul>
        
        <div className="flex gap-2">
          {canAccess ? (
            <Button onClick={onTryFeature} className="flex-1">
              Try It Now
            </Button>
          ) : (
            <Button onClick={onUpgrade} className="flex-1">
              Upgrade to Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7. OnboardingStats

**File**: `src/components/onboarding/OnboardingStats.tsx`

```typescript
interface OnboardingStatsProps {
  userId?: string;
  timeframe?: 'week' | 'month' | 'all';
  showComparison?: boolean;
  className?: string;
}

export function OnboardingStats({
  userId,
  timeframe = 'month',
  showComparison = false,
  className
}: OnboardingStatsProps) {
  const { data: stats, isLoading } = useOnboardingStats(userId, timeframe);
  
  if (isLoading) {
    return <div className="animate-pulse">Loading stats...</div>;
  }

  return (
    <div className={cn("onboarding-stats grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <StatCard
        title="Tours Completed"
        value={stats.toursCompleted}
        change={showComparison ? stats.toursCompletedChange : undefined}
        icon={<CheckCircle className="h-4 w-4" />}
      />
      
      <StatCard
        title="Features Discovered"
        value={stats.featuresDiscovered}
        change={showComparison ? stats.featuresDiscoveredChange : undefined}
        icon={<Lightbulb className="h-4 w-4" />}
      />
      
      <StatCard
        title="Time Saved"
        value={`${stats.timeSaved}min`}
        change={showComparison ? stats.timeSavedChange : undefined}
        icon={<Clock className="h-4 w-4" />}
      />
      
      <StatCard
        title="Completion Rate"
        value={`${stats.completionRate}%`}
        change={showComparison ? stats.completionRateChange : undefined}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
```

## Utility Components

### 8. TourDebugger

**File**: `src/components/onboarding/TourDebugger.tsx`

```typescript
interface TourDebuggerProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function TourDebugger({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right' 
}: TourDebuggerProps) {
  const { 
    currentTour, 
    currentStep, 
    userProgress, 
    startTour, 
    resetProgress 
  } = useOnboarding();
  
  const [isOpen, setIsOpen] = useState(false);
  
  if (!enabled) return null;

  return (
    <div className={cn("fixed z-50", {
      'top-4 left-4': position === 'top-left',
      'top-4 right-4': position === 'top-right',
      'bottom-4 left-4': position === 'bottom-left',
      'bottom-4 right-4': position === 'bottom-right',
    })}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2"
      >
        🔧 Tour Debug
      </Button>
      
      {isOpen && (
        <Card className="w-80 max-h-96 overflow-auto">
          <CardHeader>
            <CardTitle className="text-sm">Tour Debugger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Current Tour</Label>
              <p className="text-sm font-mono">{currentTour || 'None'}</p>
            </div>
            
            <div>
              <Label className="text-xs">Current Step</Label>
              <p className="text-sm font-mono">{currentStep}</p>
            </div>
            
            <div>
              <Label className="text-xs">Quick Actions</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                <Button size="xs" onClick={() => startTour('welcome')}>
                  Welcome
                </Button>
                <Button size="xs" onClick={() => startTour('quote-creation')}>
                  Quote
                </Button>
                <Button size="xs" onClick={() => resetProgress()}>
                  Reset
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Progress</Label>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(userProgress, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Component Integration Examples

### Dashboard Integration

```typescript
// src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      {/* Auto-trigger welcome tour for new users */}
      <TourTrigger tourId="welcome" trigger="auto" delay={1000} />
      
      {/* Onboarding checklist in sidebar */}
      <aside className="dashboard-sidebar">
        <OnboardingChecklist showProgress={true} />
      </aside>
      
      {/* Main dashboard content */}
      <main className="dashboard-main">
        <div className="dashboard-stats">
          <TourTooltip content="Track your business performance here">
            <StatsCards />
          </TourTooltip>
        </div>
        
        <div className="quick-actions">
          <TourTrigger tourId="quote-creation">
            <Button>Create New Quote</Button>
          </TourTrigger>
        </div>
      </main>
      
      {/* Debug panel in development */}
      <TourDebugger />
    </div>
  );
}
```

### Settings Page Integration

```typescript
// src/app/(app)/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="settings-container">
      <TourTrigger tourId="settings" trigger="auto" delay={500} />
      
      <div className="settings-content">
        <TourTooltip 
          content="Complete your company profile for professional quotes"
          showOnlyOnce={true}
        >
          <CompanyProfileCard />
        </TourTooltip>
        
        <FeatureSpotlight
          feature={{
            name: "Custom Branding",
            description: "Add your logo and colors to quotes",
            benefits: ["Professional appearance", "Brand consistency", "Client trust"],
            tier: "pro"
          }}
          onUpgrade={() => router.push('/pricing')}
        />
      </div>
    </div>
  );
}
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: After component implementation
