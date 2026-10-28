// Lógica pura de agregação sobre registros diários — extraída de
// src/data/selectors.ts na Etapa B1 da Missão 04.
//
// Por quê este arquivo existe (justificativa técnica, não é um redesenho
// gratuito): depois que selectors.ts passou a buscar a série diária através
// de getActiveProvider() (src/data/providers), os geradores da própria
// camada mock (mock/channels.ts, mock/products.ts, mock/journey.ts) não
// podiam mais importar `aggregate` de selectors.ts — isso criaria um ciclo:
// selectors.ts → providers/index.ts → mock-provider.ts → mock/channels.ts →
// selectors.ts. Esta função pura, sem dependência de provider nenhum, quebra
// o ciclo: selectors.ts busca os registros via provider e delega o cálculo
// para cá; os geradores mock continuam usando os registros da própria camada
// mock (getDailySeries de ./mock/daily-series) e delegam para a mesma função.
//
// Nenhuma regra de negócio mudou — os números para os mesmos filtros
// continuam idênticos aos da Missão 02/03 (RA-01 continua valendo: nenhuma
// unidade é somada ou dividida aqui além do que já era feito).

import { sumDevices } from './mock/device-sum'
import type { DailyRecord } from './mock/daily-series'
import type { DateRange, DeviceFilter } from '@/types/common'

export function filterRecordsInRange(records: DailyRecord[], range: DateRange): DailyRecord[] {
  const fromIso = range.from.toISOString().slice(0, 10)
  const toIso = range.to.toISOString().slice(0, 10)
  return records.filter((r) => r.date >= fromIso && r.date <= toIso)
}

export interface AggregateResult {
  sessions: number
  users: number
  orders: number
  revenue: number
  conversionRate: number // pedidos / sessões (D-04)
  averageTicket: number // receita / pedidos
  hasAnyData: boolean
  hasFutureDaysOnly: boolean
  isPartialToday: boolean
}

export function aggregateDailyRecords(records: DailyRecord[], range: DateRange, device: DeviceFilter): AggregateResult {
  const inRange = filterRecordsInRange(records, range)
  const withData = inRange.filter((r) => !r.isFuture)

  const sessions = withData.reduce((acc, r) => acc + sumDevices(r.sessions, device), 0)
  const users = withData.reduce((acc, r) => acc + sumDevices(r.users, device), 0)
  const orders = withData.reduce((acc, r) => acc + sumDevices(r.orders, device), 0)
  const revenue = withData.reduce((acc, r) => acc + sumDevices(r.revenue, device), 0)

  return {
    sessions,
    users,
    orders,
    revenue,
    conversionRate: sessions > 0 ? (orders / sessions) * 100 : 0,
    averageTicket: orders > 0 ? revenue / orders : 0,
    hasAnyData: withData.length > 0 && sessions > 0,
    hasFutureDaysOnly: inRange.length > 0 && withData.length === 0,
    isPartialToday: inRange.some((r) => r.isPartial),
  }
}
