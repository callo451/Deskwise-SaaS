'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface HeroMetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: LucideIcon
  href?: string
  sparklineData?: number[]
  className?: string
}

export function HeroMetricCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  trend,
  status = 'neutral',
  icon: Icon,
  href,
  sparklineData,
  className,
}: HeroMetricCardProps) {
  // Determine trend from change if not explicitly provided
  const determinedTrend = trend || (change && change > 0 ? 'up' : change && change < 0 ? 'down' : 'neutral')

  // Get status color
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    danger: 'text-red-600 bg-red-50 border-red-200',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200',
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  const content = (
    <Card className={cn('border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>

            {/* Value */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold mb-2"
            >
              {value}
            </motion.div>

            {/* Change indicator */}
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <div className={cn('flex items-center gap-1', trendColors[determinedTrend])}>
                  {determinedTrend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {determinedTrend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {determinedTrend === 'neutral' && <Minus className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {change > 0 && '+'}
                    {change.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className={cn(
              'p-3 rounded-lg border',
              statusColors[status]
            )}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Mini sparkline (optional) */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <MiniSparkline data={sparklineData} color={status} />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

// Mini sparkline component
function MiniSparkline({
  data,
  color,
}: {
  data: number[]
  color: 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const colorMap = {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#3b82f6',
  }

  return (
    <svg
      viewBox="0 0 100 20"
      className="w-full h-8"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
