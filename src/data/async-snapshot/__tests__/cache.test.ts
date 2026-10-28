// Testes de cache em memória (Missão 04 — Etapa C0).

import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests, getCached, invalidate, isStale, setCached } from '../cache'
import type { DailySnapshot } from '@/data/providers/schema'

function fakeSnapshot(): DailySnapshot {
  return {
    metadata: {
      source: 'ga4',
      platform: 'site',
      schemaVersion: '1.0.0',
      extractedAt: '2026-11-27T12:00:00-03:00',
      period: { from: '2026-11-27', to: '2026-11-27' },
      deviceScope: ['desktop'],
      status: 'ok',
    },
    records: [],
  }
}

describe('cache em memória', () => {
  beforeEach(() => clearAllForTests())

  it('retorna null para uma chave nunca usada', () => {
    expect(getCached('nunca-usada')).toBeNull()
  })

  it('armazena e recupera uma entrada', () => {
    const cachedAt = new Date('2026-11-27T12:00:00-03:00')
    setCached('ga4:2026-11-27', fakeSnapshot(), cachedAt)
    const entry = getCached('ga4:2026-11-27')
    expect(entry).not.toBeNull()
    expect(entry?.cachedAt).toEqual(cachedAt)
  })

  it('invalidate remove a entrada', () => {
    setCached('chave', fakeSnapshot(), new Date())
    invalidate('chave')
    expect(getCached('chave')).toBeNull()
  })

  it('isStale reflete a idade da entrada em relação a "agora"', () => {
    const cachedAt = new Date('2026-11-27T00:00:00-03:00')
    const entry = setCached('chave', fakeSnapshot(), cachedAt)
    const now30MinDepois = new Date(cachedAt.getTime() + 30 * 60 * 1000)
    const now10MinDepois = new Date(cachedAt.getTime() + 10 * 60 * 1000)
    expect(isStale(entry, 20 * 60 * 1000, now30MinDepois)).toBe(true)
    expect(isStale(entry, 20 * 60 * 1000, now10MinDepois)).toBe(false)
  })
})
