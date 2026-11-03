// Markdown do one-page (botão "Exportar Markdown"): só o que existe nos dados
// vigentes — bloco sem dado não vira tabela vazia.

import { percentDelta, type DashboardData } from '@/data/dashboard-data'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatInt, formatPercent, formatPeriodCompact } from '@/lib/format'

function signed(value: number | null): string {
  return value === null ? '—' : `${value >= 0 ? '+' : ''}${formatPercent(value, 1)}`
}

export function buildDashboardMarkdown({ overview, clarity, ux, alerts }: DashboardData): string {
  const lines: string[] = [
    buildRealExportHeader('PneuStore · Black Friday Health Monitor'),
    alerts.length > 0 ? `**Alertas:** ${alerts.map((a) => a.label).join(' · ')}` : '',
    '',
  ]

  const weekly = ux.weekly
  if (weekly) {
    const row = (label: string, pair: { y2025: number; y2026: number } | null, fmt: (n: number) => string) =>
      pair ? [`| ${label} | ${fmt(pair.y2025)} | ${fmt(pair.y2026)} | ${formatPercent(percentDelta(pair), 1)} |`] : []
    lines.push(
      `## Indicadores — semana ${weekly.period.from} a ${weekly.period.to} (vs. mesmo período de 2025)`,
      '',
      '| Indicador | 2025 | 2026 | Variação |',
      '|---|---|---|---|',
      ...row('Sessões', weekly.sessions, formatInt),
      ...row('Conversão', weekly.conversionRatePercent, (n) => formatPercent(n)),
      ...row('Receita estimada', weekly.revenueEstimatedBRL, formatCurrencyCompactBRL),
      ...row('Ticket médio', weekly.averageTicketBRL, formatCurrencyBRL),
      '',
    )
  }

  if (clarity) {
    const cell = (n: number | null) => (n === null ? '—' : String(n))
    lines.push(
      `## Onde o checkout trava (Clarity, ${clarity.period.from} a ${clarity.period.to})`,
      '',
      '| Página | Dead clicks | Rage clicks | Quick backs |',
      '|---|---|---|---|',
      ...clarity.friction.map((p) => `| ${p.label} | ${cell(p.deadClicks)} | ${cell(p.rageClicks)} | ${cell(p.quickBacks)} |`),
      '',
    )
  }

  if (overview && overview.channelShares.length > 0) {
    lines.push(
      '## De onde vem a receita',
      '',
      '| Canal | % da receita | Variação |',
      '|---|---|---|',
      ...overview.channelShares.map((c) => `| ${c.channel} | ${formatPercent(c.revenueSharePercent, 1)} | ${signed(c.comparisonChangePercent)} |`),
      '',
    )
  }

  if (overview && overview.brands.length > 0) {
    const added = (n: number | null) => (n === null ? '—' : formatInt(n))
    lines.push(
      `## O que vende${overview.catalogPeriod ? ` (${formatPeriodCompact(overview.catalogPeriod.from, overview.catalogPeriod.to)})` : ''}`,
      '',
      '| Marca | Receita | Vistos | Adicionados* | Comprados |',
      '|---|---|---|---|---|',
      ...overview.brands.map((b) => `| ${b.brand} | ${formatCurrencyCompactBRL(b.itemRevenue)} | ${formatInt(b.itemsViewed)} | ${added(b.itemsAdded)} | ${formatInt(b.itemsPurchased)} |`),
      '',
    )
  }

  if (ux.priorities && ux.priorities.items.length > 0) {
    lines.push('## Próximas ações', '', ...ux.priorities.items.map((p) => `- **${p.title}** (${p.owner}): ${p.detail}`))
  }

  return lines.filter((l) => l !== '').join('\n')
}

