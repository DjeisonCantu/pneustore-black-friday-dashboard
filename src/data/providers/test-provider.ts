// Provedor de teste — Missão 04, Etapa B2.
//
// Implementa DataProvider com dados fixos e minúsculos (não usa a camada
// mock de demonstração), para que os testes automatizados de
// selectors/view-models sejam rápidos, isolados e cubram os cenários de
// falha explicitamente pedidos: fonte indisponível, snapshot inválido, dados
// ausentes e dados desatualizados. Não é usado pela aplicação em tempo de
// execução — só por testes (ver src/data/__tests__).

import { validateDailySnapshot, type SnapshotMetadata } from './schema'
import type { DataProvider, DataProviderId } from './types'
import type { DailyRecord } from '@/data/mock/daily-series'
import type { ClaritySignalRow, JourneyStage } from '@/data/mock/journey'
import type { ChannelRow } from '@/data/mock/channels'
import type { BrandRow, ProductRow } from '@/data/mock/products'
import type { DateRange, SourceMeta } from '@/types/common'

export const TEST_TODAY = new Date('2026-11-27T00:00:00-03:00')
const FIXTURE_START = new Date('2026-11-25T00:00:00-03:00')

const metric = (v: number) => ({ desktop: v, mobile: v * 1.6, tablet: v * 0.15 })

/** Fixture pequena e determinística — independente da camada mock de demonstração. */
export const FIXTURE_RECORDS: DailyRecord[] = [
  { date: '2026-11-25', isFuture: false, isPartial: false, sessions: metric(1000), users: metric(800), orders: metric(20), revenue: metric(2000) },
  { date: '2026-11-26', isFuture: false, isPartial: false, sessions: metric(1200), users: metric(950), orders: metric(25), revenue: metric(2500) },
  { date: '2026-11-27', isFuture: false, isPartial: true, sessions: metric(900), users: metric(700), orders: metric(18), revenue: metric(1800) },
  { date: '2026-11-28', isFuture: true, isPartial: false, sessions: metric(0), users: metric(0), orders: metric(0), revenue: metric(0) },
]

export type FailureScenario = 'ok' | 'fonte-indisponivel' | 'snapshot-invalido' | 'dados-ausentes' | 'dados-desatualizados'

function emptyPort() {
  return {
    getDailySeries: (): DailyRecord[] => [],
    getHourlySeries: () => [],
    getChannelBreakdown: (): ChannelRow[] => [],
    listChannels: () => [] as const,
    getProductRows: (): ProductRow[] => [],
    getBrandRows: (): BrandRow[] => [],
    getCategoryRows: (): ProductRow[] | null => null,
    getJourneyStages: (): JourneyStage[] => [],
    getClaritySignals: (): ClaritySignalRow[] | null => null,
  }
}

/**
 * Cenário "snapshot inválido": simula um payload malformado recebido de uma
 * fonte real, valida com o contrato Zod (schema.ts) e, como esperado, a
 * validação falha — o provedor então se comporta como "sem dados", nunca
 * repassando o payload inválido adiante. O resultado da validação fica
 * disponível em `lastValidation` para o teste inspecionar.
 */
function buildInvalidSnapshotPayload(): unknown {
  return {
    metadata: {
      source: 'ga4',
      platform: 'site',
      schemaVersion: '1.0.0',
      extractedAt: 'não-é-uma-data',
      period: { from: '2026-11-27', to: '2026-11-27' },
      deviceScope: ['desktop'],
      status: 'ok',
    },
    records: [
      // sessions.desktop como string — deve falhar a validação.
      { date: '2026-11-27', isFuture: false, isPartial: false, sessions: { desktop: 'muitas', mobile: 0, tablet: 0 }, users: metric(0), orders: metric(0), revenue: metric(0) },
    ],
  }
}

export function createTestProvider(scenario: FailureScenario): DataProvider & { lastValidationErrors?: string[] } {
  const id: DataProviderId = 'test'
  const label = `Provedor de teste (${scenario})`

  const baseSourceMeta = (unavailableSince: Date | null, lastUpdated: Date | null): SourceMeta[] => [
    { source: 'ga4', label: 'GA4 (teste)', lastUpdated, unavailableSince },
    { source: 'clarity', label: 'Clarity (teste)', lastUpdated, unavailableSince },
  ]

  switch (scenario) {
    case 'ok':
      return {
        id,
        label,
        platform: 'site',
        today: () => TEST_TODAY,
        datasetBounds: (): DateRange => ({ from: FIXTURE_START, to: TEST_TODAY }),
        getDailySeries: () => FIXTURE_RECORDS,
        getHourlySeries: () => [],
        getChannelBreakdown: () => [],
        listChannels: () => [] as const,
        getProductRows: () => [],
        getBrandRows: () => [],
        getCategoryRows: () => null,
        getJourneyStages: () => [],
        getClaritySignals: () => [],
        sourceMeta: baseSourceMeta(null, TEST_TODAY),
        isUnavailable: () => false,
      }

    case 'fonte-indisponivel':
      return {
        id,
        label,
        platform: 'site',
        today: () => TEST_TODAY,
        datasetBounds: () => ({ from: TEST_TODAY, to: TEST_TODAY }),
        ...emptyPort(),
        sourceMeta: baseSourceMeta(TEST_TODAY, null),
        // A fonte está fora do ar: toda consulta deve ser tratada como indisponível,
        // nunca como "zero dados reais" (RF-17 — nunca mostrar como se fosse atual).
        isUnavailable: () => true,
      }

    case 'dados-ausentes':
      return {
        id,
        label,
        platform: 'site',
        today: () => TEST_TODAY,
        datasetBounds: () => ({ from: TEST_TODAY, to: TEST_TODAY }),
        ...emptyPort(),
        // Diferente de "fonte indisponível": a fonte respondeu normalmente,
        // só não havia dado para o período/filtro pedido (EmptyState, não UnavailableState).
        sourceMeta: baseSourceMeta(null, TEST_TODAY),
        isUnavailable: () => false,
      }

    case 'dados-desatualizados': {
      const staleSince = new Date(TEST_TODAY.getTime() - 1000 * 60 * 60 * 24 * 3) // 3 dias atrás
      return {
        id,
        label,
        platform: 'site',
        today: () => TEST_TODAY,
        datasetBounds: () => ({ from: FIXTURE_START, to: TEST_TODAY }),
        getDailySeries: () => FIXTURE_RECORDS,
        getHourlySeries: () => [],
        getChannelBreakdown: () => [],
        listChannels: () => [] as const,
        getProductRows: () => [],
        getBrandRows: () => [],
        getCategoryRows: () => null,
        getJourneyStages: () => [],
        getClaritySignals: () => [],
        sourceMeta: baseSourceMeta(null, staleSince),
        // Última atualização muito antiga em relação a "hoje": tratado como
        // indisponível para exibição, mesmo que haja dado em cache (RF-17).
        isUnavailable: () => true,
      }
    }

    case 'snapshot-invalido': {
      const validation = validateDailySnapshot(buildInvalidSnapshotPayload())
      return {
        id,
        label,
        platform: 'site',
        today: () => TEST_TODAY,
        datasetBounds: () => ({ from: TEST_TODAY, to: TEST_TODAY }),
        ...emptyPort(),
        sourceMeta: baseSourceMeta(TEST_TODAY, null),
        isUnavailable: () => true,
        lastValidationErrors: validation.errors,
      }
    }
  }
}

export type { SnapshotMetadata }
