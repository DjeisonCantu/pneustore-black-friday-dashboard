import { describe, expect, test } from 'vitest'
import { channelRevenueShare, loadRealOverview } from '../real-overview'

describe('loadRealOverview', () => {
  test('o snapshot real embutido continua válido contra o contrato (nunca deve devolver null)', () => {
    const result = loadRealOverview()
    expect(result).not.toBeNull()
  })

  test('expõe o total exato de receita do período, lido de "Participação por canal"', () => {
    const result = loadRealOverview()
    expect(result?.revenue).toBe(47460135.62)
  })

  test('expõe usuários aproximados e período atualizado', () => {
    const result = loadRealOverview()
    expect(result?.users).toBe(945100)
    expect(result?.period).toEqual({ from: '2026-10-02', to: '2026-10-29' })
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
    expect(cpc).toEqual({ channel: 'CPC', revenueSharePercent: 43.45, comparisonChangePercent: -11.2 })
    expect(result?.channelShares).toHaveLength(6)
  })
})

describe('channelRevenueShare', () => {
  test('divide pela receita TOTAL do período, nunca pela soma das linhas exibidas', () => {
    // google/cpc: receita 18.580.000, total do período 47.460.135,62 — ~39,1% (não ~44,95%,
    // que seria o resultado errado de dividir pela soma só das linhas, ~41,3 mi).
    const result = loadRealOverview()
    const googleCpc = result?.channels.find((c) => c.sourceMedium === 'google / cpc')
    expect(googleCpc).toBeDefined()
    const share = channelRevenueShare(googleCpc!.revenue, result!.revenue)
    expect(share).toBeCloseTo(39.14, 1)
  })

  test('devolve null quando o total do período é desconhecido — nunca divide por algo que não é o total', () => {
    expect(channelRevenueShare(1000, null)).toBeNull()
    expect(channelRevenueShare(1000, 0)).toBeNull()
  })
})
