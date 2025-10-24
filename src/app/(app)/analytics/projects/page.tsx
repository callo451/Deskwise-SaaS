'use client'

import { Suspense, useState } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { LineChartWidget } from '@/components/analytics/line-chart-widget'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { GaugeWidget } from '@/components/analytics/gauge-widget'
import { DataTableWidget, StatusCell, UserCell } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  FolderKanban,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Activity,
  Zap,
  ArrowLeft,
  BarChart3,
  GitBranch,
  Shield,
  Gauge,
  ListChecks,
} from 'lucide-react'
import { formatNumber, formatCurrency, formatPercentage, formatDuration } from '@/lib/analytics-utils'
import Link from 'next/link'

function ProjectAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()
  const [activeTab, setActiveTab] = useState('basic')

  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/projects/metrics',
    filters
  )

  const { data: trends, loading: trendsLoading } = useAnalytics(
    '/api/analytics/projects/trends',
    filters
  )

  const { data: evm, loading: evmLoading } = useAnalytics(
    '/api/analytics/projects/evm',
    filters
  )

  const { data: resources, loading: resourcesLoading } = useAnalytics(
    '/api/analytics/projects/resources',
    filters
  )

  const { data: projects, loading: projectsLoading } = useAnalytics(
    '/api/analytics/projects/list',
    filters
  )

  const { data: risks, loading: risksLoading } = useAnalytics(
    '/api/analytics/projects/risks',
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
              {activeTab === 'basic'
                ? 'Executive summary and key project portfolio metrics'
                : 'Comprehensive project portfolio analysis, EVM metrics, and performance tracking'
              }
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
        statuses={['planning', 'active', 'on_hold', 'completed', 'cancelled']}
        priorities={['Low', 'Medium', 'High', 'Critical']}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Basic Overview
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Advanced Metrics
          </TabsTrigger>
        </TabsList>

        {/* BASIC TAB - Executive-Friendly */}
        <TabsContent value="basic" className="space-y-6">
          {/* Simple Hero Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <HeroMetricCard
              title="Active Projects"
              value={metricsLoading ? '-' : metrics?.active || 0}
              change={metrics?.activeChange}
              status="neutral"
              icon={FolderKanban}
            />

            <HeroMetricCard
              title="On Track"
              value={metricsLoading ? '-' : metrics?.onSchedule || 0}
              change={metrics?.onScheduleChange}
              status="success"
              icon={CheckCircle}
            />

            <HeroMetricCard
              title="Need Attention"
              value={metricsLoading ? '-' : metrics?.atRisk || 0}
              change={metrics?.atRiskChange}
              status={metrics?.atRisk > 5 ? 'danger' : metrics?.atRisk > 2 ? 'warning' : 'success'}
              icon={AlertTriangle}
            />

            <HeroMetricCard
              title="Budget Health"
              value={metricsLoading ? '-' : formatPercentage(metrics?.budgetUtilization || 0)}
              change={metrics?.utilizationChange}
              status={
                metrics?.budgetUtilization > 90
                  ? 'danger'
                  : metrics?.budgetUtilization > 75
                  ? 'warning'
                  : 'success'
              }
              icon={DollarSign}
            />
          </div>

          {/* Budget Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <HeroMetricCard
              title="Total Budget"
              value={metricsLoading ? '-' : formatCurrency(metrics?.totalBudget || 0)}
              status="neutral"
              icon={DollarSign}
              className="bg-blue-50 dark:bg-blue-950"
            />

            <HeroMetricCard
              title="Amount Spent"
              value={metricsLoading ? '-' : formatCurrency(metrics?.budgetSpent || 0)}
              status="neutral"
              icon={TrendingUp}
              className="bg-green-50 dark:bg-green-950"
            />

            <HeroMetricCard
              title="Remaining Budget"
              value={metricsLoading ? '-' : formatCurrency((metrics?.totalBudget || 0) - (metrics?.budgetSpent || 0))}
              status={
                ((metrics?.budgetSpent || 0) / (metrics?.totalBudget || 1)) > 0.9
                  ? 'danger'
                  : ((metrics?.budgetSpent || 0) / (metrics?.totalBudget || 1)) > 0.75
                  ? 'warning'
                  : 'success'
              }
              icon={Target}
              className="bg-purple-50 dark:bg-purple-950"
            />
          </div>

          {/* Project Status Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <DonutChartWidget
              title="Project Status"
              description="How your projects are distributed"
              data={metrics?.byStatus || []}
              loading={metricsLoading}
            />

            <DonutChartWidget
              title="Project Health"
              description="Overall health of your portfolio"
              data={metrics?.byHealth || []}
              loading={metricsLoading}
              colors={['#10b981', '#f59e0b', '#ef4444']}
            />
          </div>

          {/* Progress Trend */}
          <div className="grid gap-6 md:grid-cols-1">
            <LineChartWidget
              title="Portfolio Progress"
              description="Average completion percentage over time"
              data={trends?.portfolioTrend || []}
              xAxisKey="date"
              lines={[
                { dataKey: 'avgProgress', name: 'Average Progress', color: '#3b82f6' },
              ]}
              loading={trendsLoading}
              yAxisFormatter={(value) => `${value}%`}
            />
          </div>

          {/* Budget by Project */}
          <div className="grid gap-6 md:grid-cols-1">
            <BarChartWidget
              title="Budget Status by Project"
              description="Compare planned vs actual spending"
              data={projects?.budgetComparison || []}
              xAxisKey="project"
              bars={[
                { dataKey: 'budget', name: 'Total Budget', color: '#3b82f6' },
                { dataKey: 'actual', name: 'Spent', color: '#10b981' },
              ]}
              layout="vertical"
              loading={projectsLoading}
              yAxisFormatter={(value) => formatCurrency(value)}
              tooltipFormatter={(value) => formatCurrency(value)}
            />
          </div>

          {/* Completion Timeline */}
          <div className="grid gap-6 md:grid-cols-2">
            <BarChartWidget
              title="Monthly Completions"
              description="Projects completed each month"
              data={trends?.completionTimeline || []}
              xAxisKey="month"
              bars={[
                { dataKey: 'completed', name: 'Completed', color: '#10b981' },
              ]}
              loading={trendsLoading}
            />

            <BarChartWidget
              title="Projects by Team"
              description="Resource allocation across teams"
              data={resources?.byRole || []}
              xAxisKey="role"
              bars={[
                { dataKey: 'allocated', name: 'Team Members', color: '#3b82f6' },
              ]}
              loading={resourcesLoading}
            />
          </div>

          {/* Simplified Project List */}
          <DataTableWidget
            title="Project Summary"
            description="Quick overview of all projects"
            data={projects?.list || []}
            columns={[
              {
                key: 'projectNumber',
                label: 'ID',
                align: 'center',
              },
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
                key: 'health',
                label: 'Health',
                render: (value) => (
                  <StatusCell
                    status={value === 'green' ? 'success' : value === 'yellow' ? 'warning' : 'danger'}
                  />
                ),
                align: 'center',
              },
              {
                key: 'progress',
                label: 'Complete',
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
            ]}
            loading={projectsLoading}
          />
        </TabsContent>

        {/* ADVANCED TAB - Technical/PM View */}
        <TabsContent value="advanced" className="space-y-6">
          {/* Hero Metrics - Portfolio Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <HeroMetricCard
              title="Total Projects"
              value={metricsLoading ? '-' : formatNumber(metrics?.total || 0)}
              change={metrics?.totalChange}
              status="neutral"
              icon={FolderKanban}
            />

            <HeroMetricCard
              title="Active Projects"
              value={metricsLoading ? '-' : metrics?.active || 0}
              change={metrics?.activeChange}
              status="neutral"
              icon={Activity}
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
              status={metrics?.atRisk > 5 ? 'danger' : metrics?.atRisk > 2 ? 'warning' : 'success'}
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
              title="Budget Spent"
              value={metricsLoading ? '-' : formatCurrency(metrics?.budgetSpent || 0)}
              change={metrics?.spentChange}
              status="neutral"
              icon={TrendingUp}
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
              icon={BarChart3}
            />

            <HeroMetricCard
              title="Completion Rate"
              value={metricsLoading ? '-' : formatPercentage(metrics?.completionRate || 0)}
              change={metrics?.completionChange}
              status="success"
              icon={Target}
            />
          </div>

          {/* Earned Value Management (EVM) Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <HeroMetricCard
              title="Planned Value (PV)"
              value={metricsLoading ? '-' : formatCurrency(evm?.plannedValue || 0)}
              status="neutral"
              icon={Calendar}
              className="bg-blue-50 dark:bg-blue-950"
            />

            <HeroMetricCard
              title="Earned Value (EV)"
              value={metricsLoading ? '-' : formatCurrency(evm?.earnedValue || 0)}
              status="neutral"
              icon={TrendingUp}
              className="bg-green-50 dark:bg-green-950"
            />

            <HeroMetricCard
              title="Actual Cost (AC)"
              value={metricsLoading ? '-' : formatCurrency(evm?.actualCost || 0)}
              status="neutral"
              icon={DollarSign}
              className="bg-orange-50 dark:bg-orange-950"
            />

            <HeroMetricCard
              title="Cost Variance (CV)"
              value={metricsLoading ? '-' : formatCurrency(evm?.costVariance || 0)}
              status={evm?.costVariance >= 0 ? 'success' : 'danger'}
              icon={evm?.costVariance >= 0 ? TrendingUp : TrendingDown}
              className="bg-purple-50 dark:bg-purple-950"
            />

            <HeroMetricCard
              title="Schedule Variance (SV)"
              value={metricsLoading ? '-' : formatCurrency(evm?.scheduleVariance || 0)}
              status={evm?.scheduleVariance >= 0 ? 'success' : 'danger'}
              icon={evm?.scheduleVariance >= 0 ? CheckCircle : AlertTriangle}
              className="bg-indigo-50 dark:bg-indigo-950"
            />
          </div>

          {/* EVM Performance Indices */}
          <div className="grid gap-6 md:grid-cols-4">
            <GaugeWidget
              title="Cost Performance Index (CPI)"
              description="Cost efficiency (>1.0 = under budget)"
              value={((evm?.cpi || 0) * 100)}
              target={100}
              thresholds={{
                success: 95,
                warning: 85,
                danger: 0,
              }}
              loading={evmLoading}
              insight={
                evm?.cpi >= 1.0
                  ? 'Excellent: Under budget performance'
                  : evm?.cpi >= 0.9
                  ? 'Good: Slight cost overrun'
                  : 'Action Required: Significant cost overrun'
              }
              insightType={
                evm?.cpi >= 1.0
                  ? 'success'
                  : evm?.cpi >= 0.9
                  ? 'warning'
                  : 'danger'
              }
            />

            <GaugeWidget
              title="Schedule Performance Index (SPI)"
              description="Schedule efficiency (>1.0 = ahead)"
              value={((evm?.spi || 0) * 100)}
              target={100}
              thresholds={{
                success: 95,
                warning: 85,
                danger: 0,
              }}
              loading={evmLoading}
              insight={
                evm?.spi >= 1.0
                  ? 'Excellent: Ahead of schedule'
                  : evm?.spi >= 0.9
                  ? 'Good: Minor schedule delays'
                  : 'Action Required: Behind schedule'
              }
              insightType={
                evm?.spi >= 1.0
                  ? 'success'
                  : evm?.spi >= 0.9
                  ? 'warning'
                  : 'danger'
              }
            />

            <GaugeWidget
              title="Estimate at Completion (EAC)"
              description="Projected total cost at completion"
              value={((evm?.actualCost || 0) / (metrics?.totalBudget || 1)) * 100}
              target={100}
              thresholds={{
                success: 100,
                warning: 110,
                danger: 120,
              }}
              loading={evmLoading}
              insight={formatCurrency(evm?.eac || 0)}
            />

            <GaugeWidget
              title="To Complete Performance Index"
              description="Required efficiency to finish on budget"
              value={((evm?.tcpi || 0) * 100)}
              target={100}
              thresholds={{
                success: 100,
                warning: 110,
                danger: 120,
              }}
              loading={evmLoading}
              insight={
                evm?.tcpi <= 1.0
                  ? 'Achievable: Can finish on budget'
                  : evm?.tcpi <= 1.2
                  ? 'Challenging: Requires improved efficiency'
                  : 'Critical: Unlikely to finish on budget'
              }
              insightType={
                evm?.tcpi <= 1.0
                  ? 'success'
                  : evm?.tcpi <= 1.2
                  ? 'warning'
                  : 'danger'
              }
            />
          </div>

          {/* Project Health & Status Distribution */}
          <div className="grid gap-6 md:grid-cols-3">
            <DonutChartWidget
              title="Project Health Status"
              description="Distribution by health indicator"
              data={metrics?.byHealth || []}
              loading={metricsLoading}
              colors={['#10b981', '#f59e0b', '#ef4444']}
            />

            <DonutChartWidget
              title="Project Status Distribution"
              description="Projects by lifecycle stage"
              data={metrics?.byStatus || []}
              loading={metricsLoading}
            />

            <DonutChartWidget
              title="Project Stage Distribution"
              description="PRINCE2/PMBOK stages"
              data={metrics?.byStage || []}
              loading={metricsLoading}
            />
          </div>

          {/* Portfolio Trends */}
          <div className="grid gap-6 md:grid-cols-1">
            <LineChartWidget
              title="Portfolio Progress Trend"
              description="Overall portfolio completion and budget burn rate over time"
              data={trends?.portfolioTrend || []}
              xAxisKey="date"
              lines={[
                { dataKey: 'avgProgress', name: 'Avg Progress %', color: '#3b82f6' },
                { dataKey: 'budgetBurn', name: 'Budget Burn %', color: '#f59e0b' },
                { dataKey: 'schedulePerfIndex', name: 'Schedule Performance', color: '#10b981' },
              ]}
              loading={trendsLoading}
              yAxisFormatter={(value) => `${value}%`}
            />
          </div>

          {/* Budget Analysis */}
          <div className="grid gap-6 md:grid-cols-1">
            <BarChartWidget
              title="Budget vs Actual Spending by Project"
              description="Planned budget compared to actual spend with variance indicators"
              data={projects?.budgetComparison || []}
              xAxisKey="project"
              bars={[
                { dataKey: 'budget', name: 'Planned Budget', color: '#3b82f6' },
                { dataKey: 'actual', name: 'Actual Spend', color: '#10b981' },
                { dataKey: 'projected', name: 'Projected Total', color: '#f59e0b' },
              ]}
              layout="vertical"
              loading={projectsLoading}
              yAxisFormatter={(value) => formatCurrency(value)}
              tooltipFormatter={(value) => formatCurrency(value)}
            />
          </div>

          {/* Resource Allocation & Utilization */}
          <div className="grid gap-6 md:grid-cols-2">
            <BarChartWidget
              title="Resource Allocation by Role"
              description="Team members allocated across projects by role"
              data={resources?.byRole || []}
              xAxisKey="role"
              bars={[
                { dataKey: 'allocated', name: 'Allocated', color: '#3b82f6' },
                { dataKey: 'available', name: 'Available', color: '#10b981' },
              ]}
              loading={resourcesLoading}
            />

            <LineChartWidget
              title="Resource Utilization Trend"
              description="Average resource utilization percentage over time"
              data={trends?.resourceUtilization || []}
              xAxisKey="date"
              lines={[
                { dataKey: 'utilization', name: 'Utilization %', color: '#3b82f6' },
              ]}
              thresholds={[
                { value: 85, label: 'Optimal', color: '#10b981' },
                { value: 100, label: 'Full Capacity', color: '#f59e0b' },
              ]}
              loading={trendsLoading}
              yAxisFormatter={(value) => `${value}%`}
            />
          </div>

          {/* Timeline Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <BarChartWidget
              title="Project Completion Timeline"
              description="Projects completed per month"
              data={trends?.completionTimeline || []}
              xAxisKey="month"
              bars={[
                { dataKey: 'completed', name: 'Completed', color: '#10b981' },
                { dataKey: 'cancelled', name: 'Cancelled', color: '#ef4444' },
              ]}
              loading={trendsLoading}
            />

            <BarChartWidget
              title="Avg Duration by Project Type"
              description="Average project duration by type/methodology"
              data={metrics?.durationByType || []}
              xAxisKey="type"
              bars={[
                { dataKey: 'avgDuration', name: 'Avg Duration (days)', color: '#3b82f6' },
              ]}
              loading={metricsLoading}
            />
          </div>

          {/* Risk & Issue Analysis */}
          <div className="grid gap-6 md:grid-cols-3">
            <DonutChartWidget
              title="Risk Distribution"
              description="Active risks by severity"
              data={risks?.bySeverity || []}
              loading={risksLoading}
              colors={['#10b981', '#f59e0b', '#ef4444', '#dc2626']}
            />

            <BarChartWidget
              title="Top Risk Categories"
              description="Most common risk categories"
              data={risks?.byCategory || []}
              xAxisKey="category"
              bars={[
                { dataKey: 'count', name: 'Active Risks', color: '#ef4444' },
              ]}
              layout="vertical"
              loading={risksLoading}
            />

            <BarChartWidget
              title="Issues by Project"
              description="Active issues per project"
              data={risks?.issuesByProject || []}
              xAxisKey="project"
              bars={[
                { dataKey: 'issues', name: 'Active Issues', color: '#f59e0b' },
              ]}
              layout="vertical"
              loading={risksLoading}
            />
          </div>

          {/* Team Performance */}
          <div className="grid gap-6 md:grid-cols-1">
            <DataTableWidget
              title="Project Manager Performance"
              description="PM productivity and project success metrics"
              data={resources?.pmPerformance || []}
              columns={[
                {
                  key: 'manager',
                  label: 'Project Manager',
                  render: (value, row) => (
                    <UserCell
                      name={row.name}
                      email={row.email}
                      avatar={row.avatar}
                    />
                  ),
                },
                {
                  key: 'activeProjects',
                  label: 'Active',
                  sortable: true,
                  align: 'center',
                },
                {
                  key: 'completedProjects',
                  label: 'Completed',
                  sortable: true,
                  align: 'center',
                },
                {
                  key: 'onTimeDelivery',
                  label: 'On-Time %',
                  sortable: true,
                  render: (value) => (
                    <span
                      className={
                        value >= 90
                          ? 'text-green-600 font-semibold'
                          : value >= 75
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
                  key: 'avgCPI',
                  label: 'Avg CPI',
                  sortable: true,
                  render: (value) => (
                    <span className={value >= 1.0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {value.toFixed(2)}
                    </span>
                  ),
                  align: 'center',
                },
                {
                  key: 'avgSPI',
                  label: 'Avg SPI',
                  sortable: true,
                  render: (value) => (
                    <span className={value >= 1.0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {value.toFixed(2)}
                    </span>
                  ),
                  align: 'center',
                },
                {
                  key: 'budgetVariance',
                  label: 'Budget Variance',
                  sortable: true,
                  render: (value) => (
                    <span className={value <= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(value)}
                    </span>
                  ),
                  align: 'right',
                },
              ]}
              showRanking
              rankingKey="completedProjects"
              loading={resourcesLoading}
            />
          </div>

          {/* Project Details Table */}
          <DataTableWidget
            title="Project Portfolio Details"
            description="Comprehensive project status, budget, and performance metrics"
            data={projects?.list || []}
            columns={[
              {
                key: 'projectNumber',
                label: 'ID',
                align: 'center',
              },
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
                key: 'health',
                label: 'Health',
                render: (value) => (
                  <StatusCell
                    status={value === 'green' ? 'success' : value === 'yellow' ? 'warning' : 'danger'}
                  />
                ),
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
                key: 'cpi',
                label: 'CPI',
                sortable: true,
                render: (value) => (
                  <span className={value >= 1.0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {value ? value.toFixed(2) : '-'}
                  </span>
                ),
                align: 'center',
              },
              {
                key: 'spi',
                label: 'SPI',
                sortable: true,
                render: (value) => (
                  <span className={value >= 1.0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {value ? value.toFixed(2) : '-'}
                  </span>
                ),
                align: 'center',
              },
              {
                key: 'dueDate',
                label: 'Due Date',
                sortable: true,
                align: 'center',
              },
              {
                key: 'daysRemaining',
                label: 'Days Left',
                sortable: true,
                render: (value) => (
                  <span className={value < 30 ? 'text-red-600 font-semibold' : value < 60 ? 'text-yellow-600' : ''}>
                    {value}
                  </span>
                ),
                align: 'center',
              },
            ]}
            loading={projectsLoading}
          />
        </TabsContent>
      </Tabs>
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
