// Cobertura do período selecionado vs. o período realmente extraído pelo
// Clarity — Missão 04, Etapa C3.
//
// A janela de coleta real do Clarity é de 1 a 3 dias por requisição
// (04-validacao/13-plano-ativacao-clarity.md, seção 4), quase sempre menor
// que o período comercial escolhido nos filtros globais (ex. "7 dias",
// "Semana Black"). Esta função decide se o snapshot cobre, cobre
// parcialmente, ou não cobre o período selecionado — nunca reaproveitando
// dados de um período diferente sem avisar explicitamente (regra explícita
// desta etapa).

import type { DateRange } from '@/types/common'

export type ClarityPeriodCoverage = 'full' | 'partial' | 'none'

function startOfDayFromISODate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00-03:00`)
}

function endOfDayFromISODate(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59-03:00`)
}

/**
 * `selected` é o período resolvido dos filtros globais (ex. `vm.range`,
 * já em horário de Brasília). `snapshotPeriod` vem de
 * `ClarityJourneyView.period` (datas, sem hora).
 *
 * - 'full': o período selecionado está inteiramente dentro da janela extraída.
 * - 'partial': há alguma sobreposição, mas não total (para os dois lados).
 * - 'none': nenhuma sobreposição — mostrar os dados seria apresentá-los como
 *   se fossem de um período que não é o selecionado.
 */
export function evaluateClarityPeriodCoverage(selected: DateRange, snapshotPeriod: { from: string; to: string }): ClarityPeriodCoverage {
  const snapshotFrom = startOfDayFromISODate(snapshotPeriod.from)
  const snapshotTo = endOfDayFromISODate(snapshotPeriod.to)

  if (selected.to < snapshotFrom || selected.from > snapshotTo) {
    return 'none'
  }
  if (selected.from >= snapshotFrom && selected.to <= snapshotTo) {
    return 'full'
  }
  return 'partial'
}

function formatWindowLabel(snapshotPeriod: { from: string; to: string }): string {
  return snapshotPeriod.from === snapshotPeriod.to ? snapshotPeriod.from : `${snapshotPeriod.from} a ${snapshotPeriod.to}`
}

/** `null` quando a cobertura é 'full' — não há nada a avisar. */
export function clarityCoverageMessage(coverage: ClarityPeriodCoverage, snapshotPeriod: { from: string; to: string }): string | null {
  if (coverage === 'full') return null

  const windowLabel = formatWindowLabel(snapshotPeriod)
  if (coverage === 'none') {
    return `Sem sinais do Clarity para o período selecionado — esta extração cobre apenas ${windowLabel}.`
  }
  return `Cobertura parcial: esta extração do Clarity cobre apenas ${windowLabel} dentro do período selecionado.`
}
