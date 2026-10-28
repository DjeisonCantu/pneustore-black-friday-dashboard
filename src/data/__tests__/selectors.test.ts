// Testes de filtros e comparação temporal (Missão 04 — Etapa B2).
// Rodam contra o provedor ativo padrão (mock), para confirmar que a migração
// para DataProvider (Etapa B1) preservou o comportamento da Missão 02/03.

import { describe, expect, it } from 'vitest'
import {
  aggregate,
  comparisonLabel,
  isSingleDay,
  periodLabel,
  resolveComparisonRange,
  resolvePeriodRange,
} from '../selectors'
import type { Filters } from '@/types/common'

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const baseFilters: Filters = {
  period: '7dias',
  customRange: null,
  device: 'todos',
  comparison: 'nenhum',
}

describe('resolvePeriodRange — presets de filtro', () => {
  it('hoje resolve para um único dia', () => {
    const range = resolvePeriodRange({ period: 'hoje', customRange: null })
    expect(toIso(range.from)).toBe(toIso(range.to))
    expect(isSingleDay(range)).toBe(true)
  })

  it('ontem é exatamente um dia antes de hoje', () => {
    const hoje = resolvePeriodRange({ period: 'hoje', customRange: null })
    const ontem = resolvePeriodRange({ period: 'ontem', customRange: null })
    const diffDays = Math.round((hoje.from.getTime() - ontem.from.getTime()) / 86400000)
    expect(diffDays).toBe(1)
    expect(isSingleDay(ontem)).toBe(true)
  })

  it('7dias cobre exatamente 7 dias terminando hoje', () => {
    const range = resolvePeriodRange({ period: '7dias', customRange: null })
    const diffDays = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
    expect(diffDays).toBe(7)
    expect(toIso(range.to)).toBe(toIso(resolvePeriodRange({ period: 'hoje', customRange: null }).from))
  })

  it('semana-black cobre 24/11 a 01/12/2026 (D-10)', () => {
    const range = resolvePeriodRange({ period: 'semana-black', customRange: null })
    expect(toIso(range.from)).toBe('2026-11-24')
    expect(toIso(range.to)).toBe('2026-12-01')
  })

  it('personalizado usa o intervalo informado pelo usuário', () => {
    const customRange = { from: new Date('2026-10-01T00:00:00-03:00'), to: new Date('2026-10-05T00:00:00-03:00') }
    const range = resolvePeriodRange({ period: 'personalizado', customRange })
    expect(toIso(range.from)).toBe('2026-10-01')
    expect(toIso(range.to)).toBe('2026-10-05')
  })

  it('periodLabel cobre todos os presets sem lançar', () => {
    for (const preset of ['hoje', 'ontem', '7dias', 'semana-black', 'personalizado'] as const) {
      expect(() => periodLabel(preset)).not.toThrow()
    }
  })
})

describe('resolveComparisonRange — comparação temporal', () => {
  it('nenhum retorna null', () => {
    expect(resolveComparisonRange({ ...baseFilters, comparison: 'nenhum' })).toBeNull()
  })

  it('periodo-anterior usa o mesmo número de dias, imediatamente antes', () => {
    const filters: Filters = { ...baseFilters, period: '7dias', comparison: 'periodo-anterior' }
    const current = resolvePeriodRange(filters)
    const previous = resolveComparisonRange(filters)!
    const currentLength = Math.round((current.to.getTime() - current.from.getTime()) / 86400000) + 1
    const previousLength = Math.round((previous.to.getTime() - previous.from.getTime()) / 86400000) + 1
    expect(previousLength).toBe(currentLength)
    expect(toIso(previous.to)).toBe(toIso(new Date(current.from.getTime() - 86400000)))
  })

  it('mesmo-periodo-2025 desloca exatamente 364 dias (alinhamento por dia da semana, D-07)', () => {
    const filters: Filters = { ...baseFilters, period: 'hoje', comparison: 'mesmo-periodo-2025' }
    const current = resolvePeriodRange(filters)
    const previousYear = resolveComparisonRange(filters)!
    const diffDays = Math.round((current.from.getTime() - previousYear.from.getTime()) / 86400000)
    expect(diffDays).toBe(364)
    // 27/11/2026 (sexta) − 364 dias = 28/11/2025, conforme recomendação de D-07.
    expect(toIso(previousYear.from)).toBe('2025-11-28')
  })

  it('comparisonLabel cobre todos os modos sem lançar', () => {
    for (const mode of ['nenhum', 'periodo-anterior', 'mesmo-periodo-2025'] as const) {
      expect(() => comparisonLabel(mode)).not.toThrow()
    }
  })
})

describe('aggregate — integridade dos dados após a migração para DataProvider (B1)', () => {
  it('um período inteiramente no futuro não tem dados reais (hasAnyData=false, hasFutureDaysOnly=true)', () => {
    const futureRange = { from: new Date('2026-11-29T00:00:00-03:00'), to: new Date('2026-11-30T00:00:00-03:00') }
    const result = aggregate(futureRange, 'todos')
    expect(result.hasAnyData).toBe(false)
    expect(result.hasFutureDaysOnly).toBe(true)
    expect(result.sessions).toBe(0)
  })

  it('um período com dados reais soma sessões por dispositivo sem misturar unidades', () => {
    const range = resolvePeriodRange({ period: '7dias', customRange: null })
    const total = aggregate(range, 'todos')
    const desktop = aggregate(range, 'desktop')
    const mobile = aggregate(range, 'mobile')
    const tablet = aggregate(range, 'tablet')
    expect(total.hasAnyData).toBe(true)
    // Soma dos dispositivos deve bater com o total (RF-08 / CA-05).
    expect(desktop.sessions + mobile.sessions + tablet.sessions).toBe(total.sessions)
    expect(total.conversionRate).toBeGreaterThan(0)
  })
})
