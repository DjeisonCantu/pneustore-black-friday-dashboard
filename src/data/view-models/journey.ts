import { aggregate, computeVariation, resolveComparisonRange, resolvePeriodRange } from '@/data/selectors'
import { getActiveProvider } from '@/data/providers'
import type { JourneyStage } from '@/data/mock/journey'
import type { DeviceSegment, Filters, Variation } from '@/types/common'

export interface DeviceConversionRow {
  device: DeviceSegment
  conversionRate: number
  comparisonConversionRate?: number
  variation: Variation | null
}

export interface JourneyViewModel {
  range: ReturnType<typeof resolvePeriodRange>
  comparisonRange: ReturnType<typeof resolveComparisonRange>
  deviceConversion: DeviceConversionRow[]
  stages: JourneyStage[]
  hasAnyData: boolean
}

const DEVICE_SEGMENTS: DeviceSegment[] = ['desktop', 'mobile']

export function buildJourneyViewModel(filters: Filters): JourneyViewModel {
  const range = resolvePeriodRange(filters)
  const comparisonRange = resolveComparisonRange(filters)

  const deviceConversion: DeviceConversionRow[] = DEVICE_SEGMENTS.map((device) => {
    const current = aggregate(range, device)
    const previous = comparisonRange ? aggregate(comparisonRange, device) : null
    return {
      device,
      conversionRate: current.conversionRate,
      comparisonConversionRate: previous?.conversionRate,
      variation: computeVariation(current.conversionRate, previous?.conversionRate ?? null),
    }
  })

  const overall = aggregate(range, filters.device)

  return {
    range,
    comparisonRange,
    deviceConversion,
    stages: getActiveProvider().getJourneyStages(range, filters.device),
    hasAnyData: overall.hasAnyData,
  }
}
