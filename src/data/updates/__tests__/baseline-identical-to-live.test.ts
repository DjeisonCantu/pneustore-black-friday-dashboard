// A garantia da migração: o dashboard gerado SÓ com data/updates/0000-baseline.md
// é idêntico ao que estava no ar antes do fluxo "Atualizar dados" (commit
// 3216ba6). `fixtures/live-3216ba6-expected.json` é a saída CONGELADA do código
// daquele commit (visão do Looker, Clarity, Relatório UX e alertas).

import { describe, expect, it } from 'vitest'
import { BUNDLED_UPDATES } from '@/data/bundled-data'
import { deadClickShare, isCriticalPage } from '@/data/dashboard-data'
import { BASELINE_DATA, BASELINE_MERGED } from './baseline'
import expected from './fixtures/live-3216ba6-expected.json'

const { overview, clarity, ux, alerts } = BASELINE_DATA

describe('baseline = site no ar (3216ba6)', () => {
  it('o baseline lido sozinho tem as 12 seções do relatório (todas, menos «Looker — app», que o site nunca mostrou) e é a primeira atualização do bundle', () => {
    expect(BASELINE_MERGED.updates).toHaveLength(1)
    expect(BASELINE_MERGED.updates[0].sectionKeys).toHaveLength(12)
    expect(BUNDLED_UPDATES[0].id).toBe('0000-baseline')
  })

  it('Looker: resumo, canais, origem/mídia e marcas idênticos', () => {
    expect(overview).not.toBeNull()
    expect(overview!.period).toEqual(expected.overview.period)
    expect(overview!.extractedAt).toBe(expected.overview.extractedAt)
    expect({ s: overview!.sessions, u: overview!.users, o: overview!.orders, r: overview!.revenue }).toEqual({
      s: expected.overview.sessions,
      u: expected.overview.users,
      o: expected.overview.orders,
      r: expected.overview.revenue,
    })
    expect(overview!.channels).toEqual(expected.overview.channels)
    expect(overview!.channelShares).toEqual(expected.overview.channelShares)
    expect(overview!.brands).toEqual(expected.overview.brands)
    expect(overview!.limitations).toEqual(expected.overview.limitations)
  })

  it('Looker: nenhuma tabela ganha selo de período próprio (todas valem o período do resumo)', () => {
    expect(overview!.catalogPeriod).toBeNull()
    expect(overview!.channelsPeriod).toBeNull()
  })

  it('Clarity: período, páginas do checkout, sessões, limitações e fonte idênticos', () => {
    expect(clarity).not.toBeNull()
    expect(clarity!.period).toEqual(expected.clarity.period)
    expect(clarity!.friction).toEqual(expected.clarity.friction)
    expect(clarity!.sessionsByDevice).toEqual(expected.clarity.sessionsByDevice)
    expect(clarity!.notes).toEqual(expected.clarity.notes)
    expect(clarity!.source).toBe(expected.clarity.source)
  })

  it('Clarity: mesma página crítica e mesmas participações de dead clicks', () => {
    const friction = clarity!.friction
    expect(friction.filter((p) => isCriticalPage(p, friction)).map((p) => p.path)).toEqual(expected.clarity.criticalPaths)
    expect(friction.map((p) => ({ path: p.path, share: deadClickShare(p, friction) }))).toEqual(expected.clarity.shares)
  })

  it('Relatório UX: indicadores, funil, dead clicks, ano a ano e próximas ações idênticos', () => {
    expect(ux.source).toBe(expected.ux.source)
    expect(ux.period).toEqual(expected.ux.period)

    const w = ux.weekly!
    expect(w.period).toEqual(expected.ux.period)
    expect(w.comparisonPeriod).toEqual(expected.ux.comparisonPeriod)
    expect({ s: w.sessions, c: w.conversionRatePercent, r: w.revenueEstimatedBRL, t: w.averageTicketBRL, n: w.note }).toEqual({
      s: expected.ux.weekly.sessions,
      c: expected.ux.weekly.conversionRatePercent,
      r: expected.ux.weekly.revenueEstimatedBRL,
      t: expected.ux.weekly.averageTicketBRL,
      n: expected.ux.weekly.note,
    })

    expect(ux.funnel).toMatchObject(expected.ux.funnel)
    expect(ux.deadClicks).toMatchObject(expected.ux.deadClicks)
    expect(ux.yoy).toMatchObject(expected.ux.yoy)
    expect(ux.priorities!.items).toEqual(expected.ux.priorities)
  })

  it('alertas idênticos (Carrinho: atrito alto · Outros: receita em queda)', () => {
    expect(alerts).toEqual(expected.alerts)
  })
})
