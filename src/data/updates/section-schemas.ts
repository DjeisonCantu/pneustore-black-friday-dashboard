// Validação (zod) de cada tabela do modelo. O parser (parse-update-md.ts) já
// converteu as células em número/texto — célula vazia chega como `undefined`
// ("campo ausente", nunca 0) — e aqui se valida o SENTIDO: faixas, enums, as
// 6 páginas do checkout, duplicatas. Mensagens em português.

import { z } from 'zod'
import { CHECKOUT_PAGE_PATHS } from '../clarity/checkout-pages.ts'
import type { SectionDataMap, SectionKey } from './types.ts'

const REQUIRED = 'campo obrigatório (a célula não pode ficar vazia)'

function numberField(options: { int?: boolean; max?: number } = {}) {
  const base = z
    .number({ error: (issue) => (issue.input === undefined ? REQUIRED : 'precisa ser um número') })
    .min(0, { error: 'não pode ser negativo' })
  const withInt = options.int ? base.int({ error: 'precisa ser um número inteiro (sem casas decimais)' }) : base
  return options.max === undefined ? withInt : withInt.max(options.max, { error: `não pode passar de ${options.max}` })
}

function signedNumberField() {
  return z.number({ error: (issue) => (issue.input === undefined ? REQUIRED : 'precisa ser um número') })
}

function textField() {
  return z.string({ error: REQUIRED }).min(1, { error: REQUIRED })
}

function enumField<const T extends readonly [string, ...string[]]>(values: T, label: string) {
  return z.enum(values, {
    error: (issue) => (issue.input === undefined ? REQUIRED : `${label} «${String(issue.input)}» não é válido — use: ${values.join(', ')}`),
  })
}

const precisao = enumField(['exato', 'aproximado'] as const, 'precisão')
const dispositivoUx = enumField(['mobile', 'desktop', 'todos'] as const, 'dispositivo')
const dispositivoClarity = enumField(['mobile', 'desktop', 'tablet', 'other'] as const, 'dispositivo')

const paginaCheckout = z.enum(CHECKOUT_PAGE_PATHS as unknown as [string, ...string[]], {
  error: (issue) =>
    issue.input === undefined
      ? REQUIRED
      : `página «${String(issue.input)}» não está entre as 6 páginas de checkout aceitas (${CHECKOUT_PAGE_PATHS.join(', ')})`,
})

export interface RawRow {
  line: number
  row: Record<string, unknown>
}

export type Fail = (line: number, message: string) => void

/** Tipo de número de cada coluna: `unsigned` (≥ 0) ou `signed` (variação, pode ser negativa). Colunas fora daqui são texto. */
export interface TableSpec {
  numeric: Record<string, 'unsigned' | 'signed'>
  schema: z.ZodType
  build: (rows: RawRow[], fail: Fail) => unknown
  /** `true` quando nenhuma linha trouxe valor algum (ex.: só nomes, com todas as células de dado vazias). */
  isEmpty: (data: unknown) => boolean
}

type Row<S extends z.ZodType> = z.infer<S>

/** Aponta linhas repetidas pela mesma chave (ex.: o mesmo canal duas vezes) — nunca escolhe uma delas sozinho. */
function rejectDuplicates(rows: RawRow[], keyOf: (row: RawRow['row']) => string, what: string, fail: Fail) {
  const seen = new Map<string, number>()
  for (const { line, row } of rows) {
    const key = keyOf(row).toLowerCase()
    const first = seen.get(key)
    if (first === undefined) seen.set(key, line)
    else fail(line, `${what} «${keyOf(row)}» repetido (já aparece na linha ${first})`)
  }
}

// --- Looker -----------------------------------------------------------------

const resumoSchema = z
  .strictObject({
    metrica: enumField(['sessoes', 'usuarios', 'pedidos', 'receita', 'ticket_medio'] as const, 'métrica'),
    valor: numberField().optional(),
    precisao: precisao.optional(),
  })
  .refine((row) => row.valor === undefined || row.precisao !== undefined, { path: ['precisao'], error: 'informe a precisão (exato ou aproximado) quando há valor' })

const resumo: TableSpec = {
  numeric: { valor: 'unsigned' },
  schema: resumoSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.metrica), 'métrica', fail)
    const data: SectionDataMap['looker.resumo'] = {}
    for (const { row } of rows) {
      const r = row as Row<typeof resumoSchema>
      if (r.valor !== undefined && r.precisao !== undefined) data[r.metrica] = { value: r.valor, precision: r.precisao }
    }
    return data
  },
  isEmpty: (data) => Object.keys(data as object).length === 0,
}

const canaisSchema = z.strictObject({
  canal: textField(),
  participacao: numberField({ max: 100 }),
  variacao_vs_anterior: signedNumberField().optional(),
})

const canais: TableSpec = {
  numeric: { participacao: 'unsigned', variacao_vs_anterior: 'signed' },
  schema: canaisSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.canal), 'canal', fail)
    return rows.map(({ row }): SectionDataMap['looker.canais'][number] => {
      const r = row as Row<typeof canaisSchema>
      return r.variacao_vs_anterior === undefined
        ? { canal: r.canal, participacao: r.participacao }
        : { canal: r.canal, participacao: r.participacao, variacao: r.variacao_vs_anterior }
    })
  },
  isEmpty: (data) => (data as unknown[]).length === 0,
}

const origemSchema = z.strictObject({
  origem_midia: textField(),
  receita: numberField(),
  precisao,
})

const origem: TableSpec = {
  numeric: { receita: 'unsigned' },
  schema: origemSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.origem_midia), 'origem/mídia', fail)
    return rows.map(({ row }): SectionDataMap['looker.origem'][number] => {
      const r = row as Row<typeof origemSchema>
      return { origem: r.origem_midia, receita: r.receita, precisao: r.precisao }
    })
  },
  isEmpty: (data) => (data as unknown[]).length === 0,
}

const marcasSchema = z.strictObject({
  marca: textField(),
  itens_vistos: numberField({ int: true }),
  pct_add_to_cart: numberField({ max: 100 }).optional(),
  itens_comprados: numberField({ int: true }),
  receita_item: numberField(),
})

const marcas: TableSpec = {
  numeric: { itens_vistos: 'unsigned', pct_add_to_cart: 'unsigned', itens_comprados: 'unsigned', receita_item: 'unsigned' },
  schema: marcasSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.marca), 'marca', fail)
    return rows.map(({ row }): SectionDataMap['looker.marcas'][number] => {
      const r = row as Row<typeof marcasSchema>
      const base = { marca: r.marca, itensVistos: r.itens_vistos, itensComprados: r.itens_comprados, receitaItem: r.receita_item }
      return r.pct_add_to_cart === undefined ? base : { ...base, pctAddToCart: r.pct_add_to_cart }
    })
  },
  isEmpty: (data) => (data as unknown[]).length === 0,
}

const appSchema = z
  .strictObject({
    metrica: enumField(['receita_app'] as const, 'métrica'),
    valor: numberField().optional(),
    precisao: precisao.optional(),
  })
  .refine((row) => row.valor === undefined || row.precisao !== undefined, { path: ['precisao'], error: 'informe a precisão (exato ou aproximado) quando há valor' })

const app: TableSpec = {
  numeric: { valor: 'unsigned' },
  schema: appSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.metrica), 'métrica', fail)
    const data: SectionDataMap['looker.app'] = {}
    for (const { row } of rows) {
      const r = row as Row<typeof appSchema>
      if (r.valor !== undefined && r.precisao !== undefined) data[r.metrica] = { value: r.valor, precision: r.precisao }
    }
    return data
  },
  isEmpty: (data) => Object.keys(data as object).length === 0,
}

// --- Clarity ----------------------------------------------------------------

const checkoutSchema = z.strictObject({
  pagina: paginaCheckout,
  dead_clicks: numberField({ int: true }).optional(),
  rage_clicks: numberField({ int: true }).optional(),
  quick_backs: numberField({ int: true }).optional(),
})

const checkout: TableSpec = {
  numeric: { dead_clicks: 'unsigned', rage_clicks: 'unsigned', quick_backs: 'unsigned' },
  schema: checkoutSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.pagina), 'página', fail)
    return rows.map(({ row }): SectionDataMap['clarity.checkout'][number] => {
      const r = row as Row<typeof checkoutSchema>
      const result: SectionDataMap['clarity.checkout'][number] = { pagina: r.pagina }
      if (r.dead_clicks !== undefined) result.deadClicks = r.dead_clicks
      if (r.rage_clicks !== undefined) result.rageClicks = r.rage_clicks
      if (r.quick_backs !== undefined) result.quickBacks = r.quick_backs
      return result
    })
  },
  isEmpty: (data) => (data as SectionDataMap['clarity.checkout']).every((r) => r.deadClicks === undefined && r.rageClicks === undefined && r.quickBacks === undefined),
}

const sessoesSchema = z.strictObject({
  dispositivo: dispositivoClarity,
  sessoes: numberField({ int: true }).optional(),
})

const sessoes: TableSpec = {
  numeric: { sessoes: 'unsigned' },
  schema: sessoesSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.dispositivo), 'dispositivo', fail)
    const data: SectionDataMap['clarity.sessoes'] = {}
    for (const { row } of rows) {
      const r = row as Row<typeof sessoesSchema>
      if (r.sessoes !== undefined) data[r.dispositivo] = r.sessoes
    }
    return data
  },
  isEmpty: (data) => Object.keys(data as object).length === 0,
}

// --- Relatório UX (transcrição do Resumo Executivo) ------------------------------

const indicadoresSchema = z.strictObject({
  metrica: enumField(['sessoes', 'taxa_conversao', 'receita_estimada', 'ticket_medio'] as const, 'métrica'),
  '2025': numberField(),
  '2026': numberField(),
  precisao,
})

const indicadores: TableSpec = {
  numeric: { '2025': 'unsigned', '2026': 'unsigned' },
  schema: indicadoresSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.metrica), 'métrica', fail)
    const data: SectionDataMap['ux.indicadores'] = {}
    for (const { row } of rows) {
      const r = row as Row<typeof indicadoresSchema>
      data[r.metrica] = { y2025: r['2025'], y2026: r['2026'], precision: r.precisao }
    }
    return data
  },
  isEmpty: (data) => Object.keys(data as object).length === 0,
}

const etapaSchema = z.strictObject({
  etapa: textField(),
  mobile: numberField().optional(),
  desktop: numberField().optional(),
})

function etapaSpec(): TableSpec {
  return {
    numeric: { mobile: 'unsigned', desktop: 'unsigned' },
    schema: etapaSchema,
    build: (rows, fail) => {
      rejectDuplicates(rows, (row) => String(row.etapa), 'etapa', fail)
      return rows.map(({ row }): SectionDataMap['ux.funil'][number] => {
        const r = row as Row<typeof etapaSchema>
        const result: SectionDataMap['ux.funil'][number] = { etapa: r.etapa }
        if (r.mobile !== undefined) result.mobile = r.mobile
        if (r.desktop !== undefined) result.desktop = r.desktop
        return result
      })
    },
    isEmpty: (data) => (data as SectionDataMap['ux.funil']).every((r) => r.mobile === undefined && r.desktop === undefined),
  }
}

const anoAnoSchema = z.strictObject({
  metrica: enumField(['produto_ate_pedido_confirmado_pct', 'sessoes_com_dead_click_pct', 'cobertura_clarity_sessoes_ga4_pct'] as const, 'métrica'),
  dispositivo: dispositivoUx,
  '2025': numberField(),
  '2026': numberField(),
})

const anoAno: TableSpec = {
  numeric: { '2025': 'unsigned', '2026': 'unsigned' },
  schema: anoAnoSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => `${String(row.metrica)} · ${String(row.dispositivo)}`, 'métrica/dispositivo', fail)
    return rows.map(({ row }): SectionDataMap['ux.anoaano'][number] => {
      const r = row as Row<typeof anoAnoSchema>
      return { metrica: r.metrica, dispositivo: r.dispositivo, y2025: r['2025'], y2026: r['2026'] }
    })
  },
  isEmpty: (data) => (data as unknown[]).length === 0,
}

const acoesSchema = z.strictObject({
  titulo: textField(),
  detalhe: textField(),
  responsavel: textField(),
})

const acoes: TableSpec = {
  numeric: {},
  schema: acoesSchema,
  build: (rows, fail) => {
    rejectDuplicates(rows, (row) => String(row.titulo), 'ação', fail)
    return rows.map(({ row }): SectionDataMap['ux.acoes'][number] => {
      const r = row as Row<typeof acoesSchema>
      return { titulo: r.titulo, detalhe: r.detalhe, responsavel: r.responsavel }
    })
  },
  isEmpty: (data) => (data as unknown[]).length === 0,
}

/** Seções em formato de tabela. `ux.gravacoes` é uma lista e é tratada à parte pelo parser. */
export const TABLE_SPECS: Partial<Record<SectionKey, TableSpec>> = {
  'looker.resumo': resumo,
  'looker.canais': canais,
  'looker.origem': origem,
  'looker.marcas': marcas,
  'looker.app': app,
  'clarity.checkout': checkout,
  'clarity.sessoes': sessoes,
  'ux.indicadores': indicadores,
  'ux.funil': etapaSpec(),
  'ux.deadclicks': etapaSpec(),
  'ux.anoaano': anoAno,
  'ux.acoes': acoes,
}

export const FrontmatterSchema = z.strictObject({
  tipo: z.literal('atualizacao-dashboard', { error: 'tipo deve ser «atualizacao-dashboard»' }),
  versao_modelo: z.number({ error: 'versao_modelo precisa ser um número inteiro (ex.: 1)' }).int({ error: 'versao_modelo precisa ser um número inteiro (ex.: 1)' }),
  gerado_em: z.string({ error: REQUIRED }),
  gerado_por: z.string().optional(),
})
