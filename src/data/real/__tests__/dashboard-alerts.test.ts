import { describe, expect, it } from 'vitest'
import { buildDashboardAlerts } from '../dashboard-alerts'

describe('buildDashboardAlerts', () => {
  it('nunca devolve mais de 2 alertas', () => {
    expect(buildDashboardAlerts().length).toBeLessThanOrEqual(2)
  })

  it('aponta o Carrinho como atrito alto (concentra mais de 40% dos dead clicks)', () => {
    expect(buildDashboardAlerts()).toContainEqual({ label: 'Carrinho: atrito alto' })
  })

  it('aponta o canal com maior queda de receita (Outros, -20,1%)', () => {
    expect(buildDashboardAlerts()).toContainEqual({ label: 'Outros: receita em queda' })
  })
})
