// Confere os números contra o PDF original (PneuStore_Resumo_Executivo_PreBlack_2026.pdf)
// — nenhum valor aqui pode divergir do que está escrito no relatório.

import { describe, expect, it } from 'vitest'
import {
  CLARITY_DEAD_CLICKS_2026,
  CLARITY_FUNNEL_2026,
  CLARITY_YOY,
  GA4_WEEKLY,
  percentDelta,
} from '../pre-black-executive-report'

describe('percentDelta', () => {
  it('reproduz as variações mostradas no relatório (slide 3 — GA4)', () => {
    expect(percentDelta(GA4_WEEKLY.sessions)).toBeCloseTo(-42.8, 1)
    expect(percentDelta(GA4_WEEKLY.conversionRatePercent)).toBeCloseTo(43.5, 1)
    expect(percentDelta(GA4_WEEKLY.revenueEstimatedBRL)).toBeCloseTo(-17.5, 1)
    expect(percentDelta(GA4_WEEKLY.averageTicketBRL)).toBeCloseTo(0.7, 1)
  })
})

describe('GA4_WEEKLY', () => {
  it('bate com o slide 03/05 do relatório', () => {
    expect(GA4_WEEKLY.sessions).toEqual({ y2025: 707350, y2026: 404343 })
    expect(GA4_WEEKLY.conversionRatePercent).toEqual({ y2025: 1.38, y2026: 1.98 })
    expect(GA4_WEEKLY.averageTicketBRL).toEqual({ y2025: 1491.02, y2026: 1502.0 })
  })
})

describe('CLARITY_FUNNEL_2026', () => {
  it('bate com o slide 01/05 do relatório (3 etapas, mobile/desktop)', () => {
    expect(CLARITY_FUNNEL_2026.steps).toEqual([
      { label: 'Instalação para carrinho', mobile: 60, desktop: 87 },
      { label: 'Carrinho para frete', mobile: 34, desktop: 39 },
      { label: 'Pagamento para confirmação', mobile: 83, desktop: 75 },
    ])
  })
})

describe('CLARITY_DEAD_CLICKS_2026', () => {
  it('bate com o slide 02/05 do relatório (4 etapas, mobile/desktop)', () => {
    expect(CLARITY_DEAD_CLICKS_2026.steps).toEqual([
      { label: 'Instalação', mobile: 0.25, desktop: 0.55 },
      { label: 'Carrinho', mobile: 0.36, desktop: 1.17 },
      { label: 'Frete / entrega', mobile: 0.28, desktop: 0.4 },
      { label: 'Pagamento', mobile: 0.14, desktop: 0.59 },
    ])
  })

  it('mantém o aviso de que o desktop ainda não foi analisado', () => {
    expect(CLARITY_DEAD_CLICKS_2026.note).toContain('Desktop ainda não analisado')
  })
})

describe('CLARITY_YOY', () => {
  it('bate com o slide 04/05 do relatório', () => {
    expect(CLARITY_YOY.productToConfirmedOrderPercent).toEqual({
      mobile: { y2025: 1.6, y2026: 3.3 },
      desktop: { y2025: 3.7, y2026: 6.7 },
    })
    expect(CLARITY_YOY.sessionsWithDeadClickPercent).toEqual({
      mobile: { y2025: 11.2, y2026: 15.2 },
      desktop: { y2025: 18.4, y2026: 27.1 },
    })
    expect(CLARITY_YOY.clarityCoverageOfGa4SessionsPercent).toEqual({ y2025: 2.5, y2026: 86 })
  })
})
