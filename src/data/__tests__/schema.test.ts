// Testes de integridade dos contratos de snapshot (Missão 04 — Etapas B2 e C0).

import { describe, expect, it } from 'vitest'
import { isCompatibleSchemaVersion, isDeviceSegmented, SNAPSHOT_SCHEMA_VERSION, validateDailySnapshot } from '../providers/schema'

function validPayload() {
  return {
    metadata: {
      source: 'ga4',
      platform: 'site',
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      extractedAt: '2026-11-27T23:05:00-03:00',
      period: { from: '2026-11-27', to: '2026-11-27' },
      deviceScope: ['desktop', 'mobile', 'tablet'],
      status: 'ok',
      note: undefined as string | undefined,
    },
    records: [
      {
        date: '2026-11-27',
        isFuture: false,
        isPartial: true,
        sessions: { desktop: 100, mobile: 200, tablet: 10 },
        users: { desktop: 80, mobile: 150, tablet: 8 },
        orders: { desktop: 2, mobile: 3, tablet: 0 },
        revenue: { desktop: 200, mobile: 300, tablet: 0 },
      },
    ],
  }
}

describe('validateDailySnapshot — contrato de snapshot', () => {
  it('aceita um snapshot bem formado', () => {
    const result = validateDailySnapshot(validPayload())
    expect(result.success).toBe(true)
    expect(result.data?.records).toHaveLength(1)
  })

  it('rejeita platform "app" — separação site/app é estrutural (RA-04/INT-02)', () => {
    const payload = validPayload()
    payload.metadata.platform = 'app'
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
    expect(result.errors?.some((e) => e.includes('platform'))).toBe(true)
  })

  it('rejeita data em formato errado', () => {
    const payload = validPayload()
    payload.records[0].date = '27/11/2026'
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('rejeita extractedAt que não é uma data válida', () => {
    const payload = validPayload()
    payload.metadata.extractedAt = 'não é uma data'
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('rejeita métrica negativa', () => {
    const payload = validPayload()
    payload.records[0].sessions.desktop = -5
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('rejeita tipo errado (string em vez de número)', () => {
    const payload = validPayload() as Record<string, unknown>
    const records = payload.records as Array<Record<string, unknown>>
    ;(records[0].sessions as Record<string, unknown>).desktop = 'muitas'
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('rejeita campo obrigatório ausente (deviceScope)', () => {
    const payload = validPayload() as Record<string, unknown>
    const metadata = payload.metadata as Record<string, unknown>
    delete metadata.deviceScope
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('nunca lança exceção para entrada completamente inesperada', () => {
    expect(() => validateDailySnapshot(null)).not.toThrow()
    expect(() => validateDailySnapshot('string qualquer')).not.toThrow()
    expect(() => validateDailySnapshot(42)).not.toThrow()
    expect(validateDailySnapshot(undefined).success).toBe(false)
  })

  it('aceita o campo opcional "note" quando presente, e funciona sem ele', () => {
    const comNota = validPayload()
    comNota.metadata.note = 'coleta parcial por instabilidade simulada'
    expect(validateDailySnapshot(comNota).success).toBe(true)
    expect(validateDailySnapshot(validPayload()).success).toBe(true) // sem o campo
  })

  it('aceita e preserva o campo opcional "limitations" (Etapa C5.2) — antes era descartado em silêncio', () => {
    const payload = { ...validPayload(), metadata: { ...validPayload().metadata, limitations: ['receita aproximada, arredondada pela fonte'] } }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.metadata.limitations).toEqual(['receita aproximada, arredondada pela fonte'])
    expect(validateDailySnapshot(validPayload()).data?.metadata.limitations).toBeUndefined() // sem o campo
  })

  it('rejeita period.from depois de period.to (período semanticamente inválido)', () => {
    const payload = validPayload()
    payload.metadata.period = { from: '2026-11-28', to: '2026-11-27' }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(false)
  })

  it('descarta campos desconhecidos (nunca repassa dado fora do contrato, incl. possível PII)', () => {
    const payload = validPayload() as Record<string, unknown>
    const metadata = payload.metadata as Record<string, unknown>
    metadata.customerEmail = 'alguem@exemplo.com' // nunca deveria existir num snapshot real
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.metadata).not.toHaveProperty('customerEmail')
  })
})

describe('validateDailySnapshot — seções opcionais de origem de tráfego e catálogo (Etapa C4)', () => {
  it('aceita um snapshot sem as seções opcionais (compatibilidade com Etapas B2/C0)', () => {
    const result = validateDailySnapshot(validPayload())
    expect(result.success).toBe(true)
    expect(result.data?.acquisition).toBeUndefined()
    expect(result.data?.catalog).toBeUndefined()
  })

  it('aceita acquisition.channels bem formado, sem nenhuma taxa pré-calculada armazenada', () => {
    const payload = {
      ...validPayload(),
      acquisition: {
        channels: [{ channel: 'CPC', sourceMedium: 'google / cpc', sessions: 500, orders: 12, revenue: 2400 }],
      },
    }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.acquisition?.channels[0]).not.toHaveProperty('conversionRate')
    expect(result.data?.acquisition?.channels[0]).not.toHaveProperty('revenueShare')
  })

  it('sourceMedium é opcional em acquisition.channels', () => {
    const payload = {
      ...validPayload(),
      acquisition: { channels: [{ channel: 'Direct', sessions: 300, orders: 4, revenue: 600 }] },
    }
    expect(validateDailySnapshot(payload).success).toBe(true)
  })

  it('rejeita um canal com sessões negativas', () => {
    const payload = {
      ...validPayload(),
      acquisition: { channels: [{ channel: 'CPC', sessions: -1, orders: 0, revenue: 0 }] },
    }
    expect(validateDailySnapshot(payload).success).toBe(false)
  })

  it('aceita catalog com products/brands e categories: null (ranking de categoria ainda não disponível — Q-04)', () => {
    const payload = {
      ...validPayload(),
      catalog: {
        products: [
          { name: 'Pneu Aro 15', brand: 'Pirelli', isService: false, itemsViewed: 900, itemsAdded: 240, itemsPurchased: 60, itemRevenue: 18000 },
        ],
        brands: [{ brand: 'Pirelli', itemsViewed: 900, itemsAdded: 240, itemsPurchased: 60, itemRevenue: 18000 }],
        categories: null,
      },
    }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.catalog?.categories).toBeNull()
  })

  it('category em catalog.products é opcional — nunca inventa "Outros" quando ausente', () => {
    const payload = {
      ...validPayload(),
      catalog: {
        products: [{ name: 'Pneu Aro 15', brand: 'Pirelli', isService: false, itemsViewed: 10, itemsAdded: 2, itemsPurchased: 1, itemRevenue: 300 }],
        brands: [],
        categories: null,
      },
    }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.catalog?.products[0].category).toBeUndefined()
  })

  it('rejeita um produto com itemsPurchased negativo', () => {
    const payload = {
      ...validPayload(),
      catalog: {
        products: [{ name: 'X', brand: 'Y', isService: false, itemsViewed: 1, itemsAdded: 1, itemsPurchased: -1, itemRevenue: 0 }],
        brands: [],
        categories: null,
      },
    }
    expect(validateDailySnapshot(payload).success).toBe(false)
  })

  it('aceita categories preenchido com o mesmo formato de linha de produto (convenção de getCategoryRows)', () => {
    const payload = {
      ...validPayload(),
      catalog: {
        products: [],
        brands: [],
        categories: [{ name: 'Pneus', brand: '(todas as marcas)', isService: false, itemsViewed: 500, itemsAdded: 100, itemsPurchased: 40, itemRevenue: 9000 }],
      },
    }
    expect(validateDailySnapshot(payload).success).toBe(true)
  })
})

describe('validateDailySnapshot — métrica agregada sem dispositivo (Etapa C5.2)', () => {
  it('aceita um registro cujas métricas são só um total, sem segmentação por dispositivo', () => {
    const payload = {
      ...validPayload(),
      records: [
        {
          date: '2026-11-27',
          isFuture: false,
          isPartial: true,
          sessions: { total: 1000 },
          users: { total: 800 },
          orders: { total: 20 },
          revenue: { total: 5000 },
        },
      ],
    }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
  })

  it('aceita um snapshot com registros mistos — um segmentado, outro só com total', () => {
    const payload = {
      ...validPayload(),
      records: [
        ...validPayload().records,
        { date: '2026-11-26', isFuture: false, isPartial: true, sessions: { total: 50 }, users: { total: 40 }, orders: { total: 1 }, revenue: { total: 100 } },
      ],
    }
    expect(validateDailySnapshot(payload).success).toBe(true)
  })

  it('rejeita uma métrica que não é nem segmentada por dispositivo nem um total', () => {
    const payload = {
      ...validPayload(),
      records: [{ date: '2026-11-27', isFuture: false, isPartial: true, sessions: { foo: 1 }, users: { total: 1 }, orders: { total: 1 }, revenue: { total: 1 } }],
    }
    expect(validateDailySnapshot(payload).success).toBe(false)
  })

  it('rejeita um total negativo, igual já valia para desktop/mobile/tablet', () => {
    const payload = {
      ...validPayload(),
      records: [{ date: '2026-11-27', isFuture: false, isPartial: true, sessions: { total: -5 }, users: { total: 1 }, orders: { total: 1 }, revenue: { total: 1 } }],
    }
    expect(validateDailySnapshot(payload).success).toBe(false)
  })

  it('isDeviceSegmented distingue as duas formas corretamente', () => {
    expect(isDeviceSegmented({ desktop: 1, mobile: 2, tablet: 3 })).toBe(true)
    expect(isDeviceSegmented({ total: 100 })).toBe(false)
  })
})

describe('validateDailySnapshot — acquisition.channels sem sessões/pedidos (Etapa C5.2)', () => {
  it('aceita um canal só com receita, sem sessões nem pedidos', () => {
    const payload = {
      ...validPayload(),
      acquisition: { channels: [{ channel: 'CPC', revenue: 1000 }] },
    }
    const result = validateDailySnapshot(payload)
    expect(result.success).toBe(true)
    expect(result.data?.acquisition?.channels[0].sessions).toBeUndefined()
    expect(result.data?.acquisition?.channels[0].orders).toBeUndefined()
  })

  it('continua aceitando um canal completo (sessões, pedidos e receita), como antes', () => {
    const payload = {
      ...validPayload(),
      acquisition: { channels: [{ channel: 'CPC', sessions: 500, orders: 12, revenue: 2400 }] },
    }
    expect(validateDailySnapshot(payload).success).toBe(true)
  })

  it('continua exigindo revenue — o único campo que toda fonte já vista consegue fornecer', () => {
    const payload = {
      ...validPayload(),
      acquisition: { channels: [{ channel: 'CPC' }] },
    }
    expect(validateDailySnapshot(payload).success).toBe(false)
  })
})

describe('isCompatibleSchemaVersion', () => {
  it('aceita a própria versão suportada pela aplicação', () => {
    expect(isCompatibleSchemaVersion(SNAPSHOT_SCHEMA_VERSION)).toBe(true)
  })

  it('aceita uma versão com mesmo major (minor/patch podem evoluir sem quebrar)', () => {
    expect(isCompatibleSchemaVersion('1.4.2')).toBe(true)
  })

  it('rejeita um major diferente — formato pode ter mudado de forma incompatível', () => {
    expect(isCompatibleSchemaVersion('2.0.0')).toBe(false)
  })
})
