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
import { useRealData } from '@/hooks/use-real-data'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildDashboardMarkdown } from '@/lib/dashboard-markdown'
import { formatDateShort } from '@/lib/format'

function rangeLabel(from: string, to: string): string {
  return `${formatDateShort(new Date(`${from}T00:00:00-03:00`))} a ${formatDateShort(new Date(`${to}T00:00:00-03:00`))}`
}

/** Os blocos do one-page, lendo os dados do contexto — a prévia do "Atualizar dados" reaproveita isto com dados em memória. */
export function DashboardBlocks() {
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
    </div>
  )
}

export function DashboardPage() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const data = useRealData()
  const { overview, clarity, ux } = data

  useRegisterPageExport('PneuStore · Black Friday Health Monitor', () => buildDashboardMarkdown(data))

  const sources = [
    ux.period && `Resumo Executivo Pré-Black (${rangeLabel(ux.period.from, ux.period.to)})`,
    clarity && `Clarity (${rangeLabel(clarity.period.from, clarity.period.to)})`,
    overview?.period && `Looker Studio (${rangeLabel(overview.period.from, overview.period.to)})`,
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <DashboardBlocks />

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 text-ds-sm text-[var(--color-muted-foreground)]">
        <span>Fontes: {sources.length > 0 ? sources.join(' · ') : '—'}</span>
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
