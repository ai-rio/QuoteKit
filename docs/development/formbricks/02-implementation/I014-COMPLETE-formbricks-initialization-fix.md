# Formbricks Initialization Order Fix

## Problem

The Formbricks integration was experiencing multiple API call errors and initialization order issues:

1. **"Formbricks must be initialized before setting userId"** - User authentication useEffect was running before Formbricks initialization completed
2. **Multiple API calls in loops** - No protection against duplicate setUserId and setAttributes calls
3. **Race conditions** - User context synchronization happening before SDK was ready

## Root Cause

The FormbricksProvider had two separate useEffect hooks running independently:
- Initialization useEffect (dependency: `[]`)
- User context useEffect (dependency: `[user]`)

The user useEffect could trigger before initialization was complete, causing the SDK to reject userId and attribute setting operations.

## Solution

### 1. Added Initialization State Tracking

```typescript
const [formbricksInitialized, setFormbricksInitialized] = useState(false);
const [initializationTimeout, setInitializationTimeout] = useState(false);
```

### 2. Updated Initialization Flow

- Mark Formbricks as initialized only after successful SDK initialization
- Set timeout protection (10 seconds) to prevent indefinite waiting
- Reset initialization state on errors

### 3. Fixed User Context Synchronization

```typescript
useEffect(() => {
  if (user?.id && formbricksInitialized) {
    const manager = FormbricksManager.getInstance();
    
    // Double-check that the manager is ready for user operations
    if (!manager.isReadyForUser()) {
      console.log('⏳ Manager not ready for user operations yet, waiting...');
      return;
    }
    
    // Proceed with setUserId and setAttributes
  }
}, [user, formbricksInitialized, initializationTimeout]);
```

### 4. Added Duplicate Call Protection

**FormbricksManager improvements:**

```typescript
private currentUserId: string | null = null;
private currentAttributes: Record<string, any> = {};

async setUserId(userId: string): Promise<void> {
  // Check if userId is already set to prevent duplicate calls
  if (this.currentUserId === userId) {
    console.log('👤 UserId already set - skipping duplicate call');
    return;
  }
  // ... rest of implementation
}

setAttributes(attributes: Record<string, any>): void {
  // Check if attributes are the same to prevent duplicate calls
  const attributesString = JSON.stringify(attributes);
  const currentAttributesString = JSON.stringify(this.currentAttributes);
  
  if (attributesString === currentAttributesString) {
    console.log('📋 Attributes already set - skipping duplicate call');
    return;
  }
  // ... rest of implementation
}
```

### 5. Added User Session Reset

```typescript
resetUser(): void {
  console.log('🔄 Resetting Formbricks user session');
  this.currentUserId = null;
  this.currentAttributes = {};
  
  try {
    if (typeof window !== 'undefined' && (window as any).formbricks?.reset) {
      (window as any).formbricks.reset();
    }
  } catch (error) {
    console.error('❌ Failed to reset Formbricks user session:', error);
  }
}
```

### 6. Enhanced Error Handling

- Changed synchronous errors to Promise rejections for better async handling
- Added detailed logging for debugging initialization issues
- Added timeout protection with clear error messages

## Benefits

1. **Eliminates Race Conditions**: User context only sets after Formbricks is fully initialized
2. **Prevents Duplicate API Calls**: Built-in protection against setting same userId/attributes multiple times
3. **Better Error Handling**: Graceful degradation instead of throwing errors
4. **Improved Debugging**: Comprehensive logging for troubleshooting
5. **Timeout Protection**: Prevents indefinite waiting if initialization fails

## Testing

After implementing these changes:
- ✅ No more "Formbricks must be initialized before setting userId" errors
- ✅ No more duplicate API calls in loops
- ✅ Proper initialization order maintained
- ✅ Zero TypeScript errors
- ✅ Graceful error handling and recovery

## Files Modified

1. `src/libs/formbricks/formbricks-provider.tsx` - Fixed initialization order and added state tracking
2. `src/libs/formbricks/formbricks-manager.ts` - Added duplicate call protection and user session management

## Impact

This fix resolves the critical initialization issues that were causing console errors and potential performance problems due to multiple API calls. The Formbricks integration now works reliably with proper error handling and performance optimization.
