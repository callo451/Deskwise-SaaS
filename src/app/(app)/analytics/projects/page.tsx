'use client'

import { Suspense } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { DataTableWidget, StatusCell } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  FolderKanban,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/analytics-utils'
import Link from 'next/link'

function ProjectAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()

  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/projects/metrics',
    filters
  )

  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/projects/trends',
    filters
  )

  const { data: projects, loading: projectsLoading } = useAnalytics(
    '/api/analytics/projects/list',
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
            <h1 className="text-3xl font-bold tracking-tight">Project Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track project health, budgets, and resource allocation
            </p>
          </div>
        </div>

        <ExportMenu
          data={metrics}
          filename="project-analytics"
          title="Project Analytics Report"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        statuses={['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']}
        priorities={['Low', 'Medium', 'High', 'Critical']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <HeroMetricCard
          title="Total Projects"
          value={metricsLoading ? '-' : metrics?.total || 0}
          change={metrics?.totalChange}
          status="neutral"
          icon={FolderKanban}
        />

        <HeroMetricCard
          title="Active Projects"
          value={metricsLoading ? '-' : metrics?.active || 0}
          change={metrics?.activeChange}
          status="neutral"
          icon={TrendingUp}
        />

        <HeroMetricCard
          title="On Schedule"
          value={metricsLoading ? '-' : metrics?.onSchedule || 0}
          change={metrics?.onScheduleChange}
          status="success"
          icon={CheckCircle}
        />

        <HeroMetricCard
          title="At Risk"
          value={metricsLoading ? '-' : metrics?.atRisk || 0}
          change={metrics?.atRiskChange}
          status={metrics?.atRisk > 5 ? 'danger' : 'warning'}
          icon={AlertTriangle}
        />

        <HeroMetricCard
          title="Total Budget"
          value={metricsLoading ? '-' : formatCurrency(metrics?.totalBudget || 0)}
          change={metrics?.budgetChange}
          status="neutral"
          icon={DollarSign}
        />

        <HeroMetricCard
          title="Budget Utilization"
          value={metricsLoading ? '-' : formatPercentage(metrics?.budgetUtilization || 0)}
          change={metrics?.utilizationChange}
          status={
            metrics?.budgetUtilization > 90
              ? 'danger'
              : metrics?.budgetUtilization > 75
              ? 'warning'
              : 'success'
          }
          icon={TrendingUp}
        />
      </div>

      {/* Project Health & Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        <DonutChartWidget
          title="Project Health Status"
          description="Distribution by health indicator"
          data={metrics?.byHealth || []}
          loading={metricsLoading}
          colors={['#10b981', '#f59e0b', '#ef4444']}
        />

        <BarChartWidget
          title="Project Completion Timeline"
          description="Projects completed per month"
          data={trends?.completionTimeline || []}
          xAxisKey="month"
          bars={[
            { dataKey: 'completed', name: 'Completed', color: '#10b981' },
          ]}
          loading={trendsLoading}
        />
      </div>

      {/* Budget Analysis */}
      <div className="grid gap-6 md:grid-cols-1">
        <BarChartWidget
          title="Budget vs Actual Spending"
          description="Planned budget compared to actual spend by project"
          data={projects?.budgetComparison || []}
          xAxisKey="project"
          bars={[
            { dataKey: 'budget', name: 'Budget', color: '#3b82f6' },
            { dataKey: 'actual', name: 'Actual', color: '#10b981' },
          ]}
          layout="vertical"
          loading={projectsLoading}
          yAxisFormatter={(value) => formatCurrency(value)}
          tooltipFormatter={(value) => formatCurrency(value)}
        />
      </div>

      {/* Resource Allocation */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="Resource Allocation"
          description="Team members allocated to projects"
          data={metrics?.resourceAllocation || []}
          xAxisKey="department"
          bars={[
            { dataKey: 'allocated', name: 'Allocated' },
          ]}
          loading={metricsLoading}
        />

        <LineChartWidget
          title="Project Progress Trend"
          description="Average completion percentage over time"
          data={trends?.progressTrend || []}
          xAxisKey="date"
          lines={[
            { dataKey: 'avgProgress', name: 'Avg Progress %', color: '#3b82f6' },
          ]}
          loading={trendsLoading}
          yAxisFormatter={(value) => `${value}%`}
        />
      </div>

      {/* Project List */}
      <DataTableWidget
        title="Project Details"
        description="Comprehensive project status and metrics"
        data={projects?.list || []}
        columns={[
          {
            key: 'name',
            label: 'Project Name',
          },
          {
            key: 'status',
            label: 'Status',
            render: (value) => <StatusCell status={value} />,
            align: 'center',
          },
          {
            key: 'progress',
            label: 'Progress',
            sortable: true,
            render: (value) => `${value}%`,
            align: 'center',
          },
          {
            key: 'budget',
            label: 'Budget',
            sortable: true,
            render: (value) => formatCurrency(value),
            align: 'right',
          },
          {
            key: 'spent',
            label: 'Spent',
            sortable: true,
            render: (value, row) => (
              <span
                className={
                  (value / row.budget) > 0.9
                    ? 'text-red-600 font-semibold'
                    : (value / row.budget) > 0.75
                    ? 'text-yellow-600 font-semibold'
                    : ''
                }
              >
                {formatCurrency(value)}
              </span>
            ),
            align: 'right',
          },
          {
            key: 'dueDate',
            label: 'Due Date',
            sortable: true,
            align: 'center',
          },
          {
            key: 'health',
            label: 'Health',
            render: (value) => <StatusCell status={value} />,
            align: 'center',
          },
        ]}
        loading={projectsLoading}
      />
    </div>
  )
}

export default function ProjectAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <ProjectAnalyticsContent />
    </Suspense>
  )
}
