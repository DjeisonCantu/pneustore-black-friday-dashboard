// Série diária fictícia do site PneuStore, isolada da aplicação real.
// TODOS os valores aqui são DADOS FICTÍCIOS gerados para fins de maquete —
// nunca devem ser confundidos com os números dos relatórios em
// 00-referencias (regra RA-06 de 01-planejamento/02-prd.md).
//
// A data de referência ("hoje" dentro da maquete) é a própria Black Friday,
// para permitir demonstrar os presets "Hoje", "Semana da Black" e as
// comparações anuais descritas em 04-arquitetura-informacao.md.

import { createRng, rangeNoise } from './seed'
import type { DeviceSegment } from '@/types/common'

export const BLACK_FRIDAY_DATE = '2026-11-27'
// Âncora do "hoje" fictício à meia-noite — usada para TODA comparação de
// datas (isFuture/isPartial, filtros). Nunca usar MOCK_TODAY para isso: às
// 23:59:59-03:00 seu instante UTC já cai no dia seguinte e desalinha os
// filtros de período em relação aos registros diários.
const TODAY_UTC = new Date(`${BLACK_FRIDAY_DATE}T00:00:00-03:00`)
// Instante de "última atualização" exibido na interface (RF-17) — apenas para formatação.
export const MOCK_TODAY = new Date('2026-11-27T23:59:59-03:00')
export const DATASET_START = new Date('2025-09-01T00:00:00-03:00')
export const DATASET_END = new Date('2026-11-30T23:59:59-03:00')

export interface DeviceMetricSet {
  desktop: number
  mobile: number
  tablet: number
}

export interface DailyRecord {
  date: string // YYYY-MM-DD
  isFuture: boolean
  isPartial: boolean
  sessions: DeviceMetricSet
  users: DeviceMetricSet
  orders: DeviceMetricSet
  revenue: DeviceMetricSet
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

const DEVICE_SHARE: Record<DeviceSegment, number> = {
  mobile: 0.58,
  desktop: 0.37,
  tablet: 0.05,
}

const BASE_CONVERSION: Record<DeviceSegment, number> = {
  desktop: 0.021,
  mobile: 0.013,
  tablet: 0.015,
}

const BASE_TICKET: Record<DeviceSegment, number> = {
  desktop: 1120,
  mobile: 980,
  tablet: 1010,
}

const BASE_DAILY_SESSIONS = 9000

/** Multiplicador sazonal fictício: aquecimento pré-Black, pico na Black e Cyber Monday. */
function seasonalMultiplier(date: Date): number {
  const blackFriday = new Date('2026-11-27T00:00:00-03:00')
  const cyberMonday = new Date('2026-11-30T00:00:00-03:00')
  const daysToBlack = daysBetween(date, blackFriday)
  const daysToCyber = Math.abs(daysBetween(date, cyberMonday))

  if (daysToBlack === 0) return 3.6
  if (daysToBlack > 0 && daysToBlack <= 6) return 1.4 + (6 - daysToBlack) * 0.28 // semana da Black
  if (daysToBlack > 6 && daysToBlack <= 20) return 1.05 + (20 - daysToBlack) * 0.015 // aquecimento
  if (daysToCyber === 0) return 2.1
  if (daysToBlack < 0 && daysToBlack >= -2) return 1.6 + daysToBlack * 0.15 // ressaca pós-Black

  const weekday = date.getUTCDay()
  const weekendBoost = weekday === 0 || weekday === 6 ? 1.08 : 1.0
  return 0.95 * weekendBoost
}

function buildDataset(): DailyRecord[] {
  const records: DailyRecord[] = []
  const totalDays = daysBetween(DATASET_START, DATASET_END) + 1

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(DATASET_START)
    date.setUTCDate(date.getUTCDate() + i)
    const iso = toISODate(date)
    const isFuture = date.getTime() > TODAY_UTC.getTime()
    const isPartial = iso === BLACK_FRIDAY_DATE

    const rng = createRng(`daily:${iso}`)
    const multiplier = seasonalMultiplier(date)
    const noise = rangeNoise(rng, 0.92, 1.08)
    const totalSessions = isFuture ? 0 : Math.round(BASE_DAILY_SESSIONS * multiplier * noise)
    const partialFactor = isPartial ? 0.62 : 1 // "dia em andamento" — dado parcial

    const sessions = {} as DeviceMetricSet
    const users = {} as DeviceMetricSet
    const orders = {} as DeviceMetricSet
    const revenue = {} as DeviceMetricSet

    for (const device of ['desktop', 'mobile', 'tablet'] as DeviceSegment[]) {
      const deviceRng = createRng(`daily:${iso}:${device}`)
      const shareNoise = rangeNoise(deviceRng, 0.95, 1.05)
      const deviceSessions = Math.round(totalSessions * DEVICE_SHARE[device] * shareNoise * partialFactor)
      const userRatio = rangeNoise(deviceRng, 0.78, 0.86)
      const convNoise = rangeNoise(deviceRng, 0.85, 1.2)
      const conversion = BASE_CONVERSION[device] * convNoise
      const deviceOrders = Math.round(deviceSessions * conversion)
      const ticketNoise = rangeNoise(deviceRng, 0.9, 1.12)
      const ticket = BASE_TICKET[device] * ticketNoise

      sessions[device] = deviceSessions
      users[device] = Math.round(deviceSessions * userRatio)
      orders[device] = deviceOrders
      revenue[device] = Math.round(deviceOrders * ticket * 100) / 100
    }

    records.push({ date: iso, isFuture, isPartial, sessions, users, orders, revenue })
  }

  return records
}

let cachedDataset: DailyRecord[] | null = null

export function getDailySeries(): DailyRecord[] {
  if (!cachedDataset) {
    cachedDataset = buildDataset()
  }
  return cachedDataset
}

export function getRecordByDate(iso: string): DailyRecord | undefined {
  return getDailySeries().find((r) => r.date === iso)
}
