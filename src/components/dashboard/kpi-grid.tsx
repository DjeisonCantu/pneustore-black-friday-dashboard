// Bloco B do layout one-page: 4 cartões de KPI, número grande + variação —
// sem parágrafo explicativo (a metodologia fica no ícone (i), Parte 3).

import { TrendingDown, TrendingUp } from 'lucide-react'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { GA4_WEEKLY, percentDelta, type YearPair } from '@/data/real/pre-black-executive-report'
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
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="group"
      aria-label="Indicadores da semana de 14 a 20/10/2026, comparados com o mesmo período de 2025"
    >
      <KpiCard label="Sessões" value={formatInt(GA4_WEEKLY.sessions.y2026)} pair={GA4_WEEKLY.sessions} />
      <KpiCard label="Conversão" value={formatPercent(GA4_WEEKLY.conversionRatePercent.y2026)} pair={GA4_WEEKLY.conversionRatePercent} />
      <KpiCard
        label="Receita"
        approx
        value={formatCurrencyCompactBRL(GA4_WEEKLY.revenueEstimatedBRL.y2026)}
        pair={GA4_WEEKLY.revenueEstimatedBRL}
      />
      <KpiCard
        label="Ticket médio"
        value={formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2026)}
        pair={GA4_WEEKLY.averageTicketBRL}
      />
    </div>
  )
}
