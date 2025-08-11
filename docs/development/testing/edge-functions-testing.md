# Edge Functions Test Page

This page provides a comprehensive testing interface for Edge Functions with proper authentication and error handling.

## Access

Visit: [http://localhost:3000/test-edge-functions](http://localhost:3000/test-edge-functions)

## Features

- **Connection Testing**: Verifies Supabase connectivity before running tests
- **Authentication**: Login as admin user for authenticated function testing
- **Individual Testing**: Test each function separately with detailed results
- **Batch Testing**: Run all tests at once with progress tracking
- **Error Handling**: Clear error messages with troubleshooting guidance
- **Performance Metrics**: Response times and success rates
- **Troubleshooting Guide**: Built-in help for common issues

## Prerequisites

1. **Supabase Running**: 
   ```bash
   supabase start
   ```

2. **Migrations Applied**:
   ```bash
   supabase migration up
   ```

3. **Functions Deployed** (optional):
   ```bash
   supabase functions deploy
   ```

4. **Next.js Development Server**:
   ```bash
   npm run dev
   ```

## Quick Diagnosis

Run the diagnostic script to check your setup:

```bash
npm run edge-functions:diagnose
```

This will check:
- Supabase CLI installation
- Local Supabase instance status
- Edge Functions availability
- Database migrations
- Environment configuration
- Next.js server status

## Authentication

The test page uses the admin user created by the migration:
- **Email**: carlos@ai.rio.br
- **Password**: password123

This user is automatically created when you run `supabase migration up`.

## Troubleshooting

### Connection Issues
- Ensure Supabase is running: `supabase start`
- Check http://127.0.0.1:54321 in browser
- Verify Database Studio: http://127.0.0.1:54323

### Authentication Issues
- Run migrations: `supabase migration up`
- Check admin user exists in Database Studio
- Try refreshing the page

### Edge Functions Not Found
- Deploy functions: `supabase functions deploy`
- Check function exists in `supabase/functions/`
- Verify function is listed in Supabase Dashboard

### Network Errors
- Check if Supabase is running
- Verify no firewall blocking localhost:54321
- Try restarting Supabase: `supabase stop && supabase start`

## Function Categories

### Core Functions (Critical)
- **subscription-status**: User subscription management
- **quote-processor**: Quote creation and processing

### System Functions (Non-Critical)
- **monitoring-alerting**: System health monitoring
- **webhook-handler**: Webhook processing
- **test-connection**: Basic connectivity testing

## Success Criteria

- All critical functions should pass
- Response times should be under 2000ms
- Success rate should be 100% for deployed functions
- Authentication should work without errors

## Development Notes

This test page:
- Uses direct Supabase client configuration to avoid environment issues
- Implements proper error handling and user feedback
- Provides detailed troubleshooting information
- Includes connection status checking before testing
- Supports both individual and batch testing modes
