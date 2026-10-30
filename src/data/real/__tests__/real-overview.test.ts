import { describe, expect, test } from 'vitest'
import { loadRealOverview } from '../real-overview'

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
})
