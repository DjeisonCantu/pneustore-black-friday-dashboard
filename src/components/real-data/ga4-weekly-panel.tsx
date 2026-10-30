// Painel GA4 — comparação semanal (atualização de 30/10/2026). Mostra
// exatamente os números do slide 03/05 do "Resumo Executivo Pré-Black"
// (PneuStore_Resumo_Executivo_PreBlack_2026.pdf): mesmos valores, mesma
// conta de variação percentual — sem recalcular nem reinterpretar.

import { BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GA4_WEEKLY, PRE_BLACK_REPORT_COMPARISON_PERIOD, PRE_BLACK_REPORT_PERIOD, PRE_BLACK_REPORT_SOURCE, percentDelta, type YearPair } from '@/data/real/pre-black-executive-report'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatDateShort, formatInt, formatPercent } from '@/lib/format'

function DeltaTag({ pair, higherIsBetter = true }: { pair: YearPair; higherIsBetter?: boolean }) {
  const delta = percentDelta(pair)
  const isGood = higherIsBetter ? delta >= 0 : delta <= 0
  return (
    <span className={isGood ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>
      {delta >= 0 ? '+' : ''}
      {formatPercent(delta, 1)}
    </span>
  )
}

function MetricBlock({
  label,
  pair,
  format,
  higherIsBetter = true,
}: {
  label: string
  pair: YearPair
  format: (value: number) => string
  higherIsBetter?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
      <span className="text-ds-sm font-medium text-[var(--color-muted-foreground)]">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-ds-sm text-[var(--color-muted-foreground)]">2025: {format(pair.y2025)}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-ds-h4 font-semibold tabular-nums text-[var(--color-foreground)]">{format(pair.y2026)}</span>
        <DeltaTag pair={pair} higherIsBetter={higherIsBetter} />
      </div>
    </div>
  )
}

export function Ga4WeeklyPanel() {
  const periodFrom = new Date(`${PRE_BLACK_REPORT_PERIOD.from}T00:00:00-03:00`)
  const periodTo = new Date(`${PRE_BLACK_REPORT_PERIOD.to}T00:00:00-03:00`)
  const comparisonFrom = new Date(`${PRE_BLACK_REPORT_COMPARISON_PERIOD.from}T00:00:00-03:00`)
  const comparisonTo = new Date(`${PRE_BLACK_REPORT_COMPARISON_PERIOD.to}T00:00:00-03:00`)

  return (
    <Card className="print-break-inside-avoid border-[var(--color-success)]/30">
      <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
        <CardTitle>GA4 — comparação semanal</CardTitle>
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          REAL
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-ds-sm text-[var(--color-muted-foreground)]">
          Semana <strong className="text-[var(--color-foreground)]">{formatDateShort(periodFrom)} a {formatDateShort(periodTo)}</strong> de 2026,
          comparada com {formatDateShort(comparisonFrom)} a {formatDateShort(comparisonTo)} de 2025 (site inteiro).
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricBlock label="Sessões" pair={GA4_WEEKLY.sessions} format={formatInt} higherIsBetter />
          <MetricBlock label="Conversão" pair={GA4_WEEKLY.conversionRatePercent} format={(v) => formatPercent(v)} higherIsBetter />
          <MetricBlock label="Receita estimada" pair={GA4_WEEKLY.revenueEstimatedBRL} format={formatCurrencyCompactBRL} higherIsBetter />
        </div>

        <p className="text-ds-sm text-[var(--color-muted-foreground)]">
          Ticket médio praticamente estável: {formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2025)} em 2025 e{' '}
          {formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2026)} em 2026 (<DeltaTag pair={GA4_WEEKLY.averageTicketBRL} />).
        </p>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-info)]/30 bg-[var(--color-info-soft)] px-4 py-3 text-ds-sm text-[var(--color-info)]">
          {GA4_WEEKLY.note}
        </div>
      </CardContent>
      <CardFooter>
        <span>Fonte: {PRE_BLACK_REPORT_SOURCE}</span>
      </CardFooter>
    </Card>
  )
}
