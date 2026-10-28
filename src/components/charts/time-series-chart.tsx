import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeSeriesPoint } from '@/data/selectors'

type MetricKey = 'sessions' | 'orders' | 'revenue' | 'conversionRate'

const COMPARISON_KEY: Record<MetricKey, keyof TimeSeriesPoint> = {
  sessions: 'comparisonSessions',
  orders: 'comparisonOrders',
  revenue: 'comparisonRevenue',
  conversionRate: 'comparisonConversionRate',
}

export function TimeSeriesChart({
  data,
  metric,
  formatValue,
  showComparison,
  comparisonLabel,
}: {
  data: TimeSeriesPoint[]
  metric: MetricKey
  formatValue: (value: number) => string
  showComparison: boolean
  comparisonLabel: string
}) {
  const chartData = data.map((point) => ({
    label: point.label,
    atual: point.isFuture ? null : point[metric],
    comparacao: showComparison ? point[COMPARISON_KEY[metric]] ?? null : null,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(value: number) => formatValue(value)}
        />
        <Tooltip
          formatter={
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((value: number, name: string) => [formatValue(value), name === 'atual' ? 'Período atual' : comparisonLabel]) as any
          }
          labelFormatter={(label) => `Dia ${label}`}
          contentStyle={{
            borderRadius: 8,
            borderColor: 'var(--color-border)',
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="atual" stroke="var(--color-primary)" strokeWidth={2.25} dot={false} name="atual" connectNulls={false} />
        {showComparison && (
          <Line
            type="monotone"
            dataKey="comparacao"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.75}
            strokeDasharray="5 4"
            dot={false}
            name="comparacao"
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
