import { describe, expect, it } from 'vitest'
import {
  CHANNEL_DECLINE_ALERT_THRESHOLD,
  CRITICAL_DEAD_CLICK_SHARE_THRESHOLD,
  buildDashboardData,
  channelRevenueShare,
  deadClickShare,
  isCriticalPage,
  percentDelta,
  type CheckoutPageFriction,
} from '../dashboard-data'
import { mergeUpdates } from '../updates/merge-updates'
import { parseUpdateMd } from '../updates/parse-update-md'
import { formatIssue, type ParsedUpdate } from '../updates/types'
import example0311 from '../updates/__tests__/fixtures/atualizacao-2026-11-03.md?raw'
import { BASELINE_MERGED } from '../updates/__tests__/baseline'
import { canaisSection, checkoutSection, mdFile, resumoSection } from '../updates/__tests__/helpers'

function parse(id: string, text: string): ParsedUpdate {
  const result = parseUpdateMd(text)
  if (!result.ok) throw new Error(result.issues.map(formatIssue).join('\n'))
  return { id, ...result.update }
}

const update0311 = parse('2026-11-03-1530', example0311)

describe('percentDelta', () => {
  it('reproduz as variações do relatório UX (slide 3 — GA4)', () => {
    expect(percentDelta({ y2025: 707350, y2026: 404343 })).toBeCloseTo(-42.8, 1)
    expect(percentDelta({ y2025: 1.38, y2026: 1.98 })).toBeCloseTo(43.5, 1)
    expect(percentDelta({ y2025: 14600000, y2026: 12040000 })).toBeCloseTo(-17.5, 1)
    expect(percentDelta({ y2025: 1491.02, y2026: 1502 })).toBeCloseTo(0.7, 1)
  })
})

describe('channelRevenueShare', () => {
  it('divide pela receita TOTAL do período, nunca pela soma das linhas exibidas', () => {
    // google / cpc: 17.220.000 de 44.945.346,96 — ~38,3% (não ~43,8%, que seria dividir pela soma das linhas).
    expect(channelRevenueShare(17_220_000, 44_945_346.96)).toBeCloseTo(38.31, 1)
  })

  it('devolve null quando o total do período é desconhecido', () => {
    expect(channelRevenueShare(1000, null)).toBeNull()
    expect(channelRevenueShare(1000, 0)).toBeNull()
  })
})

describe('deadClickShare / isCriticalPage', () => {
  const page = (path: string, deadClicks: number | null): CheckoutPageFriction => ({ path, label: path, deadClicks, rageClicks: 1, quickBacks: 1 })
  const pages = [page('cart', 5910), page('servicos', 4940), page('type', 35), page('send', 927), page('payment', 723), page('confirmation', 314)]

  it('o Carrinho concentra mais de 40% — fica crítico; Escolha de serviços (~38%) e Confirmação não', () => {
    expect(deadClickShare(pages[0], pages)).toBeGreaterThan(CRITICAL_DEAD_CLICK_SHARE_THRESHOLD)
    expect(pages.filter((p) => isCriticalPage(p, pages)).map((p) => p.path)).toEqual(['cart'])
  })

  it('as participações fecham em 100%', () => {
    expect(pages.reduce((sum, p) => sum + deadClickShare(p, pages), 0)).toBeCloseTo(100, 5)
  })

  it('página sem dead clicks (célula vazia) não entra na conta nem é crítica', () => {
    const withGap = [page('a', 50), page('b', null)]
    expect(deadClickShare(withGap[1], withGap)).toBe(0)
    expect(deadClickShare(withGap[0], withGap)).toBe(100)
    expect(isCriticalPage(withGap[1], withGap)).toBe(false)
  })
})

describe('buildDashboardData — baseline sozinho (o que está no ar)', () => {
  const data = buildDashboardData(BASELINE_MERGED)

  it('cada fonte tem o próprio período', () => {
    expect(data.overview?.period).toEqual({ from: '2026-10-02', to: '2026-10-29' })
    expect(data.clarity?.period).toEqual({ from: '2026-10-27', to: '2026-10-29' })
    expect(data.ux.period).toEqual({ from: '2026-10-14', to: '2026-10-20' })
  })

  it('"itens adicionados" é a estimativa vistos × %Add to Cart (Itaro: 178.977)', () => {
    expect(data.overview?.brands.find((b) => b.brand === 'Itaro')?.itemsAdded).toBe(178977)
  })
})

describe('buildDashboardData — baseline + atualização de 03/11', () => {
  // Constrói uma atualização "baseline" mínima só com o que o teste precisa, para isolar o efeito da de 03/11.
  const baseline = parse(
    '0000-baseline',
    mdFile([resumoSection('2026-10-02..2026-10-29', 1635826), canaisSection('2026-10-02..2026-10-29', 43.45, -11.2), checkoutSection('2026-10-27..2026-10-29', 10129)], '2026-10-30T12:17:54.727Z'),
  )
  const data = buildDashboardData(mergeUpdates([baseline, update0311]))

  it('Looker 06/10–02/11 e Clarity 31/10–02/11 substituem os do baseline', () => {
    expect(data.overview?.period).toEqual({ from: '2026-10-06', to: '2026-11-02' })
    expect(data.overview?.sessions).toBe(1582478)
    expect(data.overview?.revenue).toBe(44945346.96)
    expect(data.clarity?.period).toEqual({ from: '2026-10-31', to: '2026-11-02' })
    expect(data.clarity?.friction.find((p) => p.path === '/checkout/v2/cart')).toEqual({
      path: '/checkout/v2/cart',
      label: 'Carrinho',
      deadClicks: 5910,
      rageClicks: 226,
      quickBacks: 288,
    })
  })

  it('as marcas de 01–02/nov ganham selo próprio (diferem do período do resumo)', () => {
    expect(data.overview?.catalogPeriod).toEqual({ from: '2026-11-01', to: '2026-11-02' })
    expect(data.overview?.brands).toHaveLength(10)
    expect(data.overview?.brands.find((b) => b.brand === 'Pirelli')).toEqual({ brand: 'Pirelli', itemsViewed: 14194, itemsAdded: 4281, itemsPurchased: 251, itemRevenue: 205694.6 })
    expect(data.overview?.channelsPeriod).toBeNull()
  })

  it('o Clarity traz a limitação de fim de semana + Finados (e a do baseline sai de vigor junto com a seção antiga)', () => {
    const note = data.clarity?.notes.find((n) => n.includes('Finados'))
    expect(note).toContain('sábado')
  })

  it('o Relatório UX continua o do baseline (a atualização de 03/11 não traz seções de UX)', () => {
    // sem seções UX em nenhum dos dois arquivos de teste, o bloco fica ausente em vez de inventado
    expect(data.ux.weekly).toBeNull()
    expect(data.ux.priorities).toBeNull()
  })

  it('alertas: Carrinho (atrito alto) e o canal com maior queda (Outros, -17,8%)', () => {
    expect(data.alerts).toEqual([{ label: 'Carrinho: atrito alto' }, { label: 'Outros: receita em queda' }])
  })

  it(`a queda de canal só vira alerta a partir de ${CHANNEL_DECLINE_ALERT_THRESHOLD}%`, () => {
    const mild = parse('0000-baseline', mdFile([canaisSection('2026-10-02..2026-10-29', 40, -14.9)]))
    expect(buildDashboardData(mergeUpdates([mild])).alerts).toEqual([])
  })
})

describe('buildDashboardData — célula vazia = ausente, nunca 0', () => {
  it('%Add to Cart vazio: itens adicionados fica null (não 0)', () => {
    const update = parse(
      '0000-baseline',
      mdFile([
        ['## Looker — marcas', 'fonte: looker-pdf', 'periodo: 2026-11-01..2026-11-02', '', '| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |', '|---|---|---|---|---|', '| Itaro | 100 |  | 5 | 1000 |'].join('\n'),
      ]),
    )
    expect(buildDashboardData(mergeUpdates([update])).overview?.brands[0].itemsAdded).toBeNull()
  })

  it('variação vazia: comparisonChangePercent fica null e não vira alerta', () => {
    const update = parse('0000-baseline', mdFile([['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-02..2026-10-29', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 40 |  |'].join('\n')]))
    const data = buildDashboardData(mergeUpdates([update]))
    expect(data.overview?.channelShares[0].comparisonChangePercent).toBeNull()
    expect(data.alerts).toEqual([])
  })

  it('sem nenhuma seção, o dashboard fica vazio (nada inventado)', () => {
    const data = buildDashboardData(mergeUpdates([]))
    expect(data.overview).toBeNull()
    expect(data.clarity).toBeNull()
    expect(data.ux.period).toBeNull()
    expect(data.alerts).toEqual([])
  })
})
