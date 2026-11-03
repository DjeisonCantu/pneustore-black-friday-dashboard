// Datas e períodos — módulo puro (sem DOM nem Node), usado pelo parser, pelo
// merge, pela prévia e pela UI. Opera sobre strings ISO (AAAA-MM-DD) para
// nunca deslocar um dia por fuso horário.

export interface Period {
  from: string
  to: string
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/
const PERIOD_RE = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/

/** `true` só para datas que existem no calendário (rejeita "2026-02-30"). */
export function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** Data (AAAA-MM-DD) ou data e hora ISO 8601 — aceito em `gerado_em`. */
export function isIsoDateOrDateTime(value: string): boolean {
  if (ISO_DATE_RE.test(value)) return isRealIsoDate(value)
  if (!ISO_DATE_TIME_RE.test(value)) return false
  return isRealIsoDate(value.slice(0, 10)) && !Number.isNaN(Date.parse(value))
}

export type PeriodParse = { ok: true; period: Period } | { ok: false; message: string }

/** Lê "AAAA-MM-DD..AAAA-MM-DD" — datas reais e from ≤ to. Nunca adivinha. */
export function parsePeriod(raw: string): PeriodParse {
  const match = PERIOD_RE.exec(raw.trim())
  if (!match) return { ok: false, message: `período «${raw.trim()}» fora do formato AAAA-MM-DD..AAAA-MM-DD` }
  const [, from, to] = match
  if (!isRealIsoDate(from)) return { ok: false, message: `data inicial «${from}» não existe no calendário` }
  if (!isRealIsoDate(to)) return { ok: false, message: `data final «${to}» não existe no calendário` }
  if (from > to) return { ok: false, message: `a data inicial (${from}) vem depois da final (${to})` }
  return { ok: true, period: { from, to } }
}

export function samePeriod(a: Period, b: Period): boolean {
  return a.from === b.from && a.to === b.to
}

/** Os dois períodos têm pelo menos um dia em comum. */
export function periodsOverlap(a: Period, b: Period): boolean {
  return a.from <= b.to && b.from <= a.to
}

const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function parts(iso: string): { day: string; month: string } {
  const [, month, day] = iso.split('-')
  return { day, month }
}

/**
 * "27–29/10" (mesmo mês) ou "31/10–02/11" (meses diferentes); dia único: "02/11".
 * Mesmo formato que o site usava no rótulo de dead clicks antes das atualizações.
 */
export function formatPeriodNumeric(from: string, to: string): string {
  const a = parts(from)
  const b = parts(to)
  if (from === to) return `${b.day}/${b.month}`
  if (a.month === b.month) return `${a.day}–${b.day}/${b.month}`
  return `${a.day}/${a.month}–${b.day}/${b.month}`
}

/** "01–02/nov" (mesmo mês, mês abreviado); meses diferentes: "31/10–02/11"; dia único: "02/nov". */
export function formatPeriodCompact(from: string, to: string): string {
  const a = parts(from)
  const b = parts(to)
  const monthName = (month: string) => MONTH_ABBREVIATIONS[Number(month) - 1] ?? month
  if (from === to) return `${b.day}/${monthName(b.month)}`
  if (a.month === b.month) return `${a.day}–${b.day}/${monthName(b.month)}`
  return `${a.day}/${a.month}–${b.day}/${b.month}`
}

/** "27/10 a 29/10/2026" — formato longo usado no texto de "Sobre os dados". */
export function formatPeriodLong(from: string, to: string): string {
  const a = parts(from)
  const b = parts(to)
  return `${a.day}/${a.month} a ${b.day}/${b.month}/${to.slice(0, 4)}`
}
