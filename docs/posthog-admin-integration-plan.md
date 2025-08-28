# PostHog Admin Control Panel Integration Plan

## Overview

This document outlines the integration plan for PostHog analytics into QuoteKit's admin-only control panel. The admin panel will provide complete oversight and control over all users and the email system, leveraging PostHog's powerful analytics capabilities while maintaining strict compliance with the LawnQuote Design System Specification.

## Design System Compliance

All admin panel components MUST follow the specifications in `@docs/design-system-specification.md`:

### Required Color Palette
```css
--forest-green: 147 21% 20%;      /* Primary admin actions */
--equipment-yellow: 47 95% 49%;    /* Secondary admin actions */
--light-concrete: 0 0% 96%;       /* Page backgrounds */
--stone-gray: 0 0% 85%;           /* Borders & subtle elements */
--charcoal: 0 0% 11%;             /* Primary text */
--paper-white: 0 0% 100%;         /* Card backgrounds */
```

### Component Standards
- **Cards**: `bg-paper-white border-stone-gray shadow-sm`
- **Buttons**: Primary (`bg-forest-green text-white`), Secondary (`bg-equipment-yellow text-charcoal`)
- **Inputs**: `bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green`
- **Typography**: `text-charcoal` variants, financial values use `font-mono`

## Admin Control Panel Architecture

### Route Structure
```
/admin/
├── dashboard/              # System overview with PostHog metrics
├── users/                 # Complete user management & analytics
│   ├── overview/          # User listing with analytics
│   ├── [userId]/          # Individual user detailed analytics
│   └── bulk-actions/      # Mass user operations
├── email-system/          # Email control center
│   ├── campaigns/         # Mass email campaign management
│   ├── performance/       # Email analytics dashboard
│   └── templates/         # Template management
└── analytics/             # Advanced PostHog query interface
    ├── custom-queries/    # SQL-like HogQL queries
    ├── funnels/          # Conversion funnel analysis
    └── cohorts/          # User segmentation
```

## PostHog Integration Components

### 1. Admin Dashboard Analytics

#### Core System Metrics Component
Using shadcn/ui v4 `dashboard-01` block as foundation with design system compliance:

```tsx
// Admin metrics cards - MUST use design system colors
<Card className="bg-paper-white border-stone-gray shadow-sm">
  <CardHeader className="pb-4">
    <CardTitle className="text-section-title text-charcoal">System Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Metrics with proper typography */}
      <div className="text-center">
        <div className="font-mono text-2xl text-charcoal">{totalUsers}</div>
        <div className="text-charcoal/70 text-sm">Total Users</div>
      </div>
    </div>
  </CardContent>
</Card>
```

#### PostHog Query API Integration
```typescript
// System-wide analytics query
const systemMetrics = await fetch(`${posthogUrl}/api/projects/${projectId}/query/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${personalApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: {
      kind: 'HogQLQuery',
      query: `
        SELECT 
          countDistinct(properties.user_id) as total_users,
          countIf(event = 'quote_created') as quotes_created,
          countIf(event = 'quote_sent') as quotes_sent,
          countIf(event = 'quote_accepted') as quotes_accepted,
          sum(properties.quote_value) as total_revenue
        FROM events
        WHERE timestamp >= now() - interval 30 day
      `
    }
  })
})
```

### 2. User Management System

#### User Analytics Table Component
Design system compliant table using proper color classes:

```tsx
// User listing with analytics - proper design system colors
<div className="bg-paper-white border-stone-gray rounded-lg shadow-sm">
  {/* Table header */}
  <div className="grid grid-cols-12 gap-4 font-bold text-sm text-charcoal/60 mb-2 px-3 py-2 bg-light-concrete">
    <div className="col-span-3">USER</div>
    <div className="col-span-2">QUOTES</div>
    <div className="col-span-2">REVENUE</div>
    <div className="col-span-2">LAST ACTIVE</div>
    <div className="col-span-3">ACTIONS</div>
  </div>
  
  {/* User rows */}
  {users.map(user => (
    <div className="grid grid-cols-12 gap-4 items-center p-3 hover:bg-stone-gray/20 border-b border-stone-gray/50">
      <div className="col-span-3">
        <div className="text-charcoal font-medium">{user.email}</div>
        <div className="text-charcoal/70 text-sm">{user.company_name}</div>
      </div>
      <div className="col-span-2 font-mono text-charcoal">{user.quote_count}</div>
      <div className="col-span-2 font-mono text-charcoal">${user.total_revenue}</div>
      <div className="col-span-2 text-charcoal/70 text-sm">{user.last_active}</div>
      <div className="col-span-3 flex gap-2">
        <Button className="bg-forest-green text-white hover:opacity-90">
          View Details
        </Button>
        <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90">
          Manage
        </Button>
      </div>
    </div>
  ))}
</div>
```

#### User Detail Analytics View
PostHog queries for individual user insights:

```typescript
// Individual user analytics
const userAnalytics = {
  query: {
    kind: 'HogQLQuery',
    query: `
      SELECT 
        event,
        count() as event_count,
        toDate(timestamp) as date
      FROM events
      WHERE properties.user_id = '${userId}'
        AND timestamp >= now() - interval 90 day
      GROUP BY event, date
      ORDER BY date DESC, event_count DESC
    `
  }
}
```

### 3. Email System Control Center

#### Email Performance Dashboard
Using design system components for email analytics:

```tsx
// Email metrics - design system compliant
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-paper-white border-stone-gray shadow-sm">
    <CardHeader>
      <CardTitle className="text-charcoal text-section-title">Email Performance</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between">
            <span className="text-charcoal/70">Delivery Rate</span>
            <span className="font-mono text-charcoal">{deliveryRate}%</span>
          </div>
          <div className="w-full bg-stone-gray/30 rounded-full h-2 mt-1">
            <div 
              className="bg-forest-green h-2 rounded-full" 
              style={{ width: `${deliveryRate}%` }}
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

#### Bulk Email Campaign Management
Admin controls for system-wide email operations:

```tsx
// Campaign management interface - proper button styling
<Card className="bg-paper-white border-stone-gray shadow-sm">
  <CardHeader>
    <CardTitle className="text-charcoal text-section-title">Email Campaigns</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button className="bg-forest-green text-white hover:opacity-90 font-bold">
          Create Campaign
        </Button>
        <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold">
          Schedule Bulk Send
        </Button>
      </div>
      
      {/* Campaign controls with proper form styling */}
      <div className="grid gap-3">
        <Label className="text-label text-charcoal font-medium">
          Target Users
        </Label>
        <Input
          className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
          placeholder="Select user segments..."
        />
      </div>
    </div>
  </CardContent>
</Card>
```

### 4. Advanced Analytics Interface

#### Custom HogQL Query Builder
Admin interface for running custom PostHog queries:

```tsx
// Query builder with proper form styling
<Card className="bg-paper-white border-stone-gray shadow-sm">
  <CardHeader>
    <CardTitle className="text-charcoal text-section-title">Custom Analytics Query</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="grid gap-3">
        <Label className="text-label text-charcoal font-medium">
          HogQL Query
        </Label>
        <textarea
          className="min-h-[200px] w-full bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60 font-mono text-sm p-3 rounded-md"
          placeholder="SELECT event, count() FROM events WHERE..."
        />
      </div>
      
      <div className="flex gap-3">
        <Button className="bg-forest-green text-white hover:opacity-90 font-bold">
          Execute Query
        </Button>
        <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold">
          Save Query
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

## Implementation Phases

### Phase 1: Foundation Setup
1. **Admin Route Structure**: Create `/admin` routes with role-based access control
2. **PostHog SDK Integration**: Install and configure `posthog-js` and `posthog-node`
3. **Design System Compliance**: Ensure all components use proper color classes
4. **Basic Dashboard**: Implement system overview using `dashboard-01` block structure

### Phase 2: User Management
1. **User Analytics Integration**: PostHog queries for user behavior data
2. **User Control Interface**: Suspend/activate users, view detailed analytics
3. **User Journey Mapping**: Complete activity timelines and behavior analysis
4. **Bulk Operations**: Mass user management tools

### Phase 3: Email Control Center  
1. **Email Performance Tracking**: System-wide email analytics dashboard
2. **Campaign Management**: Bulk email operation controls
3. **Template Override System**: Admin control over user email templates
4. **Delivery Monitoring**: Real-time email deliverability tracking

### Phase 4: Advanced Analytics
1. **Custom Query Interface**: HogQL query builder for admins
2. **Automated Insights**: Alert systems for anomalies
3. **User Segmentation**: Advanced cohort analysis
4. **Predictive Analytics**: Forecasting and trend analysis

## Required shadcn/ui v4 Components

Based on the available blocks, we will use:

1. **`dashboard-01`**: Foundation for the main admin dashboard layout
2. **`sidebar-01` or similar**: Admin navigation sidebar
3. **Calendar components**: For date range selections in analytics
4. **Form components**: User management and email campaign interfaces

## Security & Access Control

### Admin Role Verification
```typescript
// Admin authentication middleware
const isAdmin = async (userId: string) => {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return user?.role === 'admin'
}

// PostHog admin event tracking
posthog.capture('admin_action', {
  admin_id: adminUser.id,
  action_type: 'user_management',
  target_user_id: targetUserId,
  timestamp: new Date().toISOString()
})
```

### Data Protection
- All PostHog queries respect user privacy settings
- Admin actions are logged and auditable
- Sensitive data is masked in non-production environments

## Design System Compliance Checklist

Before implementation, ensure ALL components meet these requirements:

### ✅ Color Compliance
- [ ] All text uses `text-charcoal` variants
- [ ] All cards use `bg-paper-white border-stone-gray`
- [ ] All page backgrounds use `bg-light-concrete`
- [ ] All input fields use `bg-light-concrete` (NOT `bg-paper-white`)
- [ ] No hardcoded hex colors or generic gray classes

### ✅ Typography Compliance
- [ ] Primary headings: `text-charcoal font-bold`
- [ ] Secondary text: `text-charcoal/70`
- [ ] Financial values use: `font-mono text-charcoal`

### ✅ Button Compliance
- [ ] Primary: `bg-forest-green text-white hover:opacity-90`
- [ ] Secondary: `bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90`

### ✅ Form Input Compliance
- [ ] All inputs: `bg-light-concrete text-charcoal border-stone-gray`
- [ ] Focus states: `focus:border-forest-green focus:ring-forest-green`
- [ ] Placeholders: `placeholder:text-charcoal/60`

## Success Metrics

The admin control panel will provide insights into:

1. **User Engagement**: Active users, feature adoption, user journey analysis
2. **Business Performance**: Quote conversion rates, revenue tracking, growth metrics
3. **Email Effectiveness**: Delivery rates, engagement metrics, campaign performance
4. **System Health**: Usage patterns, error rates, performance monitoring

## Conclusion

This integration plan provides administrators with complete control and visibility over the QuoteKit system while maintaining strict compliance with the LawnQuote Design System Specification. The use of PostHog's powerful analytics capabilities, combined with shadcn/ui v4 components and proper design system adherence, will create a professional, accessible, and highly functional admin control panel.

All implementation must follow the mandatory compliance rules outlined in the design system specification, ensuring consistent visual appearance and optimal user experience across all admin interfaces.