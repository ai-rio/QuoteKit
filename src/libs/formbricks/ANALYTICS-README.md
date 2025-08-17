# Formbricks Analytics Data Fetching System

## FB-014: Sprint 4 Implementation Complete

This document describes the comprehensive analytics data fetching and aggregation system implemented for the Formbricks integration in Sprint 4.

## 🎯 Overview

The analytics system provides a complete solution for fetching, processing, and analyzing survey response data from Formbricks Cloud. It includes sophisticated caching, error handling, and real-time updates with React hooks for seamless UI integration.

## 📁 File Structure

```
src/libs/formbricks/
├── analytics-api.ts              # API integration for data fetching
├── data-aggregation.ts          # Data processing and analytics engine
├── cache.ts                     # Intelligent caching system
├── analytics-error-handler.ts   # Enhanced error handling
├── analytics-example.tsx        # Complete usage examples
└── ANALYTICS-README.md          # This documentation
```

## 🚀 Key Features

### 1. **FormbricksAnalyticsAPI** (`analytics-api.ts`)
- Complete API integration for Formbricks Cloud
- Automatic retry logic with exponential backoff
- Support for pagination and filtering
- Comprehensive error handling
- Rate limiting and quota management

### 2. **FormbricksDataAggregator** (`data-aggregation.ts`)
- Advanced data processing and analytics
- Quote creation workflow insights
- Survey response trend analysis
- Question-level analytics with sentiment analysis
- Performance metrics and improvement recommendations

### 3. **FormbricksAnalyticsCache** (`cache.ts`)
- High-performance caching with multiple storage strategies
- Intelligent cache invalidation
- Compression for large datasets
- Cache warming and preloading
- Detailed cache statistics and health monitoring

### 4. **React Hooks** (`useAnalyticsData.ts`)
- `useAnalyticsData()` - Main analytics data fetching
- `useSurveys()` - Survey management
- `useSurveyResponses()` - Response data with pagination
- `useSurveyAnalytics()` - Detailed survey insights
- `useQuoteCreationInsights()` - Quote workflow analytics
- `useRealTimeAnalytics()` - Live data updates

### 5. **Error Handling** (`analytics-error-handler.ts`)
- Sophisticated error recovery strategies
- Health monitoring and diagnostics
- Automatic fallback mechanisms
- Error pattern analysis and recommendations

## 🔧 Quick Start

### Basic Usage

```typescript
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

function MyAnalyticsComponent() {
  const {
    data,
    loading,
    error,
    refetch,
    lastUpdated
  } = useAnalyticsData({
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    },
    enableRealTimeUpdates: true,
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Analytics Dashboard</h2>
      <p>Total Surveys: {data?.metrics.totalSurveys}</p>
      <p>Total Responses: {data?.metrics.totalResponses}</p>
      <p>Completion Rate: {data?.metrics.averageCompletionRate}%</p>
    </div>
  );
}
```

### Advanced Usage with Quote Creation Insights

```typescript
import { useQuoteCreationInsights } from '@/hooks/useAnalyticsData';

function QuoteInsightsDashboard() {
  const { insights, loading, error } = useQuoteCreationInsights();

  if (loading) return <div>Loading insights...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Quote Creation Insights</h2>
      <div>
        <p>Total Quotes: {insights?.totalQuoteCreations}</p>
        <p>Survey Completion Rate: {insights?.surveyCompletionRate * 100}%</p>
        <p>Average Complexity: {insights?.averageComplexityScore}</p>
      </div>
      
      <h3>Improvement Areas</h3>
      {insights?.improvementAreas.map((area, index) => (
        <div key={index} className={`priority-${area.priority}`}>
          <strong>{area.area}</strong>
          <p>{area.suggestion}</p>
          <span>Impact Score: {area.impactScore}</span>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Analytics

```typescript
import { useRealTimeAnalytics } from '@/hooks/useAnalyticsData';

function RealTimeComponent() {
  const {
    data,
    isLive,
    lastUpdated,
    refetch
  } = useRealTimeAnalytics(30000); // Update every 30 seconds

  return (
    <div>
      <div className={`status ${isLive ? 'live' : 'offline'}`}>
        {isLive ? '🟢 Live' : '🔴 Offline'}
      </div>
      <p>Last updated: {lastUpdated?.toLocaleTimeString()}</p>
      <button onClick={refetch}>Force Refresh</button>
    </div>
  );
}
```

## 🛠️ Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_FORMBRICKS_ENV_ID=your_environment_id

# Optional
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
FORMBRICKS_API_KEY=your_api_key
```

### Custom Configuration

```typescript
import { 
  createFormbricksAnalyticsAPI,
  createAnalyticsCache,
  createDataAggregator
} from '@/libs/formbricks';

// Custom API configuration
const api = createFormbricksAnalyticsAPI({
  environmentId: 'your_env_id',
  apiKey: 'your_api_key',
  apiHost: 'https://your-custom-host.com'
});

// Custom cache configuration
const cache = createAnalyticsCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
  strategy: 'localStorage',
  enableCompression: true
});

// Custom aggregator configuration
const aggregator = createDataAggregator({
  groupBy: 'day',
  timeZone: 'America/New_York',
  includeIncomplete: false,
  minResponseThreshold: 10
});
```

## 📊 Data Types

### Analytics Data Structure

```typescript
interface FormbricksAnalyticsData {
  surveys: FormbricksSurvey[];
  responses: FormbricksSurveyResponse[];
  metrics: {
    totalSurveys: number;
    totalResponses: number;
    averageCompletionRate: number;
    responseRate: number;
    activeSurveys: number;
  };
  responsesByPeriod: Array<{
    date: string;
    count: number;
  }>;
  completionRates: Array<{
    surveyId: string;
    surveyName: string;
    completionRate: number;
  }>;
}
```

### Quote Creation Insights

```typescript
interface QuoteCreationInsights {
  totalQuoteCreations: number;
  surveyTriggerRate: number;
  surveyCompletionRate: number;
  averageComplexityScore: number;
  workflowAnalytics: QuoteWorkflowAnalytics;
  satisfactionTrends: TrendData[];
  improvementAreas: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impactScore: number;
  }>;
}
```

## 🗄️ Caching Strategy

### Cache Levels

1. **Memory Cache** - Fastest access, session-based
2. **localStorage** - Persistent across sessions
3. **sessionStorage** - Tab-specific storage

### Cache TTL (Time to Live)

- Analytics data: 10 minutes
- Survey list: 15 minutes
- Survey responses: 3 minutes
- Survey details: 5 minutes

### Cache Invalidation

```typescript
// Manual cache invalidation
const { invalidateCache } = useAnalyticsData();
invalidateCache(); // Clears analytics cache

// Pattern-based invalidation
const cache = getDefaultCache();
cache.invalidate('surveys_*'); // Clear all survey-related cache
cache.invalidate(/analytics_.*/); // Clear with regex pattern
```

## 🚨 Error Handling

### Error Recovery Strategies

1. **Retry** - Automatic retry with exponential backoff
2. **Cache Fallback** - Use cached data when API fails
3. **Graceful Degradation** - Show partial data or fallback UI
4. **Skip Non-Critical** - Continue operation without failed component

### Error Monitoring

```typescript
import { getDefaultErrorHandler } from '@/libs/formbricks/analytics-error-handler';

const errorHandler = getDefaultErrorHandler();

// Get health status
const health = errorHandler.getHealthStatus();
console.log('System health:', health.status); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Error rate:', health.errorRate); // Percentage
console.log('Recommendations:', health.recommendations); // Array of suggestions

// Get detailed metrics
const metrics = errorHandler.getMetrics();
console.log('Total errors:', metrics.totalErrors);
console.log('Errors by type:', metrics.errorsByType);
console.log('Retry success rate:', metrics.retrySuccessRate);
```

## 🔄 Real-time Updates

### Configuration Options

```typescript
const options = {
  enableRealTimeUpdates: true,
  refetchInterval: 30000, // 30 seconds
  enableCaching: true,
  retryOnError: true
};

const { data, isLive } = useAnalyticsData(options);
```

### Update Strategies

- **Polling** - Regular interval fetching
- **Smart Refresh** - Only fetch when data is stale
- **Background Updates** - Non-blocking data refresh
- **Error Resilience** - Continue updates despite errors

## 🎨 UI Integration

### Complete Example Component

See `analytics-example.tsx` for a comprehensive dashboard implementation including:

- Real-time status indicators
- Metric cards with trend indicators
- Interactive survey selection
- Error states and retry mechanisms
- Cache information display
- Quote creation insights
- Improvement recommendations

### Styling Integration

The example uses Tailwind CSS classes but can be adapted to any styling system:

```typescript
// Custom styling example
const MetricCard = ({ title, value, trend }) => (
  <div className="metric-card">
    <div className="metric-title">{title}</div>
    <div className="metric-value">{value}</div>
    <div className={`metric-trend ${trend > 0 ? 'positive' : 'negative'}`}>
      {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
    </div>
  </div>
);
```

## 🧪 Testing

### API Testing

```typescript
import { getDefaultAnalyticsAPI } from '@/libs/formbricks/analytics-api';

// Test API connectivity
const api = getDefaultAnalyticsAPI();
const isConnected = await api.testConnection();
console.log('API connected:', isConnected);

// Test data fetching
try {
  const surveys = await api.getSurveys();
  console.log('Fetched surveys:', surveys.length);
} catch (error) {
  console.error('API test failed:', error);
}
```

### Cache Testing

```typescript
import { getDefaultCache } from '@/libs/formbricks/cache';

const cache = getDefaultCache();

// Test cache operations
cache.set('test_key', { test: 'data' });
const cached = cache.get('test_key');
console.log('Cache test:', cached);

// Check cache stats
const stats = cache.getStats();
console.log('Cache performance:', {
  hitRate: stats.hitRate,
  entries: stats.entries,
  memoryUsage: stats.memoryUsage
});
```

## 📈 Performance Optimization

### Best Practices

1. **Use Appropriate Cache TTL** - Balance freshness vs performance
2. **Enable Compression** - For large datasets
3. **Implement Pagination** - For response data
4. **Use Filters** - Reduce data transfer
5. **Monitor Cache Hit Rate** - Optimize cache strategy

### Performance Metrics

- Cache hit rate > 80%
- API response time < 2 seconds
- UI render time < 100ms
- Memory usage < 50MB

## 🔍 Debugging

### Debug Mode

```typescript
// Enable debug logging
const api = createFormbricksAnalyticsAPI({
  environmentId: 'your_env_id',
  debug: true
});

// Check manager status
import { getFormbricksManager } from '@/libs/formbricks';
const manager = getFormbricksManager();
const status = manager.getStatus();
console.log('Manager status:', status);
```

### Common Issues

1. **Environment ID Invalid** - Check Formbricks dashboard
2. **Network Errors** - Verify connectivity and CORS
3. **Cache Issues** - Clear cache and restart
4. **Rate Limiting** - Implement proper retry logic

## 📋 Integration Checklist

- [ ] Environment variables configured
- [ ] API connectivity tested
- [ ] Cache strategy implemented
- [ ] Error handling configured
- [ ] Real-time updates enabled
- [ ] UI components integrated
- [ ] Performance optimized
- [ ] Analytics tracking added

## 🎉 Success Criteria

✅ **Sprint 4 Complete - All Requirements Met:**

1. ✅ **API Integration** - Complete Formbricks API integration with retry logic
2. ✅ **Data Aggregation** - Advanced analytics processing and insights
3. ✅ **Caching System** - High-performance caching with multiple strategies
4. ✅ **Error Handling** - Comprehensive error recovery and monitoring
5. ✅ **React Hooks** - Complete hook ecosystem for UI integration
6. ✅ **Real-time Updates** - Live data updates with performance optimization
7. ✅ **Quote Insights** - Specialized analytics for quote creation workflow
8. ✅ **Documentation** - Complete usage examples and integration guide

The analytics data fetching system is now ready for UI integration and provides a robust foundation for data-driven insights in QuoteKit.

## 🚀 Next Steps

1. Integrate analytics components into main application
2. Add custom dashboard visualizations
3. Implement alert system for critical metrics
4. Add export functionality for reports
5. Configure automated monitoring and alerting

---

**Note**: This implementation provides the complete backend infrastructure for analytics. The UI components in `analytics-example.tsx` demonstrate full integration and can be customized to match your application's design system.