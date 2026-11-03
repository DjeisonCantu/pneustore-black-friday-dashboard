// Regra de merge das atualizações (append-only):
//  - os arquivos valem em ordem de NOME (0000-baseline, depois AAAA-MM-DD-HHmm);
//  - para cada SEÇÃO vale a versão mais recente;
//  - seção ausente num arquivo novo mantém a anterior (MD parcial não apaga nada);
//  - o histórico guarda TODAS as versões de cada seção.
//
// Limitações: cada seção traz as suas (`limitacoes:`) e cada arquivo traz as
// dele (seção «Limitações»). Valem as limitações de um arquivo enquanto ele
// for a fonte de pelo menos uma seção vigente — quando todas as suas seções
// são substituídas, as limitações dele saem de vigor (continuam no histórico).

import { SECTION_DEFS, getSectionDef } from './model.ts'
import type { LimitationScope, ParsedUpdate, Section, SectionKey } from './types.ts'

export interface SectionVersion<K extends SectionKey = SectionKey> {
  updateId: string
  geradoEm: string
  section: Section<K>
}

export interface EffectiveLimitation {
  text: string
  scope: LimitationScope
  updateId: string
  /** Presente quando a limitação veio de uma seção específica. */
  sectionKey?: SectionKey
}

export interface UpdateSummary {
  id: string
  geradoEm: string
  geradoPor?: string
  sectionKeys: SectionKey[]
}

export type CurrentSections = { [K in SectionKey]?: SectionVersion<K> }
export type SectionHistory = { [K in SectionKey]?: SectionVersion<K>[] }

export interface MergedData {
  updates: UpdateSummary[]
  /** A versão vigente de cada seção (a mais recente). */
  current: CurrentSections
  /** Todas as versões de cada seção, da mais antiga para a mais recente. */
  history: SectionHistory
  limitations: EffectiveLimitation[]
}

/** Compara pelo nome sem ".md": "…-1530" vem antes de "…-1530-2" (o sufixo é uma atualização posterior). */
export function compareUpdateIds(a: string, b: string): number {
  const x = a.replace(/\.md$/i, '')
  const y = b.replace(/\.md$/i, '')
  return x < y ? -1 : x > y ? 1 : 0
}

/** Id da prévia no navegador: ordena DEPOIS de qualquer arquivo real (os nomes reais começam por 0000 ou por uma data). */
export const PREVIEW_UPDATE_ID = '9999-previa'

/** Merge das atualizações já publicadas com um arquivo ainda não publicado (a prévia "Ver como fica"). */
export function mergeWithPreview(published: readonly ParsedUpdate[], incoming: Omit<ParsedUpdate, 'id'>): MergedData {
  return mergeUpdates([...published, { id: PREVIEW_UPDATE_ID, ...incoming }])
}

export function mergeUpdates(updates: readonly ParsedUpdate[]): MergedData {
  const ids = new Set<string>()
  for (const update of updates) {
    if (ids.has(update.id)) throw new Error(`Duas atualizações com o mesmo nome: «${update.id}».`)
    ids.add(update.id)
  }
  const ordered = [...updates].sort((a, b) => compareUpdateIds(a.id, b.id))

  const current: Record<string, SectionVersion> = {}
  const history: Record<string, SectionVersion[]> = {}
  const summaries: UpdateSummary[] = []

  for (const update of ordered) {
    const keys: SectionKey[] = []
    for (const def of SECTION_DEFS) {
      const section = update.sections[def.key]
      if (!section) continue
      keys.push(def.key)
      const version: SectionVersion = { updateId: update.id, geradoEm: update.meta.geradoEm, section }
      current[def.key] = version
      ;(history[def.key] ??= []).push(version)
    }
    summaries.push({ id: update.id, geradoEm: update.meta.geradoEm, ...(update.meta.geradoPor ? { geradoPor: update.meta.geradoPor } : {}), sectionKeys: keys })
  }

  const limitations: EffectiveLimitation[] = []
  const seen = new Set<string>()
  const push = (item: EffectiveLimitation) => {
    const key = `${item.scope}|${item.text}`
    if (seen.has(key)) return
    seen.add(key)
    limitations.push(item)
  }

  const providers = new Set(Object.values(current).map((version) => version.updateId))
  for (const update of ordered) {
    if (!providers.has(update.id)) continue
    for (const item of update.limitations) push({ text: item.text, scope: item.scope, updateId: update.id })
  }
  for (const def of SECTION_DEFS) {
    const version = current[def.key]
    if (!version) continue
    for (const text of version.section.limitations) push({ text, scope: getSectionDef(def.key).scope, updateId: version.updateId, sectionKey: def.key })
  }

  return { updates: summaries, current: current as CurrentSections, history: history as SectionHistory, limitations }
}
