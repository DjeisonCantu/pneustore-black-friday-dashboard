// Ranking de marcas e produtos fictícios (IND-08). Os nomes de marca e
// produto abaixo são inventados — nenhum nome real de marca do relatório de
// referência é reaproveitado, para não misturar dado real com fictício
// (RA-06).
//
// Categorias (item_category) não entram aqui: a matriz de indicadores marca
// essa dimensão como "não disponível" (Q-04), então a tela exibe um estado
// de validação em vez de números fictícios para categoria.

import { createRng, rangeNoise } from './seed'
import type { DateRange, DeviceFilter } from '@/types/common'
import { aggregateDailyRecords } from '../aggregate-core'
import { getDailySeries } from './daily-series'

// Ver nota de arquitetura equivalente em mock/channels.ts: este módulo é
// parte da implementação do provedor mock e não pode depender de
// selectors.ts/providers sem criar um ciclo (Missão 04 — Etapa B1).
function aggregate(range: DateRange, device: DeviceFilter) {
  return aggregateDailyRecords(getDailySeries(), range, device)
}

export const FICTITIOUS_BRANDS = [
  'TrilhaMax',
  'RodaForte',
  'ViaPneu',
  'NortePneus',
  'SolidaBorracha',
  'EstradaPlus',
  'VelozTir',
  'AutoGrip',
] as const

interface ProductSeed {
  name: string
  brand: (typeof FICTITIOUS_BRANDS)[number]
  isService: boolean
}

const PRODUCT_CATALOG: ProductSeed[] = [
  { name: 'Aro 15 Confort 195/65', brand: 'TrilhaMax', isService: false },
  { name: 'Aro 16 Sport 205/55', brand: 'TrilhaMax', isService: false },
  { name: 'Aro 17 Trail 215/50', brand: 'RodaForte', isService: false },
  { name: 'Aro 14 Urbano 175/70', brand: 'RodaForte', isService: false },
  { name: 'Aro 15 EcoRun 185/65', brand: 'ViaPneu', isService: false },
  { name: 'Aro 18 Performance 225/45', brand: 'ViaPneu', isService: false },
  { name: 'Aro 16 SUV Grip 215/65', brand: 'NortePneus', isService: false },
  { name: 'Aro 15 AllSeason 195/60', brand: 'NortePneus', isService: false },
  { name: 'Aro 17 Caminhonete 265/65', brand: 'SolidaBorracha', isService: false },
  { name: 'Aro 14 City 165/70', brand: 'SolidaBorracha', isService: false },
  { name: 'Aro 16 Moto Radial 100/80', brand: 'EstradaPlus', isService: false },
  { name: 'Aro 19 Esportivo 235/40', brand: 'EstradaPlus', isService: false },
  { name: 'Aro 15 Touring 185/60', brand: 'VelozTir', isService: false },
  { name: 'Aro 17 SUV Comfort 225/60', brand: 'VelozTir', isService: false },
  { name: 'Aro 20 Premium 245/35', brand: 'AutoGrip', isService: false },
  { name: 'Aro 13 Econômico 165/65', brand: 'AutoGrip', isService: false },
  { name: 'Kit Montagem + Balanceamento', brand: 'TrilhaMax', isService: true },
  { name: 'Serviço de Alinhamento', brand: 'RodaForte', isService: true },
  { name: 'Rodízio de Pneus', brand: 'ViaPneu', isService: true },
  { name: 'Balanceamento Avulso', brand: 'NortePneus', isService: true },
]

export interface ProductRow {
  name: string
  brand: string
  isService: boolean
  itemsViewed: number
  itemsAdded: number
  itemsPurchased: number
  itemRevenue: number
}

export interface BrandRow {
  brand: string
  itemsViewed: number
  itemsAdded: number
  itemsPurchased: number
  itemRevenue: number
}

const ITEM_VIEW_RATE = 0.62 // itens vistos por sessão (fictício)
const ADD_TO_CART_RATE = 0.27 // itens adicionados / itens vistos
const ITEMS_PER_ORDER = 1.9

function weightedShares(key: string, labels: readonly string[]): number[] {
  const rng = createRng(key)
  const raw = labels.map((_, i) => rangeNoise(rng, 0.4, 1.6) * (1 / (i * 0.3 + 1)))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map((v) => v / sum)
}

export function getProductRows(range: DateRange, device: DeviceFilter): ProductRow[] {
  const totals = aggregate(range, device)
  const keyBase = `${range.from.toISOString()}:${range.to.toISOString()}:${device}`

  const totalItemsViewed = Math.round(totals.sessions * ITEM_VIEW_RATE)
  const totalItemsAdded = Math.round(totalItemsViewed * ADD_TO_CART_RATE)
  const totalItemsPurchased = Math.round(totals.orders * ITEMS_PER_ORDER)
  const totalItemRevenue = Math.round(totals.revenue * 0.97 * 100) / 100

  const names = PRODUCT_CATALOG.map((p) => p.name)
  const viewedShares = weightedShares(`${keyBase}:viewed`, names)
  const addedShares = weightedShares(`${keyBase}:added`, names)
  const purchasedShares = weightedShares(`${keyBase}:purchased`, names)
  const revenueShares = weightedShares(`${keyBase}:revenue`, names)

  return PRODUCT_CATALOG.map((product, i) => ({
    name: product.name,
    brand: product.brand,
    isService: product.isService,
    itemsViewed: Math.round(totalItemsViewed * viewedShares[i]),
    itemsAdded: Math.round(totalItemsAdded * addedShares[i]),
    itemsPurchased: Math.round(totalItemsPurchased * purchasedShares[i]),
    itemRevenue: Math.round(totalItemRevenue * revenueShares[i] * 100) / 100,
  })).sort((a, b) => b.itemRevenue - a.itemRevenue)
}

export function getBrandRows(range: DateRange, device: DeviceFilter): BrandRow[] {
  const products = getProductRows(range, device)
  const byBrand = new Map<string, BrandRow>()

  for (const p of products) {
    const existing = byBrand.get(p.brand) ?? {
      brand: p.brand,
      itemsViewed: 0,
      itemsAdded: 0,
      itemsPurchased: 0,
      itemRevenue: 0,
    }
    existing.itemsViewed += p.itemsViewed
    existing.itemsAdded += p.itemsAdded
    existing.itemsPurchased += p.itemsPurchased
    existing.itemRevenue += p.itemRevenue
    byBrand.set(p.brand, existing)
  }

  return Array.from(byBrand.values()).sort((a, b) => b.itemRevenue - a.itemRevenue)
}
