// Jornada de compra fictícia. Importante: NÃO calculamos taxa de passagem
// entre etapas nem abandono — a metodologia (D-05) ainda não foi aprovada
// (RF-06, RF-07, RA-02, RA-03). Apenas volumes brutos, com unidade explícita.

import { createRng, rangeNoise } from './seed'
import type { DateRange, DeviceFilter, Unit } from '@/types/common'
import { aggregateDailyRecords } from '../aggregate-core'
import { getDailySeries } from './daily-series'

// Ver nota de arquitetura equivalente em mock/channels.ts: este módulo é
// parte da implementação do provedor mock e não pode depender de
// selectors.ts/providers sem criar um ciclo (Missão 04 — Etapa B1).
function aggregate(range: DateRange, device: DeviceFilter) {
  return aggregateDailyRecords(getDailySeries(), range, device)
}

export interface JourneyStage {
  id: string
  label: string
  unit: Unit
  volume: number
  note?: string
}

export function getJourneyStages(range: DateRange, device: DeviceFilter): JourneyStage[] {
  const totals = aggregate(range, device)
  const rng = createRng(`${range.from.toISOString()}:${range.to.toISOString()}:${device}:journey`)

  const viewItem = Math.round(totals.sessions * rangeNoise(rng, 2.0, 2.6))
  const addToCart = Math.round(viewItem * rangeNoise(rng, 0.26, 0.33))
  const viewCart = Math.round(addToCart * rangeNoise(rng, 0.82, 0.95))
  const beginCheckout = Math.round(viewCart * rangeNoise(rng, 0.5, 0.6))
  const shippingInfo = Math.round(beginCheckout * rangeNoise(rng, 0.76, 0.86))
  const paymentInfo = Math.round(shippingInfo * rangeNoise(rng, 0.7, 0.8))

  return [
    { id: 'produto', label: 'Produto visualizado', unit: 'evento', volume: viewItem },
    { id: 'carrinho', label: 'Adicionado ao carrinho', unit: 'evento', volume: addToCart },
    { id: 'ver-carrinho', label: 'Visualização do carrinho', unit: 'evento', volume: viewCart },
    { id: 'checkout', label: 'Início de checkout', unit: 'evento', volume: beginCheckout },
    { id: 'frete', label: 'Informação de frete', unit: 'evento', volume: shippingInfo },
    { id: 'pagamento', label: 'Informação de pagamento', unit: 'evento', volume: paymentInfo },
    {
      id: 'pedido',
      label: 'Pedido confirmado',
      unit: 'pedido',
      volume: totals.orders,
      note: 'Unidade diferente das etapas anteriores (pedidos, não eventos) — não comparar diretamente.',
    },
  ]
}

export const JOURNEY_PAGES = ['Carrinho', 'Frete', 'Pagamento'] as const

export interface ClaritySignalRow {
  page: (typeof JOURNEY_PAGES)[number]
  device: 'desktop' | 'mobile'
  deadClicksPerSession: number
  rageClicksPerSession: number
  quickBacksPerSession: number
}

/**
 * Espaço reservado para sinais comportamentais do Clarity (RF-09).
 * A integração real depende de D-12/Q-10 (token da Data Export API).
 * Os números abaixo são apenas ilustrativos do layout final.
 */
export function getClaritySignalsPlaceholder(): ClaritySignalRow[] {
  const rows: ClaritySignalRow[] = []
  for (const page of JOURNEY_PAGES) {
    for (const device of ['desktop', 'mobile'] as const) {
      const rng = createRng(`clarity:${page}:${device}`)
      rows.push({
        page,
        device,
        deadClicksPerSession: Math.round(rangeNoise(rng, 0.1, 1.2) * 100) / 100,
        rageClicksPerSession: Math.round(rangeNoise(rng, 0.02, 0.35) * 100) / 100,
        quickBacksPerSession: Math.round(rangeNoise(rng, 0.05, 0.5) * 100) / 100,
      })
    }
  }
  return rows
}
