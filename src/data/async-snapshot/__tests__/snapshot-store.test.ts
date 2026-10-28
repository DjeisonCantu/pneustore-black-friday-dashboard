// Testes do orquestrador de carregamento (Missão 04 — Etapa C0): cache,
// recarregamento controlado, condição de corrida em troca rápida de filtro,
// dados desatualizados e preservação do provedor mock existente.

import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests } from '../cache'
import { createSnapshotStore } from '../snapshot-store'
import { ga4SnapshotValidator } from '@/data/providers/schema'
import type { SnapshotFetcher } from '../types'

function validPayload(overrides: Partial<{ sessions: number }> = {}) {
  return {
    metadata: {
      source: 'ga4',
      platform: 'site',
      schemaVersion: '1.0.0',
      extractedAt: '2026-11-27T23:00:00-03:00',
      period: { from: '2026-11-27', to: '2026-11-27' },
      deviceScope: ['desktop'],
      status: 'ok',
    },
    records: [
      {
        date: '2026-11-27',
        isFuture: false,
        isPartial: false,
        sessions: { desktop: overrides.sessions ?? 100, mobile: 0, tablet: 0 },
        users: { desktop: 80, mobile: 0, tablet: 0 },
        orders: { desktop: 2, mobile: 0, tablet: 0 },
        revenue: { desktop: 2000, mobile: 0, tablet: 0 },
      },
    ],
  }
}

/** Fetcher que resolve depois de um atraso controlável, para simular corrida entre requisições. */
function delayedFetcher(responsesByUrl: Record<string, { body: unknown; delayMs: number }>): SnapshotFetcher {
  return async (url) => {
    const config = responsesByUrl[url]
    await new Promise((resolve) => setTimeout(resolve, config.delayMs))
    return { ok: true, status: 200, json: async () => config.body }
  }
}

describe('snapshot-store — carregamento assíncrono básico', () => {
  beforeEach(() => clearAllForTests())

  it('status vai de loading para success', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => validPayload() })

    const promise = store.load('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    expect(store.getState().status).toBe('loading')
    await promise
    expect(store.getState().status).toBe('success')
    expect(store.getState().snapshot?.records).toHaveLength(1)
  })

  it('usa o cache em uma segunda chamada, sem precisar buscar de novo', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    let callCount = 0
    const fetcher: SnapshotFetcher = async () => {
      callCount += 1
      return { ok: true, status: 200, json: async () => validPayload() }
    }

    await store.load('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    await store.load('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    expect(callCount).toBe(1)
  })

  it('reload ignora o cache e busca de novo', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    let callCount = 0
    const fetcher: SnapshotFetcher = async () => {
      callCount += 1
      return { ok: true, status: 200, json: async () => validPayload() }
    }

    await store.load('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    await store.reload('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    expect(callCount).toBe(2)
  })

  it('snapshot inválido resulta em status error, nunca em dado aceito como real', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    const badPayload = validPayload()
    badPayload.metadata.platform = 'app'
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => badPayload })

    await store.load('ga4:invalido', '/dev-snapshots/ga4-invalid-example.json', { fetcher })
    const state = store.getState()
    expect(state.status).toBe('error')
    expect(state.snapshot).toBeNull()
    expect(state.errors).not.toBeNull()
  })

  it('fonte indisponível (HTTP não-ok) resulta em status error com mensagem', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    const fetcher: SnapshotFetcher = async () => ({ ok: false, status: 503, json: async () => null })

    await store.load('ga4:indisponivel', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    const state = store.getState()
    expect(state.status).toBe('error')
    expect(state.errors?.[0]).toMatch(/503/)
  })
})

describe('snapshot-store — dados desatualizados (RF-17)', () => {
  beforeEach(() => clearAllForTests())

  it('marca como "stale" quando o tempo decorrido excede maxAgeMs', async () => {
    let currentTime = new Date('2026-11-27T12:00:00-03:00')
    const store = createSnapshotStore(ga4SnapshotValidator, { maxAgeMs: 10 * 60 * 1000, now: () => currentTime })
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => validPayload() })

    await store.load('ga4:2026-11-27', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })
    expect(store.getState().status).toBe('success')

    // Avança o relógio além do maxAgeMs sem recarregar.
    currentTime = new Date(currentTime.getTime() + 20 * 60 * 1000)
    expect(store.getState().status).toBe('stale')
    // O snapshot em cache continua acessível — só o status muda — nunca é
    // exibido silenciosamente como "atual" (RF-17 exige o aviso, não a omissão do dado).
    expect(store.getState().snapshot).not.toBeNull()
  })
})

describe('snapshot-store — condição de corrida (troca rápida de filtros)', () => {
  beforeEach(() => clearAllForTests())

  it('só o resultado da chamada mais recente é aplicado, mesmo que a mais antiga responda por último', async () => {
    const store = createSnapshotStore(ga4SnapshotValidator)
    const fetcher = delayedFetcher({
      '/dev-snapshots/dia-25.json': { body: validPayload({ sessions: 2500 }), delayMs: 50 },
      '/dev-snapshots/dia-26.json': { body: validPayload({ sessions: 2600 }), delayMs: 5 },
    })

    // Simula o usuário trocando o filtro de período rapidamente: a primeira
    // chamada (mais lenta) só resolve DEPOIS da segunda (mais rápida).
    const firstCall = store.load('periodo-atual', '/dev-snapshots/dia-25.json', { fetcher })
    const secondCall = store.load('periodo-atual', '/dev-snapshots/dia-26.json', { fetcher })

    await Promise.all([firstCall, secondCall])

    // Se não houvesse proteção contra corrida, a resposta do dia-25 (mais
    // lenta) sobrescreveria por último o resultado correto do dia-26.
    // Cast seguro: `validPayload` sempre usa a forma segmentada por dispositivo.
    const sessions = store.getState().snapshot?.records[0].sessions as { desktop: number } | undefined
    expect(sessions?.desktop).toBe(2600)
  })
})

describe('snapshot-store — preservação do provedor mock existente', () => {
  it('usar a camada assíncrona não afeta o provedor ativo da aplicação', async () => {
    const { getActiveProvider } = await import('@/data/providers')
    const before = getActiveProvider()
    expect(before.id).toBe('mock')

    const store = createSnapshotStore(ga4SnapshotValidator)
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => validPayload() })
    await store.load('qualquer-chave', '/dev-snapshots/ga4-2026-11-27.json', { fetcher })

    const after = getActiveProvider()
    expect(after.id).toBe('mock')
    expect(after).toBe(before)
  })
})
