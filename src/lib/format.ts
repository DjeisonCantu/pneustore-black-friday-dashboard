const LOCALE = 'pt-BR'
const TIME_ZONE = 'America/Sao_Paulo'

export function formatInt(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(Math.round(value))
}

export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyCompactBRL(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(value: number, digits = 2): string {
  return `${formatDecimal(value, digits)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date)
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

export function formatDateRangeLabel(from: Date, to: Date): string {
  if (from.toDateString() === to.toDateString()) {
    return formatDate(from)
  }
  return `${formatDate(from)} a ${formatDate(to)}`
}

const MONTH_ABBREVIATIONS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Selo compacto de período a partir de datas ISO (AAAA-MM-DD), sem passar
 * por `Date` (evita deslocamento de fuso): mesmo mês → "01–02/nov"; meses
 * diferentes → "31/10–02/11"; dia único → "02/nov".
 */
export function formatPeriodCompact(from: string, to: string): string {
  const [, fromMonth, fromDay] = from.split('-')
  const [, toMonth, toDay] = to.split('-')
  const monthName = (month: string) => MONTH_ABBREVIATIONS[Number(month) - 1] ?? month

  if (from === to) return `${toDay}/${monthName(toMonth)}`
  if (fromMonth === toMonth) return `${fromDay}–${toDay}/${monthName(toMonth)}`
  return `${fromDay}/${fromMonth}–${toDay}/${toMonth}`
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'short', timeZone: TIME_ZONE }).format(date)
}
