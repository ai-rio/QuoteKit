# Migration Guide - Updating to Latest Formbricks SDK

## Overview

This guide helps you migrate from older Formbricks SDK implementations to the latest patterns and best practices. Follow this guide if you have an existing Formbricks integration that needs updating.

---

## Breaking Changes Summary

### 1. Import Path Changes
**Old Pattern:**
```typescript
import formbricks from "@formbricks/js/app";
```

**New Pattern:**
```typescript
import formbricks from "@formbricks/js";
```

### 2. Initialization Method Changes
**Old Pattern:**
```typescript
await formbricks.init({
  environmentId: config.environmentId,
  apiHost: config.apiHost,
  userId: config.userId,
});
```

**New Pattern:**
```typescript
formbricks.setup({
  environmentId: config.environmentId,
  appUrl: config.appUrl, // Changed from apiHost
});

// Set user attributes separately
formbricks.setAttributes({ userId: config.userId });
```

### 3. Environment Variable Changes
**Old Pattern:**
```bash
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

**New Pattern:**
```bash
NEXT_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
```

### 4. Event Tracking Changes
**Old Pattern:**
```typescript
formbricks.track(eventName, properties);
```

**New Pattern:**
```typescript
// Direct tracking may not be available
// Use attributes and route changes instead
formbricks.setAttributes({
  lastAction: eventName,
  lastActionTime: new Date().toISOString(),
  ...properties,
});
```

---

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
# Update to latest SDK version
pnpm update @formbricks/js

# Add zod as peer dependency if not already installed
pnpm add zod
```

### Step 2: Update Import Statements

Find and replace all Formbricks imports:

```typescript
// Before
import formbricks from "@formbricks/js/app";

// After
import formbricks from "@formbricks/js";
```

### Step 3: Update Environment Variables

**In your `.env` files:**
```bash
# Before
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com

# After
NEXT_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
```

**In your code:**
```typescript
// Before
apiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST

// After
appUrl: process.env.NEXT_PUBLIC_FORMBRICKS_APP_URL
```

### Step 4: Update Initialization Code

**Before:**
```typescript
export class FormbricksManager {
  async initialize(config: FormbricksConfig): Promise<void> {
    await formbricks.init({
      environmentId: config.environmentId,
      apiHost: config.apiHost,
      userId: config.userId,
    });
  }
}
```

**After:**
```typescript
export class FormbricksManager {
  initialize(config: FormbricksConfig): void {
    formbricks.setup({
      environmentId: config.environmentId,
      appUrl: config.appUrl,
    });

    // Set user attributes separately
    if (config.userId) {
      formbricks.setAttributes({ userId: config.userId });
    }
  }
}
```

### Step 5: Update Provider Component

**Before:**
```typescript
export function FormbricksProvider() {
  const { user } = useAuth();

  useEffect(() => {
    const manager = FormbricksManager.getInstance();
    await manager.initialize({
      environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
      apiHost: process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST!,
      userId: user.id,
    });
  }, [user]);

  return null;
}
```

**After:**
```typescript
export function FormbricksProvider() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) return;

    formbricks.setup({
      environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
      appUrl: process.env.NEXT_PUBLIC_FORMBRICKS_APP_URL!,
    });

    formbricks.setAttributes({
      userId: user.id,
      email: user.email,
      // ... other attributes
    });
  }, [user]);

  // Add route change tracking
  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
```

### Step 6: Update Event Tracking

**Before:**
```typescript
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  const manager = FormbricksManager.getInstance();
  manager.trackEvent(eventName, properties);
};
```

**After:**
```typescript
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  formbricks.setAttributes({
    lastAction: eventName,
    lastActionTime: new Date().toISOString(),
    ...properties,
  });
};
```

### Step 7: Update Method Names

**Before:**
```typescript
formbricks.setUserAttributes(attributes);
```

**After:**
```typescript
formbricks.setAttributes(attributes);
```

---

## Testing Your Migration

### 1. Verify SDK Loading
```typescript
// Add temporary logging to verify initialization
useEffect(() => {
  formbricks.setup({
    environmentId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID!,
    appUrl: process.env.NEXT_PUBLIC_FORMBRICKS_APP_URL!,
  });
  
  console.log('Formbricks initialized with new SDK');
}, []);
```

### 2. Check Network Requests
- Open browser DevTools → Network tab
- Look for requests to your Formbricks instance
- Verify no 404 errors or failed requests

### 3. Test Survey Triggering
- Navigate through your app
- Verify route changes are registered
- Check that surveys appear as expected

### 4. Verify User Attributes
- Check Formbricks dashboard
- Confirm user attributes are being set correctly
- Verify survey targeting still works

---

## Common Migration Issues

### Issue 1: "formbricks is not defined"
**Cause:** Import path not updated or SDK not loaded
**Solution:**
```typescript
// Ensure correct import
import formbricks from "@formbricks/js";

// Add error handling
try {
  formbricks.setup(config);
} catch (error) {
  console.error('Formbricks setup failed:', error);
}
```

### Issue 2: Environment variables not found
**Cause:** Environment variable names not updated
**Solution:**
```bash
# Check your .env files
grep -r "FORMBRICKS" .env*

# Update all references
NEXT_PUBLIC_FORMBRICKS_APP_URL=https://app.formbricks.com
```

### Issue 3: Surveys not appearing
**Cause:** Route changes not being registered
**Solution:**
```typescript
// Add route change tracking
import { usePathname, useSearchParams } from 'next/navigation';

export function FormbricksProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    formbricks?.registerRouteChange();
  }, [pathname, searchParams]);

  return null;
}
```

### Issue 4: User attributes not syncing
**Cause:** Attributes set before initialization
**Solution:**
```typescript
useEffect(() => {
  if (!user) return;

  // Initialize first
  formbricks.setup(config);
  
  // Then set attributes
  setTimeout(() => {
    formbricks.setAttributes(userAttributes);
  }, 100);
}, [user]);
```

---

## Performance Considerations

### 1. Remove Async/Await
The new SDK doesn't require async initialization:

**Before:**
```typescript
const initializeFormbricks = async () => {
  await formbricks.init(config);
};
```

**After:**
```typescript
const initializeFormbricks = () => {
  formbricks.setup(config);
};
```

### 2. Optimize Bundle Size
The new SDK may have different bundle characteristics:

```typescript
// Consider lazy loading if needed
const FormbricksProvider = React.lazy(() => 
  import('./FormbricksProvider')
);
```

### 3. Error Boundaries
Add error boundaries around Formbricks components:

```typescript
<ErrorBoundary fallback={null}>
  <FormbricksProvider />
</ErrorBoundary>
```

---

## Rollback Plan

If you encounter issues, you can temporarily rollback:

### 1. Revert Dependencies
```bash
# Install previous version (if known)
pnpm add @formbricks/js@previous-version

# Or restore from package-lock.json backup
git checkout HEAD~1 -- package-lock.json
pnpm install
```

### 2. Revert Code Changes
```bash
# Revert specific files
git checkout HEAD~1 -- src/components/providers/FormbricksProvider.tsx

# Or create a rollback branch
git checkout -b rollback-formbricks-migration
git revert <migration-commit-hash>
```

### 3. Revert Environment Variables
```bash
# Restore old environment variables
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

---

## Post-Migration Checklist

- [ ] All imports updated to new path
- [ ] Environment variables renamed
- [ ] Initialization method updated to `setup()`
- [ ] User attributes set with `setAttributes()`
- [ ] Route change tracking added
- [ ] Event tracking updated to use attributes
- [ ] Error handling implemented
- [ ] Testing completed on all major flows
- [ ] Performance impact assessed
- [ ] Team trained on new patterns

---

## Getting Help

If you encounter issues during migration:

1. **Check the Console**: Look for specific error messages
2. **Review Network Tab**: Verify API calls are working
3. **Test in Isolation**: Create a minimal test case
4. **Check Documentation**: Refer to latest Formbricks docs
5. **Community Support**: Ask in Formbricks Discord/GitHub

---

## Next Steps

After successful migration:

1. **Monitor Performance**: Watch for any performance regressions
2. **Update Documentation**: Update your team's internal docs
3. **Plan New Features**: Consider implementing new SDK capabilities
4. **Mobile Integration**: Explore mobile SDK options if relevant

This migration should improve your Formbricks integration's reliability and unlock access to new features and improvements.
