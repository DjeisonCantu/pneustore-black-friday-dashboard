// Confere os números contra 05-atualizacoes-diarias/2026-10-30/clarity-2026-10-27_a_29.json
// (consulta real via query-analytics-dashboard).

import { describe, expect, it } from 'vitest'
import {
  CLARITY_CHECKOUT_FRICTION,
  CLARITY_SESSIONS_BY_DEVICE,
  CRITICAL_DEAD_CLICK_SHARE_THRESHOLD,
  deadClickShare,
  isCriticalPage,
} from '../clarity-checkout-friction'

describe('CLARITY_CHECKOUT_FRICTION', () => {
  it('tem as 6 páginas de checkout, batendo com a extração real', () => {
    expect(CLARITY_CHECKOUT_FRICTION).toHaveLength(6)
    const cart = CLARITY_CHECKOUT_FRICTION.find((p) => p.path === '/checkout/v2/cart')
    expect(cart).toEqual({ path: '/checkout/v2/cart', label: 'Carrinho', deadClicks: 10129, rageClicks: 626, quickBacks: 542 })
  })
})

describe('CLARITY_SESSIONS_BY_DEVICE', () => {
  it('bate com o total real por dispositivo', () => {
    expect(CLARITY_SESSIONS_BY_DEVICE).toEqual({ mobile: 110378, desktop: 53490, tablet: 745, other: 13, total: 164626 })
  })
})

describe('deadClickShare / isCriticalPage', () => {
  it('o Carrinho concentra mais de 40% dos dead clicks — fica marcado como crítico', () => {
    const cart = CLARITY_CHECKOUT_FRICTION[0]
    expect(deadClickShare(cart)).toBeGreaterThan(CRITICAL_DEAD_CLICK_SHARE_THRESHOLD)
    expect(isCriticalPage(cart)).toBe(true)
  })

  it('a Confirmação, com pouco volume, não é marcada como crítica', () => {
    const confirmation = CLARITY_CHECKOUT_FRICTION.find((p) => p.path === '/checkout/v2/confirmation')!
    expect(isCriticalPage(confirmation)).toBe(false)
  })

  it('a soma das participações das 6 páginas fecha em 100%', () => {
    const total = CLARITY_CHECKOUT_FRICTION.reduce((sum, p) => sum + deadClickShare(p), 0)
    expect(total).toBeCloseTo(100, 5)
  })
})
