// Contrato de "provedor de dados" — proposta da Missão 03 (descoberta técnica).
//
// Hoje, src/data/selectors.ts e src/data/view-models/*.ts importam as funções
// de src/data/mock/* diretamente. Este arquivo define a INTERFACE que tanto o
// provedor fictício atual quanto um futuro provedor real (snapshots GA4 +
// Clarity, Missão 04) deveriam implementar, para que seletores e view-models
// passem a depender de uma abstração — não da camada mock por nome.
//
// Histórico: proposto na Missão 03 (descoberta técnica) como preparação, sem
// nada conectado. Na Missão 04 — Etapa B1, src/data/selectors.ts e os
// view-models passaram a consumir esta interface de fato (ver
// 04-validacao/05-mapeamento-frontend.md para o relato da migração).

import type { BrandRow, ProductRow } from '@/data/mock/products'
import type { Channel, ChannelRow } from '@/data/mock/channels'
import type { DailyRecord } from '@/data/mock/daily-series'
import type { HourlyPoint } from '@/data/mock/hourly'
import type { ClaritySignalRow, JourneyStage } from '@/data/mock/journey'
import type { DateRange, DeviceFilter, SourceMeta } from '@/types/common'

/**
 * Metadados de proveniência — todo provedor deve informar quando e de qual
 * fonte seus dados vieram, para alimentar RF-17 ("última atualização") e os
 * estados "fonte indisponível" (INT-06).
 */
export interface ProviderStatus {
  sourceMeta: SourceMeta[]
  /** true quando o provedor não conseguiu entregar dados frescos desta fonte. */
  isUnavailable(source: SourceMeta['source']): boolean
}

/**
 * "Hoje" e limites de data são decisão do PROVEDOR, não da aplicação: o
 * provedor mock usa uma data fictícia fixa (a própria Black Friday) para que
 * os presets de período e as comparações anuais sejam demonstráveis a
 * qualquer momento; um provedor real usaria a data corrente de verdade e os
 * limites do que já foi coletado. Os seletores (src/data/selectors.ts) nunca
 * devem presumir isso sozinhos.
 */
export interface CalendarPort {
  today(): Date
  /** Intervalo de datas com dado potencialmente disponível (para limitar o seletor de período personalizado). */
  datasetBounds(): DateRange
}

/** Série diária agregada por dispositivo — base de IND-01, IND-02, IND-03. */
export interface DailyMetricsPort {
  getDailySeries(): DailyRecord[]
  getHourlySeries(dateIso: string, device: DeviceFilter): HourlyPoint[]
}

/** Origem do tráfego — base de IND-07. */
export interface AcquisitionPort {
  getChannelBreakdown(range: DateRange, device: DeviceFilter, comparisonRange: DateRange | null): ChannelRow[]
  listChannels(): readonly Channel[]
}

/** Produtos, marcas e (quando disponível) categorias — base de IND-08. */
export interface CatalogPort {
  getProductRows(range: DateRange, device: DeviceFilter): ProductRow[]
  getBrandRows(range: DateRange, device: DeviceFilter): BrandRow[]
  /**
   * Categoria depende de confirmação de item_category no stream web (Q-04).
   * Um provedor real deve retornar `null` (não um array vazio) enquanto a
   * dimensão não estiver disponível, para que a UI mostre o estado de
   * validação em vez de "sem dados" (ver ValidationState).
   */
  getCategoryRows(range: DateRange, device: DeviceFilter): ProductRow[] | null
}

/**
 * Jornada de compra — volumes por etapa (IND-05) e sinais do Clarity (apoio).
 * Deliberadamente NÃO inclui abandono/funil: enquanto D-05 não for aprovada,
 * nenhum provedor (mock ou real) deve calcular essa métrica (RA-02/RA-03).
 */
export interface JourneyPort {
  getJourneyStages(range: DateRange, device: DeviceFilter): JourneyStage[]
  /** Retorna `null` quando a integração com o Clarity não estiver configurada (D-12/Q-10). */
  getClaritySignals(): ClaritySignalRow[] | null
}

export type DataProviderId = 'mock' | 'ga4-clarity-snapshot' | 'test'

export interface DataProvider
  extends DailyMetricsPort,
    AcquisitionPort,
    CatalogPort,
    JourneyPort,
    ProviderStatus,
    CalendarPort {
  readonly id: DataProviderId
  readonly label: string
  /**
   * Sempre `'site'` nesta aplicação (RA-04/INT-02): o dashboard nunca lê dados
   * do aplicativo PneuStore. Um provedor real deve recusar/"falhar seguro"
   * em vez de aceitar um snapshot marcado como `'app'` — ver schema.ts.
   */
  readonly platform: 'site'
}
