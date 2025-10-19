'use client'

import { Suspense, useState } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { GaugeWidget } from '@/components/analytics/gauge-widget'
import { DataTableWidget, UserCell, StatusCell } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  Ticket,
  AlertCircle,
  HardDrive,
  FolderKanban,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { formatNumber, formatDuration, formatPercentage } from '@/lib/analytics-utils'

function AnalyticsOverviewContent() {
  const { filters, updateFilter, clearFilters } = useFilters()
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch overview metrics
  const { data: metrics, loading: metricsLoading, refetch: refetchMetrics } = useAnalytics(
    '/api/analytics/overview/metrics',
    filters,
    { refetchInterval: autoRefresh ? 30000 : undefined }
  )

  // Fetch trend data
  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/overview/trends',
    filters
  )

  // Fetch activity data
  const { data: activity, loading: activityLoading } = useAnalytics(
    '/api/analytics/overview/activity',
    filters
  )

  const handleRefreshAll = () => {
    refetchMetrics()
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights across all ITSM modules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>

          <ExportMenu
            data={metrics}
            filename="analytics-overview"
            title="Analytics Overview"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        departments={['IT Support', 'Engineering', 'Operations']}
        statuses={['Open', 'In Progress', 'Resolved', 'Closed']}
        priorities={['Low', 'Medium', 'High', 'Critical']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <HeroMetricCard
          title="Total Tickets"
          value={metricsLoading ? '-' : formatNumber(metrics?.totalTickets || 0)}
          change={metrics?.ticketsChange}
          trend={metrics?.ticketsChange > 0 ? 'up' : 'down'}
          status="neutral"
          icon={Ticket}
          href="/analytics/tickets"
        />

        <HeroMetricCard
          title="Active Incidents"
          value={metricsLoading ? '-' : metrics?.activeIncidents || 0}
          change={metrics?.incidentsChange}
          trend={metrics?.incidentsChange < 0 ? 'up' : 'down'}
          status={metrics?.activeIncidents > 10 ? 'warning' : 'success'}
          icon={AlertCircle}
          href="/analytics/incidents"
        />

        <HeroMetricCard
          title="Managed Assets"
          value={metricsLoading ? '-' : formatNumber(metrics?.totalAssets || 0)}
          change={metrics?.assetsChange}
          trend="up"
          status="neutral"
          icon={HardDrive}
          href="/analytics/assets"
        />

        <HeroMetricCard
          title="Active Projects"
          value={metricsLoading ? '-' : metrics?.activeProjects || 0}
          change={metrics?.projectsChange}
          trend="neutral"
          status="neutral"
          icon={FolderKanban}
          href="/analytics/projects"
        />

        <HeroMetricCard
          title="Avg Resolution Time"
          value={metricsLoading ? '-' : formatDuration(metrics?.avgResolutionTime || 0)}
          change={metrics?.resolutionChange}
          trend={metrics?.resolutionChange < 0 ? 'up' : 'down'}
          status={metrics?.avgResolutionTime < 3600000 ? 'success' : 'warning'}
          icon={Clock}
        />

        <HeroMetricCard
          title="SLA Compliance"
          value={metricsLoading ? '-' : formatPercentage(metrics?.slaCompliance || 0)}
          change={metrics?.slaChange}
          trend={metrics?.slaChange > 0 ? 'up' : 'down'}
          status={metrics?.slaCompliance >= 95 ? 'success' : metrics?.slaCompliance >= 85 ? 'warning' : 'danger'}
          icon={TrendingUp}
          href="/analytics/sla"
        />
      </div>

      {/* Module Tabs */}
      <Tabs defaultValue="service-desk" className="space-y-6">
        <TabsList>
          <TabsTrigger value="service-desk">Service Desk</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Service Desk Tab */}
        <TabsContent value="service-desk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ticket Volume Trend */}
            <LineChartWidget
              title="Ticket Volume Trend"
              description="Daily ticket creation over time"
              data={trends?.ticketVolume || []}
              xAxisKey="date"
              lines={[
                { dataKey: 'created', name: 'Created', color: '#3b82f6' },
                { dataKey: 'resolved', name: 'Resolved', color: '#10b981' },
              ]}
              loading={trendsLoading}
              insight={trends?.ticketVolumeInsight}
              insightType="info"
            />

            {/* Status Distribution */}
            <DonutChartWidget
              title="Ticket Status Distribution"
              description="Current ticket breakdown by status"
              data={metrics?.ticketsByStatus || []}
              loading={metricsLoading}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Priority Mix */}
            <BarChartWidget
              title="Priority Distribution"
              description="Tickets by priority level"
              data={metrics?.ticketsByPriority || []}
              xAxisKey="priority"
              bars={[{ dataKey: 'count', name: 'Tickets' }]}
              loading={metricsLoading}
            />

            {/* SLA Compliance Gauge */}
            <GaugeWidget
              title="SLA Compliance Rate"
              description="Percentage of tickets meeting SLA"
              value={metrics?.slaCompliance || 0}
              target={95}
              loading={metricsLoading}
              insight={
                metrics?.slaCompliance >= 95
                  ? 'Excellent SLA performance'
                  : metrics?.slaCompliance >= 85
                  ? 'SLA compliance needs attention'
                  : 'Critical: SLA compliance below target'
              }
              insightType={
                metrics?.slaCompliance >= 95
                  ? 'success'
                  : metrics?.slaCompliance >= 85
                  ? 'warning'
                  : 'danger'
              }
            />
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Status */}
            <DonutChartWidget
              title="Project Status"
              description="Active projects by status"
              data={metrics?.projectsByStatus || []}
              loading={metricsLoading}
            />

            {/* Project Timeline */}
            <BarChartWidget
              title="Project Completion Timeline"
              description="Projects by completion month"
              data={trends?.projectTimeline || []}
              xAxisKey="month"
              bars={[{ dataKey: 'completed', name: 'Completed' }]}
              loading={trendsLoading}
            />
          </div>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Asset Types */}
            <DonutChartWidget
              title="Asset Distribution by Type"
              description="Breakdown of managed assets"
              data={metrics?.assetsByType || []}
              loading={metricsLoading}
            />

            {/* Asset Status */}
            <BarChartWidget
              title="Asset Lifecycle Status"
              description="Assets by lifecycle stage"
              data={metrics?.assetsByStatus || []}
              xAxisKey="status"
              bars={[{ dataKey: 'count', name: 'Assets' }]}
              loading={metricsLoading}
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Top Performers Table */}
          <DataTableWidget
            title="Top Performing Technicians"
            description="Based on tickets resolved this period"
            data={activity?.topPerformers || []}
            columns={[
              {
                key: 'user',
                label: 'Technician',
                render: (value, row) => (
                  <UserCell
                    name={row.name}
                    email={row.email}
                    avatar={row.avatar}
                  />
                ),
              },
              {
                key: 'resolved',
                label: 'Resolved',
                sortable: true,
                align: 'center',
              },
              {
                key: 'avgTime',
                label: 'Avg Time',
                sortable: true,
                render: (value) => formatDuration(value),
                align: 'center',
              },
              {
                key: 'satisfaction',
                label: 'Satisfaction',
                sortable: true,
                render: (value) => `${value}%`,
                align: 'center',
              },
            ]}
            showRanking
            rankingKey="resolved"
            loading={activityLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AnalyticsOverviewPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <AnalyticsOverviewContent />
    </Suspense>
  )
}
