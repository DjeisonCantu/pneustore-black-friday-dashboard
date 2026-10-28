// Implementação de referência da interface DataProvider (ver types.ts),
// usando a camada fictícia já existente. É o provedor PADRÃO da aplicação
// (Missão 04 — Etapa B1): src/data/selectors.ts e os view-models o consomem
// via getActiveProvider() em vez de importar src/data/mock/* por nome.

import { BLACK_FRIDAY_DATE, DATASET_START, getDailySeries, MOCK_TODAY } from '@/data/mock/daily-series'
import { getHourlySeries } from '@/data/mock/hourly'
import { CHANNELS, getChannelBreakdown } from '@/data/mock/channels'
import { getBrandRows, getProductRows } from '@/data/mock/products'
import { getClaritySignalsPlaceholder, getJourneyStages } from '@/data/mock/journey'
import type { DataProvider } from './types'

// Mesma âncora de "hoje" que data/selectors.ts usava antes da migração —
// meia-noite do dia da Black fictícia, para alinhar com isFuture/isPartial
// calculados em mock/daily-series.ts.
const MOCK_TODAY_MIDNIGHT = new Date(`${BLACK_FRIDAY_DATE}T00:00:00-03:00`)

export const mockDataProvider: DataProvider = {
  id: 'mock',
  label: 'Dados fictícios (Missão 02)',
  platform: 'site',

  today: () => MOCK_TODAY_MIDNIGHT,
  datasetBounds: () => ({ from: DATASET_START, to: MOCK_TODAY_MIDNIGHT }),

  getDailySeries,
  getHourlySeries,

  getChannelBreakdown,
  listChannels: () => CHANNELS,

  getProductRows,
  getBrandRows,
  // Categoria não é um dado fictício à parte nesta missão — permanece em
  // validação (Q-04), por isso o provedor mock também retorna null aqui,
  // igual a como um provedor real se comportaria antes da confirmação.
  getCategoryRows: () => null,

  getJourneyStages,
  // Idem: o provedor mock expõe o placeholder apenas para ilustrar o layout
  // (RF-09); um provedor real retornaria null até D-12/Q-10 serem resolvidas.
  getClaritySignals: () => getClaritySignalsPlaceholder(),

  sourceMeta: [
    { source: 'ga4', label: 'GA4 (fictício)', lastUpdated: MOCK_TODAY, unavailableSince: null },
    { source: 'clarity', label: 'Clarity (fictício)', lastUpdated: MOCK_TODAY, unavailableSince: null },
  ],
  isUnavailable: () => false,
}
