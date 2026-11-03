// Parser + validação de um arquivo de atualização (.md). Módulo PURO (sem DOM,
// sem Node): roda no navegador (prévia) e no build (plugin do Vite) com o
// mesmo resultado.
//
// Regras que nunca mudam: nenhum valor é "adivinhado" — vírgula decimal,
// separador de milhar, "%", "R$" ou texto num campo numérico viram ERRO com
// seção e linha; célula vazia é campo ausente (nunca 0); página fora das 6 do
// checkout, data inexistente ou período invertido também são erro.

import { isIsoDateOrDateTime, parsePeriod } from './dates.ts'
import { SECTION_DEFS, SUPPORTED_MODEL_VERSIONS, findSectionDef, isLimitationsHeading, normalizeName, type SectionDef } from './model.ts'
import { FrontmatterSchema, TABLE_SPECS, type RawRow, type TableSpec } from './section-schemas.ts'
import type { LimitationItem, LimitationScope, ParseIssue, ParseResult, Section, SectionKey, SectionMap, UpdateMeta } from './types.ts'

const MAX_ISSUES = 100

export type NumberParse = { ok: true; value: number } | { ok: false; message: string }

/** Número com ponto decimal e sem separador de milhar. Qualquer outra forma é recusada com o motivo. */
export function parseStrictNumber(raw: string): NumberParse {
  const text = raw.trim()
  if (/^-?\d+(\.\d+)?$/.test(text)) return { ok: true, value: Number(text) }
  if (text.includes('%')) return { ok: false, message: `«${text}» tem o símbolo % — escreva só o número (42.79 já significa 42,79%)` }
  if (/R\$/i.test(text)) return { ok: false, message: `«${text}» tem «R$» — escreva só o número (ex.: 44945346.96)` }
  if (text.includes(',')) return { ok: false, message: `«${text}» tem vírgula — use ponto decimal e nenhum separador de milhar (ex.: 44945346.96)` }
  if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(text)) return { ok: false, message: `«${text}» parece ter separador de milhar — escreva o número inteiro sem pontos (ex.: 1582478)` }
  if (/\s/.test(text)) return { ok: false, message: `«${text}» tem espaço dentro do número` }
  if (/[a-z]/i.test(text)) return { ok: false, message: `«${text}» tem letras (ex.: «mil», «mi») — escreva o número completo (ex.: 17220000)` }
  return { ok: false, message: `«${text}» não é um número válido (use ponto decimal, sem separador de milhar)` }
}

/** Tira os comentários <!-- ... --> mantendo a contagem de linhas (os números de linha das mensagens continuam certos). */
function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ''))
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

const SEPARATOR_CELL_RE = /^:?-{3,}:?$/
function isSeparatorRow(line: string): boolean {
  const cells = splitCells(line)
  return cells.length > 0 && cells.every((cell) => SEPARATOR_CELL_RE.test(cell))
}

const KEY_LINE_RE = /^([A-Za-zÀ-ÿ_]+):\s*(.*)$/
const LIMITATION_TAG_RE = /^\[(clarity|looker|ux)\]\s*/i

function limitationFromBullet(text: string): LimitationItem {
  const match = LIMITATION_TAG_RE.exec(text)
  if (!match) return { text, scope: 'geral' }
  return { text: text.slice(match[0].length).trim(), scope: match[1].toLowerCase() as LimitationScope }
}

interface BodyLine {
  n: number
  t: string
}

interface Block {
  heading: string
  line: number
  body: BodyLine[]
}

interface KeyValue {
  value: string
  line: number
}

export function parseUpdateMd(input: string): ParseResult {
  const issues: ParseIssue[] = []
  const add = (issue: ParseIssue) => {
    if (issues.length < MAX_ISSUES) issues.push(issue)
  }

  const lines = stripComments(input.replace(/^﻿/, '').replace(/\r\n?/g, '\n')).split('\n')

  // --- 1. Cabeçalho (frontmatter) ---------------------------------------------------
  let cursor = 0
  while (cursor < lines.length && lines[cursor].trim() === '') cursor++
  if (lines[cursor]?.trim() !== '---') {
    return { ok: false, issues: [{ line: Math.min(cursor + 1, lines.length), message: 'o arquivo precisa começar com o cabeçalho entre «---» (tipo, versao_modelo, gerado_em)' }] }
  }
  let frontmatterEnd = -1
  for (let j = cursor + 1; j < lines.length; j++) {
    if (lines[j].trim() === '---') {
      frontmatterEnd = j
      break
    }
  }
  if (frontmatterEnd === -1) {
    return { ok: false, issues: [{ line: cursor + 1, message: 'o cabeçalho não foi fechado com «---»' }] }
  }

  const front: Record<string, KeyValue> = {}
  for (let j = cursor + 1; j < frontmatterEnd; j++) {
    const t = lines[j].trim()
    if (t === '') continue
    const match = KEY_LINE_RE.exec(t)
    if (!match) {
      add({ line: j + 1, message: `linha do cabeçalho fora do formato «chave: valor»: «${t}»` })
      continue
    }
    const key = match[1].toLowerCase()
    if (front[key]) add({ line: j + 1, message: `«${key}» aparece duas vezes no cabeçalho` })
    else front[key] = { value: match[2].trim(), line: j + 1 }
  }

  const versionRaw = front.versao_modelo?.value
  const frontCheck = FrontmatterSchema.safeParse({
    tipo: front.tipo?.value,
    versao_modelo: versionRaw !== undefined && /^\d+$/.test(versionRaw) ? Number(versionRaw) : versionRaw,
    gerado_em: front.gerado_em?.value,
    gerado_por: front.gerado_por?.value,
  })
  let meta: UpdateMeta | null = null
  if (!frontCheck.success) {
    for (const issue of frontCheck.error.issues) {
      const field = String(issue.path[0] ?? '')
      const missing = front[field] === undefined && field !== ''
      add({ line: front[field]?.line ?? cursor + 1, message: missing ? `falta «${field}» no cabeçalho` : `«${field}»: ${issue.message}` })
    }
  } else {
    const { tipo, versao_modelo: versaoModelo, gerado_em: geradoEm, gerado_por: geradoPor } = frontCheck.data
    if (!SUPPORTED_MODEL_VERSIONS.includes(versaoModelo)) {
      add({ line: front.versao_modelo?.line, message: `versao_modelo ${versaoModelo} não é suportada (versões aceitas: ${SUPPORTED_MODEL_VERSIONS.join(', ')})` })
    }
    if (!isIsoDateOrDateTime(geradoEm)) {
      add({ line: front.gerado_em?.line, message: `gerado_em «${geradoEm}» não é uma data válida (use AAAA-MM-DD)` })
    }
    meta = { tipo, versaoModelo, geradoEm, ...(geradoPor ? { geradoPor } : {}) }
  }

  // --- 2. Divide o corpo em blocos "## título" ---------------------------------------------
  const blocks: Block[] = []
  let current: Block | null = null
  for (let j = frontmatterEnd + 1; j < lines.length; j++) {
    const raw = lines[j]
    const t = raw.trim()
    const heading = /^##\s+(\S.*)$/.exec(t)
    if (heading && !t.startsWith('###')) {
      current = { heading: heading[1].trim(), line: j + 1, body: [] }
      blocks.push(current)
      continue
    }
    if (/^#\s/.test(t)) continue // título do documento: ignorado
    if (current) {
      current.body.push({ n: j + 1, t })
    } else if (t.startsWith('|')) {
      add({ line: j + 1, message: 'linha de tabela fora de uma seção «## ...»' })
    } else if (KEY_LINE_RE.test(t)) {
      add({ line: j + 1, message: `«${t}» está fora de uma seção «## ...»` })
    }
  }

  // --- 3. Processa cada bloco ------------------------------------------------------------
  const sections: SectionMap = {}
  const seen = new Set<SectionKey>()
  const limitations: LimitationItem[] = []
  let sawLimitations = false

  for (const block of blocks) {
    if (isLimitationsHeading(block.heading)) {
      if (sawLimitations) add({ section: block.heading, line: block.line, message: 'a seção «Limitações» aparece mais de uma vez' })
      sawLimitations = true
      for (const { n, t } of block.body) {
        if (t === '') continue
        if (t.startsWith('- ')) limitations.push(limitationFromBullet(t.slice(2).trim()))
        else add({ section: block.heading, line: n, message: `use uma limitação por linha, começando com «- »: «${t}»` })
      }
      continue
    }

    const def = findSectionDef(block.heading)
    if (!def) {
      const valid = [...SECTION_DEFS.map((candidate) => candidate.heading), 'Limitações'].join('; ')
      add({ section: block.heading, line: block.line, message: `seção desconhecida. Seções válidas: ${valid}` })
      continue
    }
    if (seen.has(def.key)) {
      add({ section: def.heading, line: block.line, message: 'esta seção aparece mais de uma vez no arquivo' })
      continue
    }
    seen.add(def.key)

    const section = parseDataBlock(def, block, add)
    if (section) (sections as Record<string, unknown>)[def.key] = section
  }

  if (blocks.length === 0 || (Object.keys(sections).length === 0 && limitations.length === 0 && issues.length === 0)) {
    add({ message: 'o arquivo não tem nenhuma seção de dados («## Looker — ...», «## Clarity — ...» etc.)' })
  }

  if (issues.length > 0 || !meta) return { ok: false, issues }
  return { ok: true, update: { meta, sections, limitations } }
}

function parseDataBlock(def: SectionDef, block: Block, add: (issue: ParseIssue) => void): Section | null {
  const startCount = { value: 0 }
  const report = (issue: ParseIssue) => {
    startCount.value++
    add({ section: def.heading, ...issue })
  }

  const keys: Record<string, KeyValue> = {}
  const sectionLimitations: string[] = []
  const listItems: string[] = []
  const allowedKeys = ['fonte', 'periodo', ...def.optionalKeys, ...(def.kind === 'table' ? ['limitacoes'] : [])]

  interface TableState {
    headerLine: number
    header: string[]
    separatorSeen: boolean
    rows: { line: number; cells: string[] }[]
  }
  let table: TableState | null = null
  let mode: 'meta' | 'table' | 'after' | 'limitations' = 'meta'

  for (const { n, t } of block.body) {
    if (t === '') {
      if (mode === 'table') mode = 'after'
      continue
    }

    if (t.startsWith('|')) {
      if (def.kind === 'list') {
        report({ line: n, message: 'esta seção é uma lista («- item»), não uma tabela' })
      } else if (mode === 'limitations') {
        report({ line: n, message: 'a tabela precisa vir antes de «limitacoes:»' })
      } else if (table === null) {
        table = { headerLine: n, header: splitCells(t), separatorSeen: false, rows: [] }
        mode = 'table'
      } else if (mode === 'after') {
        report({ line: n, message: 'a tabela foi interrompida por uma linha em branco (ou há uma segunda tabela) — cada seção tem uma tabela só, sem linhas em branco no meio' })
      } else if (!table.separatorSeen) {
        if (isSeparatorRow(t)) table.separatorSeen = true
        else report({ line: n, message: 'falta a linha separadora («|---|---|») logo abaixo do cabeçalho da tabela' })
      } else {
        table.rows.push({ line: n, cells: splitCells(t) })
      }
      continue
    }

    if (t.startsWith('- ')) {
      if (def.kind === 'list') listItems.push(t.slice(2).trim())
      else if (mode === 'limitations') sectionLimitations.push(t.slice(2).trim())
      else report({ line: n, message: `item de lista fora de «limitacoes:»: «${t}»` })
      continue
    }

    const keyMatch = KEY_LINE_RE.exec(t)
    if (keyMatch) {
      const key = normalizeName(keyMatch[1]).replace(/\s+/g, '_')
      if (key === 'limitacoes' && def.kind === 'table') {
        if (keyMatch[2].trim() !== '') report({ line: n, message: 'escreva as limitações em linhas «- ...» abaixo de «limitacoes:»' })
        mode = 'limitations'
        continue
      }
      if (!allowedKeys.includes(key)) {
        report({ line: n, message: `campo «${keyMatch[1]}:» não existe nesta seção (aceitos: ${allowedKeys.map((k) => `${k}:`).join(' ')})` })
        continue
      }
      if (keys[key]) {
        report({ line: n, message: `«${key}:» aparece duas vezes` })
        continue
      }
      keys[key] = { value: keyMatch[2].trim(), line: n }
      if (mode === 'table') mode = 'after'
      continue
    }

    report({ line: n, message: `linha não reconhecida: «${t}»` })
  }

  // Campos de cabeçalho da seção.
  const fonte = keys.fonte
  if (!fonte || fonte.value === '') report({ line: block.line, message: 'falta «fonte:» (ex.: fonte: ' + def.fonte + ')' })
  else if (normalizeName(fonte.value) !== def.fonte) report({ line: fonte.line, message: `fonte «${fonte.value}» não combina com esta seção (esperado: ${def.fonte})` })

  const periodoRaw = keys.periodo
  let periodo: Section['periodo'] | null = null
  if (!periodoRaw || periodoRaw.value === '') {
    report({ line: block.line, message: 'falta «periodo:» (formato AAAA-MM-DD..AAAA-MM-DD)' })
  } else {
    const parsed = parsePeriod(periodoRaw.value)
    if (parsed.ok) periodo = parsed.period
    else report({ line: periodoRaw.line, message: parsed.message })
  }

  let periodoComparacao: Section['periodoComparacao']
  if (keys.periodo_comparacao) {
    const parsed = parsePeriod(keys.periodo_comparacao.value)
    if (parsed.ok) periodoComparacao = parsed.period
    else report({ line: keys.periodo_comparacao.line, message: `periodo_comparacao: ${parsed.message}` })
  }

  // Dados.
  let data: unknown
  if (def.kind === 'list') {
    if (listItems.length === 0) report({ line: block.line, message: 'a lista não tem nenhum item («- ...»)' })
    data = listItems
  } else {
    data = parseTable(def, table, report, block.line)
  }

  if (startCount.value > 0 || !periodo || data === undefined) return null

  return {
    key: def.key,
    heading: def.heading,
    fonte: def.fonte,
    periodo,
    ...(periodoComparacao ? { periodoComparacao } : {}),
    ...(keys.nota?.value ? { nota: keys.nota.value } : {}),
    ...(keys.descricao_fonte?.value ? { descricaoFonte: keys.descricao_fonte.value } : {}),
    limitations: sectionLimitations,
    data,
  } as Section
}

function parseTable(
  def: SectionDef,
  table: { headerLine: number; header: string[]; separatorSeen: boolean; rows: { line: number; cells: string[] }[] } | null,
  report: (issue: ParseIssue) => void,
  headingLine: number,
): unknown {
  const spec: TableSpec | undefined = TABLE_SPECS[def.key]
  if (!spec) return undefined
  if (!table) {
    report({ line: headingLine, message: 'a seção não tem a tabela de dados' })
    return undefined
  }
  if (!table.separatorSeen) {
    report({ line: table.headerLine, message: 'falta a linha separadora («|---|---|») logo abaixo do cabeçalho da tabela' })
    return undefined
  }

  // Cabeçalho: mesmas colunas do modelo (ordem livre, nomes exatos).
  const header = table.header.map((name) => normalizeName(name))
  const expected = def.columns.map((name) => normalizeName(name))
  const missing = expected.filter((name) => !header.includes(name))
  const extra = header.filter((name) => !expected.includes(name))
  const repeated = header.filter((name, index) => header.indexOf(name) !== index)
  if (missing.length > 0 || extra.length > 0 || repeated.length > 0) {
    const parts = [
      missing.length > 0 ? `faltam as colunas ${missing.map((c) => `«${c}»`).join(', ')}` : null,
      extra.length > 0 ? `colunas desconhecidas ${extra.map((c) => `«${c}»`).join(', ')}` : null,
      repeated.length > 0 ? `colunas repetidas ${repeated.map((c) => `«${c}»`).join(', ')}` : null,
    ].filter(Boolean)
    report({ line: table.headerLine, message: `cabeçalho da tabela fora do modelo: ${parts.join('; ')}. Colunas esperadas: ${def.columns.join(' | ')}` })
    return undefined
  }
  if (table.rows.length === 0) {
    report({ line: table.headerLine, message: 'a tabela não tem nenhuma linha de dados' })
    return undefined
  }

  const validRows: RawRow[] = []
  let rowIssues = 0
  for (const { line, cells } of table.rows) {
    if (cells.length !== header.length) {
      report({ line, message: `a linha tem ${cells.length} células, mas o cabeçalho tem ${header.length}` })
      rowIssues++
      continue
    }
    const row: Record<string, unknown> = {}
    let numberProblem = false
    def.columns.forEach((column) => {
      const cell = cells[header.indexOf(normalizeName(column))]
      if (cell === '') return // célula vazia = campo ausente (nunca 0)
      if (spec.numeric[column]) {
        const parsed = parseStrictNumber(cell)
        if (!parsed.ok) {
          report({ line, message: `coluna «${column}»: ${parsed.message}` })
          numberProblem = true
        } else row[column] = parsed.value
      } else row[column] = cell
    })
    if (numberProblem) {
      rowIssues++
      continue
    }
    const check = spec.schema.safeParse(row)
    if (!check.success) {
      for (const issue of check.error.issues) {
        const column = issue.path.length > 0 ? `coluna «${String(issue.path[0])}»: ` : ''
        report({ line, message: `${column}${issue.message}` })
      }
      rowIssues++
      continue
    }
    validRows.push({ line, row: check.data as Record<string, unknown> })
  }
  if (rowIssues > 0) return undefined

  let buildIssues = 0
  const data = spec.build(validRows, (line, message) => {
    buildIssues++
    report({ line, message })
  })
  if (buildIssues > 0) return undefined
  if (spec.isEmpty(data)) {
    report({ line: table.headerLine, message: 'nenhum valor preenchido nesta seção (todas as células de dado estão vazias) — se não há dado novo, apague a seção inteira' })
    return undefined
  }
  return data
}
