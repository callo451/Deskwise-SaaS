import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsGridBlockProps {
  props: BlockProps
}

export function StatsGridBlock({ props }: StatsGridBlockProps) {
  const { stats, style } = props

  if (!stats?.items || stats.items.length === 0) return null

  return (
    <div className={cn('portal-stats-grid grid gap-4 md:grid-cols-2 lg:grid-cols-4', style?.className)}>
      {stats.items.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-3xl font-bold">{stat.value}</p>
              {stat.trend && stat.trendValue && (
                <div
                  className={cn(
                    'flex items-center text-sm font-medium',
                    stat.trend === 'up' && 'text-green-600',
                    stat.trend === 'down' && 'text-red-600',
                    stat.trend === 'neutral' && 'text-gray-600'
                  )}
                >
                  {stat.trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
                  {stat.trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
                  {stat.trend === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
                  {stat.trendValue}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
