// Selo de período do bloco "O que vende" (atualização de 03/11/2026): a
// tabela de marcas pode cobrir menos dias que o resto do snapshot, então o
// bloco mostra o próprio período — e, sem catalogPeriod, nada muda.

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { RealOverviewView } from '@/data/real/real-overview'

const loadRealOverviewMock = vi.fn<() => RealOverviewView | null>()
vi.mock('@/data/real/real-overview', () => ({ loadRealOverview: () => loadRealOverviewMock() }))

import { TopSellersBlock } from '../top-sellers-block'

function viewWith(catalogPeriod: RealOverviewView['catalogPeriod']): RealOverviewView {
  return {
    period: { from: '2026-10-06', to: '2026-11-02' },
    extractedAt: '2026-11-03T14:04:32.063Z',
    sessions: null,
    users: null,
    orders: null,
    revenue: null,
    channels: [],
    channelShares: [],
    brands: [{ brand: 'MarcaTeste', itemsViewed: 100, itemsAdded: 40, itemsPurchased: 5, itemRevenue: 1000 }],
    catalogPeriod,
    limitations: [],
  }
}

function renderBlock() {
  return render(
    <TooltipProvider delayDuration={0}>
      <TopSellersBlock />
    </TooltipProvider>,
  )
}

describe('TopSellersBlock — selo de período', () => {
  beforeEach(() => {
    loadRealOverviewMock.mockReset()
  })

  it('mostra o selo "01–02/nov" quando o snapshot traz catalogPeriod', () => {
    loadRealOverviewMock.mockReturnValue(viewWith({ from: '2026-11-01', to: '2026-11-02' }))
    renderBlock()
    expect(screen.getByText('01–02/nov')).toBeTruthy()
    expect(screen.getByLabelText('Período das marcas: 01–02/nov')).toBeTruthy()
  })

  it('formata período que atravessa meses como dd/mm–dd/mm', () => {
    loadRealOverviewMock.mockReturnValue(viewWith({ from: '2026-10-31', to: '2026-11-02' }))
    renderBlock()
    expect(screen.getByText('31/10–02/11')).toBeTruthy()
  })

  it('sem catalogPeriod o bloco continua como antes: sem selo próprio', () => {
    loadRealOverviewMock.mockReturnValue(viewWith(null))
    renderBlock()
    expect(screen.getByText('O que vende')).toBeTruthy()
    expect(screen.queryByLabelText(/Período das marcas/)).toBeNull()
  })

  it('sem marcas ou com snapshot inválido o bloco não renderiza (comportamento anterior)', () => {
    loadRealOverviewMock.mockReturnValue(null)
    const { container } = renderBlock()
    expect(container.textContent).toBe('')
  })
})
