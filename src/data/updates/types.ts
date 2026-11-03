// Tipos do fluxo de atualizações (arquivos .md em data/updates/). Tudo aqui é
// JSON puro — o plugin do Vite serializa a lista de atualizações validadas
// direto para o bundle.

import type { Period } from './dates.ts'

export type { Period }

export type Precision = 'exato' | 'aproximado'
export type Device = 'mobile' | 'desktop' | 'tablet' | 'other'

export interface Metric {
  value: number
  precision: Precision
}

export type SectionKey =
  | 'looker.resumo'
  | 'looker.canais'
  | 'looker.origem'
  | 'looker.marcas'
  | 'looker.app'
  | 'clarity.checkout'
  | 'clarity.sessoes'
  | 'ux.indicadores'
  | 'ux.funil'
  | 'ux.deadclicks'
  | 'ux.gravacoes'
  | 'ux.anoaano'
  | 'ux.acoes'

/** Origem do dado de uma seção — vira o escopo das limitações. */
export type Scope = 'looker' | 'clarity' | 'ux'
/** Escopo de uma limitação: de uma fonte específica ou geral (sem etiqueta). */
export type LimitationScope = Scope | 'geral'

export type LookerResumoMetric = 'sessoes' | 'usuarios' | 'pedidos' | 'receita' | 'ticket_medio'
export type UxIndicatorMetric = 'sessoes' | 'taxa_conversao' | 'receita_estimada' | 'ticket_medio'
export type UxYoyMetric = 'produto_ate_pedido_confirmado_pct' | 'sessoes_com_dead_click_pct' | 'cobertura_clarity_sessoes_ga4_pct'
export type UxYoyDevice = 'mobile' | 'desktop' | 'todos'

export interface CanalRow {
  canal: string
  participacao: number
  variacao?: number
}

export interface OrigemRow {
  origem: string
  receita: number
  precisao: Precision
}

export interface MarcaRow {
  marca: string
  itensVistos: number
  /** % Add to Cart do Looker — a contagem de adicionados é só estimada a partir dele. */
  pctAddToCart?: number
  itensComprados: number
  receitaItem: number
}

export interface CheckoutRow {
  pagina: string
  deadClicks?: number
  rageClicks?: number
  quickBacks?: number
}

export interface DeviceStepRow {
  etapa: string
  mobile?: number
  desktop?: number
}

export interface YoyRow {
  metrica: UxYoyMetric
  dispositivo: UxYoyDevice
  y2025: number
  y2026: number
}

export interface ActionRow {
  titulo: string
  detalhe: string
  responsavel: string
}

export interface SectionDataMap {
  'looker.resumo': Partial<Record<LookerResumoMetric, Metric>>
  'looker.canais': CanalRow[]
  'looker.origem': OrigemRow[]
  'looker.marcas': MarcaRow[]
  'looker.app': Partial<Record<'receita_app', Metric>>
  'clarity.checkout': CheckoutRow[]
  'clarity.sessoes': Partial<Record<Device, number>>
  'ux.indicadores': Partial<Record<UxIndicatorMetric, { y2025: number; y2026: number; precision: Precision }>>
  'ux.funil': DeviceStepRow[]
  'ux.deadclicks': DeviceStepRow[]
  'ux.gravacoes': string[]
  'ux.anoaano': YoyRow[]
  'ux.acoes': ActionRow[]
}

export interface Section<K extends SectionKey = SectionKey> {
  key: K
  /** Título exato da seção no arquivo (ex.: "Looker — marcas"). */
  heading: string
  fonte: string
  periodo: Period
  periodoComparacao?: Period
  nota?: string
  descricaoFonte?: string
  /** Limitações declaradas dentro da própria seção (`limitacoes:`). */
  limitations: string[]
  data: SectionDataMap[K]
}

export type SectionMap = { [K in SectionKey]?: Section<K> }

export interface LimitationItem {
  text: string
  scope: LimitationScope
}

export interface UpdateMeta {
  tipo: string
  versaoModelo: number
  /** Data (AAAA-MM-DD) ou data e hora ISO, como escrito no arquivo. */
  geradoEm: string
  geradoPor?: string
}

export interface ParsedUpdate {
  /** Nome do arquivo sem ".md" — define a ordem de leitura. "(prévia)" na prévia do navegador. */
  id: string
  meta: UpdateMeta
  sections: SectionMap
  /** Limitações do arquivo (seção "Limitações"), com etiqueta opcional [Clarity]/[Looker]/[UX]. */
  limitations: LimitationItem[]
}

export interface ParseIssue {
  message: string
  /** Título da seção onde o problema aconteceu, quando houver. */
  section?: string
  /** Linha (1-based) no arquivo, quando houver. */
  line?: number
}

export type ParseResult = { ok: true; update: Omit<ParsedUpdate, 'id'> } | { ok: false; issues: ParseIssue[] }

export function formatIssue(issue: ParseIssue): string {
  const where = [issue.section ? `Seção «${issue.section}»` : null, issue.line !== undefined ? `linha ${issue.line}` : null].filter(Boolean).join(', ')
  return where ? `${where}: ${issue.message}` : issue.message
}
