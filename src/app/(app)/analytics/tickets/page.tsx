'use client'

import { Suspense } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { GaugeWidget } from '@/components/analytics/gauge-widget'
import { DataTableWidget, UserCell, StatusCell } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { formatNumber, formatDuration, formatPercentage } from '@/lib/analytics-utils'
import Link from 'next/link'

function TicketAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()

  // Fetch ticket metrics
  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/tickets/metrics',
    filters
  )

  // Fetch ticket trends
  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/tickets/trends',
    filters
  )

  // Fetch category performance
  const { data: categories, loading: categoriesLoading } = useAnalytics(
    '/api/analytics/tickets/categories',
    filters
  )

  // Fetch team performance
  const { data: team, loading: teamLoading } = useAnalytics(
    '/api/analytics/tickets/team',
    filters
  )

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ticket Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of ticket volume, resolution, and SLA performance
            </p>
          </div>
        </div>

        <ExportMenu
          data={metrics}
          filename="ticket-analytics"
          title="Ticket Analytics Report"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        departments={['IT Support', 'Engineering', 'Operations']}
        statuses={['Open', 'In Progress', 'Resolved', 'Closed']}
        priorities={['Low', 'Medium', 'High', 'Critical']}
        categories={['Hardware', 'Software', 'Network', 'Access', 'Other']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <HeroMetricCard
          title="Total Tickets"
          value={metricsLoading ? '-' : formatNumber(metrics?.total || 0)}
          change={metrics?.totalChange}
          status="neutral"
          icon={Ticket}
        />

        <HeroMetricCard
          title="Open Tickets"
          value={metricsLoading ? '-' : metrics?.open || 0}
          change={metrics?.openChange}
          status={metrics?.open > 50 ? 'warning' : 'neutral'}
          icon={AlertTriangle}
        />

        <HeroMetricCard
          title="Resolved"
          value={metricsLoading ? '-' : formatNumber(metrics?.resolved || 0)}
          change={metrics?.resolvedChange}
          status="success"
          icon={CheckCircle}
        />

        <HeroMetricCard
          title="Avg Resolution Time"
          value={metricsLoading ? '-' : formatDuration(metrics?.avgResolutionTime || 0)}
          change={metrics?.resolutionTimeChange}
          trend={metrics?.resolutionTimeChange < 0 ? 'up' : 'down'}
          status={metrics?.avgResolutionTime < 7200000 ? 'success' : 'warning'}
          icon={Clock}
        />

        <HeroMetricCard
          title="First Response Time"
          value={metricsLoading ? '-' : formatDuration(metrics?.avgFirstResponse || 0)}
          change={metrics?.firstResponseChange}
          trend={metrics?.firstResponseChange < 0 ? 'up' : 'down'}
          status="neutral"
          icon={TrendingUp}
        />

        <HeroMetricCard
          title="SLA Compliance"
          value={metricsLoading ? '-' : formatPercentage(metrics?.slaCompliance || 0)}
          change={metrics?.slaChange}
          status={
            metrics?.slaCompliance >= 95
              ? 'success'
              : metrics?.slaCompliance >= 85
              ? 'warning'
              : 'danger'
          }
          icon={CheckCircle}
        />

        <HeroMetricCard
          title="Customer Satisfaction"
          value={metricsLoading ? '-' : `${metrics?.satisfaction || 0}%`}
          change={metrics?.satisfactionChange}
          status="success"
          icon={Users}
        />
      </div>

      {/* Volume Trends */}
      <div className="grid gap-6 md:grid-cols-1">
        <LineChartWidget
          title="Ticket Volume Trends"
          description="Daily ticket creation, resolution, and backlog"
          data={trends?.volumeData || []}
          xAxisKey="date"
          lines={[
            { dataKey: 'created', name: 'Created', color: '#3b82f6' },
            { dataKey: 'resolved', name: 'Resolved', color: '#10b981' },
            { dataKey: 'backlog', name: 'Backlog', color: '#f59e0b' },
          ]}
          thresholds={[
            { value: 100, label: 'Target Backlog', color: '#ef4444' },
          ]}
          loading={trendsLoading}
          insight={trends?.volumeInsight}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <DonutChartWidget
          title="Status Distribution"
          description="Current tickets by status"
          data={metrics?.byStatus || []}
          loading={metricsLoading}
        />

        <DonutChartWidget
          title="Priority Mix"
          description="Tickets by priority level"
          data={metrics?.byPriority || []}
          loading={metricsLoading}
        />

        <DonutChartWidget
          title="Category Breakdown"
          description="Tickets by category"
          data={metrics?.byCategory || []}
          loading={metricsLoading}
        />
      </div>

      {/* Resolution Time by Category */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="Resolution Time by Category"
          description="Average time to resolve by ticket category"
          data={categories?.resolutionTime || []}
          xAxisKey="category"
          bars={[
            { dataKey: 'avgTime', name: 'Avg Resolution Time' },
          ]}
          layout="vertical"
          loading={categoriesLoading}
          yAxisFormatter={(value) => formatDuration(value)}
          tooltipFormatter={(value) => formatDuration(value)}
        />

        <GaugeWidget
          title="Overall SLA Compliance"
          description="Percentage of tickets meeting SLA targets"
          value={metrics?.slaCompliance || 0}
          target={95}
          thresholds={{
            success: 95,
            warning: 85,
            danger: 0,
          }}
          loading={metricsLoading}
          insight={
            metrics?.slaCompliance >= 95
              ? 'Excellent: Meeting SLA targets consistently'
              : metrics?.slaCompliance >= 85
              ? 'Good: Minor SLA improvements needed'
              : 'Action Required: SLA compliance below acceptable threshold'
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

      {/* Team Performance */}
      <div className="grid gap-6 md:grid-cols-1">
        <DataTableWidget
          title="Team Performance"
          description="Technician productivity and performance metrics"
          data={team?.performance || []}
          columns={[
            {
              key: 'technician',
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
              key: 'assigned',
              label: 'Assigned',
              sortable: true,
              align: 'center',
            },
            {
              key: 'resolved',
              label: 'Resolved',
              sortable: true,
              align: 'center',
            },
            {
              key: 'avgResolutionTime',
              label: 'Avg Resolution',
              sortable: true,
              render: (value) => formatDuration(value),
              align: 'center',
            },
            {
              key: 'slaCompliance',
              label: 'SLA Rate',
              sortable: true,
              render: (value) => (
                <span
                  className={
                    value >= 95
                      ? 'text-green-600 font-semibold'
                      : value >= 85
                      ? 'text-yellow-600 font-semibold'
                      : 'text-red-600 font-semibold'
                  }
                >
                  {value}%
                </span>
              ),
              align: 'center',
            },
            {
              key: 'satisfaction',
              label: 'CSAT',
              sortable: true,
              render: (value) => `${value}%`,
              align: 'center',
            },
          ]}
          showRanking
          rankingKey="resolved"
          loading={teamLoading}
        />
      </div>

      {/* SLA Breach Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="SLA Breaches by Priority"
          description="Number of SLA breaches by ticket priority"
          data={metrics?.slaBreaches || []}
          xAxisKey="priority"
          bars={[
            { dataKey: 'breaches', name: 'Breaches', color: '#ef4444' },
          ]}
          loading={metricsLoading}
        />

        <LineChartWidget
          title="SLA Compliance Trend"
          description="Daily SLA compliance rate over time"
          data={trends?.slaComplianceTrend || []}
          xAxisKey="date"
          lines={[
            { dataKey: 'compliance', name: 'Compliance %', color: '#10b981' },
          ]}
          thresholds={[
            { value: 95, label: 'Target', color: '#10b981' },
            { value: 85, label: 'Warning', color: '#f59e0b' },
          ]}
          loading={trendsLoading}
          yAxisFormatter={(value) => `${value}%`}
        />
      </div>
    </div>
  )
}

export default function TicketAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <TicketAnalyticsContent />
    </Suspense>
  )
}
