// Selo de período do bloco "O que vende": a tabela de marcas pode cobrir menos
// dias que o resto do snapshot, então o bloco mostra o próprio período — e,
// sem período próprio (catalogPeriod = null), nada muda.

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DashboardData, OverviewView } from '@/data/dashboard-data'
import { RealDataProvider } from '@/state/real-data-provider'
import { TopSellersBlock } from '../top-sellers-block'

function overviewWith(catalogPeriod: OverviewView['catalogPeriod']): OverviewView {
  return {
    period: { from: '2026-10-06', to: '2026-11-02' },
    extractedAt: '2026-11-03',
    sessions: null,
    users: null,
    orders: null,
    revenue: null,
    channels: [],
    channelShares: [],
    channelsPeriod: null,
    brands: [{ brand: 'MarcaTeste', itemsViewed: 100, itemsAdded: 40, itemsPurchased: 5, itemRevenue: 1000 }],
    catalogPeriod,
    limitations: [],
  }
}

const emptyUx: DashboardData['ux'] = { period: null, weekly: null, funnel: null, deadClicks: null, yoy: null, priorities: null, source: null }

function renderBlock(overview: OverviewView | null) {
  return render(
    <TooltipProvider delayDuration={0}>
      <RealDataProvider data={{ overview, clarity: null, ux: emptyUx, alerts: [] }}>
        <TopSellersBlock />
      </RealDataProvider>
    </TooltipProvider>,
  )
}

describe('TopSellersBlock — selo de período', () => {
  it('mostra o selo "01–02/nov" quando as marcas têm período próprio', () => {
    renderBlock(overviewWith({ from: '2026-11-01', to: '2026-11-02' }))
    expect(screen.getByText('01–02/nov')).toBeTruthy()
    expect(screen.getByLabelText('Período das marcas: 01–02/nov')).toBeTruthy()
  })

  it('formata período que atravessa meses como dd/mm–dd/mm', () => {
    renderBlock(overviewWith({ from: '2026-10-31', to: '2026-11-02' }))
    expect(screen.getByText('31/10–02/11')).toBeTruthy()
  })

  it('sem período próprio o bloco continua como antes: sem selo', () => {
    renderBlock(overviewWith(null))
    expect(screen.getByText('O que vende')).toBeTruthy()
    expect(screen.queryByLabelText(/Período das marcas/)).toBeNull()
  })

  it('sem dados de Looker o bloco não renderiza', () => {
    const { container } = renderBlock(null)
    expect(container.textContent).toBe('')
  })

  it('"adicionados" sem %Add to Cart aparece como "—", nunca como 0', () => {
    const overview = overviewWith(null)
    overview.brands = [{ brand: 'SemPct', itemsViewed: 100, itemsAdded: null, itemsPurchased: 5, itemRevenue: 1000 }]
    renderBlock(overview)
    expect(screen.getByText('100 / — / 5')).toBeTruthy()
  })
})
