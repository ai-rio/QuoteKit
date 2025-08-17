# Analytics Dashboard Components

**FB-013: Design Analytics Dashboard UI**

This directory contains a comprehensive analytics dashboard UI system for displaying and managing Formbricks survey data. The components are built with React, TypeScript, and shadcn/ui, following QuoteKit's design patterns.

## Components Overview

### Core Components

#### `AnalyticsDashboard`
The main dashboard component that orchestrates all analytics features.

**Features:**
- Real-time data fetching and auto-refresh
- Tabbed interface (Overview, Responses, Surveys)
- Integrated filtering and export functionality
- Mobile-responsive layout
- Loading states and error handling

**Usage:**
```tsx
import { AnalyticsDashboard } from '@/components/analytics';

<AnalyticsDashboard
  initialData={analyticsData}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

#### `AnalyticsMetricsCards`
Displays key metrics in a responsive card grid.

**Metrics Displayed:**
- Total surveys and active surveys
- Total responses with trend indicators
- Average completion rate
- Response rate and engagement
- Weekly response summaries

**Features:**
- Trend calculations and visual indicators
- Loading and error states
- Mobile-first responsive design
- Color-coded performance indicators

#### `SurveyResponsesList`
Comprehensive list view of survey responses with advanced filtering.

**Features:**
- Search functionality across responses
- Sortable columns (date, survey, completion status)
- Pagination with configurable page sizes
- Response detail modal
- Survey and completion status filters
- Bulk operations support

#### `ResponseFilters`
Advanced filtering interface for customizing data views.

**Filter Options:**
- Date range selection with quick presets
- Survey selection with multi-select
- Completion status filtering
- Results per page configuration
- Active filter indicators

#### `ResponseChart`
Visualization component for response trends over time.

**Features:**
- Simple bar chart implementation
- Trend calculation and indicators
- Interactive hover states
- Performance categorization (peak, low, normal)
- Summary statistics display

#### `CompletionRateChart`
Specialized chart for survey completion rates.

**Features:**
- Progress bar visualization
- Performance distribution categories
- Top performer highlighting
- Completion rate benchmarks
- Survey-specific insights

#### `DataExportInterface`
Comprehensive data export functionality.

**Export Formats:**
- CSV (Comma-separated values)
- JSON (JavaScript Object Notation)
- Excel (Microsoft Excel workbook)

**Export Options:**
- Survey responses inclusion
- Analytics metrics inclusion
- Date range filtering
- Survey-specific exports
- Progress tracking and status updates

### Utility Components

#### `AnalyticsLoadingState`
Consistent loading states across all analytics components.

**Variants:**
- `full` - Complete dashboard loading
- `cards` - Metrics cards skeleton
- `list` - Response list skeleton
- `chart` - Chart loading placeholder

#### `AnalyticsErrorState`
Standardized error handling and display.

**Variants:**
- `card` - Card-based error display
- `banner` - Full-width error banner
- `inline` - Compact inline error

**Features:**
- Retry functionality
- Network error detection
- Troubleshooting tips
- Contextual error messages

## Data Types and Interfaces

The analytics system uses TypeScript interfaces defined in `types.ts`:

### Core Data Types
- `FormbricksAnalyticsData` - Complete analytics dataset
- `FormbricksSurvey` - Survey metadata and statistics
- `FormbricksSurveyResponse` - Individual response data
- `FormbricksAnalyticsFilters` - Filter configuration

### Component-Specific Types
- `AnalyticsDashboardProps` - Dashboard configuration
- `MetricsCardData` - Metrics display configuration
- `FilterState` - Internal filter state management
- `ExportOptions` - Export configuration
- `ChartDataPoint` - Chart data structure
- `CompletionRateData` - Completion rate metrics

## Design Principles

### Mobile-First Responsive Design
- All components adapt to screen sizes from mobile to desktop
- Touch-friendly interactive elements (44px minimum touch targets)
- Collapsible layouts for complex components
- Horizontal scrolling for data tables on mobile

### Accessibility Compliance
- ARIA labels and descriptions for all interactive elements
- Keyboard navigation support
- Screen reader friendly content structure
- High contrast color schemes
- Focus management and visual indicators

### Performance Optimization
- Lazy loading for large datasets
- Virtual scrolling for extensive lists
- Memoized calculations for expensive operations
- Efficient re-rendering with React hooks

### Error Handling
- Graceful degradation when data is unavailable
- Network error detection and recovery
- User-friendly error messages
- Retry mechanisms for failed operations

## Integration Guide

### Basic Setup

1. Import the main dashboard component:
```tsx
import { AnalyticsDashboard } from '@/components/analytics';
```

2. Provide analytics data:
```tsx
const analyticsData: FormbricksAnalyticsData = {
  surveys: [],
  responses: [],
  metrics: {
    totalSurveys: 0,
    totalResponses: 0,
    averageCompletionRate: 0,
    responseRate: 0,
    activeSurveys: 0
  },
  responsesByPeriod: [],
  completionRates: []
};
```

3. Render the dashboard:
```tsx
<AnalyticsDashboard
  initialData={analyticsData}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

### API Integration

The dashboard expects an API endpoint at `/api/analytics/formbricks` that accepts POST requests with filter parameters:

```typescript
// Request format
{
  filters: {
    dateRange: { start: Date, end: Date },
    surveyIds?: string[],
    completed?: boolean,
    limit: number,
    offset: number
  }
}

// Response format
{
  data: FormbricksAnalyticsData,
  success: boolean,
  error?: string
}
```

### Customization

#### Theming
Components use QuoteKit's design tokens:
- `bg-paper-white` - Card backgrounds
- `border-stone-gray` - Border colors
- `text-charcoal` - Primary text
- `text-success-green` - Success states
- `text-equipment-yellow` - Warning states

#### Custom Metrics
Extend `MetricsCardData` interface to add custom metrics:

```tsx
const customMetrics: MetricsCardData[] = [
  {
    title: "Custom Metric",
    value: "42",
    subtitle: "Custom description",
    icon: YourIcon,
    trend: {
      value: 15,
      direction: 'up',
      label: '+15%'
    }
  }
];
```

## Testing

Components include comprehensive TypeScript types and are designed for easy testing:

```tsx
// Example test data
const mockAnalyticsData: FormbricksAnalyticsData = {
  surveys: [
    {
      id: 'test-survey-1',
      name: 'Test Survey',
      type: 'web',
      status: 'inProgress',
      questions: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      responseCount: 100,
      completionRate: 75
    }
  ],
  // ... additional test data
};
```

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Dependencies

### Required
- React 18+
- TypeScript 5+
- @radix-ui components
- lucide-react icons
- Tailwind CSS

### Peer Dependencies
- shadcn/ui components
- QuoteKit utilities (`@/utils/cn`)

## Performance Considerations

- Use `React.memo()` for expensive child components
- Implement virtual scrolling for >1000 responses
- Consider pagination for large datasets
- Use `useMemo()` for complex calculations
- Implement proper cleanup for auto-refresh intervals

## Security Considerations

- Sanitize all user input in search fields
- Validate export file sizes before generation
- Implement proper CSRF protection for API endpoints
- Use HTTPS for all data transmission
- Implement rate limiting for export operations

---

**Note**: This analytics dashboard is designed specifically for Formbricks integration in QuoteKit. For other analytics providers, adapt the data interfaces and API integration accordingly.