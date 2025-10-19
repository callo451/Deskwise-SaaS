# Analytics Quick Start Guide

## Getting Started

This guide will help you quickly get up and running with the Deskwise Analytics system.

## 1. Access Analytics

Navigate to the Analytics section via the sidebar:

```
Dashboard → Analytics & Reports → Overview
```

Or directly visit: `http://localhost:9002/analytics`

## 2. Basic Navigation

### Analytics Pages

- **Overview** (`/analytics`) - Dashboard with all modules
- **Service Desk** (`/analytics/tickets`) - Ticket analytics
- **Operations** (`/analytics/projects`) - Project analytics
- **Assets** (`/analytics/assets`) - Asset analytics
- **Reports** (`/analytics/reports/library`) - Saved reports

### Page Structure

Each analytics page follows this pattern:

```
┌─────────────────────────────────────┐
│ Header (Title + Export Button)     │
├─────────────────────────────────────┤
│ Filters (Date, Status, Priority)   │
├─────────────────────────────────────┤
│ Hero Metrics (6-7 KPI Cards)       │
├─────────────────────────────────────┤
│ Charts & Visualizations            │
│ (Line, Bar, Donut, Gauge, Tables)  │
└─────────────────────────────────────┘
```

## 3. Using Filters

### Date Range Picker

Click the date range button to select:

**Quick Presets:**
- Today
- Last 7 days
- Last 30 days
- This month
- This quarter
- Custom range

**Persistence:**
- Filters are saved in URL
- Share filtered URLs with team
- Filters persist across page refreshes

### Apply Multiple Filters

```tsx
// Example: View tickets from last 30 days in IT Support
1. Click date range → Select "Last 30 days"
2. Select department → Choose "IT Support"
3. Select status → Choose "Open"
4. Charts update automatically
```

### Clear Filters

Click **"Clear All"** button to reset all filters.

## 4. Interpreting Charts

### Hero Metric Cards

```
┌─────────────────────┐
│ Total Tickets       │
│                     │
│ 1,234      ↗ +12.5%│
│                     │
│ vs last period     │
└─────────────────────┘
```

**Components:**
- **Large Number** - Current value
- **Trend Arrow** - Up/Down/Neutral
- **Percentage** - Change vs previous period
- **Color** - Status indicator
  - Green = Good
  - Yellow = Warning
  - Red = Critical
  - Blue = Neutral

### Line Charts

Show trends over time:

```
Volume ↑
  │     ╱╲
  │    ╱  ╲    ╱
  │   ╱    ╲  ╱
  │  ╱      ╲╱
  └──────────────→ Time
```

**Features:**
- Hover for exact values
- Multiple series comparison
- Threshold lines

### Donut Charts

Show distribution percentages:

```
    ┌─────┐
  ╱       ╲
 │   45%   │
 │         │
  ╲       ╱
    └─────┘
```

**Colors:**
- Each segment represents a category
- Hover for percentages
- Click legend to highlight

### Gauge Charts

Show compliance metrics:

```
      95%
   ┌───────┐
  │░░░░░▓▓│
   └───────┘
  0%   Target   100%
```

**Zones:**
- Green = Meeting target
- Yellow = Warning
- Red = Critical

### Data Tables

Sortable tables with rankings:

```
# Technician     Resolved   Avg Time
🥇 John Smith      152      2h 15m
🥈 Jane Doe        148      2h 30m
🥉 Bob Johnson     142      2h 45m
```

**Features:**
- Click column headers to sort
- Pagination for large datasets
- Ranking indicators (🥇🥈🥉)

## 5. Exporting Data

### Export Button

Click **Export** button in top-right corner:

```
┌─────────────────┐
│ Export Format   │
├─────────────────┤
│ 📄 Export as PDF│
│ 📊 Export Excel │
│ 📝 Export CSV   │
│ 🖼️ Export Image │
└─────────────────┘
```

### Export Formats

**PDF** - Formatted report with charts
- Best for: Sharing with stakeholders
- Includes: All charts and tables
- File size: Medium

**Excel (XLSX)** - Spreadsheet with data
- Best for: Further analysis
- Includes: Raw data tables
- File size: Small

**CSV** - Comma-separated values
- Best for: Import to other tools
- Includes: Raw data only
- File size: Small

**PNG** - Image of current view
- Best for: Presentations
- Includes: Visual snapshot
- File size: Medium

## 6. Auto-Refresh

Enable auto-refresh for live dashboards:

```tsx
1. Click "Auto-refresh OFF" button
2. Toggle to "Auto-refresh ON"
3. Data updates every 30 seconds
```

**Use Cases:**
- NOC dashboards
- Live monitoring
- Real-time incident tracking

## 7. Creating Custom Reports

### Step 1: Navigate to Report Builder

```
Analytics → Reports → Create Report
```

### Step 2: Select Data Sources

```
☑ Tickets
☑ Incidents
☐ Assets
☐ Projects
```

### Step 3: Choose Fields

```
Available Fields:
☑ tickets.ID
☑ tickets.Title
☑ tickets.Status
☑ tickets.Priority
☑ tickets.Created Date
```

### Step 4: Add Filters

```
Filter 1:
Field: tickets.Status
Operator: Equals
Value: Open
```

### Step 5: Select Visualization

```
Chart Type:
○ Table
● Bar Chart
○ Line Chart
○ Pie Chart
```

### Step 6: Save Report

```
Report Name: Open Tickets by Priority
Description: Daily report of open tickets
Category: Tickets
```

## 8. Running Saved Reports

### From Reports Library

```
1. Go to: Analytics → Reports → Library
2. Find your report
3. Click "Run" button
4. View results
5. Export if needed
```

### Quick Actions

- **Run** - Execute report now
- **Edit** - Modify report settings
- **Duplicate** - Copy for variation
- **Delete** - Remove report

## 9. Common Use Cases

### Daily Stand-up

```
1. Go to: /analytics/tickets
2. Filter: Last 24 hours
3. View: New tickets created
4. Check: Team performance table
5. Export: PDF for meeting
```

### Weekly Executive Report

```
1. Go to: /analytics (Overview)
2. Filter: Last 7 days
3. Review: All hero metrics
4. Check: Trend charts
5. Export: PDF report
```

### Monthly SLA Review

```
1. Go to: /analytics/sla
2. Filter: Last month
3. Review: Compliance gauges
4. Check: Breach analysis
5. Export: Excel for deep dive
```

### Asset Audit

```
1. Go to: /analytics/assets
2. Filter: All active assets
3. Review: Warranty expiring
4. Check: Asset inventory table
5. Export: CSV for import
```

## 10. Keyboard Shortcuts

### Navigation

- `Ctrl/Cmd + K` - Search (future)
- `Esc` - Close modals
- `Tab` - Navigate filters
- `Enter` - Apply filter

### Tables

- `↑↓` - Navigate rows
- `Click header` - Sort column
- `Page Up/Down` - Navigate pages

## 11. Tips & Tricks

### Performance

- Use shorter date ranges for faster loading
- Filter by department to reduce dataset
- Enable auto-refresh only when needed

### Accuracy

- Exclude test data with filters
- Use custom date ranges for specific periods
- Compare same day-of-week for consistency

### Sharing

- Copy URL with filters applied
- Export to PDF for email
- Schedule reports (coming soon)

### Mobile

- Swipe charts to see tooltips
- Pinch to zoom on mobile
- Rotate device for better table view

## 12. Troubleshooting

### Charts Not Loading

**Problem:** Blank charts or loading spinner
**Solution:**
1. Check internet connection
2. Refresh page (F5)
3. Clear filters
4. Contact support if persists

### Export Failing

**Problem:** Export button not working
**Solution:**
1. Check browser popup blocker
2. Allow downloads in browser
3. Try different format
4. Reduce data size with filters

### Filters Not Working

**Problem:** Filters don't update charts
**Solution:**
1. Wait for debounce (1 second)
2. Check URL parameters updated
3. Clear cache and reload
4. Try different browser

### Data Looks Wrong

**Problem:** Unexpected numbers or trends
**Solution:**
1. Verify date range is correct
2. Check filters are appropriate
3. Compare with source data
4. Report data issue to admin

## 13. Best Practices

### Daily Monitoring

- Start with Overview dashboard
- Check hero metrics for anomalies
- Drill down into problem areas
- Export critical insights

### Weekly Reviews

- Compare week-over-week
- Use "Last 7 days" filter
- Focus on trend direction
- Share exports with team

### Monthly Reports

- Use full month date range
- Export to PDF for records
- Compare to previous month
- Document action items

### Quarterly Analysis

- Use "This quarter" preset
- Review all analytics pages
- Identify long-term trends
- Plan next quarter improvements

## 14. Getting Help

### Documentation

- **Full Guide:** `ANALYTICS_IMPLEMENTATION.md`
- **Delivery Summary:** `ANALYTICS_DELIVERY_SUMMARY.md`
- **This Guide:** `ANALYTICS_QUICK_START.md`

### Support

- Check documentation first
- Review common issues above
- Contact IT support
- Submit bug report

### Feedback

- Suggest new features
- Report usability issues
- Request new charts
- Share use cases

## 15. What's Next

### Coming Soon

- Scheduled reports via email
- Custom dashboard builder
- Real-time WebSocket updates
- AI-powered insights
- Mobile app
- Slack/Teams integration

### Stay Updated

- Check release notes
- Watch for announcements
- Try new features
- Provide feedback

---

**Happy Analyzing! 📊**

For detailed technical information, see `ANALYTICS_IMPLEMENTATION.md`
