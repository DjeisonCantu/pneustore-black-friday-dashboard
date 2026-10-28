// Testes do fetcher de fixtures fictícias do Clarity — Missão 04, Etapa C3.
//
// O Vitest roda em modo "test", onde `import.meta.env.DEV` é `true` (mesmo
// comportamento do `vite dev`) — por isso estes testes exercitam o caminho
// "de desenvolvimento" de verdade, sem precisar simular `import.meta.env`.

import { describe, expect, it } from 'vitest'
import { DEV_CLARITY_FIXTURE_FILES, devClarityFetcher, devClaritySnapshotUrl } from '../dev-fixtures'

describe('devClaritySnapshotUrl', () => {
  it('monta uma "URL" previsível para cada cenário', () => {
    expect(devClaritySnapshotUrl('ok')).toBe(`dev-fixtures/clarity/${DEV_CLARITY_FIXTURE_FILES.ok}.json`)
    expect(devClaritySnapshotUrl('partial')).toBe(`dev-fixtures/clarity/${DEV_CLARITY_FIXTURE_FILES.partial}.json`)
    expect(devClaritySnapshotUrl('invalid')).toBe(`dev-fixtures/clarity/${DEV_CLARITY_FIXTURE_FILES.invalid}.json`)
  })
})

describe('devClarityFetcher', () => {
  it('resolve o cenário "ok" para o JSON fictício válido', async () => {
    const response = await devClarityFetcher(devClaritySnapshotUrl('ok'))
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    const payload = (await response.json()) as { metadata: { status: string } }
    expect(payload.metadata.status).toBe('ok')
  })

  it('resolve o cenário "partial" para o JSON fictício com coleta parcial', async () => {
    const response = await devClarityFetcher(devClaritySnapshotUrl('partial'))
    const payload = (await response.json()) as { metadata: { status: string } }
    expect(payload.metadata.status).toBe('partial')
  })

  it('resolve o cenário "invalid" para o JSON fictício propositalmente inválido', async () => {
    const response = await devClarityFetcher(devClaritySnapshotUrl('invalid'))
    const payload = (await response.json()) as { metadata: { platform: string } }
    expect(payload.metadata.platform).toBe('app')
  })

  it('devolve 404 para uma "URL" desconhecida, sem lançar', async () => {
    const response = await devClarityFetcher('dev-fixtures/clarity/nao-existe.json')
    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('nunca faz uma chamada de rede real — resolve inteiramente em memória', async () => {
    const originalFetch = globalThis.fetch
    let fetchCalled = false
    globalThis.fetch = (() => {
      fetchCalled = true
      throw new Error('devClarityFetcher nunca deveria chamar fetch()')
    }) as typeof fetch

    try {
      await devClarityFetcher(devClaritySnapshotUrl('ok'))
      expect(fetchCalled).toBe(false)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
