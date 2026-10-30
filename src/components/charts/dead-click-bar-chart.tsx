// Barras horizontais genéricas com destaque de item crítico — usado pelo
// bloco "Onde o checkout trava" (dead clicks por página) e reaproveitável
// para qualquer outra lista rotulada com um item "crítico" a destacar.
// Mesma biblioteca (Recharts) e visual já usados em channel-bar-chart.tsx —
// nenhuma dependência nova.

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface LabeledBarDatum {
  label: string
  value: number
  isCritical?: boolean
}

export function DeadClickBarChart({
  data,
  formatValue,
  ariaLabel,
}: {
  data: LabeledBarDatum[]
  formatValue: (value: number) => string
  ariaLabel: string
}) {
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            formatter={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((value: number, _name: string, item: { payload?: LabeledBarDatum }) => [
                `${formatValue(value)}${item?.payload?.isCritical ? ' — crítico' : ''}`,
                'Valor',
              ]) as any
            }
            contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.isCritical ? 'var(--color-error)' : 'var(--color-border)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
