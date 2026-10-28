import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface DeviceBarDatum {
  device: string
  atual: number
  comparacao?: number
}

export function DeviceBarChart({
  data,
  formatValue,
  comparisonLabel,
}: {
  data: DeviceBarDatum[]
  formatValue: (value: number) => string
  comparisonLabel: string
}) {
  const hasComparison = data.some((d) => d.comparacao !== undefined)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barGap={6}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="device" tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} width={56} tickFormatter={formatValue} />
        <Tooltip
          formatter={
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((value: number, name: string) => [formatValue(value), name === 'atual' ? 'Período atual' : comparisonLabel]) as any
          }
          contentStyle={{ borderRadius: 8, borderColor: 'var(--color-border)', fontSize: 12 }}
        />
        {hasComparison && <Legend formatter={(value) => (value === 'atual' ? 'Período atual' : comparisonLabel)} wrapperStyle={{ fontSize: 12 }} />}
        <Bar dataKey="atual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={48} name="atual" />
        {hasComparison && <Bar dataKey="comparacao" fill="var(--color-border)" radius={[4, 4, 0, 0]} maxBarSize={48} name="comparacao" />}
      </BarChart>
    </ResponsiveContainer>
  )
}
