// Prévia de uma atualização: bloco a bloco, o que muda em relação ao dado
// vigente. Puro — só compara; não grava nada.

import { checkoutPageLabel } from '../clarity/checkout-pages.ts'
import { formatPeriodNumeric, periodsOverlap, samePeriod, type Period } from './dates.ts'
import type { MergedData } from './merge-updates.ts'
import { SECTION_DEFS } from './model.ts'
import type { ParsedUpdate, Scope, Section, SectionKey } from './types.ts'

export interface Entry {
  id: string
  label: string
  /** Valor cru, usado só para comparar. */
  raw: string
  /** Valor formatado para mostrar. */
  shown: string
}

export interface EntryChange {
  label: string
  before?: string
  after?: string
}

export type BlockStatus = 'novo' | 'atualiza' | 'igual' | 'ausente'

export interface BlockWarning {
  level: 'aviso' | 'info'
  message: string
}

export interface BlockDiff {
  key: SectionKey
  label: string
  status: BlockStatus
  oldPeriod?: Period
  newPeriod?: Period
  changes: EntryChange[]
  /** Os números não mudaram, mas período, nota ou limitações sim. */
  textChanged: boolean
  warnings: BlockWarning[]
}

export interface UpdateDiff {
  blocks: BlockDiff[]
  /** Existe pelo menos um bloco novo ou atualizado. */
  hasChanges: boolean
  hasWarnings: boolean
}

const number = (value: number, digits = 2) => value.toLocaleString('pt-BR', { maximumFractionDigits: digits })
const money = (value: number) => `R$ ${number(value)}`
const percent = (value: number) => `${number(value)}%`

const RESUMO_LABELS = { sessoes: 'Sessões', usuarios: 'Usuários', pedidos: 'Pedidos', receita: 'Receita', ticket_medio: 'Ticket médio' } as const
const UX_INDICATOR_LABELS = { sessoes: 'Sessões', taxa_conversao: 'Conversão', receita_estimada: 'Receita estimada', ticket_medio: 'Ticket médio' } as const
const UX_INDICATOR_FORMAT = { sessoes: number, taxa_conversao: percent, receita_estimada: money, ticket_medio: money } as const

function entry(id: string, label: string, raw: string | number, shown: string): Entry {
  return { id, label, raw: String(raw), shown }
}

/** Os principais números de uma seção, em lista plana (id estável) para comparar antes × depois. */
export function flattenSection(section: Section): Entry[] {
  switch (section.key) {
    case 'looker.resumo': {
      const data = section.data as Section<'looker.resumo'>['data']
      return (Object.keys(RESUMO_LABELS) as (keyof typeof RESUMO_LABELS)[]).flatMap((metric) => {
        const item = data[metric]
        if (!item) return []
        const shown = metric === 'receita' || metric === 'ticket_medio' ? money(item.value) : number(item.value)
        return [entry(metric, RESUMO_LABELS[metric], item.value, `${shown}${item.precision === 'aproximado' ? ' (aprox.)' : ''}`)]
      })
    }
    case 'looker.canais': {
      const data = section.data as Section<'looker.canais'>['data']
      return data.flatMap((row) => [
        entry(`${row.canal}.part`, `${row.canal} · participação`, row.participacao, percent(row.participacao)),
        ...(row.variacao === undefined ? [] : [entry(`${row.canal}.var`, `${row.canal} · variação`, row.variacao, percent(row.variacao))]),
      ])
    }
    case 'looker.origem': {
      const data = section.data as Section<'looker.origem'>['data']
      return data.map((row) => entry(row.origem, row.origem, row.receita, money(row.receita)))
    }
    case 'looker.marcas': {
      const data = section.data as Section<'looker.marcas'>['data']
      return data.map((row) => entry(row.marca, `${row.marca} · receita`, row.receitaItem, money(row.receitaItem)))
    }
    case 'looker.app': {
      const data = section.data as Section<'looker.app'>['data']
      return data.receita_app ? [entry('receita_app', 'Receita do app', data.receita_app.value, money(data.receita_app.value))] : []
    }
    case 'clarity.checkout': {
      const data = section.data as Section<'clarity.checkout'>['data']
      const groups = [
        ['dead', 'dead clicks', 'deadClicks'],
        ['rage', 'rage clicks', 'rageClicks'],
        ['quick', 'quick backs', 'quickBacks'],
      ] as const
      return groups.flatMap(([id, label, field]) =>
        data.flatMap((row) => {
          const value = row[field]
          return value === undefined ? [] : [entry(`${row.pagina}.${id}`, `${checkoutPageLabel(row.pagina)} · ${label}`, value, number(value))]
        }),
      )
    }
    case 'clarity.sessoes': {
      const data = section.data as Section<'clarity.sessoes'>['data']
      return (['mobile', 'desktop', 'tablet', 'other'] as const).flatMap((device) => {
        const value = data[device]
        return value === undefined ? [] : [entry(device, `Sessões · ${device}`, value, number(value))]
      })
    }
    case 'ux.indicadores': {
      const data = section.data as Section<'ux.indicadores'>['data']
      return (Object.keys(UX_INDICATOR_LABELS) as (keyof typeof UX_INDICATOR_LABELS)[]).flatMap((metric) => {
        const item = data[metric]
        if (!item) return []
        const format = UX_INDICATOR_FORMAT[metric]
        return [
          entry(`${metric}.2026`, `${UX_INDICATOR_LABELS[metric]} (2026)`, item.y2026, format(item.y2026)),
          entry(`${metric}.2025`, `${UX_INDICATOR_LABELS[metric]} (2025)`, item.y2025, format(item.y2025)),
        ]
      })
    }
    case 'ux.funil':
    case 'ux.deadclicks': {
      const data = section.data as Section<'ux.funil'>['data']
      return data.flatMap((row) => [
        ...(row.mobile === undefined ? [] : [entry(`${row.etapa}.mobile`, `${row.etapa} · mobile`, row.mobile, number(row.mobile))]),
        ...(row.desktop === undefined ? [] : [entry(`${row.etapa}.desktop`, `${row.etapa} · desktop`, row.desktop, number(row.desktop))]),
      ])
    }
    case 'ux.gravacoes': {
      const data = section.data as Section<'ux.gravacoes'>['data']
      return data.map((text, index) => entry(`g${index}`, `Gravação ${index + 1}`, text, text))
    }
    case 'ux.anoaano': {
      const data = section.data as Section<'ux.anoaano'>['data']
      return data.flatMap((row) => [
        entry(`${row.metrica}.${row.dispositivo}.2026`, `${row.metrica.replace(/_/g, ' ')} · ${row.dispositivo} (2026)`, row.y2026, number(row.y2026)),
        entry(`${row.metrica}.${row.dispositivo}.2025`, `${row.metrica.replace(/_/g, ' ')} · ${row.dispositivo} (2025)`, row.y2025, number(row.y2025)),
      ])
    }
    case 'ux.acoes': {
      const data = section.data as Section<'ux.acoes'>['data']
      return data.map((row) => entry(row.titulo, row.titulo, `${row.detalhe}|${row.responsavel}`, `${row.detalhe} (${row.responsavel})`))
    }
  }
}

function sameSection(a: Section, b: Section): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function periodLabel(period: Period): string {
  return formatPeriodNumeric(period.from, period.to)
}

function diffEntries(before: Entry[], after: Entry[]): EntryChange[] {
  const changes: EntryChange[] = []
  const beforeById = new Map(before.map((e) => [e.id, e]))
  const afterById = new Map(after.map((e) => [e.id, e]))
  for (const next of after) {
    const previous = beforeById.get(next.id)
    if (!previous) changes.push({ label: next.label, after: next.shown })
    else if (previous.raw !== next.raw) changes.push({ label: next.label, before: previous.shown, after: next.shown })
  }
  for (const previous of before) {
    if (!afterById.has(previous.id)) changes.push({ label: previous.label, before: previous.shown })
  }
  return changes
}

/** Compara a atualização recebida com o dado vigente, seção por seção (todas as seções do modelo aparecem). */
export function diffUpdate(current: MergedData, incoming: Pick<ParsedUpdate, 'sections'>): UpdateDiff {
  const blocks: BlockDiff[] = SECTION_DEFS.map((def): BlockDiff => {
    const next = incoming.sections[def.key] as Section | undefined
    const previous = current.current[def.key]?.section as Section | undefined
    if (!next) return { key: def.key, label: def.label, status: 'ausente', oldPeriod: previous?.periodo, changes: [], textChanged: false, warnings: [] }
    if (!previous) return { key: def.key, label: def.label, status: 'novo', newPeriod: next.periodo, changes: [], textChanged: false, warnings: [] }
    if (sameSection(previous, next)) {
      return { key: def.key, label: def.label, status: 'igual', oldPeriod: previous.periodo, newPeriod: next.periodo, changes: [], textChanged: false, warnings: [] }
    }

    const changes = diffEntries(flattenSection(previous), flattenSection(next))
    const warnings: BlockWarning[] = []
    if (next.periodo.to < previous.periodo.to) {
      warnings.push({
        level: 'aviso',
        message: `O período novo (${periodLabel(next.periodo)}) termina antes do atual (${periodLabel(previous.periodo)}). Confira se este arquivo não é mais antigo que o dado que está no ar.`,
      })
    }
    if (samePeriod(previous.periodo, next.periodo)) {
      warnings.push({ level: 'info', message: `Mesmo período (${periodLabel(next.periodo)}) com dados diferentes — é uma correção do dado atual?` })
    } else if (periodsOverlap(previous.periodo, next.periodo)) {
      warnings.push({ level: 'info', message: `Os períodos se sobrepõem (${periodLabel(next.periodo)} e ${periodLabel(previous.periodo)}) — não some os números dos dois.` })
    }
    return {
      key: def.key,
      label: def.label,
      status: 'atualiza',
      oldPeriod: previous.periodo,
      newPeriod: next.periodo,
      changes,
      textChanged: changes.length === 0,
      warnings,
    }
  })

  return {
    blocks,
    hasChanges: blocks.some((block) => block.status === 'novo' || block.status === 'atualiza'),
    hasWarnings: blocks.some((block) => block.warnings.some((warning) => warning.level === 'aviso')),
  }
}

const SCOPE_LABELS: Record<Scope, string> = { looker: 'Looker', clarity: 'Clarity', ux: 'Relatório UX' }

/** "Looker 06/10–02/11 e 01–02/11; Clarity 31/10–02/11" — usado na mensagem de commit e na confirmação. */
export function summarizeUpdatePeriods(update: Pick<ParsedUpdate, 'sections'>): string {
  const byScope = new Map<Scope, string[]>()
  for (const def of SECTION_DEFS) {
    const section = update.sections[def.key]
    if (!section) continue
    const label = periodLabel(section.periodo)
    const list = byScope.get(def.scope) ?? []
    if (!list.includes(label)) list.push(label)
    byScope.set(def.scope, list)
  }
  return (['looker', 'clarity', 'ux'] as const)
    .filter((scope) => byScope.has(scope))
    .map((scope) => `${SCOPE_LABELS[scope]} ${byScope.get(scope)!.join(' e ')}`)
    .join('; ')
}
