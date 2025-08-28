# FB-004: Formbricks Cloud Setup Guide

## Overview

This document provides complete setup instructions for integrating Formbricks Cloud with QuoteKit. The integration is already configured and ready to use in development.

## Environment Status ✅

All required environment variables are properly configured:

```bash
# Formbricks Configuration
NEXT_PUBLIC_FORMBRICKS_ENV_ID=dev_cm5u8x9y6000114qg8x9y6000
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_DEBUG=true
```

## Integration Status ✅

The following components are implemented and active:

1. **SDK Installation** ✅ - `@formbricks/js@^4.1.0`
2. **Provider Setup** ✅ - FormbricksProvider in app layout
3. **Manager Service** ✅ - Singleton FormbricksManager class
4. **User Tracking** ✅ - Automatic user attribute synchronization
5. **Route Tracking** ✅ - Page navigation tracking hook

## Development Server Verification

The integration works with QuoteKit server running on port 3000:
- ✅ Environment variables loaded correctly
- ✅ FormbricksProvider initialized in layout
- ✅ SDK loaded and configured for development
- ✅ Connection to Formbricks Cloud established

## Team Setup Instructions

### For Developers

1. **Environment Setup**: No action needed - variables already configured in `.env`

2. **Development Server**: Start the server as usual:
   ```bash
   npm run dev
   # Server will run on http://localhost:3000
   ```

3. **Verify Integration**: Check browser console for Formbricks initialization:
   ```
   ✅ Formbricks SDK initialized successfully
   ```

4. **Debug Mode**: Formbricks debug mode is enabled in development:
   ```bash
   FORMBRICKS_DEBUG=true
   ```

### For Product/UX Teams

1. **Access Formbricks Dashboard**: 
   - URL: https://app.formbricks.com
   - Environment ID: `dev_cm5u8x9y6000114qg8x9y6000`

2. **Survey Creation**:
   - Create surveys targeting specific user actions
   - Use user attributes for personalization
   - Test surveys in development environment

3. **User Segmentation**: Available user attributes:
   ```typescript
   {
     email: string
     signupDate: string
     lastActive?: string
     subscriptionTier?: string
     quotesCreated?: number
     revenue?: number
     industry?: string
     companySize?: string
   }
   ```

### For QA/Testing

1. **Test Survey Triggers**:
   ```javascript
   // Manual trigger for testing
   window.formbricks?.track('test-event', {
     testProperty: 'value'
   });
   ```

2. **Verify User Attributes**:
   - Login to QuoteKit
   - Check Formbricks dashboard for user data
   - Verify attributes are synchronized

3. **Route Tracking**:
   - Navigate between pages
   - Verify route changes are tracked in Formbricks

## Technical Architecture

### Core Components

1. **FormbricksManager** (`src/libs/formbricks/formbricks-manager.ts`)
   - Singleton service managing SDK lifecycle
   - Error handling with graceful fallbacks
   - Initialization state management

2. **FormbricksProvider** (`src/libs/formbricks/formbricks-provider.tsx`)
   - React component for SDK initialization
   - User context synchronization
   - Automatic attribute updates

3. **useFormbricksTracking** (`src/hooks/use-formbricks-tracking.ts`)
   - Custom hook for event tracking
   - Route change detection
   - Consistent API for components

### Error Handling

The integration includes comprehensive error handling:

- **Development**: Detailed error logging
- **Production**: Silent failures to prevent UX disruption
- **Graceful Degradation**: App continues working if Formbricks fails

### Performance Considerations

- **Lazy Loading**: SDK loaded only when needed
- **Singleton Pattern**: Single instance across app
- **Error Boundaries**: Formbricks failures don't crash app
- **Minimal Bundle Impact**: Efficient SDK integration

## Production Deployment

### Environment Variables for Production

Update `.env.production.example` when deploying:

```bash
# Production Formbricks Configuration
NEXT_PUBLIC_FORMBRICKS_ENV_ID=prod_your_production_env_id
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_DEBUG=false

# Optional: Server-side features
FORMBRICKS_API_KEY=prod_sk_your_api_key
FORMBRICKS_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Deployment Checklist

- [ ] Update environment ID for production
- [ ] Disable debug mode (`FORMBRICKS_DEBUG=false`)
- [ ] Test survey triggers in staging
- [ ] Verify user attribute synchronization
- [ ] Monitor error rates post-deployment

## Troubleshooting

### Common Issues

1. **SDK Not Initializing**
   ```bash
   # Check environment variables
   echo $NEXT_PUBLIC_FORMBRICKS_ENV_ID
   echo $NEXT_PUBLIC_FORMBRICKS_API_HOST
   ```

2. **User Attributes Not Syncing**
   - Verify user is logged in
   - Check user metadata structure
   - Review FormbricksProvider implementation

3. **Surveys Not Displaying**
   - Confirm survey is published in Formbricks dashboard
   - Check targeting conditions
   - Verify trigger events are firing

### Debug Commands

```javascript
// Browser console debugging
console.log('Formbricks Status:', window.formbricks);
window.formbricks?.track('debug-test');

// Check manager status
const manager = window.FormbricksManager?.getInstance();
console.log('Manager Status:', manager?.getStatus());
```

## Support & Resources

- **Formbricks Documentation**: https://formbricks.com/docs
- **SDK Reference**: https://formbricks.com/docs/developer-docs/js-library
- **QuoteKit Integration**: `/src/libs/formbricks/README.md`

## Success Metrics

- ✅ SDK initializes without errors
- ✅ User attributes sync automatically
- ✅ Surveys display correctly on triggers
- ✅ No impact on app performance
- ✅ Error handling works as expected

---

**FB-004 Status**: ✅ **COMPLETE**  
**Last Updated**: 2025-01-14  
**Verified On**: QuoteKit server port 3000