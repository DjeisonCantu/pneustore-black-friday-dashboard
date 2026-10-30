// Página única (one-page) — substitui as antigas Visão geral, Jornada de
// compra e Aquisição e produtos (atualização de 30/10/2026, layout
// one-page). "Sobre os dados" virou uma gaveta (Sheet), aberta pelo link no
// rodapé, em vez de uma tela própria.

import { useState } from 'react'
import { StatusBar } from '@/components/dashboard/status-bar'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import { CheckoutFrictionBlock } from '@/components/dashboard/checkout-friction-block'
import { RevenueByChannelBlock } from '@/components/dashboard/revenue-by-channel-block'
import { TopSellersBlock } from '@/components/dashboard/top-sellers-block'
import { PrioritiesChecklist } from '@/components/dashboard/priorities-checklist'
import { AboutDataSheet } from '@/components/dashboard/about-data-sheet'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { buildDashboardAlerts } from '@/data/real/dashboard-alerts'
import { CLARITY_CHECKOUT_FRICTION, CLARITY_CHECKOUT_PERIOD } from '@/data/real/clarity-checkout-friction'
import { GA4_WEEKLY, PRE_BLACK_PRIORITIES, PRE_BLACK_REPORT_PERIOD, percentDelta } from '@/data/real/pre-black-executive-report'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatDateShort, formatInt, formatPercent } from '@/lib/format'

function rangeLabel(from: string, to: string): string {
  return `${formatDateShort(new Date(`${from}T00:00:00-03:00`))} a ${formatDateShort(new Date(`${to}T00:00:00-03:00`))}`
}

export function DashboardPage() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const view = loadRealOverview()

  useRegisterPageExport('PneuStore · Black Friday Health Monitor', () => {
    const alerts = buildDashboardAlerts()
    const lines = [
      buildRealExportHeader('PneuStore · Black Friday Health Monitor'),
      alerts.length > 0 ? `**Alertas:** ${alerts.map((a) => a.label).join(' · ')}` : '',
      '',
      `## Indicadores — semana ${PRE_BLACK_REPORT_PERIOD.from} a ${PRE_BLACK_REPORT_PERIOD.to} (vs. mesmo período de 2025)`,
      '',
      '| Indicador | 2025 | 2026 | Variação |',
      '|---|---|---|---|',
      `| Sessões | ${formatInt(GA4_WEEKLY.sessions.y2025)} | ${formatInt(GA4_WEEKLY.sessions.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.sessions), 1)} |`,
      `| Conversão | ${formatPercent(GA4_WEEKLY.conversionRatePercent.y2025)} | ${formatPercent(GA4_WEEKLY.conversionRatePercent.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.conversionRatePercent), 1)} |`,
      `| Receita estimada | ${formatCurrencyCompactBRL(GA4_WEEKLY.revenueEstimatedBRL.y2025)} | ${formatCurrencyCompactBRL(GA4_WEEKLY.revenueEstimatedBRL.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.revenueEstimatedBRL), 1)} |`,
      `| Ticket médio | ${formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2025)} | ${formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.averageTicketBRL), 1)} |`,
      '',
      `## Onde o checkout trava (Clarity, ${CLARITY_CHECKOUT_PERIOD.from} a ${CLARITY_CHECKOUT_PERIOD.to})`,
      '',
      '| Página | Dead clicks | Rage clicks | Quick backs |',
      '|---|---|---|---|',
      ...CLARITY_CHECKOUT_FRICTION.map((p) => `| ${p.label} | ${p.deadClicks} | ${p.rageClicks} | ${p.quickBacks} |`),
      '',
      '## De onde vem a receita',
      '',
      '| Canal | % da receita | Variação |',
      '|---|---|---|',
      ...(view?.channelShares ?? []).map((c) => `| ${c.channel} | ${formatPercent(c.revenueSharePercent, 1)} | ${c.comparisonChangePercent >= 0 ? '+' : ''}${formatPercent(c.comparisonChangePercent, 1)} |`),
      '',
      '## O que vende',
      '',
      '| Marca | Receita | Vistos | Adicionados* | Comprados |',
      '|---|---|---|---|---|',
      ...(view?.brands ?? []).map((b) => `| ${b.brand} | ${formatCurrencyCompactBRL(b.itemRevenue)} | ${formatInt(b.itemsViewed)} | ${formatInt(b.itemsAdded)} | ${formatInt(b.itemsPurchased)} |`),
      '',
      '## Próximas ações',
      '',
      ...PRE_BLACK_PRIORITIES.map((p) => `- **${p.title}** (${p.owner}): ${p.detail}`),
    ]
    return lines.filter((l) => l !== '').join('\n')
  })

  return (
    <div className="space-y-5">
      <StatusBar />
      <KpiGrid />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CheckoutFrictionBlock />
        </div>
        <div className="lg:col-span-5">
          <RevenueByChannelBlock />
        </div>
      </div>

      <TopSellersBlock />
      <PrioritiesChecklist />

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 text-ds-sm text-[var(--color-muted-foreground)]">
        <span>
          Fontes: Resumo Executivo Pré-Black ({rangeLabel(PRE_BLACK_REPORT_PERIOD.from, PRE_BLACK_REPORT_PERIOD.to)}) · Clarity (
          {rangeLabel(CLARITY_CHECKOUT_PERIOD.from, CLARITY_CHECKOUT_PERIOD.to)}) · Looker Studio (
          {view ? rangeLabel(view.period.from, view.period.to) : '—'})
        </span>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="no-print font-medium text-[var(--color-primary)] hover:underline"
        >
          Sobre os dados
        </button>
      </footer>

      <AboutDataSheet open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  )
}
