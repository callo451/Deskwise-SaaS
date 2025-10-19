'use client'

import { Suspense } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { DataTableWidget } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  AlertCircle,
  Clock,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowLeft,
} from 'lucide-react'
import { formatNumber, formatDuration, formatPercentage } from '@/lib/analytics-utils'
import Link from 'next/link'

function IncidentAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()

  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/incidents/metrics',
    filters
  )

  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/incidents/trends',
    filters
  )

  const { data: rootCauses, loading: rootCausesLoading } = useAnalytics(
    '/api/analytics/incidents/root-causes',
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
            <h1 className="text-3xl font-bold tracking-tight">Incident Analytics</h1>
            <p className="text-muted-foreground mt-1">
              MTTR, MTBF, and availability metrics
            </p>
          </div>
        </div>

        <ExportMenu
          data={metrics}
          filename="incident-analytics"
          title="Incident Analytics Report"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        statuses={['Open', 'Investigating', 'Resolved', 'Closed']}
        priorities={['P1', 'P2', 'P3', 'P4']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <HeroMetricCard
          title="Total Incidents"
          value={metricsLoading ? '-' : formatNumber(metrics?.total || 0)}
          change={metrics?.totalChange}
          status="neutral"
          icon={AlertCircle}
        />

        <HeroMetricCard
          title="Active Incidents"
          value={metricsLoading ? '-' : metrics?.active || 0}
          change={metrics?.activeChange}
          status={metrics?.active > 5 ? 'danger' : 'neutral'}
          icon={AlertTriangle}
        />

        <HeroMetricCard
          title="MTTR"
          value={metricsLoading ? '-' : formatDuration(metrics?.mttr || 0)}
          change={metrics?.mttrChange}
          trend={metrics?.mttrChange < 0 ? 'up' : 'down'}
          status={metrics?.mttr < 14400000 ? 'success' : 'warning'}
          icon={Clock}
        />

        <HeroMetricCard
          title="MTBF"
          value={metricsLoading ? '-' : formatDuration(metrics?.mtbf || 0)}
          change={metrics?.mtbfChange}
          trend={metrics?.mtbfChange > 0 ? 'up' : 'down'}
          status={metrics?.mtbf > 86400000 ? 'success' : 'warning'}
          icon={TrendingDown}
        />

        <HeroMetricCard
          title="Availability"
          value={metricsLoading ? '-' : formatPercentage(metrics?.availability || 0)}
          change={metrics?.availabilityChange}
          status={metrics?.availability >= 99.9 ? 'success' : metrics?.availability >= 99 ? 'warning' : 'danger'}
          icon={Activity}
        />

        <HeroMetricCard
          title="Resolved"
          value={metricsLoading ? '-' : metrics?.resolved || 0}
          change={metrics?.resolvedChange}
          status="success"
          icon={CheckCircle}
        />
      </div>

      {/* Incident Trends */}
      <div className="grid gap-6 md:grid-cols-1">
        <LineChartWidget
          title="Incident Severity Timeline"
          description="Daily incident volume by severity"
          data={trends?.severityTimeline || []}
          xAxisKey="date"
          lines={[
            { dataKey: 'p1', name: 'P1 - Critical', color: '#ef4444' },
            { dataKey: 'p2', name: 'P2 - High', color: '#f59e0b' },
            { dataKey: 'p3', name: 'P3 - Medium', color: '#3b82f6' },
            { dataKey: 'p4', name: 'P4 - Low', color: '#10b981' },
          ]}
          loading={trendsLoading}
          insight={trends?.severityInsight}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        <DonutChartWidget
          title="Severity Distribution"
          description="Incidents by severity level"
          data={metrics?.bySeverity || []}
          loading={metricsLoading}
          colors={['#ef4444', '#f59e0b', '#3b82f6', '#10b981']}
        />

        <DonutChartWidget
          title="Status Breakdown"
          description="Current incident status"
          data={metrics?.byStatus || []}
          loading={metricsLoading}
        />

        <DonutChartWidget
          title="Service Impact"
          description="Affected services"
          data={metrics?.byService || []}
          loading={metricsLoading}
        />
      </div>

      {/* Root Cause Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="Root Cause Distribution"
          description="Incidents by identified root cause"
          data={rootCauses?.distribution || []}
          xAxisKey="cause"
          bars={[
            { dataKey: 'count', name: 'Incidents', color: '#3b82f6' },
          ]}
          layout="vertical"
          loading={rootCausesLoading}
        />

        <BarChartWidget
          title="MTTR by Root Cause"
          description="Average resolution time by cause type"
          data={rootCauses?.mttrByCause || []}
          xAxisKey="cause"
          bars={[
            { dataKey: 'mttr', name: 'MTTR', color: '#f59e0b' },
          ]}
          layout="vertical"
          loading={rootCausesLoading}
          yAxisFormatter={(value) => formatDuration(value)}
          tooltipFormatter={(value) => formatDuration(value)}
        />
      </div>

      {/* Service Impact Heatmap (as table) */}
      <DataTableWidget
        title="Service Impact Analysis"
        description="Downtime and incident count by service"
        data={metrics?.serviceImpact || []}
        columns={[
          {
            key: 'service',
            label: 'Service',
          },
          {
            key: 'incidents',
            label: 'Incidents',
            sortable: true,
            align: 'center',
          },
          {
            key: 'totalDowntime',
            label: 'Total Downtime',
            sortable: true,
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'availability',
            label: 'Availability',
            sortable: true,
            render: (value) => (
              <span
                className={
                  value >= 99.9
                    ? 'text-green-600 font-semibold'
                    : value >= 99
                    ? 'text-yellow-600 font-semibold'
                    : 'text-red-600 font-semibold'
                }
              >
                {value.toFixed(3)}%
              </span>
            ),
            align: 'center',
          },
          {
            key: 'mttr',
            label: 'MTTR',
            sortable: true,
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'mtbf',
            label: 'MTBF',
            sortable: true,
            render: (value) => formatDuration(value),
            align: 'center',
          },
        ]}
        loading={metricsLoading}
      />

      {/* Active Incidents List */}
      <DataTableWidget
        title="Active Incidents"
        description="Currently open high-priority incidents"
        data={metrics?.activeIncidents || []}
        columns={[
          {
            key: 'id',
            label: 'ID',
          },
          {
            key: 'title',
            label: 'Title',
          },
          {
            key: 'severity',
            label: 'Severity',
            align: 'center',
            render: (value) => (
              <span
                className={
                  value === 'P1'
                    ? 'text-red-600 font-semibold'
                    : value === 'P2'
                    ? 'text-orange-600 font-semibold'
                    : ''
                }
              >
                {value}
              </span>
            ),
          },
          {
            key: 'service',
            label: 'Service',
            align: 'center',
          },
          {
            key: 'duration',
            label: 'Duration',
            sortable: true,
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'assignee',
            label: 'Assignee',
            align: 'center',
          },
        ]}
        loading={metricsLoading}
      />
    </div>
  )
}

export default function IncidentAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <IncidentAnalyticsContent />
    </Suspense>
  )
}
