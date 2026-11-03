// Bloco B do layout one-page: 4 cartões de KPI, número grande + variação —
// sem parágrafo explicativo (a metodologia fica no ícone (i), Parte 3).

import { TrendingDown, TrendingUp } from 'lucide-react'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { percentDelta, type YearPair } from '@/data/dashboard-data'
import { formatPeriodLong } from '@/data/updates/dates'
import { useRealData } from '@/hooks/use-real-data'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatInt, formatPercent } from '@/lib/format'

function DeltaBadge({ pair, higherIsBetter = true }: { pair: YearPair; higherIsBetter?: boolean }) {
  const delta = percentDelta(pair)
  const isGood = higherIsBetter ? delta >= 0 : delta <= 0
  const Icon = delta >= 0 ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-ds-sm font-medium ${isGood ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {delta >= 0 ? '+' : ''}
      {formatPercent(delta, 1)}
    </span>
  )
}

function KpiCard({
  label,
  approx,
  value,
  pair,
  higherIsBetter = true,
}: {
  label: string
  /** `true` quando o valor é uma estimativa (ganha "≈" + tooltip, nunca um parágrafo — Parte 3). */
  approx?: boolean
  value: string
  pair: YearPair
  higherIsBetter?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span className="flex items-center gap-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
        {label}
        {approx && (
          <NoteTooltip
            label={`${label} é uma estimativa`}
            notes="Valor aproximado — ver 'Sobre os dados' para a metodologia completa."
          />
        )}
      </span>
      <span className="text-ds-h3 font-semibold tabular-nums text-[var(--color-foreground)]">
        {approx && '≈ '}
        {value}
      </span>
      <DeltaBadge pair={pair} higherIsBetter={higherIsBetter} />
    </div>
  )
}

export function KpiGrid() {
  const { weekly } = useRealData().ux
  if (!weekly) return null

  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="group"
      aria-label={`Indicadores da semana de ${formatPeriodLong(weekly.period.from, weekly.period.to)}, comparados com o mesmo período de 2025`}
    >
      {weekly.sessions && <KpiCard label="Sessões" value={formatInt(weekly.sessions.y2026)} pair={weekly.sessions} />}
      {weekly.conversionRatePercent && (
        <KpiCard label="Conversão" value={formatPercent(weekly.conversionRatePercent.y2026)} pair={weekly.conversionRatePercent} />
      )}
      {weekly.revenueEstimatedBRL && (
        <KpiCard label="Receita" approx value={formatCurrencyCompactBRL(weekly.revenueEstimatedBRL.y2026)} pair={weekly.revenueEstimatedBRL} />
      )}
      {weekly.averageTicketBRL && (
        <KpiCard label="Ticket médio" value={formatCurrencyBRL(weekly.averageTicketBRL.y2026)} pair={weekly.averageTicketBRL} />
      )}
    </div>
  )
}
