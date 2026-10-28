// Testes do carregador puro (Missão 04 — Etapa C0 / generalizado na C2):
// sucesso, rede indisponível, JSON/esquema inválido e versão incompatível.
// Usa o validador do GA4 como exemplo (o carregador é genérico — ver também
// src/data/clarity/__tests__ para a mesma mecânica com o contrato do Clarity).

import { describe, expect, it } from 'vitest'
import { loadSnapshotFromUrl } from '../loader'
import { ga4SnapshotValidator } from '@/data/providers/schema'
import type { SnapshotFetcher } from '../types'

function fetcherReturning(body: unknown, { ok = true, status = 200 } = {}): SnapshotFetcher {
  return async () => ({ ok, status, json: async () => body })
}

function validSnapshotPayload() {
  return {
    metadata: {
      source: 'ga4',
      platform: 'site',
      schemaVersion: '1.0.0',
      extractedAt: '2026-11-27T23:05:00-03:00',
      period: { from: '2026-11-27', to: '2026-11-27' },
      deviceScope: ['desktop'],
      status: 'ok',
    },
    records: [
      {
        date: '2026-11-27',
        isFuture: false,
        isPartial: false,
        sessions: { desktop: 100, mobile: 0, tablet: 0 },
        users: { desktop: 80, mobile: 0, tablet: 0 },
        orders: { desktop: 2, mobile: 0, tablet: 0 },
        revenue: { desktop: 2000, mobile: 0, tablet: 0 },
      },
    ],
  }
}

describe('loadSnapshotFromUrl', () => {
  it('retorna sucesso para um payload válido', async () => {
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, {
      fetcher: fetcherReturning(validSnapshotPayload()),
    })
    expect(result.outcome).toBe('success')
    if (result.outcome === 'success') {
      expect(result.snapshot.records).toHaveLength(1)
    }
  })

  it('reporta network-error quando a resposta HTTP não é ok (fonte indisponível)', async () => {
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, {
      fetcher: fetcherReturning(null, { ok: false, status: 503 }),
    })
    expect(result.outcome).toBe('network-error')
  })

  it('reporta network-error quando o fetcher lança (ex.: sem conexão)', async () => {
    const throwing: SnapshotFetcher = async () => {
      throw new Error('ECONNREFUSED')
    }
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, { fetcher: throwing })
    expect(result.outcome).toBe('network-error')
  })

  it('reporta aborted quando o signal já está abortado e o fetcher lança', async () => {
    const controller = new AbortController()
    controller.abort()
    const throwing: SnapshotFetcher = async () => {
      throw new Error('AbortError')
    }
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, {
      fetcher: throwing,
      signal: controller.signal,
    })
    expect(result.outcome).toBe('aborted')
  })

  it('reporta invalid para um payload que falha a validação (platform errado)', async () => {
    const payload = validSnapshotPayload()
    payload.metadata.platform = 'app'
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-invalid-example.json', ga4SnapshotValidator, {
      fetcher: fetcherReturning(payload),
    })
    expect(result.outcome).toBe('invalid')
  })

  it('reporta invalid quando a resposta não é JSON válido', async () => {
    const brokenJsonFetcher: SnapshotFetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    })
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, { fetcher: brokenJsonFetcher })
    expect(result.outcome).toBe('invalid')
  })

  it('reporta incompatible-version para um major de esquema diferente do suportado', async () => {
    const payload = validSnapshotPayload()
    payload.metadata.schemaVersion = '2.0.0'
    const result = await loadSnapshotFromUrl('/dev-snapshots/ga4-2026-11-27.json', ga4SnapshotValidator, {
      fetcher: fetcherReturning(payload),
    })
    expect(result.outcome).toBe('incompatible-version')
  })
})
