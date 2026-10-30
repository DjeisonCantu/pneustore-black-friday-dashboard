// Testes do fetcher do snapshot REAL do Clarity embutido em produção —
// atualização de 30/10/2026. Testa o fetcher isoladamente (em vez de passar
// pelo hook useClarityJourneySignals) porque `import.meta.env.DEV` é uma
// constante de build fixa como `true` sob Vitest — o ramo de produção do
// hook não é alcançável a partir de um teste comum; o fetcher, porém, não
// depende de DEV e pode ser verificado diretamente.

import { describe, expect, it } from 'vitest'
import { validateClaritySnapshot } from '@/data/clarity/contract'
import { CHECKOUT_PAGES } from '@/data/clarity/checkout-pages'
import { REAL_CLARITY_SNAPSHOT_URL, realClarityFetcher } from '../clarity-real-fetcher'

describe('realClarityFetcher', () => {
  it('devolve 404 para qualquer URL que não seja a do snapshot real', async () => {
    const response = await realClarityFetcher('outra-url.json')
    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('devolve o snapshot real embutido para a URL correta', async () => {
    const response = await realClarityFetcher(REAL_CLARITY_SNAPSHOT_URL)
    expect(response.ok).toBe(true)
    const payload = await response.json()
    expect(payload).toMatchObject({ metadata: { source: 'clarity', status: 'partial' } })
  })

  it('o payload devolvido é válido contra o contrato do Clarity', async () => {
    const response = await realClarityFetcher(REAL_CLARITY_SNAPSHOT_URL)
    const payload = await response.json()
    const result = validateClaritySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it('usa só as 6 páginas validadas de checkout-pages.ts — nenhuma a mais, nenhuma a menos', async () => {
    const response = await realClarityFetcher(REAL_CLARITY_SNAPSHOT_URL)
    const payload = (await response.json()) as { pages: Array<{ page: string }> }
    const expectedPaths = CHECKOUT_PAGES.map((p) => p.path).sort()
    const actualPaths = payload.pages.map((p) => p.page).sort()
    expect(actualPaths).toEqual(expectedPaths)
  })

  it('todas as linhas são agregadas (device "all") — nunca inventa uma divisão por dispositivo', async () => {
    const response = await realClarityFetcher(REAL_CLARITY_SNAPSHOT_URL)
    const payload = (await response.json()) as { pages: Array<{ device: string; sessions?: number }> }
    expect(payload.pages.every((p) => p.device === 'all')).toBe(true)
    expect(payload.pages.every((p) => p.sessions === undefined)).toBe(true)
  })

  it('as sessões do site por dispositivo aparecem só em metadata, nunca em uma linha de página', async () => {
    const response = await realClarityFetcher(REAL_CLARITY_SNAPSHOT_URL)
    const payload = (await response.json()) as { metadata: { note?: string } }
    expect(payload.metadata.note).toContain('110.378')
  })
})
