import type { DeviceFilter } from '@/types/common'
import type { DeviceMetricSet } from './daily-series'

export function sumDevices(metric: DeviceMetricSet, device: DeviceFilter): number {
  if (device === 'todos') return metric.desktop + metric.mobile + metric.tablet
  return metric[device]
}
