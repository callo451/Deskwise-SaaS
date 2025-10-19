'use client'

import { ChartWidget, ChartEmptyState } from './chart-widget'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getChartColors } from '@/lib/analytics-utils'

interface LineChartWidgetProps {
  title: string
  description?: string
  data: any[]
  xAxisKey: string
  lines: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  thresholds?: Array<{
    value: number
    label: string
    color?: string
  }>
  loading?: boolean
  error?: Error | null
  insight?: string
  insightType?: 'success' | 'warning' | 'danger' | 'info'
  onExport?: () => void
  onRefresh?: () => void
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  className?: string
}

export function LineChartWidget({
  title,
  description,
  data,
  xAxisKey,
  lines,
  thresholds,
  loading = false,
  error = null,
  insight,
  insightType,
  onExport,
  onRefresh,
  yAxisFormatter,
  tooltipFormatter,
  className,
}: LineChartWidgetProps) {
  const colors = getChartColors(lines.length)

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
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={yAxisFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={tooltipFormatter}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />

            {/* Threshold lines */}
            {thresholds?.map((threshold, index) => (
              <ReferenceLine
                key={index}
                y={threshold.value}
                stroke={threshold.color || '#ef4444'}
                strokeDasharray="3 3"
                label={{
                  value: threshold.label,
                  position: 'right',
                  fontSize: 11,
                  fill: threshold.color || '#ef4444',
                }}
              />
            ))}

            {/* Data lines */}
            {lines.map((line, index) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color || colors[index]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartWidget>
  )
}
