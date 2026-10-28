// Granularidade horária fictícia, usada apenas quando o período selecionado
// é um único dia (RF-04 / Q-06 — "horária se a fonte permitir").

import { createRng, rangeNoise } from './seed'
import { getRecordByDate } from './daily-series'
import type { DeviceFilter } from '@/types/common'
import { sumDevices } from './device-sum'

export interface HourlyPoint {
  hour: number
  sessions: number
  orders: number
  revenue: number
}

const HOUR_WEIGHTS = [
  0.012, 0.008, 0.006, 0.005, 0.006, 0.01, 0.018, 0.03, 0.045, 0.055, 0.06, 0.065, 0.07, 0.068,
  0.062, 0.058, 0.055, 0.058, 0.062, 0.07, 0.075, 0.07, 0.05, 0.026,
]

export function getHourlySeries(iso: string, device: DeviceFilter): HourlyPoint[] {
  const record = getRecordByDate(iso)
  if (!record) return []

  const totalSessions = sumDevices(record.sessions, device)
  const totalOrders = sumDevices(record.orders, device)
  const totalRevenue = sumDevices(record.revenue, device)
  const weightSum = HOUR_WEIGHTS.reduce((a, b) => a + b, 0)

  const lastHour = record.isPartial ? new Date().getUTCHours() : 23

  return HOUR_WEIGHTS.map((weight, hour) => {
    const rng = createRng(`hourly:${iso}:${device}:${hour}`)
    const noise = rangeNoise(rng, 0.9, 1.1)
    const share = (weight / weightSum) * noise
    const isWithinData = hour <= lastHour

    return {
      hour,
      sessions: isWithinData ? Math.round(totalSessions * share) : 0,
      orders: isWithinData ? Math.round(totalOrders * share) : 0,
      revenue: isWithinData ? Math.round(totalRevenue * share * 100) / 100 : 0,
    }
  })
}
