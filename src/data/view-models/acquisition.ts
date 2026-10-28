import { resolveComparisonRange, resolvePeriodRange, aggregate } from '@/data/selectors'
import { getActiveProvider } from '@/data/providers'
import type { ChannelRow } from '@/data/mock/channels'
import type { BrandRow, ProductRow } from '@/data/mock/products'
import type { Filters } from '@/types/common'

export interface AcquisitionViewModel {
  range: ReturnType<typeof resolvePeriodRange>
  comparisonRange: ReturnType<typeof resolveComparisonRange>
  channels: ChannelRow[]
  brands: BrandRow[]
  products: ProductRow[]
  hasAnyData: boolean
}

export function buildAcquisitionViewModel(filters: Filters): AcquisitionViewModel {
  const range = resolvePeriodRange(filters)
  const comparisonRange = resolveComparisonRange(filters)
  const totals = aggregate(range, filters.device)

  const provider = getActiveProvider()

  return {
    range,
    comparisonRange,
    channels: provider.getChannelBreakdown(range, filters.device, comparisonRange),
    brands: provider.getBrandRows(range, filters.device),
    products: provider.getProductRows(range, filters.device),
    hasAnyData: totals.hasAnyData,
  }
}
