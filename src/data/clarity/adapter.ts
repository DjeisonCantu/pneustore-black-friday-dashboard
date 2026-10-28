// Adaptador Clarity — Missão 04, Etapa C2.
//
// Transforma um ClaritySnapshot já validado (contract.ts) num modelo de
// apresentação pronto para a Jornada de compra. Função pura, sem I/O —
// testável sem rede e sem React. Nunca mistura métricas do Clarity com
// denominadores do GA4 (RA-07): todo denominador usado aqui (`sessions`)
// vem do próprio registro do Clarity, nunca de `src/data/selectors.ts`.

import { checkoutPageLabel } from './checkout-pages'
import type { ClarityDevice, ClarityMetric, ClarityPageSignal, ClaritySnapshot } from './contract'
import type { DeviceFilter } from '@/types/common'

export interface ClaritySignalCell {
  /** Contagem bruta — nunca omitida. */
  absolute: number
  /**
   * Taxa por sessão: usa o valor informado pela própria fonte quando
   * presente; senão, calcula `absolute / sessions` SE o denominador for
   * conhecido; senão `null` (nunca inventado).
   */
  perSession: number | null
  /** Denominador explícito usado (ou que seria usado) para `perSession` — `null` quando desconhecido. */
  sessions: number | null
}

export interface ClarityJourneyRow {
  pagePath: string
  pageLabel: string
  device: ClarityDevice
  deadClicks: ClaritySignalCell
  rageClicks: ClaritySignalCell
  quickBacks: ClaritySignalCell
}

export interface ClarityPageConcentration {
  pagePath: string
  pageLabel: string
  totalDeadClicks: number
}

export interface ClarityJourneyView {
  project: string
  period: { from: string; to: string }
  extractedAt: string
  isPartial: boolean
  limitations: string[]
  rows: ClarityJourneyRow[]
  /** Páginas ordenadas pela maior concentração de dead clicks (soma de todos os dispositivos). */
  topDeadClickPages: ClarityPageConcentration[]
}

function buildCell(metric: ClarityMetric, sessions: number | undefined): ClaritySignalCell {
  const resolvedSessions = sessions ?? null
  const perSession = metric.perSession ?? (resolvedSessions && resolvedSessions > 0 ? metric.absolute / resolvedSessions : null)
  return { absolute: metric.absolute, perSession, sessions: resolvedSessions }
}

function toRow(signal: ClarityPageSignal): ClarityJourneyRow {
  return {
    pagePath: signal.page,
    pageLabel: checkoutPageLabel(signal.page),
    device: signal.device,
    deadClicks: buildCell(signal.deadClicks, signal.sessions),
    rageClicks: buildCell(signal.rageClicks, signal.sessions),
    quickBacks: buildCell(signal.quickBacks, signal.sessions),
  }
}

export function buildTopDeadClickPages(rows: ClarityJourneyRow[]): ClarityPageConcentration[] {
  const totals = new Map<string, ClarityPageConcentration>()
  for (const row of rows) {
    const existing = totals.get(row.pagePath) ?? { pagePath: row.pagePath, pageLabel: row.pageLabel, totalDeadClicks: 0 }
    existing.totalDeadClicks += row.deadClicks.absolute
    totals.set(row.pagePath, existing)
  }
  return Array.from(totals.values()).sort((a, b) => b.totalDeadClicks - a.totalDeadClicks)
}

export function buildClarityJourneyView(snapshot: ClaritySnapshot): ClarityJourneyView {
  const rows = snapshot.pages.map(toRow)
  return {
    project: snapshot.metadata.project,
    period: snapshot.metadata.period,
    extractedAt: snapshot.metadata.extractedAt,
    isPartial: snapshot.metadata.status === 'partial',
    limitations: snapshot.metadata.limitations ?? [],
    rows,
    topDeadClickPages: buildTopDeadClickPages(rows),
  }
}

/**
 * Filtra a visão pelo filtro global de dispositivo (RF da Etapa C3: "o
 * painel deverá respeitar o filtro global de dispositivo"). `'todos'` e
 * `'other'` (dispositivo do Clarity sem equivalente no filtro global) nunca
 * são removidos por um filtro específico — só `'todos'` devolve tudo; um
 * filtro de 'desktop'/'mobile'/'tablet' remove as linhas de outro
 * dispositivo, incluindo `'other'`. O ranking de páginas é recalculado a
 * partir das linhas já filtradas — nunca soma dispositivos fora do filtro.
 */
export function filterClarityJourneyViewByDevice(view: ClarityJourneyView, device: DeviceFilter): ClarityJourneyView {
  if (device === 'todos') return view

  const rows = view.rows.filter((row) => row.device === device)
  return { ...view, rows, topDeadClickPages: buildTopDeadClickPages(rows) }
}
