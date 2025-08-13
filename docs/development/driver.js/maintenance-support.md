# Maintenance & Support Guide: Driver.js Onboarding System

## Overview

This document provides comprehensive guidance for maintaining and supporting the driver.js onboarding system in LawnQuote, including troubleshooting, updates, performance optimization, and long-term maintenance strategies.

## System Architecture Overview

### Core Components
- **Driver.js Engine**: Tour rendering and interaction handling
- **Onboarding Context**: React state management and persistence
- **Tour Configurations**: Step definitions and flow logic
- **Analytics System**: Event tracking and performance monitoring
- **Database Layer**: Progress tracking and user preferences

### Dependencies
- `driver.js`: ^1.x (tour engine)
- `@supabase/supabase-js`: Database operations
- `posthog-js`: Analytics tracking
- `react`: Context and component management

## Troubleshooting Guide

### 1. Common Issues and Solutions

#### Issue: Tours Not Starting Automatically

**Symptoms:**
- New users don't see welcome tour
- Auto-start functionality not working
- No tour triggers on page load

**Diagnosis:**
```typescript
// Debug script to check tour initialization
const debugTourStart = () => {
  console.log('User:', getCurrentUser());
  console.log('Onboarding enabled:', process.env.NEXT_PUBLIC_ONBOARDING_ENABLED);
  console.log('Tour configs:', Object.keys(TOUR_CONFIGS));
  console.log('User progress:', getUserProgress());
};
```

**Solutions:**
1. **Check Environment Variables:**
   ```bash
   # Verify onboarding is enabled
   echo $NEXT_PUBLIC_ONBOARDING_ENABLED
   echo $NEXT_PUBLIC_ONBOARDING_AUTO_START
   ```

2. **Verify User State:**
   ```typescript
   // Check if user is properly authenticated
   const { user } = useUser();
   if (!user) {
     console.error('User not authenticated - tours will not start');
   }
   ```

3. **Check Tour Prerequisites:**
   ```typescript
   // Verify tour prerequisites are met
   const canStartTour = (tourId: string) => {
     const config = TOUR_CONFIGS[tourId];
     return config.prerequisites?.every(prereq => 
       isTourCompleted(prereq)
     ) ?? true;
   };
   ```

#### Issue: Tours Breaking on Mobile Devices

**Symptoms:**
- Popovers positioned incorrectly
- Touch interactions not working
- Text too small to read

**Diagnosis:**
```typescript
// Mobile debugging utility
const debugMobileIssues = () => {
  console.log('Viewport:', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  });
  
  console.log('Touch support:', 'ontouchstart' in window);
  console.log('User agent:', navigator.userAgent);
};
```

**Solutions:**
1. **Update Mobile CSS:**
   ```css
   @media (max-width: 768px) {
     .driver-popover.lawnquote-tour {
       max-width: calc(100vw - 2rem);
       font-size: 0.9rem;
     }
     
     .driver-popover-title {
       font-size: 1.1rem;
     }
   }
   ```

2. **Adjust Touch Targets:**
   ```css
   .driver-popover button {
     min-height: 44px;
     min-width: 44px;
     padding: 0.75rem 1rem;
   }
   ```

#### Issue: High Tour Abandonment Rate

**Symptoms:**
- Users frequently skip tours
- Low completion rates in analytics
- High drop-off at specific steps

**Diagnosis:**
```sql
-- Query to identify drop-off points
SELECT 
  tour_id,
  step_id,
  COUNT(*) as views,
  COUNT(CASE WHEN event_type = 'step_complete' THEN 1 END) as completions,
  ROUND(
    COUNT(CASE WHEN event_type = 'step_complete' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as completion_rate
FROM onboarding_analytics 
WHERE event_type IN ('step_view', 'step_complete')
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY tour_id, step_id
ORDER BY completion_rate ASC;
```

**Solutions:**
1. **Shorten Tour Length:**
   ```typescript
   // Reduce steps in problematic tours
   const optimizedWelcomeTour = {
     ...TOUR_CONFIGS.WELCOME_TOUR,
     steps: TOUR_CONFIGS.WELCOME_TOUR.steps.slice(0, 4) // Keep only first 4 steps
   };
   ```

2. **Add Skip Options:**
   ```typescript
   const tourConfig = {
     ...baseTourConfig,
     showButtons: ['next', 'previous', 'close'],
     allowClose: true,
     overlayClickBehavior: 'close'
   };
   ```

3. **Improve Step Content:**
   ```typescript
   // Make descriptions more concise and actionable
   const improvedStep = {
     element: '.dashboard-stats',
     popover: {
       title: 'Track Your Progress',
       description: 'See your quote totals and recent activity at a glance.',
       side: 'bottom',
       align: 'center'
     }
   };
   ```

### 2. Performance Issues

#### Issue: Slow Tour Loading

**Diagnosis:**
```typescript
// Performance monitoring
const measureTourLoadTime = async (tourId: string) => {
  const startTime = performance.now();
  
  try {
    await loadTour(tourId);
    const loadTime = performance.now() - startTime;
    
    console.log(`Tour ${tourId} loaded in ${loadTime}ms`);
    
    // Track in analytics
    posthog.capture('tour_load_performance', {
      tour_id: tourId,
      load_time_ms: loadTime
    });
  } catch (error) {
    console.error(`Failed to load tour ${tourId}:`, error);
  }
};
```

**Solutions:**
1. **Implement Tour Preloading:**
   ```typescript
   // Preload critical tours
   useEffect(() => {
     const preloadTours = ['welcome', 'quote-creation'];
     
     preloadTours.forEach(tourId => {
       requestIdleCallback(() => {
         loadTour(tourId).catch(() => {
           // Ignore preload errors
         });
       });
     });
   }, []);
   ```

2. **Optimize Bundle Size:**
   ```javascript
   // next.config.js
   const nextConfig = {
     experimental: {
       optimizePackageImports: ['driver.js']
     }
   };
   ```

#### Issue: Memory Leaks

**Diagnosis:**
```typescript
// Memory leak detection
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    });
  }
};

// Monitor memory after tour operations
setInterval(monitorMemoryUsage, 30000);
```

**Solutions:**
1. **Proper Cleanup:**
   ```typescript
   // Ensure tours are properly destroyed
   useEffect(() => {
     return () => {
       if (driverInstance) {
         driverInstance.destroy();
       }
     };
   }, []);
   ```

2. **Remove Event Listeners:**
   ```typescript
   // Clean up event listeners
   const cleanup = () => {
     document.removeEventListener('keydown', handleKeyDown);
     window.removeEventListener('resize', handleResize);
   };
   ```

## Update Procedures

### 1. Driver.js Library Updates

**Update Process:**
```bash
# Check current version
npm list driver.js

# Update to latest version
npm update driver.js

# Run tests to ensure compatibility
npm run test:unit -- --testPathPattern=onboarding
npm run test:e2e -- tests/e2e/onboarding.spec.ts

# Check for breaking changes
npm run type-check
```

**Breaking Change Checklist:**
- [ ] API method signatures unchanged
- [ ] CSS class names still valid
- [ ] Event handler signatures compatible
- [ ] Configuration options still supported
- [ ] TypeScript types updated

### 2. Tour Content Updates

**Content Update Workflow:**
```typescript
// 1. Update tour configuration
const updatedTour = {
  ...TOUR_CONFIGS.WELCOME_TOUR,
  steps: [
    ...TOUR_CONFIGS.WELCOME_TOUR.steps,
    {
      id: 'new-feature-highlight',
      element: '.new-feature',
      popover: {
        title: 'New Feature Available!',
        description: 'Check out our latest feature to improve your workflow.',
        side: 'right',
        align: 'start'
      }
    }
  ]
};

// 2. Test updated tour
const testTourUpdate = async () => {
  const driver = createTour(updatedTour);
  await driver.drive();
};

// 3. Deploy with feature flag
const shouldShowUpdatedTour = () => {
  return getFeatureFlag('UPDATED_WELCOME_TOUR_V2');
};
```

### 3. Database Schema Updates

**Migration Process:**
```sql
-- Add new columns for enhanced tracking
ALTER TABLE user_onboarding_progress 
ADD COLUMN tour_version TEXT DEFAULT '1.0',
ADD COLUMN completion_score INTEGER DEFAULT 0,
ADD COLUMN feedback_rating INTEGER;

-- Create index for new columns
CREATE INDEX idx_tour_version ON user_onboarding_progress(tour_version);
CREATE INDEX idx_completion_score ON user_onboarding_progress(completion_score);

-- Update existing records
UPDATE user_onboarding_progress 
SET tour_version = '1.0' 
WHERE tour_version IS NULL;
```

## Monitoring and Alerting

### 1. Key Metrics to Monitor

**Performance Metrics:**
```typescript
// Define monitoring thresholds
const MONITORING_THRESHOLDS = {
  tourLoadTime: 2000, // 2 seconds
  completionRate: 70, // 70%
  errorRate: 5, // 5%
  abandonmentRate: 30, // 30%
  avgDuration: 300 // 5 minutes
};

// Automated monitoring
const checkMetrics = async () => {
  const metrics = await getOnboardingMetrics('hour');
  
  Object.entries(MONITORING_THRESHOLDS).forEach(([metric, threshold]) => {
    const value = metrics[metric];
    const isWithinThreshold = checkThreshold(metric, value, threshold);
    
    if (!isWithinThreshold) {
      sendAlert({
        metric,
        value,
        threshold,
        severity: getSeverity(metric, value, threshold)
      });
    }
  });
};
```

**Business Metrics:**
- New user onboarding completion rate
- Feature adoption after tour completion
- Time to first quote creation
- User retention correlation with tour completion

### 2. Alert Configuration

**Alert Rules:**
```typescript
const alertRules = [
  {
    name: 'Low Completion Rate',
    condition: 'completion_rate < 70',
    severity: 'critical',
    channels: ['email', 'slack'],
    cooldown: '1h'
  },
  {
    name: 'High Error Rate',
    condition: 'error_rate > 5',
    severity: 'warning',
    channels: ['slack'],
    cooldown: '30m'
  },
  {
    name: 'Tour Load Performance',
    condition: 'avg_load_time > 2000',
    severity: 'info',
    channels: ['email'],
    cooldown: '4h'
  }
];
```

### 3. Dashboard Setup

**Monitoring Dashboard Components:**
```typescript
// Key dashboard widgets
const DashboardWidgets = [
  {
    type: 'metric',
    title: 'Tours Started Today',
    query: 'onboarding_analytics.tour_start.count.today'
  },
  {
    type: 'chart',
    title: 'Completion Rate Trend',
    query: 'onboarding_analytics.completion_rate.7d'
  },
  {
    type: 'table',
    title: 'Top Drop-off Points',
    query: 'onboarding_analytics.abandonment.by_step'
  },
  {
    type: 'heatmap',
    title: 'Tour Usage by Hour',
    query: 'onboarding_analytics.usage.hourly'
  }
];
```

## Backup and Recovery

### 1. Data Backup Strategy

**Automated Backups:**
```bash
#!/bin/bash
# backup-onboarding-data.sh

# Backup onboarding tables
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -t user_onboarding_progress \
  -t onboarding_analytics \
  -t user_onboarding_preferences \
  --data-only \
  --file="onboarding_backup_$(date +%Y%m%d_%H%M%S).sql"

# Upload to cloud storage
aws s3 cp onboarding_backup_*.sql s3://lawnquote-backups/onboarding/

# Cleanup old local backups
find . -name "onboarding_backup_*.sql" -mtime +7 -delete
```

### 2. Recovery Procedures

**Data Recovery:**
```sql
-- Restore from backup
\i onboarding_backup_20250115_120000.sql

-- Verify data integrity
SELECT 
  COUNT(*) as total_progress_records,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT tour_id) as unique_tours
FROM user_onboarding_progress;

-- Check for data consistency
SELECT tour_id, status, COUNT(*) 
FROM user_onboarding_progress 
GROUP BY tour_id, status;
```

**Configuration Recovery:**
```typescript
// Backup tour configurations
const backupTourConfigs = () => {
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    configs: TOUR_CONFIGS
  };
  
  localStorage.setItem('tour_configs_backup', JSON.stringify(backup));
};

// Restore tour configurations
const restoreTourConfigs = () => {
  const backup = localStorage.getItem('tour_configs_backup');
  if (backup) {
    const { configs } = JSON.parse(backup);
    return configs;
  }
  return null;
};
```

## Documentation Maintenance

### 1. Documentation Updates

**Regular Review Schedule:**
- **Monthly**: Update troubleshooting guide with new issues
- **Quarterly**: Review and update tour content
- **Bi-annually**: Comprehensive documentation audit
- **Annually**: Architecture review and optimization

**Documentation Checklist:**
- [ ] API documentation reflects current implementation
- [ ] Troubleshooting guide includes recent issues
- [ ] Configuration examples are up to date
- [ ] Performance benchmarks are current
- [ ] Security considerations are reviewed

### 2. Knowledge Base

**Common Questions and Answers:**

**Q: How do I add a new tour step?**
```typescript
// Add step to tour configuration
const updatedTour = {
  ...existingTour,
  steps: [
    ...existingTour.steps,
    {
      id: 'new-step',
      element: '.target-element',
      popover: {
        title: 'New Feature',
        description: 'Description of the new feature',
        side: 'bottom'
      }
    }
  ]
};
```

**Q: How do I disable tours for specific users?**
```typescript
// Add user preference check
const shouldShowTour = (tourId: string, user: User) => {
  if (user.preferences?.disableOnboarding) {
    return false;
  }
  
  return !isTourCompleted(tourId);
};
```

**Q: How do I customize tour styling?**
```css
/* Override default styles */
.driver-popover.custom-theme {
  background: var(--custom-background);
  border: 2px solid var(--custom-border);
}

.driver-popover.custom-theme .driver-popover-title {
  color: var(--custom-title-color);
  font-weight: 600;
}
```

## Long-term Maintenance Strategy

### 1. Quarterly Reviews

**Performance Review:**
- Analyze completion rates and identify trends
- Review error logs and fix recurring issues
- Optimize slow-performing tours
- Update content based on user feedback

**Content Review:**
- Verify tour steps match current UI
- Update descriptions for clarity
- Remove outdated information
- Add tours for new features

### 2. Annual Planning

**Technology Updates:**
- Evaluate driver.js alternatives
- Plan major version upgrades
- Assess integration improvements
- Review security considerations

**Feature Roadmap:**
- Advanced personalization
- AI-powered tour optimization
- Multi-language support
- Enhanced analytics

### 3. Continuous Improvement

**Feedback Loop:**
```typescript
// Collect user feedback
const collectTourFeedback = (tourId: string, rating: number, comments: string) => {
  posthog.capture('tour_feedback', {
    tour_id: tourId,
    rating,
    comments,
    user_tier: getCurrentUser()?.tier
  });
};

// Analyze feedback trends
const analyzeFeedback = async () => {
  const feedback = await getFeedbackData('30d');
  
  const insights = {
    averageRating: calculateAverageRating(feedback),
    commonComplaints: extractCommonThemes(feedback.negative),
    improvementSuggestions: extractCommonThemes(feedback.positive)
  };
  
  return insights;
};
```

**A/B Testing Framework:**
```typescript
// Test different tour variations
const runTourABTest = (tourId: string, variants: TourVariant[]) => {
  const userSegment = getUserSegment();
  const variant = selectVariant(variants, userSegment);
  
  return {
    tourConfig: variant.config,
    trackingId: `${tourId}_${variant.id}`
  };
};
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Maintenance Schedule**: Monthly reviews, quarterly updates
