// Testes do adaptador Clarity (Missão 04 — Etapa C2): valores absolutos,
// taxas e denominadores separados; ranking de páginas por dead clicks;
// limitações e estado parcial propagados corretamente.

import { describe, expect, it } from 'vitest'
import { buildClarityJourneyView, filterClarityJourneyViewByDevice } from '../adapter'
import type { ClaritySnapshot } from '../contract'

function snapshot(overrides: Partial<ClaritySnapshot['metadata']> = {}, pages: ClaritySnapshot['pages'] = []): ClaritySnapshot {
  return {
    metadata: {
      source: 'clarity',
      project: 'PneuStore (www.pneustore.com.br)',
      platform: 'site',
      schemaVersion: '1.0.0',
      extractedAt: '2026-11-27T23:10:00-03:00',
      period: { from: '2026-11-25', to: '2026-11-27' },
      deviceScope: ['desktop', 'mobile'],
      status: 'ok',
      ...overrides,
    },
    pages,
  }
}

describe('buildClarityJourneyView', () => {
  it('calcula perSession a partir de absolute/sessions quando a fonte não informa a taxa', () => {
    const view = buildClarityJourneyView(
      snapshot({}, [
        {
          page: '/checkout/v2/cart',
          device: 'desktop',
          sessions: 400,
          deadClicks: { absolute: 200 },
          rageClicks: { absolute: 4 },
          quickBacks: { absolute: 40 },
        },
      ]),
    )
    expect(view.rows[0].deadClicks.absolute).toBe(200)
    expect(view.rows[0].deadClicks.sessions).toBe(400)
    expect(view.rows[0].deadClicks.perSession).toBeCloseTo(0.5)
  })

  it('usa perSession informado pela fonte quando presente, sem recalcular', () => {
    const view = buildClarityJourneyView(
      snapshot({}, [
        {
          page: '/checkout/v2/cart',
          device: 'desktop',
          sessions: 400,
          deadClicks: { absolute: 200, perSession: 0.9 }, // deliberadamente diferente de 200/400
          rageClicks: { absolute: 4 },
          quickBacks: { absolute: 40 },
        },
      ]),
    )
    expect(view.rows[0].deadClicks.perSession).toBe(0.9)
  })

  it('nunca inventa perSession quando sessions não está disponível', () => {
    const view = buildClarityJourneyView(
      snapshot({}, [
        {
          page: '/checkout/v2/cart',
          device: 'mobile',
          deadClicks: { absolute: 95 },
          rageClicks: { absolute: 4 },
          quickBacks: { absolute: 40 },
        },
      ]),
    )
    expect(view.rows[0].deadClicks.perSession).toBeNull()
    expect(view.rows[0].deadClicks.sessions).toBeNull()
    expect(view.rows[0].deadClicks.absolute).toBe(95) // valor absoluto nunca é omitido
  })

  it('traduz o caminho da página para o rótulo validado', () => {
    const view = buildClarityJourneyView(
      snapshot({}, [
        { page: '/checkout/v2/payment', device: 'desktop', deadClicks: { absolute: 1 }, rageClicks: { absolute: 0 }, quickBacks: { absolute: 0 } },
      ]),
    )
    expect(view.rows[0].pageLabel).toBe('Pagamento')
  })

  it('ordena topDeadClickPages pela maior concentração, somando todos os dispositivos', () => {
    const view = buildClarityJourneyView(
      snapshot({}, [
        { page: '/checkout/v2/cart', device: 'desktop', deadClicks: { absolute: 100 }, rageClicks: { absolute: 0 }, quickBacks: { absolute: 0 } },
        { page: '/checkout/v2/cart', device: 'mobile', deadClicks: { absolute: 50 }, rageClicks: { absolute: 0 }, quickBacks: { absolute: 0 } },
        { page: '/checkout/v2/payment', device: 'desktop', deadClicks: { absolute: 10 }, rageClicks: { absolute: 0 }, quickBacks: { absolute: 0 } },
      ]),
    )
    expect(view.topDeadClickPages[0]).toMatchObject({ pagePath: '/checkout/v2/cart', totalDeadClicks: 150 })
    expect(view.topDeadClickPages[1]).toMatchObject({ pagePath: '/checkout/v2/payment', totalDeadClicks: 10 })
  })

  it('propaga limitações e o estado parcial do snapshot', () => {
    const view = buildClarityJourneyView(snapshot({ status: 'partial', limitations: ['janela histórica limitada'] }, []))
    expect(view.isPartial).toBe(true)
    expect(view.limitations).toEqual(['janela histórica limitada'])
  })

  it('limitations nunca é undefined, mesmo quando o snapshot não declara nenhuma', () => {
    const view = buildClarityJourneyView(snapshot({ limitations: undefined }, []))
    expect(view.limitations).toEqual([])
  })
})

describe('filterClarityJourneyViewByDevice (Etapa C3 — respeita o filtro global de dispositivo)', () => {
  const view = buildClarityJourneyView(
    snapshot({}, [
      { page: '/checkout/v2/cart', device: 'desktop', deadClicks: { absolute: 100 }, rageClicks: { absolute: 1 }, quickBacks: { absolute: 1 } },
      { page: '/checkout/v2/cart', device: 'mobile', deadClicks: { absolute: 50 }, rageClicks: { absolute: 2 }, quickBacks: { absolute: 2 } },
      { page: '/checkout/v2/payment', device: 'tablet', deadClicks: { absolute: 10 }, rageClicks: { absolute: 0 }, quickBacks: { absolute: 0 } },
    ]),
  )

  it("'todos' devolve a visão sem alterações", () => {
    const filtered = filterClarityJourneyViewByDevice(view, 'todos')
    expect(filtered).toBe(view)
  })

  it('filtra as linhas pelo dispositivo selecionado', () => {
    const filtered = filterClarityJourneyViewByDevice(view, 'desktop')
    expect(filtered.rows).toHaveLength(1)
    expect(filtered.rows[0].device).toBe('desktop')
  })

  it('recalcula o ranking de páginas só com as linhas do dispositivo filtrado', () => {
    const filtered = filterClarityJourneyViewByDevice(view, 'mobile')
    expect(filtered.topDeadClickPages).toEqual([{ pagePath: '/checkout/v2/cart', pageLabel: 'Carrinho', totalDeadClicks: 50 }])
  })

  it('devolve lista vazia quando nenhuma linha é do dispositivo filtrado', () => {
    const filtered = filterClarityJourneyViewByDevice(view, 'desktop')
    const filteredAgain = filterClarityJourneyViewByDevice(filtered, 'mobile')
    expect(filteredAgain.rows).toEqual([])
    expect(filteredAgain.topDeadClickPages).toEqual([])
  })
})
