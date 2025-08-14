# Formbricks Integration

This directory contains the complete Formbricks SDK integration for QuoteKit, implementing FB-001 from Sprint 1.

## Quick Start

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Formbricks Configuration
NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id_here
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

> **Note**: The `NEXT_PUBLIC_FORMBRICKS_API_HOST` is optional and defaults to `https://app.formbricks.com` if not specified.

### 2. Usage in Components

```typescript
import { useFormbricksTracking, FORMBRICKS_EVENTS } from '@/libs/formbricks';

function MyComponent() {
  const { trackEvent } = useFormbricksTracking();

  const handleQuoteCreated = () => {
    trackEvent(FORMBRICKS_EVENTS.QUOTE_CREATED, {
      quoteValue: 1000,
      complexity: 'simple'
    });
  };

  return <button onClick={handleQuoteCreated}>Create Quote</button>;
}
```

## Features Implemented

✅ **Singleton FormbricksManager** - Centralized SDK management  
✅ **Error Handling** - Graceful fallbacks when Formbricks is unavailable  
✅ **TypeScript Support** - Full type definitions  
✅ **React Provider** - App-wide integration  
✅ **Performance Monitoring** - < 100ms page load impact  
✅ **User Context Sync** - Automatic user attribute management  

## Architecture

- `formbricks-manager.ts` - Core SDK wrapper with singleton pattern
- `formbricks-provider.tsx` - React provider for app integration
- `types.ts` - TypeScript definitions and event constants
- `utils.ts` - Error handling and performance utilities
- `README.md` - This documentation

## Error Handling

The integration includes comprehensive error handling:

- **Initialization Failures** - App continues working without feedback
- **Network Issues** - Silent failures with console warnings
- **Missing Config** - Graceful degradation with helpful warnings

## Performance

- Lazy SDK loading to minimize initial bundle size
- Async initialization to prevent blocking
- Performance monitoring with < 100ms impact guarantee

## Next Steps

1. Set up your Formbricks account and get environment ID
2. Add environment variables to your deployment
3. Test the integration in development
4. Start adding event tracking to key user actions