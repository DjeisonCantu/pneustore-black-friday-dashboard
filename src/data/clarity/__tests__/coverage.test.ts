// Testes de cobertura de período do Clarity — Missão 04, Etapa C3.

import { describe, expect, it } from 'vitest'
import { clarityCoverageMessage, evaluateClarityPeriodCoverage } from '../coverage'

const SNAPSHOT_PERIOD = { from: '2026-11-25', to: '2026-11-27' }

describe('evaluateClarityPeriodCoverage', () => {
  it('"full" quando o período selecionado está inteiramente dentro da janela extraída', () => {
    const selected = { from: new Date('2026-11-26T00:00:00-03:00'), to: new Date('2026-11-26T23:59:59-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('full')
  })

  it('"full" quando o período selecionado é exatamente igual à janela extraída', () => {
    const selected = { from: new Date('2026-11-25T00:00:00-03:00'), to: new Date('2026-11-27T23:59:59-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('full')
  })

  it('"partial" quando o período selecionado é mais amplo que a janela extraída (ex.: "7 dias")', () => {
    const selected = { from: new Date('2026-11-21T00:00:00-03:00'), to: new Date('2026-11-27T23:59:59-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('partial')
  })

  it('"partial" quando há sobreposição parcial nas bordas', () => {
    const selected = { from: new Date('2026-11-26T00:00:00-03:00'), to: new Date('2026-12-01T00:00:00-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('partial')
  })

  it('"none" quando o período selecionado é inteiramente anterior à janela extraída', () => {
    const selected = { from: new Date('2026-11-01T00:00:00-03:00'), to: new Date('2026-11-10T00:00:00-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('none')
  })

  it('"none" quando o período selecionado é inteiramente posterior à janela extraída', () => {
    const selected = { from: new Date('2026-12-05T00:00:00-03:00'), to: new Date('2026-12-10T00:00:00-03:00') }
    expect(evaluateClarityPeriodCoverage(selected, SNAPSHOT_PERIOD)).toBe('none')
  })
})

describe('clarityCoverageMessage', () => {
  it('devolve null para cobertura "full" — nada a avisar', () => {
    expect(clarityCoverageMessage('full', SNAPSHOT_PERIOD)).toBeNull()
  })

  it('menciona a janela real extraída para "partial"', () => {
    const message = clarityCoverageMessage('partial', SNAPSHOT_PERIOD)
    expect(message).toContain('2026-11-25')
    expect(message).toContain('2026-11-27')
    expect(message?.toLowerCase()).toContain('parcial')
  })

  it('menciona a janela real extraída para "none", sem sugerir que há dados do período selecionado', () => {
    const message = clarityCoverageMessage('none', SNAPSHOT_PERIOD)
    expect(message).toContain('2026-11-25')
    expect(message).toContain('2026-11-27')
    expect(message?.toLowerCase()).toContain('sem sinais')
  })

  it('não repete a data quando from === to', () => {
    const message = clarityCoverageMessage('none', { from: '2026-11-27', to: '2026-11-27' })
    expect(message).toContain('2026-11-27')
    expect(message?.match(/2026-11-27/g)).toHaveLength(1)
  })
})
