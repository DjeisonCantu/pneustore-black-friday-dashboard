// Origem do tráfego fictícia (IND-07). Os nomes dos agrupamentos refletem o
// vocabulário usado hoje no Looker (CPC, Organic, Direct, Outros, CRM,
// Criteo — ver Q-08), mas os valores são inteiramente fictícios.

import { createRng, rangeNoise } from './seed'
import type { DateRange, DeviceFilter } from '@/types/common'
import { aggregateDailyRecords } from '../aggregate-core'
import { getDailySeries } from './daily-series'

// Nota de arquitetura (Missão 04 — Etapa B1): este módulo usa a série diária
// e a agregação direto da própria camada mock, não via DataProvider — ele É
// parte da implementação do provedor mock. Usar o provider aqui criaria um
// ciclo (selectors.ts → providers → mock-provider.ts → este arquivo →
// selectors.ts). Ver src/data/aggregate-core.ts para o detalhe.
function aggregate(range: DateRange, device: DeviceFilter) {
  return aggregateDailyRecords(getDailySeries(), range, device)
}

export const CHANNELS = ['CPC', 'Organic', 'Direct', 'Outros', 'CRM', 'Criteo'] as const
export type Channel = (typeof CHANNELS)[number]

const BASE_WEIGHTS: Record<Channel, number> = {
  CPC: 0.39,
  Organic: 0.3,
  Direct: 0.17,
  Outros: 0.08,
  CRM: 0.045,
  Criteo: 0.015,
}

function weightedSplit(key: string, total: number): Record<Channel, number> {
  const rng = createRng(key)
  const raw = CHANNELS.map((c) => Math.max(0.001, BASE_WEIGHTS[c] * rangeNoise(rng, 0.85, 1.15)))
  const sum = raw.reduce((a, b) => a + b, 0)
  const result = {} as Record<Channel, number>
  CHANNELS.forEach((c, i) => {
    result[c] = (raw[i] / sum) * total
  })
  return result
}

export interface ChannelRow {
  channel: Channel
  sessions: number
  orders: number
  revenue: number
  conversionRate: number
  revenueShare: number
  comparisonRevenue?: number
  comparisonRevenueShare?: number
}

export function getChannelBreakdown(
  range: DateRange,
  device: DeviceFilter,
  comparisonRange: DateRange | null,
): ChannelRow[] {
  const totals = aggregate(range, device)
  const keyBase = `${range.from.toISOString()}:${range.to.toISOString()}:${device}`

  const sessionsSplit = weightedSplit(`${keyBase}:sessions`, totals.sessions)
  const ordersSplit = weightedSplit(`${keyBase}:orders`, totals.orders)
  const revenueSplit = weightedSplit(`${keyBase}:revenue`, totals.revenue)

  let comparisonRevenueSplit: Record<Channel, number> | null = null
  if (comparisonRange) {
    const comparisonTotals = aggregate(comparisonRange, device)
    comparisonRevenueSplit = weightedSplit(
      `${comparisonRange.from.toISOString()}:${comparisonRange.to.toISOString()}:${device}:revenue`,
      comparisonTotals.revenue,
    )
  }

  return CHANNELS.map((channel) => ({
    channel,
    sessions: Math.round(sessionsSplit[channel]),
    orders: Math.round(ordersSplit[channel]),
    revenue: Math.round(revenueSplit[channel] * 100) / 100,
    conversionRate: sessionsSplit[channel] > 0 ? (ordersSplit[channel] / sessionsSplit[channel]) * 100 : 0,
    revenueShare: totals.revenue > 0 ? (revenueSplit[channel] / totals.revenue) * 100 : 0,
    comparisonRevenue: comparisonRevenueSplit ? Math.round(comparisonRevenueSplit[channel] * 100) / 100 : undefined,
    comparisonRevenueShare:
      comparisonRevenueSplit && comparisonRange
        ? (comparisonRevenueSplit[channel] / Math.max(1, aggregate(comparisonRange, device).revenue)) * 100
        : undefined,
  })).sort((a, b) => b.revenue - a.revenue)
}
