'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartWidgetProps {
  title: string
  description?: string
  loading?: boolean
  error?: Error | null
  insight?: string
  insightType?: 'success' | 'warning' | 'danger' | 'info'
  onExport?: () => void
  onRefresh?: () => void
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function ChartWidget({
  title,
  description,
  loading = false,
  error = null,
  insight,
  insightType = 'info',
  onExport,
  onRefresh,
  children,
  className,
  actions,
}: ChartWidgetProps) {
  const insightColors = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <Card className={cn('border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
            )}
            {onExport && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                disabled={loading}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Insight badge */}
        {insight && !loading && !error && (
          <div className="mt-3">
            <div className={cn(
              'px-3 py-2 rounded-md border text-sm',
              insightColors[insightType]
            )}>
              {insight}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading && <ChartSkeleton />}
        {error && <ChartError error={error} />}
        {!loading && !error && children}
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[300px] w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

function ChartError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center">
      <div className="p-3 rounded-full bg-red-50 mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <p className="text-lg font-semibold mb-2">Failed to load data</p>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
    </div>
  )
}

export function ChartEmptyState({
  title = 'No data available',
  description = 'Data will appear here once available',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center">
      <div className="p-3 rounded-full bg-muted mb-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold mb-2">{title}</p>
      <p className="text-sm text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  )
}
