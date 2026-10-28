// Tipos centrais do PneuStore Black Friday Health Monitor.
// Vocabulário e IDs seguem 01-planejamento (ver README "Convenção de IDs").

export const PERIOD_PRESETS = [
  'hoje',
  'ontem',
  '7dias',
  'semana-black',
  'personalizado',
] as const
export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

export const DEVICE_FILTERS = ['todos', 'desktop', 'mobile', 'tablet'] as const
export type DeviceFilter = (typeof DEVICE_FILTERS)[number]

export const DEVICE_SEGMENTS = ['desktop', 'mobile', 'tablet'] as const
export type DeviceSegment = (typeof DEVICE_SEGMENTS)[number]

export const COMPARISON_MODES = ['nenhum', 'periodo-anterior', 'mesmo-periodo-2025'] as const
export type ComparisonMode = (typeof COMPARISON_MODES)[number]

export interface DateRange {
  from: Date
  to: Date
}

export interface Filters {
  period: PeriodPreset
  customRange: DateRange | null
  device: DeviceFilter
  comparison: ComparisonMode
}

// Cenário de demonstração — usado apenas nesta missão (maquete) para exibir
// os estados de carregamento, vazio e fonte indisponível sem backend real.
export const DEMO_SCENARIOS = ['normal', 'vazio', 'fonte-indisponivel'] as const
export type DemoScenario = (typeof DEMO_SCENARIOS)[number]

export type DataSourceId = 'ga4' | 'clarity'

export interface SourceMeta {
  source: DataSourceId
  label: string
  lastUpdated: Date | null
  unavailableSince: Date | null
}

export type LoadStatus = 'loading' | 'ready' | 'empty' | 'unavailable'

export interface AsyncSlice<T> {
  status: LoadStatus
  data: T | null
}

export type Unit = 'sessao' | 'usuario' | 'evento' | 'item' | 'pedido' | 'brl' | 'percentual'

export const UNIT_LABELS: Record<Unit, string> = {
  sessao: 'Sessões',
  usuario: 'Usuários',
  evento: 'Eventos',
  item: 'Itens',
  pedido: 'Pedidos',
  brl: 'Reais (R$)',
  percentual: 'Percentual (%)',
}

export interface IndicatorMeta {
  id: string
  label: string
  unit: Unit
  secondaryUnit?: Unit
  source: DataSourceId | 'ga4+clarity'
  definition: string
  formula?: string
  limitations?: string
  status: 'confirmado' | 'provavel' | 'parcial' | 'nao-validado'
}

export interface Variation {
  deltaAbsolute: number
  deltaPercent: number
  isRelevant: boolean
  direction: 'alta' | 'baixa' | 'estavel'
}
