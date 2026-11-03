import { afterEach, describe, expect, test, vi } from 'vitest'
import { channelRevenueShare, loadRealOverview } from '../real-overview'

describe('loadRealOverview', () => {
  test('o snapshot real embutido continua válido contra o contrato (nunca deve devolver null)', () => {
    const result = loadRealOverview()
    expect(result).not.toBeNull()
  })

  test('expõe o total exato de receita do período, lido de "Participação por canal"', () => {
    const result = loadRealOverview()
    expect(result?.revenue).toBe(44945346.96)
  })

  test('expõe usuários aproximados e período atualizado', () => {
    const result = loadRealOverview()
    expect(result?.users).toBe(920300)
    expect(result?.period).toEqual({ from: '2026-10-06', to: '2026-11-02' })
  })

  test('expõe sessões e compras exatas do período, batendo com o resumo do Looker', () => {
    const result = loadRealOverview()
    expect(result?.sessions).toBe(1582478)
    expect(result?.orders).toBe(29641)
  })

  test('expõe o período próprio das marcas (01–02/nov), diferente do período do snapshot (06/10–02/11)', () => {
    const result = loadRealOverview()
    expect(result?.catalogPeriod).toEqual({ from: '2026-11-01', to: '2026-11-02' })
    expect(result?.catalogPeriod).not.toEqual(result?.period)
  })

  test('traz as 10 marcas da tabela (Pirelli, Speedmax, Kumho e Goodyear incluídas), com a receita exata do PDF', () => {
    const result = loadRealOverview()
    expect(result?.brands).toHaveLength(10)
    expect(result?.brands.map((b) => b.brand)).toEqual(
      expect.arrayContaining(['Itaro', 'Michelin', 'Pirelli', 'Speedmax', 'Kumho', 'Goodyear', 'Continental', 'Bridgestone', 'Firestone', 'Barum']),
    )
    expect(result?.brands.find((b) => b.brand === 'Pirelli')).toEqual({
      brand: 'Pirelli',
      itemsViewed: 14194,
      itemsAdded: 4281,
      itemsPurchased: 251,
      itemRevenue: 205694.6,
    })
  })

  test('registra o aviso de origem: páginas 9–11 do PDF de 03/11 saíram em branco e não foram usadas', () => {
    const result = loadRealOverview()
    expect(result?.limitations.some((l) => l.includes('páginas 9, 10 e 11') && l.includes('em branco'))).toBe(true)
  })

  test('mantém a limitação sobre a taxa de conversão não incluída (D-04)', () => {
    const result = loadRealOverview()
    expect(result?.limitations.some((l) => l.includes('D-04'))).toBe(true)
  })

  test('nenhum canal carrega o cabeçalho de seção colado ("Origem - ...")', () => {
    const result = loadRealOverview()
    expect(result?.channels.every((c) => !c.channel.startsWith('Origem'))).toBe(true)
    expect(result?.channels.every((c) => !c.sourceMedium?.startsWith('Origem'))).toBe(true)
  })

  test('expõe a participação por canal agregada do Looker (channelShares), batendo com o PDF', () => {
    const result = loadRealOverview()
    const cpc = result?.channelShares.find((c) => c.channel === 'CPC')
    expect(cpc).toEqual({ channel: 'CPC', revenueSharePercent: 42.79, comparisonChangePercent: -11.7 })
    expect(result?.channelShares).toHaveLength(6)
  })

  test('as participações por canal somam ~100% (conferência de transcrição)', () => {
    const total = loadRealOverview()?.channelShares.reduce((sum, c) => sum + c.revenueSharePercent, 0) ?? 0
    expect(total).toBeCloseTo(100, 0)
  })
})

describe('loadRealOverview — snapshot sem catalogPeriod (comportamento anterior preservado)', () => {
  afterEach(() => {
    vi.doUnmock('../ga4-real-snapshot.json')
    vi.resetModules()
  })

  test('sem metadata.catalogPeriod a view continua válida e devolve catalogPeriod = null (a UI não mostra selo próprio)', async () => {
    vi.resetModules()
    const raw = (await import('../ga4-real-snapshot.json')).default
    const metadata: Record<string, unknown> = { ...raw.metadata }
    delete metadata.catalogPeriod
    vi.doMock('../ga4-real-snapshot.json', () => ({ default: { ...raw, metadata } }))

    const { loadRealOverview: loadWithoutCatalogPeriod } = await import('../real-overview')
    const view = loadWithoutCatalogPeriod()
    expect(view).not.toBeNull()
    expect(view?.catalogPeriod).toBeNull()
    expect(view?.brands).toHaveLength(10)
  })
})

describe('channelRevenueShare', () => {
  test('divide pela receita TOTAL do período, nunca pela soma das linhas exibidas', () => {
    // google/cpc: receita 17.220.000, total do período 44.945.346,96 — ~38,3% (não ~43,8%,
    // que seria o resultado errado de dividir pela soma só das linhas, ~39,3 mi).
    const result = loadRealOverview()
    const googleCpc = result?.channels.find((c) => c.sourceMedium === 'google / cpc')
    expect(googleCpc).toBeDefined()
    const share = channelRevenueShare(googleCpc!.revenue, result!.revenue)
    expect(share).toBeCloseTo(38.31, 1)
  })

  test('devolve null quando o total do período é desconhecido — nunca divide por algo que não é o total', () => {
    expect(channelRevenueShare(1000, null)).toBeNull()
    expect(channelRevenueShare(1000, 0)).toBeNull()
  })
})
