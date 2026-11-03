// O modelo de atualização (05-atualizacoes-diarias/modelo-atualizacao.md): quais
// seções existem, de que fonte, com quais colunas. É a única definição — o
// parser, a prévia e a UI leem daqui.

import type { Scope, SectionKey } from './types.ts'

export const SUPPORTED_MODEL_VERSIONS: readonly number[] = [1]
export const UPDATE_TYPE = 'atualizacao-dashboard'
export const LIMITATIONS_HEADING = 'Limitações'

export type SourceKey = 'looker-pdf' | 'clarity' | 'resumo-executivo-pdf'
export type OptionalKey = 'periodo_comparacao' | 'nota' | 'descricao_fonte'

export interface SectionDef {
  key: SectionKey
  heading: string
  scope: Scope
  fonte: SourceKey
  /** `table` = uma tabela markdown; `list` = lista de itens "- ...". */
  kind: 'table' | 'list'
  /** Cabeçalhos exatos da tabela (ordem livre no arquivo). */
  columns: readonly string[]
  optionalKeys: readonly OptionalKey[]
  /** Nome curto para a prévia e as mensagens. */
  label: string
}

export const SECTION_DEFS: readonly SectionDef[] = [
  { key: 'looker.resumo', heading: 'Looker — resumo do site', scope: 'looker', fonte: 'looker-pdf', kind: 'table', columns: ['metrica', 'valor', 'precisao'], optionalKeys: ['nota'], label: 'Looker · resumo do site' },
  { key: 'looker.canais', heading: 'Looker — canais', scope: 'looker', fonte: 'looker-pdf', kind: 'table', columns: ['canal', 'participacao', 'variacao_vs_anterior'], optionalKeys: ['nota'], label: 'Looker · canais' },
  { key: 'looker.origem', heading: 'Looker — origem/mídia', scope: 'looker', fonte: 'looker-pdf', kind: 'table', columns: ['origem_midia', 'receita', 'precisao'], optionalKeys: ['nota'], label: 'Looker · origem/mídia' },
  { key: 'looker.marcas', heading: 'Looker — marcas', scope: 'looker', fonte: 'looker-pdf', kind: 'table', columns: ['marca', 'itens_vistos', 'pct_add_to_cart', 'itens_comprados', 'receita_item'], optionalKeys: ['nota'], label: 'Looker · marcas' },
  { key: 'looker.app', heading: 'Looker — app', scope: 'looker', fonte: 'looker-pdf', kind: 'table', columns: ['metrica', 'valor', 'precisao'], optionalKeys: ['nota'], label: 'Looker · app' },
  { key: 'clarity.checkout', heading: 'Clarity — checkout', scope: 'clarity', fonte: 'clarity', kind: 'table', columns: ['pagina', 'dead_clicks', 'rage_clicks', 'quick_backs'], optionalKeys: ['nota', 'descricao_fonte'], label: 'Clarity · checkout' },
  { key: 'clarity.sessoes', heading: 'Clarity — sessões por dispositivo', scope: 'clarity', fonte: 'clarity', kind: 'table', columns: ['dispositivo', 'sessoes'], optionalKeys: ['nota'], label: 'Clarity · sessões por dispositivo' },
  { key: 'ux.indicadores', heading: 'Relatório UX — indicadores da semana', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'table', columns: ['metrica', '2025', '2026', 'precisao'], optionalKeys: ['periodo_comparacao', 'nota', 'descricao_fonte'], label: 'Relatório UX · indicadores' },
  { key: 'ux.funil', heading: 'Relatório UX — funil Clarity', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'table', columns: ['etapa', 'mobile', 'desktop'], optionalKeys: ['nota'], label: 'Relatório UX · funil Clarity' },
  { key: 'ux.deadclicks', heading: 'Relatório UX — dead clicks por etapa', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'table', columns: ['etapa', 'mobile', 'desktop'], optionalKeys: ['nota'], label: 'Relatório UX · dead clicks' },
  { key: 'ux.gravacoes', heading: 'Relatório UX — gravações', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'list', columns: [], optionalKeys: ['nota'], label: 'Relatório UX · gravações' },
  { key: 'ux.anoaano', heading: 'Relatório UX — Clarity ano a ano', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'table', columns: ['metrica', 'dispositivo', '2025', '2026'], optionalKeys: ['periodo_comparacao', 'nota'], label: 'Relatório UX · ano a ano' },
  { key: 'ux.acoes', heading: 'Próximas ações', scope: 'ux', fonte: 'resumo-executivo-pdf', kind: 'table', columns: ['titulo', 'detalhe', 'responsavel'], optionalKeys: ['nota'], label: 'Próximas ações' },
]

export function getSectionDef(key: SectionKey): SectionDef {
  const def = SECTION_DEFS.find((candidate) => candidate.key === key)
  if (!def) throw new Error(`Seção desconhecida: ${key}`)
  return def
}

/** Comparação de nomes tolerante a acento, caixa, espaços e ao tipo de traço (—, – ou -) — só para ACHAR a seção, nunca para valores. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+[—–-]\s+/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findSectionDef(heading: string): SectionDef | undefined {
  const wanted = normalizeName(heading)
  return SECTION_DEFS.find((def) => normalizeName(def.heading) === wanted)
}

export function isLimitationsHeading(heading: string): boolean {
  return normalizeName(heading) === normalizeName(LIMITATIONS_HEADING)
}
