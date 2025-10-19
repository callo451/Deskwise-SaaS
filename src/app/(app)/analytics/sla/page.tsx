'use client'

import { Suspense } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { GaugeWidget } from '@/components/analytics/gauge-widget'
import { DataTableWidget } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  ArrowLeft,
} from 'lucide-react'
import { formatNumber, formatDuration, formatPercentage } from '@/lib/analytics-utils'
import Link from 'next/link'

function SLAAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()

  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/sla/metrics',
    filters
  )

  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/sla/trends',
    filters
  )

  const { data: breaches, loading: breachesLoading } = useAnalytics(
    '/api/analytics/sla/breaches',
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
            <h1 className="text-3xl font-bold tracking-tight">SLA Performance</h1>
            <p className="text-muted-foreground mt-1">
              Service level agreement compliance and breach analysis
            </p>
          </div>
        </div>

        <ExportMenu
          data={metrics}
          filename="sla-analytics"
          title="SLA Performance Report"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        priorities={['P1', 'P2', 'P3', 'P4']}
        categories={['Response Time', 'Resolution Time', 'Availability']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <HeroMetricCard
          title="Overall Compliance"
          value={metricsLoading ? '-' : formatPercentage(metrics?.overallCompliance || 0)}
          change={metrics?.complianceChange}
          status={
            metrics?.overallCompliance >= 95
              ? 'success'
              : metrics?.overallCompliance >= 85
              ? 'warning'
              : 'danger'
          }
          icon={Target}
        />

        <HeroMetricCard
          title="SLA Met"
          value={metricsLoading ? '-' : formatNumber(metrics?.met || 0)}
          change={metrics?.metChange}
          status="success"
          icon={CheckCircle}
        />

        <HeroMetricCard
          title="SLA Breaches"
          value={metricsLoading ? '-' : metrics?.breaches || 0}
          change={metrics?.breachesChange}
          trend={metrics?.breachesChange < 0 ? 'up' : 'down'}
          status={metrics?.breaches > 10 ? 'danger' : metrics?.breaches > 5 ? 'warning' : 'success'}
          icon={XCircle}
        />

        <HeroMetricCard
          title="At Risk"
          value={metricsLoading ? '-' : metrics?.atRisk || 0}
          change={metrics?.atRiskChange}
          status={metrics?.atRisk > 20 ? 'warning' : 'neutral'}
          icon={AlertTriangle}
        />

        <HeroMetricCard
          title="Avg Time to Breach"
          value={metricsLoading ? '-' : formatDuration(metrics?.avgTimeToBreach || 0)}
          change={metrics?.timeToBreachChange}
          status="neutral"
          icon={Clock}
        />

        <HeroMetricCard
          title="Response Rate"
          value={metricsLoading ? '-' : formatPercentage(metrics?.responseRate || 0)}
          change={metrics?.responseRateChange}
          status={metrics?.responseRate >= 95 ? 'success' : 'warning'}
          icon={TrendingUp}
        />
      </div>

      {/* SLA Compliance Gauges */}
      <div className="grid gap-6 md:grid-cols-3">
        <GaugeWidget
          title="Overall SLA Compliance"
          description="All tickets across all priorities"
          value={metrics?.overallCompliance || 0}
          target={95}
          loading={metricsLoading}
          insight={
            metrics?.overallCompliance >= 95
              ? 'Excellent SLA compliance'
              : metrics?.overallCompliance >= 85
              ? 'SLA compliance needs improvement'
              : 'Critical: SLA compliance below target'
          }
          insightType={
            metrics?.overallCompliance >= 95
              ? 'success'
              : metrics?.overallCompliance >= 85
              ? 'warning'
              : 'danger'
          }
        />

        <GaugeWidget
          title="Response Time SLA"
          description="First response within target"
          value={metrics?.responseCompliance || 0}
          target={98}
          loading={metricsLoading}
        />

        <GaugeWidget
          title="Resolution Time SLA"
          description="Resolution within target"
          value={metrics?.resolutionCompliance || 0}
          target={95}
          loading={metricsLoading}
        />
      </div>

      {/* Compliance Trends */}
      <div className="grid gap-6 md:grid-cols-1">
        <LineChartWidget
          title="SLA Compliance Trend"
          description="Daily compliance rate over time"
          data={trends?.complianceTrend || []}
          xAxisKey="date"
          lines={[
            { dataKey: 'overall', name: 'Overall', color: '#3b82f6' },
            { dataKey: 'response', name: 'Response Time', color: '#10b981' },
            { dataKey: 'resolution', name: 'Resolution Time', color: '#f59e0b' },
          ]}
          thresholds={[
            { value: 95, label: 'Target 95%', color: '#10b981' },
            { value: 85, label: 'Warning 85%', color: '#f59e0b' },
          ]}
          loading={trendsLoading}
          yAxisFormatter={(value) => `${value}%`}
        />
      </div>

      {/* SLA Breach Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="Breaches by Priority"
          description="SLA breaches by ticket priority"
          data={metrics?.breachesByPriority || []}
          xAxisKey="priority"
          bars={[
            { dataKey: 'breaches', name: 'Breaches', color: '#ef4444' },
          ]}
          loading={metricsLoading}
        />

        <BarChartWidget
          title="Breaches by Category"
          description="SLA breaches by ticket category"
          data={metrics?.breachesByCategory || []}
          xAxisKey="category"
          bars={[
            { dataKey: 'breaches', name: 'Breaches', color: '#ef4444' },
          ]}
          loading={metricsLoading}
        />
      </div>

      {/* Service Level Breakdown */}
      <DataTableWidget
        title="Service Level Breakdown"
        description="SLA performance by service level"
        data={metrics?.byServiceLevel || []}
        columns={[
          {
            key: 'level',
            label: 'Service Level',
          },
          {
            key: 'target',
            label: 'Target',
            align: 'center',
          },
          {
            key: 'total',
            label: 'Total',
            sortable: true,
            align: 'center',
          },
          {
            key: 'met',
            label: 'Met',
            sortable: true,
            align: 'center',
          },
          {
            key: 'breached',
            label: 'Breached',
            sortable: true,
            align: 'center',
          },
          {
            key: 'compliance',
            label: 'Compliance',
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
                {value.toFixed(1)}%
              </span>
            ),
            align: 'center',
          },
        ]}
        loading={metricsLoading}
      />

      {/* Recent SLA Breaches */}
      <DataTableWidget
        title="Recent SLA Breaches"
        description="Tickets that breached SLA in the selected period"
        data={breaches?.recent || []}
        columns={[
          {
            key: 'id',
            label: 'Ticket ID',
          },
          {
            key: 'title',
            label: 'Title',
          },
          {
            key: 'priority',
            label: 'Priority',
            align: 'center',
          },
          {
            key: 'slaTarget',
            label: 'SLA Target',
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'actualTime',
            label: 'Actual Time',
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'breachTime',
            label: 'Breach By',
            render: (value) => formatDuration(value),
            align: 'center',
          },
          {
            key: 'assignee',
            label: 'Assignee',
            align: 'center',
          },
        ]}
        loading={breachesLoading}
      />
    </div>
  )
}

export default function SLAAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <SLAAnalyticsContent />
    </Suspense>
  )
}
