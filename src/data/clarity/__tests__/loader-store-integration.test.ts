// Prova de reaproveitamento (Missão 04 — Etapa C2): a MESMA camada
// genérica de carregamento/cache/store usada pelo GA4 (Etapa C0) funciona
// para o Clarity só trocando o validador — nenhum "segundo sistema de
// gerenciamento de dados" foi criado, conforme exigido pela missão.

import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests } from '@/data/async-snapshot/cache'
import { loadClaritySnapshot } from '../loader'
import { createClaritySnapshotStore } from '../store'
import type { SnapshotFetcher } from '@/data/async-snapshot/types'

function validPayload() {
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
    },
    pages: [
      {
        page: '/checkout/v2/cart',
        device: 'desktop',
        sessions: 400,
        deadClicks: { absolute: 200 },
        rageClicks: { absolute: 4 },
        quickBacks: { absolute: 40 },
      },
    ],
  }
}

describe('loadClaritySnapshot — mesmo loader genérico do GA4', () => {
  it('valida e devolve sucesso para um payload Clarity válido', async () => {
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => validPayload() })
    const result = await loadClaritySnapshot('/dev-snapshots/clarity-2026-11-27.json', { fetcher })
    expect(result.outcome).toBe('success')
  })

  it('rejeita um payload Clarity inválido (platform app)', async () => {
    const payload = validPayload()
    payload.metadata.platform = 'app'
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => payload })
    const result = await loadClaritySnapshot('/dev-snapshots/clarity-invalid-example.json', { fetcher })
    expect(result.outcome).toBe('invalid')
  })
})

describe('createClaritySnapshotStore — mesmo store genérico do GA4', () => {
  beforeEach(() => clearAllForTests())

  it('carrega, cacheia e expõe o snapshot do Clarity', async () => {
    const store = createClaritySnapshotStore()
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => validPayload() })

    await store.load('clarity:2026-11-27', '/dev-snapshots/clarity-2026-11-27.json', { fetcher })
    const state = store.getState()
    expect(state.status).toBe('success')
    expect(state.snapshot?.pages).toHaveLength(1)
  })

  it('snapshot inválido do Clarity nunca é exposto como sucesso', async () => {
    const store = createClaritySnapshotStore()
    const payload = validPayload()
    payload.metadata.platform = 'app'
    const fetcher: SnapshotFetcher = async () => ({ ok: true, status: 200, json: async () => payload })

    await store.load('clarity:invalido', '/dev-snapshots/clarity-invalid-example.json', { fetcher })
    const state = store.getState()
    expect(state.status).toBe('error')
    expect(state.snapshot).toBeNull()
  })
})
