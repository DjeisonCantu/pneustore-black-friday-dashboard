// Testes de integridade do contrato de snapshot do Clarity (Missão 04 — Etapa C2).

import { describe, expect, it } from 'vitest'
import { CLARITY_SCHEMA_VERSION, isCompatibleClaritySchemaVersion, validateClaritySnapshot } from '../contract'

function validPayload() {
  return {
    metadata: {
      source: 'clarity',
      project: 'PneuStore (www.pneustore.com.br)',
      platform: 'site',
      schemaVersion: CLARITY_SCHEMA_VERSION,
      extractedAt: '2026-11-27T23:10:00-03:00',
      period: { from: '2026-11-25', to: '2026-11-27' },
      deviceScope: ['desktop', 'mobile'],
      status: 'ok',
      limitations: ['Janela histórica limitada a 1–3 dias na Data Export API pública.'],
      note: undefined as string | undefined,
    },
    pages: [
      {
        page: '/checkout/v2/cart',
        device: 'desktop',
        sessions: 420,
        deadClicks: { absolute: 380 },
        rageClicks: { absolute: 9 },
        quickBacks: { absolute: 60 },
      },
    ],
  }
}

describe('validateClaritySnapshot — contrato', () => {
  it('aceita um snapshot bem formado', () => {
    const result = validateClaritySnapshot(validPayload())
    expect(result.success).toBe(true)
    expect(result.data?.pages).toHaveLength(1)
  })

  it('aceita uma página sem "sessions" (denominador desconhecido é permitido, nunca inventado)', () => {
    const payload = validPayload()
    delete (payload.pages[0] as Record<string, unknown>).sessions
    expect(validateClaritySnapshot(payload).success).toBe(true)
  })

  it('rejeita platform "app" — separação site/app é estrutural, igual ao contrato do GA4', () => {
    const payload = validPayload()
    payload.metadata.platform = 'app'
    const result = validateClaritySnapshot(payload)
    expect(result.success).toBe(false)
    expect(result.errors?.some((e) => e.includes('platform'))).toBe(true)
  })

  it('rejeita dispositivo fora do enum conhecido', () => {
    const payload = validPayload() as Record<string, unknown>
    const pages = payload.pages as Array<Record<string, unknown>>
    pages[0].device = 'smarttv'
    expect(validateClaritySnapshot(payload).success).toBe(false)
  })

  it('rejeita métrica negativa', () => {
    const payload = validPayload()
    payload.pages[0].deadClicks.absolute = -1
    expect(validateClaritySnapshot(payload).success).toBe(false)
  })

  it('rejeita period.from depois de period.to', () => {
    const payload = validPayload()
    payload.metadata.period = { from: '2026-11-28', to: '2026-11-27' }
    expect(validateClaritySnapshot(payload).success).toBe(false)
  })

  it('descarta campos desconhecidos (nunca repassa dado fora do contrato)', () => {
    const payload = validPayload() as Record<string, unknown>
    const metadata = payload.metadata as Record<string, unknown>
    metadata.sessionRecordingUrl = 'https://clarity.microsoft.com/player/abc' // nunca deveria existir aqui
    const result = validateClaritySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.metadata).not.toHaveProperty('sessionRecordingUrl')
  })

  it('nunca lança para entrada inesperada', () => {
    expect(() => validateClaritySnapshot(null)).not.toThrow()
    expect(() => validateClaritySnapshot(42)).not.toThrow()
    expect(validateClaritySnapshot(undefined).success).toBe(false)
  })
})

describe('isCompatibleClaritySchemaVersion', () => {
  it('aceita a própria versão e qualquer minor/patch do mesmo major', () => {
    expect(isCompatibleClaritySchemaVersion(CLARITY_SCHEMA_VERSION)).toBe(true)
    expect(isCompatibleClaritySchemaVersion('1.9.9')).toBe(true)
  })

  it('rejeita um major diferente', () => {
    expect(isCompatibleClaritySchemaVersion('2.0.0')).toBe(false)
  })
})
