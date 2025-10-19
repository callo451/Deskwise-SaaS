'use client'

import { ChartWidget, ChartEmptyState } from './chart-widget'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { getChartColors, formatPercentage } from '@/lib/analytics-utils'

interface DonutChartWidgetProps {
  title: string
  description?: string
  data: Array<{
    name: string
    value: number
  }>
  colors?: string[]
  showPercentages?: boolean
  innerRadius?: number
  loading?: boolean
  error?: Error | null
  insight?: string
  insightType?: 'success' | 'warning' | 'danger' | 'info'
  onExport?: () => void
  onRefresh?: () => void
  valueFormatter?: (value: number) => string
  className?: string
}

export function DonutChartWidget({
  title,
  description,
  data,
  colors,
  showPercentages = true,
  innerRadius = 60,
  loading = false,
  error = null,
  insight,
  insightType,
  onExport,
  onRefresh,
  valueFormatter,
  className,
}: DonutChartWidgetProps) {
  const chartColors = colors || getChartColors(data.length)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!showPercentages || percent < 0.05) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {formatPercentage(percent * 100, 0)}
      </text>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = (data.value / total) * 100

      return (
        <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {valueFormatter ? valueFormatter(data.value) : data.value}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPercentage(percentage, 1)}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = (entry.payload.value / total) * 100
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.value}
              </span>
              <span className="text-sm font-semibold">
                ({formatPercentage(percentage, 0)})
              </span>
            </div>
          )
        })}
      </div>
    )
  }

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
      {data.length === 0 ? (
        <ChartEmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="40%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              innerRadius={innerRadius}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartWidget>
  )
}
