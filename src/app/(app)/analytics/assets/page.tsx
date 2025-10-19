'use client'

import { Suspense } from 'react'
import { HeroMetricCard } from '@/components/analytics/hero-metric-card'
import { BarChartWidget } from '@/components/analytics/bar-chart-widget'
import { DonutChartWidget } from '@/components/analytics/donut-chart-widget'
import { DataTableWidget } from '@/components/analytics/data-table-widget'
import { FilterBar } from '@/components/analytics/filter-bar'
import { ExportMenu } from '@/components/analytics/export-menu'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/use-analytics'
import { useFilters } from '@/hooks/use-filters'
import {
  HardDrive,
  Server,
  Monitor,
  Smartphone,
  AlertTriangle,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/analytics-utils'
import Link from 'next/link'

function AssetAnalyticsContent() {
  const { filters, updateFilter, clearFilters } = useFilters()

  const { data: metrics, loading: metricsLoading } = useAnalytics(
    '/api/analytics/assets/metrics',
    filters
  )

  const { data: lifecycle, loading: lifecycleLoading } = useAnalytics(
    '/api/analytics/assets/lifecycle',
    filters
  )

  const { data: warranty, loading: warrantyLoading } = useAnalytics(
    '/api/analytics/assets/warranty',
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
            <h1 className="text-3xl font-bold tracking-tight">Asset Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor asset lifecycle, utilization, and maintenance
            </p>
          </div>
        </div>

        <ExportMenu
          data={metrics}
          filename="asset-analytics"
          title="Asset Analytics Report"
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        statuses={['Active', 'In Storage', 'Under Maintenance', 'Retired', 'Disposed']}
        categories={['Laptop', 'Desktop', 'Server', 'Network', 'Mobile', 'Peripheral']}
      />

      {/* Hero Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <HeroMetricCard
          title="Total Assets"
          value={metricsLoading ? '-' : formatNumber(metrics?.total || 0)}
          change={metrics?.totalChange}
          status="neutral"
          icon={HardDrive}
        />

        <HeroMetricCard
          title="Active Assets"
          value={metricsLoading ? '-' : formatNumber(metrics?.active || 0)}
          change={metrics?.activeChange}
          status="success"
          icon={Monitor}
        />

        <HeroMetricCard
          title="Under Maintenance"
          value={metricsLoading ? '-' : metrics?.maintenance || 0}
          change={metrics?.maintenanceChange}
          status={metrics?.maintenance > 20 ? 'warning' : 'neutral'}
          icon={AlertTriangle}
        />

        <HeroMetricCard
          title="Warranty Expiring"
          value={metricsLoading ? '-' : metrics?.warrantyExpiring || 0}
          change={metrics?.warrantyChange}
          status={metrics?.warrantyExpiring > 10 ? 'warning' : 'neutral'}
          icon={Calendar}
        />

        <HeroMetricCard
          title="Total Asset Value"
          value={metricsLoading ? '-' : formatCurrency(metrics?.totalValue || 0)}
          change={metrics?.valueChange}
          status="neutral"
          icon={HardDrive}
        />

        <HeroMetricCard
          title="Utilization Rate"
          value={metricsLoading ? '-' : formatPercentage(metrics?.utilization || 0)}
          change={metrics?.utilizationChange}
          status={metrics?.utilization > 80 ? 'success' : 'warning'}
          icon={Server}
        />
      </div>

      {/* Asset Distribution */}
      <div className="grid gap-6 md:grid-cols-3">
        <DonutChartWidget
          title="Assets by Type"
          description="Distribution of asset categories"
          data={metrics?.byType || []}
          loading={metricsLoading}
        />

        <DonutChartWidget
          title="Assets by Location"
          description="Asset distribution across locations"
          data={metrics?.byLocation || []}
          loading={metricsLoading}
        />

        <DonutChartWidget
          title="Lifecycle Status"
          description="Assets by lifecycle stage"
          data={metrics?.byLifecycle || []}
          loading={metricsLoading}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']}
        />
      </div>

      {/* Lifecycle & Age Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChartWidget
          title="Asset Age Distribution"
          description="Number of assets by age group"
          data={lifecycle?.ageDistribution || []}
          xAxisKey="ageGroup"
          bars={[
            { dataKey: 'count', name: 'Assets' },
          ]}
          loading={lifecycleLoading}
        />

        <BarChartWidget
          title="Maintenance Frequency"
          description="Number of maintenance events by asset type"
          data={lifecycle?.maintenanceFrequency || []}
          xAxisKey="type"
          bars={[
            { dataKey: 'events', name: 'Maintenance Events' },
          ]}
          loading={lifecycleLoading}
        />
      </div>

      {/* Warranty Expiration */}
      <div className="grid gap-6 md:grid-cols-1">
        <BarChartWidget
          title="Warranty Expiration Forecast"
          description="Assets with warranties expiring in the next 12 months"
          data={warranty?.expirationForecast || []}
          xAxisKey="month"
          bars={[
            { dataKey: 'expiring', name: 'Warranties Expiring', color: '#ef4444' },
          ]}
          loading={warrantyLoading}
          insight={
            warranty?.expiringNext30Days > 0
              ? `${warranty.expiringNext30Days} warranties expiring in the next 30 days`
              : 'No warranties expiring soon'
          }
          insightType={warranty?.expiringNext30Days > 10 ? 'warning' : 'info'}
        />
      </div>

      {/* Asset Details Table */}
      <DataTableWidget
        title="Asset Inventory"
        description="Detailed asset information and status"
        data={metrics?.assetList || []}
        columns={[
          {
            key: 'name',
            label: 'Asset Name',
          },
          {
            key: 'type',
            label: 'Type',
            align: 'center',
          },
          {
            key: 'serialNumber',
            label: 'Serial Number',
            align: 'center',
          },
          {
            key: 'location',
            label: 'Location',
            align: 'center',
          },
          {
            key: 'status',
            label: 'Status',
            align: 'center',
          },
          {
            key: 'value',
            label: 'Value',
            sortable: true,
            render: (value) => formatCurrency(value),
            align: 'right',
          },
          {
            key: 'warrantyExpiry',
            label: 'Warranty',
            sortable: true,
            render: (value) => {
              if (!value) return '-'
              const expiry = new Date(value)
              const now = new Date()
              const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <span
                  className={
                    daysUntil < 0
                      ? 'text-red-600'
                      : daysUntil < 30
                      ? 'text-yellow-600'
                      : ''
                  }
                >
                  {daysUntil < 0 ? 'Expired' : `${daysUntil} days`}
                </span>
              )
            },
            align: 'center',
          },
        ]}
        loading={metricsLoading}
      />
    </div>
  )
}

export default function AssetAnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <AssetAnalyticsContent />
    </Suspense>
  )
}
