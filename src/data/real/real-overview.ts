// Visão real embutida — primeira extração manual do Looker Studio (Missão
// 04, Etapa C5.2). Gerado por `04-validacao/scripts/looker-pdf-cli.mjs` a
// partir de um PDF exportado do relatório real da PneuStore.
//
// Validado de novo em tempo de execução (nunca confiar cegamente num JSON
// embutido, mesmo sendo "nosso") — se o arquivo for editado à mão e ficar
// fora do contrato, `loadRealOverview()` devolve `null` em vez de mostrar
// dado inválido como se fosse real.
//
// Importante: isto é um TOTAL DO PERÍODO INTEIRO exibido no relatório,
// nunca segmentado por dia nem por dispositivo — nunca comparar com os
// cartões fictícios da Visão Geral (que são diários/por dispositivo), nem
// tratar como um "dia" isolado.

import { validateDailySnapshot } from '@/data/providers/schema'
import realSnapshotRaw from './ga4-real-snapshot.json'

export interface RealChannelRow {
  channel: string
  sourceMedium?: string
  revenue: number
}

export interface RealChannelShareRow {
  channel: string
  revenueSharePercent: number
  comparisonChangePercent: number
}

export interface RealBrandRow {
  brand: string
  itemsViewed: number
  itemsAdded: number
  itemsPurchased: number
  itemRevenue: number
}

export interface RealOverviewView {
  period: { from: string; to: string }
  extractedAt: string
  sessions: number | null
  users: number | null
  orders: number | null
  revenue: number | null
  channels: RealChannelRow[]
  /** Participação por canal já agregada pelo Looker (um canal, uma linha) — ver ChannelShareRowSchema. */
  channelShares: RealChannelShareRow[]
  brands: RealBrandRow[]
  limitations: string[]
  note?: string
}

/**
 * % que uma linha de `channels` representa da receita TOTAL do período
 * (`view.revenue`) — nunca da soma das linhas exibidas, que normalmente é
 * menor que o total (ex.: quando a tabela mostra só o top N). Devolve `null`
 * quando o total do período é desconhecido, em vez de dividir por algo que
 * não é o total de verdade.
 */
export function channelRevenueShare(channelRevenue: number, periodTotalRevenue: number | null): number | null {
  if (periodTotalRevenue === null || periodTotalRevenue <= 0) return null
  return (channelRevenue / periodTotalRevenue) * 100
}

function metricTotal(metric: unknown): number | null {
  if (metric && typeof metric === 'object' && 'total' in metric) {
    return (metric as { total: number }).total
  }
  return null
}

/** `null` quando o snapshot embutido não valida mais contra o contrato — nunca mostrar dado inválido como real. */
export function loadRealOverview(): RealOverviewView | null {
  const result = validateDailySnapshot(realSnapshotRaw)
  if (!result.success || !result.data) return null

  const snapshot = result.data
  const record = snapshot.records[0] ?? null

  return {
    period: snapshot.metadata.period,
    extractedAt: snapshot.metadata.extractedAt,
    sessions: record ? metricTotal(record.sessions) : null,
    users: record ? metricTotal(record.users) : null,
    orders: record ? metricTotal(record.orders) : null,
    revenue: record ? metricTotal(record.revenue) : null,
    channels: snapshot.acquisition?.channels ?? [],
    channelShares: snapshot.acquisition?.channelShares ?? [],
    brands: snapshot.catalog?.brands ?? [],
    limitations: snapshot.metadata.limitations ?? [],
    note: snapshot.metadata.note,
  }
}
