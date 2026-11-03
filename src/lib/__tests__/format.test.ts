import { describe, expect, it } from 'vitest'
import { formatPeriodCompact } from '../format'

describe('formatPeriodCompact', () => {
  it('mesmo mês: dias com o mês abreviado no fim ("01–02/nov")', () => {
    expect(formatPeriodCompact('2026-11-01', '2026-11-02')).toBe('01–02/nov')
  })

  it('meses diferentes: dd/mm–dd/mm ("31/10–02/11", "06/10–02/11")', () => {
    expect(formatPeriodCompact('2026-10-31', '2026-11-02')).toBe('31/10–02/11')
    expect(formatPeriodCompact('2026-10-06', '2026-11-02')).toBe('06/10–02/11')
  })

  it('dia único: "02/nov"', () => {
    expect(formatPeriodCompact('2026-11-02', '2026-11-02')).toBe('02/nov')
  })

  it('opera sobre a string ISO — nunca desloca o dia por fuso horário', () => {
    expect(formatPeriodCompact('2026-10-01', '2026-10-31')).toBe('01–31/out')
  })
})
