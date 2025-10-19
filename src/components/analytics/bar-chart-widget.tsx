'use client'

import { ChartWidget, ChartEmptyState } from './chart-widget'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getChartColors } from '@/lib/analytics-utils'

interface BarChartWidgetProps {
  title: string
  description?: string
  data: any[]
  xAxisKey: string
  bars: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  layout?: 'vertical' | 'horizontal'
  stacked?: boolean
  showValues?: boolean
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

export function BarChartWidget({
  title,
  description,
  data,
  xAxisKey,
  bars,
  layout = 'horizontal',
  stacked = false,
  showValues = false,
  loading = false,
  error = null,
  insight,
  insightType,
  onExport,
  onRefresh,
  yAxisFormatter,
  tooltipFormatter,
  className,
}: BarChartWidgetProps) {
  const colors = getChartColors(bars.length)

  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props
    const displayValue = tooltipFormatter ? tooltipFormatter(value) : value

    return layout === 'vertical' ? (
      <text
        x={x + width + 5}
        y={y + height / 2}
        fill="#666"
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11}
      >
        {displayValue}
      </text>
    ) : (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#666"
        textAnchor="middle"
        fontSize={11}
      >
        {displayValue}
      </text>
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
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            {layout === 'vertical' ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={yAxisFormatter}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  width={120}
                />
              </>
            ) : (
              <>
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
              </>
            )}

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
              iconType="square"
            />

            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color || colors[index]}
                stackId={stacked ? 'stack' : undefined}
                label={showValues ? <CustomLabel /> : undefined}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartWidget>
  )
}
