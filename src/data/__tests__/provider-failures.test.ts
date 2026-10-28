// Testes de falha do provedor (Missão 04 — Etapa B2): fonte indisponível,
// snapshot inválido, dados ausentes e dados desatualizados. Confirma que
// nenhum desses cenários resulta em dado inválido/obsoleto sendo tratado
// como real.

import { describe, expect, it } from 'vitest'
import { aggregateDailyRecords } from '../aggregate-core'
import { createTestProvider, FIXTURE_RECORDS, TEST_TODAY } from '../providers/test-provider'

const RANGE = { from: TEST_TODAY, to: TEST_TODAY }

describe('provedor de teste — cenário "ok" (baseline)', () => {
  it('não está indisponível e expõe os registros da fixture', () => {
    const provider = createTestProvider('ok')
    expect(provider.isUnavailable('ga4')).toBe(false)
    expect(provider.getDailySeries()).toEqual(FIXTURE_RECORDS)
  })
})

describe('provedor de teste — fonte indisponível', () => {
  const provider = createTestProvider('fonte-indisponivel')

  it('reporta isUnavailable=true para GA4 e Clarity', () => {
    expect(provider.isUnavailable('ga4')).toBe(true)
    expect(provider.isUnavailable('clarity')).toBe(true)
  })

  it('não retorna dados como se fossem válidos', () => {
    expect(provider.getDailySeries()).toEqual([])
    const result = aggregateDailyRecords(provider.getDailySeries(), RANGE, 'todos')
    expect(result.hasAnyData).toBe(false)
  })

  it('sourceMeta registra desde quando está indisponível', () => {
    const meta = provider.sourceMeta.find((m) => m.source === 'ga4')
    expect(meta?.unavailableSince).not.toBeNull()
    expect(meta?.lastUpdated).toBeNull()
  })
})

describe('provedor de teste — dados ausentes (diferente de fonte indisponível)', () => {
  const provider = createTestProvider('dados-ausentes')

  it('a fonte está disponível, mas não há dados para o período', () => {
    expect(provider.isUnavailable('ga4')).toBe(false)
    expect(provider.getDailySeries()).toEqual([])
  })

  it('aggregate reflete "sem dados", não "fonte indisponível"', () => {
    const result = aggregateDailyRecords(provider.getDailySeries(), RANGE, 'todos')
    expect(result.hasAnyData).toBe(false)
    expect(result.hasFutureDaysOnly).toBe(false)
  })
})

describe('provedor de teste — dados desatualizados', () => {
  const provider = createTestProvider('dados-desatualizados')

  it('tem registros em cache, mas é tratado como indisponível para exibição (RF-17)', () => {
    expect(provider.getDailySeries().length).toBeGreaterThan(0)
    expect(provider.isUnavailable('ga4')).toBe(true)
  })

  it('lastUpdated está defasado em relação a "hoje"', () => {
    const meta = provider.sourceMeta.find((m) => m.source === 'ga4')
    expect(meta?.lastUpdated).not.toBeNull()
    const staleDays = (TEST_TODAY.getTime() - (meta!.lastUpdated as Date).getTime()) / 86400000
    expect(staleDays).toBeGreaterThanOrEqual(3)
  })
})

describe('provedor de teste — snapshot inválido', () => {
  const provider = createTestProvider('snapshot-invalido')

  it('a validação do payload simulado falha, com motivo registrado', () => {
    expect(provider.lastValidationErrors).toBeDefined()
    expect(provider.lastValidationErrors!.length).toBeGreaterThan(0)
  })

  it('o provedor nunca expõe o payload inválido como dado real', () => {
    expect(provider.getDailySeries()).toEqual([])
    expect(provider.isUnavailable('ga4')).toBe(true)
  })
})
