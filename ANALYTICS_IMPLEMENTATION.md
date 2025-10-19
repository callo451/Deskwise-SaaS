# Analytics Implementation Guide

## Overview

This document describes the comprehensive analytics and reporting system implemented for the Deskwise ITSM platform. The system provides full-featured analytics across all ITSM modules with interactive visualizations, real-time filtering, and export capabilities.

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Charts**: Recharts library for all visualizations
- **Styling**: Tailwind CSS with existing design system
- **State Management**: Custom React hooks
- **Animations**: Framer Motion
- **Export**: ExcelJS, jsPDF, CSV-Writer, html2canvas
- **Date Handling**: date-fns
- **Number Formatting**: numeral

### Directory Structure

```
src/
├── app/(app)/analytics/
│   ├── page.tsx                    # Overview Dashboard
│   ├── tickets/page.tsx            # Ticket Analytics
│   ├── incidents/page.tsx          # Incident Analytics
│   ├── assets/page.tsx             # Asset Analytics
│   ├── projects/page.tsx           # Project Analytics
│   ├── sla/page.tsx                # SLA Performance
│   └── reports/
│       ├── library/page.tsx        # Saved Reports
│       └── builder/page.tsx        # Report Builder
│
├── components/analytics/
│   ├── hero-metric-card.tsx        # KPI cards with trends
│   ├── chart-widget.tsx            # Base chart container
│   ├── line-chart-widget.tsx       # Time-series charts
│   ├── bar-chart-widget.tsx        # Bar/column charts
│   ├── donut-chart-widget.tsx      # Pie/donut charts
│   ├── gauge-widget.tsx            # Gauge/radial charts
│   ├── data-table-widget.tsx       # Sortable data tables
│   ├── filter-bar.tsx              # Global filters
│   ├── export-menu.tsx             # Export dropdown
│   └── index.ts                    # Component exports
│
├── hooks/
│   ├── use-analytics.ts            # Data fetching hook
│   ├── use-filters.ts              # Filter state management
│   └── use-export.ts               # Export functionality
│
└── lib/
    └── analytics-utils.ts          # Utility functions
```

## Components

### 1. HeroMetricCard

Animated KPI cards displayed at the top of analytics pages.

**Features:**
- Large metric value with animated entrance
- Trend indicator (up/down/neutral)
- Percentage change vs previous period
- Status color coding (success/warning/danger/neutral)
- Icon support
- Optional sparkline
- Clickable navigation

**Props:**
```typescript
interface HeroMetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: LucideIcon
  href?: string
  sparklineData?: number[]
  className?: string
}
```

**Usage:**
```tsx
<HeroMetricCard
  title="Total Tickets"
  value={formatNumber(1234)}
  change={12.5}
  status="neutral"
  icon={Ticket}
  href="/analytics/tickets"
/>
```

### 2. Chart Widgets

#### ChartWidget (Base Container)

Provides consistent structure for all chart types with:
- Loading states (skeleton)
- Error states
- Empty states
- Insight badges
- Export/refresh actions
- Header with title and description

#### LineChartWidget

Time-series line charts with:
- Multiple data series
- Threshold reference lines
- Custom tooltips
- Axis formatters
- Responsive container

**Usage:**
```tsx
<LineChartWidget
  title="Ticket Volume Trend"
  data={volumeData}
  xAxisKey="date"
  lines={[
    { dataKey: 'created', name: 'Created', color: '#3b82f6' },
    { dataKey: 'resolved', name: 'Resolved', color: '#10b981' },
  ]}
  thresholds={[
    { value: 100, label: 'Target', color: '#ef4444' },
  ]}
  yAxisFormatter={(value) => formatNumber(value)}
/>
```

#### BarChartWidget

Vertical or horizontal bar charts with:
- Stacked or grouped bars
- Value labels
- Custom colors per bar
- Vertical/horizontal layouts

#### DonutChartWidget

Pie and donut charts with:
- Percentage labels
- Interactive legend
- Custom color palettes
- Center label option

#### GaugeWidget

Semi-circular gauge charts for metrics like SLA compliance:
- Color-coded zones (green/yellow/red)
- Target indicator
- Threshold markers
- Current value display

### 3. DataTableWidget

Sortable, paginated data tables with:
- Ranking display (🥇🥈🥉)
- Custom cell renderers
- User avatars (UserCell)
- Status badges (StatusCell)
- Sortable columns
- Pagination

**Usage:**
```tsx
<DataTableWidget
  title="Team Performance"
  data={teamData}
  columns={[
    {
      key: 'technician',
      label: 'Technician',
      render: (value, row) => (
        <UserCell name={row.name} email={row.email} />
      ),
    },
    {
      key: 'resolved',
      label: 'Resolved',
      sortable: true,
      align: 'center',
    },
  ]}
  showRanking
  rankingKey="resolved"
/>
```

### 4. FilterBar

Global filter controls with:
- Date range picker with presets
- Multi-select dropdowns
- Active filter display
- Clear all functionality
- URL persistence

**Presets:**
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This week
- This month
- Last month
- This quarter
- This year

### 5. ExportMenu

Dropdown menu for exporting data in multiple formats:
- PDF
- Excel (XLSX)
- CSV
- PNG (charts)

## Custom Hooks

### useAnalytics

Fetches data from analytics API endpoints with:
- Auto-refresh capability
- Loading and error states
- Request cancellation
- Success/error callbacks

**Usage:**
```tsx
const { data, loading, error, refetch, isRefetching } = useAnalytics(
  '/api/analytics/tickets/metrics',
  { dateRange: filters.dateRange },
  {
    refetchInterval: 30000, // 30 seconds
    onSuccess: (data) => console.log('Data loaded', data)
  }
)
```

### useFilters

Manages filter state with:
- URL query parameter persistence
- Preset management
- LocalStorage for saved presets
- Date range calculations

**Usage:**
```tsx
const { filters, updateFilter, clearFilters, savePreset } = useFilters()

// Update filter
updateFilter('department', 'IT Support')

// Clear all
clearFilters()

// Save preset
savePreset('My Weekly Report')
```

### useExport

Handles data and chart exports:
- Multiple format support
- Progress indicators
- File downloads
- Error handling

**Usage:**
```tsx
const { exportData, exportChart, exporting } = useExport()

// Export data
await exportData('excel', data, {
  filename: 'ticket-report',
  title: 'Ticket Analytics',
})

// Export chart as PNG
await exportChart(chartRef.current, 'ticket-trends')
```

## Utility Functions

Located in `src/lib/analytics-utils.ts`:

### Number Formatting
- `formatNumber(value)` - Formats with K/M/B suffixes
- `formatPercentage(value, decimals)` - Formats as percentage
- `formatCurrency(value)` - Formats as USD currency
- `formatDuration(ms)` - Converts ms to human-readable duration

### Calculations
- `calculatePercentageChange(current, previous)` - % change
- `calculateSLACompliance(total, breaches)` - SLA %
- `calculateMovingAverage(data, windowSize)` - Moving avg
- `calculatePercentile(data, percentile)` - Percentile calc

### Data Processing
- `groupByTimePeriod(data, period)` - Group by hour/day/week/month
- `aggregateByCategory(data, categoryGetter, valueGetter)` - Aggregate data
- `generateDateLabels(from, to, period)` - Date label generation

### Visual Helpers
- `getTrendIndicator(change)` - Returns 'up'/'down'/'neutral'
- `getStatusColor(value, thresholds)` - Returns color based on value
- `getChartColors(count)` - Generates color palette
- `getSLAColor(compliance)` - SLA-specific color

## Analytics Pages

### 1. Overview Dashboard (`/analytics`)

**Hero Metrics (6):**
- Total Tickets
- Active Incidents
- Managed Assets
- Active Projects
- Avg Resolution Time
- SLA Compliance

**Tabs:**
- Service Desk (tickets, status, priority, SLA)
- Operations (projects timeline, status)
- Assets (distribution, lifecycle)
- Performance (top performers table)

**Features:**
- Auto-refresh toggle
- Global filters
- Module quick access
- Export to PDF/Excel

### 2. Ticket Analytics (`/analytics/tickets`)

**Hero Metrics (7):**
- Total Tickets
- Open Tickets
- Resolved
- Avg Resolution Time
- First Response Time
- SLA Compliance
- Customer Satisfaction

**Charts:**
- Volume trend (line chart)
- Status distribution (donut)
- Priority mix (donut)
- Category breakdown (donut)
- Resolution time by category (bar)
- SLA compliance gauge
- Team performance table
- SLA breaches (bar)
- SLA compliance trend (line)

### 3. Incident Analytics (`/analytics/incidents`)

**Hero Metrics (6):**
- Total Incidents
- Active Incidents
- MTTR (Mean Time To Repair)
- MTBF (Mean Time Between Failures)
- Availability %
- Resolved

**Charts:**
- Severity timeline (line, 4 series)
- Severity distribution (donut)
- Status breakdown (donut)
- Service impact (donut)
- Root cause distribution (bar)
- MTTR by root cause (bar)
- Service impact table
- Active incidents list

### 4. Project Analytics (`/analytics/projects`)

**Hero Metrics (6):**
- Total Projects
- Active Projects
- On Schedule
- At Risk
- Total Budget
- Budget Utilization

**Charts:**
- Project health (donut)
- Completion timeline (bar)
- Budget vs actual (bar)
- Resource allocation (bar)
- Progress trend (line)
- Project details table

### 5. Asset Analytics (`/analytics/assets`)

**Hero Metrics (6):**
- Total Assets
- Active Assets
- Under Maintenance
- Warranty Expiring
- Total Asset Value
- Utilization Rate

**Charts:**
- Assets by type (donut)
- Assets by location (donut)
- Lifecycle status (donut)
- Age distribution (bar)
- Maintenance frequency (bar)
- Warranty expiration forecast (bar)
- Asset inventory table

### 6. SLA Performance (`/analytics/sla`)

**Hero Metrics (6):**
- Overall Compliance
- SLA Met
- SLA Breaches
- At Risk
- Avg Time to Breach
- Response Rate

**Charts:**
- Overall compliance gauge
- Response time SLA gauge
- Resolution time SLA gauge
- Compliance trend (line, 3 series)
- Breaches by priority (bar)
- Breaches by category (bar)
- Service level breakdown table
- Recent breaches table

### 7. Reports Library (`/analytics/reports/library`)

**Features:**
- Search reports
- Filter by category
- Report cards with metadata
- Run/Edit/Duplicate/Delete actions
- Last run timestamp
- Scheduled report indicator

### 8. Report Builder (`/analytics/reports/builder`)

**3-Panel Layout:**

**Left: Data Sources**
- Checkbox list of sources (Tickets, Incidents, Assets, Projects, Users)
- Available fields selector
- Drag-and-drop field ordering

**Middle: Filters**
- Visual filter builder
- Field/Operator/Value inputs
- Add/Remove filters
- AND/OR conjunctions

**Right: Visualization**
- Chart type selector (Table, Bar, Line, Pie, Gauge)
- Selected fields preview
- Active filters summary

**Save Dialog:**
- Report name
- Description
- Category
- Schedule configuration

## API Integration

All analytics pages expect API endpoints following this pattern:

### Metrics Endpoints
```
GET /api/analytics/{module}/metrics?from={ISO_DATE}&to={ISO_DATE}&department={string}
```

**Response:**
```json
{
  "total": 1234,
  "totalChange": 12.5,
  "active": 45,
  "activeChange": -3.2,
  "byStatus": [
    { "name": "Open", "value": 123 },
    { "name": "In Progress", "value": 45 }
  ]
}
```

### Trends Endpoints
```
GET /api/analytics/{module}/trends?from={ISO_DATE}&to={ISO_DATE}
```

**Response:**
```json
{
  "volumeData": [
    { "date": "Jan 1", "created": 45, "resolved": 38 },
    { "date": "Jan 2", "created": 52, "resolved": 41 }
  ],
  "volumeInsight": "Ticket volume increased by 15% this week"
}
```

## Styling & Theming

All components follow the existing Deskwise design system:

**Color Palette:**
- Primary: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#ef4444` (red)
- Neutral: `#6b7280` (gray)

**Component Classes:**
- Cards: `rounded-lg border bg-card shadow-sm`
- Hover effects: `hover:shadow-md transition-all`
- Text hierarchy: `text-3xl font-bold` → `text-lg` → `text-sm text-muted-foreground`

## Accessibility

All components include:
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader announcements for dynamic content
- Color contrast compliance (WCAG 2.1 AA)

## Performance Optimizations

1. **Data Fetching:**
   - Request cancellation on unmount
   - Auto-refresh with configurable intervals
   - Debounced filter updates

2. **Rendering:**
   - Skeleton loading states
   - Virtualized tables for large datasets
   - Memoized chart components

3. **Exports:**
   - Client-side processing for small datasets
   - Server-side processing for large datasets
   - Progress indicators

## Future Enhancements

Potential additions for future releases:

1. **Advanced Features:**
   - Real-time WebSocket updates
   - Collaborative report sharing
   - Custom dashboard builder
   - Scheduled report emails
   - Mobile-optimized views

2. **Additional Charts:**
   - Heatmaps (calendar view)
   - Gantt charts (project timelines)
   - Sankey diagrams (workflow visualization)
   - Network graphs (relationship mapping)

3. **AI Integration:**
   - Automated insights generation
   - Anomaly detection
   - Predictive analytics
   - Natural language queries

4. **Export Enhancements:**
   - PowerPoint exports
   - Interactive HTML reports
   - API for programmatic access

## Testing Recommendations

### Unit Tests
- Utility functions in `analytics-utils.ts`
- Custom hooks (useAnalytics, useFilters, useExport)
- Component rendering with various props

### Integration Tests
- Filter interactions
- Data fetching and display
- Export functionality
- Navigation between pages

### E2E Tests
- Complete analytics workflows
- Report creation and execution
- Multi-filter scenarios
- Export downloads

## Deployment Notes

1. **Environment Variables:**
   - No additional environment variables required
   - Uses existing NextAuth session

2. **Database:**
   - All analytics aggregate from existing collections
   - No new collections required
   - Consider adding indexes on date fields for performance

3. **Build:**
   - All pages are client-side rendered
   - No server-side generation required
   - Bundle size increase: ~500KB (mainly Recharts)

4. **Performance:**
   - API endpoints should implement caching
   - Consider Redis for frequently accessed metrics
   - Use database aggregation pipelines for efficiency

## Support & Maintenance

**Component Updates:**
- All chart components use Recharts
- Update Recharts for new features
- Maintain color consistency with design system

**Bug Reports:**
- Check browser console for errors
- Verify API response format
- Test with different data volumes

**Common Issues:**
1. **Charts not rendering:** Check data format matches xAxisKey/dataKey
2. **Filters not working:** Verify URL parameter persistence
3. **Export failures:** Check file size limits and browser permissions

## Conclusion

This analytics implementation provides a comprehensive, production-ready reporting system for the Deskwise ITSM platform. All components are fully typed, responsive, and follow best practices for React and Next.js development.

The modular architecture allows for easy extension and customization to meet specific organizational needs while maintaining consistency with the existing design system.
