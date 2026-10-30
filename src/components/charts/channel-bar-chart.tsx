import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrencyCompactBRL, formatPercent } from '@/lib/format'

/** Forma mínima que o gráfico precisa — estrutural, não ligada a uma fonte específica (mock ou real). */
export interface ChannelBarDatum {
  channel: string
  revenue: number
  revenueShare: number
}

export function ChannelBarChart({ data }: { data: ChannelBarDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrencyCompactBRL(value)}
        />
        <YAxis
          type="category"
          dataKey="channel"
          tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          formatter={
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((value: number, _name: string, item: { payload?: ChannelBarDatum }) => {
              const share = item?.payload?.revenueShare ?? 0
              return [`${formatCurrencyCompactBRL(value)} (${formatPercent(share)})`, 'Receita']
            }) as any
          }
          contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
