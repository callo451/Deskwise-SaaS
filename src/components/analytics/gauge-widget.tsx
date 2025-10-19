'use client'

import { ChartWidget } from './chart-widget'
import { cn } from '@/lib/utils'
import { formatPercentage } from '@/lib/analytics-utils'

interface GaugeWidgetProps {
  title: string
  description?: string
  value: number
  max?: number
  target?: number
  thresholds?: {
    success: number
    warning: number
    danger: number
  }
  loading?: boolean
  error?: Error | null
  insight?: string
  insightType?: 'success' | 'warning' | 'danger' | 'info'
  onExport?: () => void
  onRefresh?: () => void
  unit?: string
  className?: string
}

export function GaugeWidget({
  title,
  description,
  value,
  max = 100,
  target,
  thresholds = {
    success: 90,
    warning: 70,
    danger: 0,
  },
  loading = false,
  error = null,
  insight,
  insightType,
  onExport,
  onRefresh,
  unit = '%',
  className,
}: GaugeWidgetProps) {
  const percentage = Math.min((value / max) * 100, 100)

  // Determine status color
  const getColor = () => {
    if (value >= thresholds.success) return '#10b981' // green
    if (value >= thresholds.warning) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const color = getColor()

  // Calculate arc path
  const radius = 80
  const circumference = Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <ChartWidget
      title={title}
      description={description}
      loading={loading}
      error={error}
      insight={insight}
      insightType={insightType}
      onExport={onExport}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="flex flex-col items-center justify-center py-8">
        {/* SVG Gauge */}
        <div className="relative">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Value arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 0.5s ease-in-out',
              }}
            />

            {/* Threshold markers */}
            {target && (
              <>
                {/* Target line */}
                <line
                  x1={100 + radius * Math.cos(Math.PI - (target / max) * Math.PI)}
                  y1={100 - radius * Math.sin(Math.PI - (target / max) * Math.PI)}
                  x2={100 + (radius + 15) * Math.cos(Math.PI - (target / max) * Math.PI)}
                  y2={100 - (radius + 15) * Math.sin(Math.PI - (target / max) * Math.PI)}
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </>
            )}

            {/* Center value */}
            <text
              x="100"
              y="85"
              textAnchor="middle"
              fontSize="32"
              fontWeight="bold"
              fill="currentColor"
            >
              {value.toFixed(1)}
              {unit}
            </text>

            {/* Label */}
            <text
              x="100"
              y="105"
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              of {max}{unit}
            </text>
          </svg>
        </div>

        {/* Threshold legend */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              {'<'}{thresholds.warning}{unit}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">
              {thresholds.warning}-{thresholds.success}{unit}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              {'>'}{thresholds.success}{unit}
            </span>
          </div>
        </div>

        {/* Target indicator */}
        {target && (
          <div className="mt-4 text-sm text-muted-foreground">
            Target: {target}{unit}
          </div>
        )}
      </div>
    </ChartWidget>
  )
}
