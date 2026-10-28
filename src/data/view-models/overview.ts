import {
  aggregate,
  buildDailyTimeSeries,
  computeVariation,
  isSingleDay,
  resolveComparisonRange,
  resolvePeriodRange,
  type TimeSeriesPoint,
} from '@/data/selectors'
import { getActiveProvider } from '@/data/providers'
import { formatCurrencyCompactBRL, formatPercent } from '@/lib/format'
import type { DeviceSegment, Filters, Variation } from '@/types/common'

export interface NamedVariation {
  key: string
  label: string
  variation: Variation | null
  format?: (value: number) => string
}

export interface DeviceSummaryRow {
  device: DeviceSegment
  sessions: number
  orders: number
  conversionRate: number
}

export interface OverviewViewModel {
  range: ReturnType<typeof resolvePeriodRange>
  comparisonRange: ReturnType<typeof resolveComparisonRange>
  current: ReturnType<typeof aggregate>
  previous: ReturnType<typeof aggregate> | null
  variations: {
    sessions: Variation | null
    users: Variation | null
    conversionRate: Variation | null
    orders: Variation | null
    revenue: Variation | null
    averageTicket: Variation | null
  }
  relevantVariations: NamedVariation[]
  timeSeries: TimeSeriesPoint[]
  isHourly: boolean
  deviceSummary: DeviceSummaryRow[]
}

const DEVICE_SEGMENTS: DeviceSegment[] = ['desktop', 'mobile', 'tablet']

export function buildOverviewViewModel(filters: Filters): OverviewViewModel {
  const range = resolvePeriodRange(filters)
  const comparisonRange = resolveComparisonRange(filters)
  const current = aggregate(range, filters.device)
  const previous = comparisonRange ? aggregate(comparisonRange, filters.device) : null

  const variations = {
    sessions: computeVariation(current.sessions, previous?.sessions ?? null),
    users: computeVariation(current.users, previous?.users ?? null),
    conversionRate: computeVariation(current.conversionRate, previous?.conversionRate ?? null),
    orders: computeVariation(current.orders, previous?.orders ?? null),
    revenue: computeVariation(current.revenue, previous?.revenue ?? null),
    averageTicket: computeVariation(current.averageTicket, previous?.averageTicket ?? null),
  }

  const named: NamedVariation[] = [
    { key: 'sessions', label: 'Sessões', variation: variations.sessions },
    { key: 'users', label: 'Usuários', variation: variations.users },
    { key: 'conversionRate', label: 'Taxa de conversão', variation: variations.conversionRate, format: formatPercent },
    { key: 'orders', label: 'Pedidos', variation: variations.orders },
    { key: 'revenue', label: 'Receita', variation: variations.revenue, format: formatCurrencyCompactBRL },
    { key: 'averageTicket', label: 'Ticket médio', variation: variations.averageTicket, format: formatCurrencyCompactBRL },
  ]

  const isHourly = isSingleDay(range)
  const timeSeries = isHourly
    ? getActiveProvider().getHourlySeries(range.from.toISOString().slice(0, 10), filters.device).map((point) => ({
        key: String(point.hour),
        label: `${String(point.hour).padStart(2, '0')}h`,
        sessions: point.sessions,
        orders: point.orders,
        revenue: point.revenue,
        conversionRate: point.sessions > 0 ? (point.orders / point.sessions) * 100 : 0,
        isFuture: false,
      }))
    : buildDailyTimeSeries(range, filters.device, comparisonRange)

  const deviceSummary: DeviceSummaryRow[] = DEVICE_SEGMENTS.map((device) => {
    const result = aggregate(range, device)
    return {
      device,
      sessions: result.sessions,
      orders: result.orders,
      conversionRate: result.conversionRate,
    }
  })

  return {
    range,
    comparisonRange,
    current,
    previous,
    variations,
    relevantVariations: named.filter((n) => n.variation?.isRelevant),
    timeSeries,
    isHourly,
    deviceSummary,
  }
}
