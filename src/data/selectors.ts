// Seletores que aplicam os filtros globais (período, dispositivo, comparação)
// sobre os dados do provedor ativo (src/data/providers). Nenhum cálculo aqui
// soma unidades diferentes (RA-01) nem deriva funil sequencial (RA-02/RA-03).
//
// Migração (Missão 04 — Etapa B1): antes, este arquivo buscava a série diária
// diretamente de src/data/mock/daily-series. Agora ele busca via
// getActiveProvider() — o mock continua sendo a fonte por padrão
// (src/data/providers/index.ts), mas a troca para um provedor real não exige
// alterar nenhuma função abaixo. A matemática de agregação pura foi extraída
// para src/data/aggregate-core.ts (ver o comentário lá sobre por quê).

import { getActiveProvider } from './providers'
import { aggregateDailyRecords, filterRecordsInRange, type AggregateResult } from './aggregate-core'
import { sumDevices } from './mock/device-sum'
import type { ComparisonMode, DateRange, DeviceFilter, Filters, PeriodPreset, Variation } from '@/types/common'

export type { AggregateResult } from './aggregate-core'

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

export function resolvePeriodRange(filters: Pick<Filters, 'period' | 'customRange'>): DateRange {
  const today = getActiveProvider().today()

  switch (filters.period) {
    case 'hoje':
      return { from: today, to: today }
    case 'ontem':
      return { from: addDays(today, -1), to: addDays(today, -1) }
    case '7dias':
      return { from: addDays(today, -6), to: today }
    case 'semana-black':
      // Semana da Black Friday, 24/11 a 01/12 (decisão recomendada em D-10).
      return { from: new Date('2026-11-24T00:00:00-03:00'), to: new Date('2026-12-01T00:00:00-03:00') }
    case 'personalizado':
      return filters.customRange ?? { from: addDays(today, -6), to: today }
  }
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  '7dias': 'Últimos 7 dias',
  'semana-black': 'Semana da Black (24/11–01/12)',
  personalizado: 'Personalizado',
}

export function periodLabel(period: PeriodPreset): string {
  return PERIOD_LABELS[period]
}

/** Alinhamento anual por dia da semana (D-07): desloca exatamente 364 dias (52 semanas). */
const YEAR_OVER_YEAR_OFFSET_DAYS = 364

export function resolveComparisonRange(filters: Filters): DateRange | null {
  const current = resolvePeriodRange(filters)
  if (filters.comparison === 'nenhum') return null

  if (filters.comparison === 'mesmo-periodo-2025') {
    return {
      from: addDays(current.from, -YEAR_OVER_YEAR_OFFSET_DAYS),
      to: addDays(current.to, -YEAR_OVER_YEAR_OFFSET_DAYS),
    }
  }

  // periodo-anterior: mesmo número de dias, imediatamente anterior.
  const lengthDays = Math.round((current.to.getTime() - current.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return {
    from: addDays(current.from, -lengthDays),
    to: addDays(current.from, -1),
  }
}

export function comparisonLabel(mode: ComparisonMode): string {
  switch (mode) {
    case 'nenhum':
      return 'Nenhum'
    case 'periodo-anterior':
      return 'Período anterior'
    case 'mesmo-periodo-2025':
      return 'Mesmo período 2025'
  }
}

export function aggregate(range: DateRange, device: DeviceFilter): AggregateResult {
  return aggregateDailyRecords(getActiveProvider().getDailySeries(), range, device)
}

/** Limite de variação relevante (D-08): ±15% no MVP, por indicador. */
export const RELEVANT_VARIATION_THRESHOLD = 15

export function computeVariation(current: number, previous: number | null): Variation | null {
  if (previous === null) return null
  const deltaAbsolute = current - previous
  const deltaPercent = previous !== 0 ? (deltaAbsolute / previous) * 100 : 0
  const direction = deltaPercent > 0.05 ? 'alta' : deltaPercent < -0.05 ? 'baixa' : 'estavel'
  return {
    deltaAbsolute,
    deltaPercent,
    isRelevant: Math.abs(deltaPercent) >= RELEVANT_VARIATION_THRESHOLD,
    direction,
  }
}

export interface TimeSeriesPoint {
  key: string
  label: string
  sessions: number
  orders: number
  revenue: number
  conversionRate: number
  comparisonSessions?: number
  comparisonOrders?: number
  comparisonRevenue?: number
  comparisonConversionRate?: number
  isFuture: boolean
}

export function buildDailyTimeSeries(range: DateRange, device: DeviceFilter, comparisonRange: DateRange | null): TimeSeriesPoint[] {
  const allRecords = getActiveProvider().getDailySeries()
  const records = filterRecordsInRange(allRecords, range)
  const comparisonRecords = comparisonRange ? filterRecordsInRange(allRecords, comparisonRange) : []

  return records.map((r, index) => {
    const sessions = sumDevices(r.sessions, device)
    const orders = sumDevices(r.orders, device)
    const revenue = sumDevices(r.revenue, device)
    const comparison = comparisonRecords[index]
    const comparisonSessions = comparison ? sumDevices(comparison.sessions, device) : undefined
    const comparisonOrders = comparison ? sumDevices(comparison.orders, device) : undefined
    const comparisonRevenue = comparison ? sumDevices(comparison.revenue, device) : undefined

    const date = new Date(`${r.date}T00:00:00-03:00`)
    return {
      key: r.date,
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      sessions,
      orders,
      revenue,
      conversionRate: sessions > 0 ? (orders / sessions) * 100 : 0,
      comparisonSessions,
      comparisonOrders,
      comparisonRevenue,
      comparisonConversionRate:
        comparisonSessions !== undefined && comparisonSessions > 0 && comparisonOrders !== undefined
          ? (comparisonOrders / comparisonSessions) * 100
          : undefined,
      isFuture: r.isFuture,
    }
  })
}

export function isSingleDay(range: DateRange): boolean {
  return range.from.toISOString().slice(0, 10) === range.to.toISOString().slice(0, 10)
}

export const DATASET_BOUNDS = getActiveProvider().datasetBounds()
