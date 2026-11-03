// Confere os números contra 05-atualizacoes-diarias/2026-11-03/clarity-2026-10-31_a_11-02.json
// (consulta real via query-analytics-dashboard, 31/10 a 02/11/2026).

import { describe, expect, it } from 'vitest'
import {
  CLARITY_CHECKOUT_FRICTION,
  CLARITY_CHECKOUT_NOTES,
  CLARITY_CHECKOUT_PERIOD,
  CLARITY_SESSIONS_BY_DEVICE,
  CRITICAL_DEAD_CLICK_SHARE_THRESHOLD,
  deadClickShare,
  isCriticalPage,
} from '../clarity-checkout-friction'

describe('CLARITY_CHECKOUT_PERIOD', () => {
  it('cobre 31/10 a 02/11/2026 (sábado, domingo e Finados)', () => {
    expect(CLARITY_CHECKOUT_PERIOD).toEqual({ from: '2026-10-31', to: '2026-11-02' })
  })
})

describe('CLARITY_CHECKOUT_FRICTION', () => {
  it('tem as 6 páginas de checkout, batendo com a extração real', () => {
    expect(CLARITY_CHECKOUT_FRICTION).toHaveLength(6)
    const cart = CLARITY_CHECKOUT_FRICTION.find((p) => p.path === '/checkout/v2/cart')
    expect(cart).toEqual({ path: '/checkout/v2/cart', label: 'Carrinho', deadClicks: 5910, rageClicks: 226, quickBacks: 288 })
  })

  it('cada página bate com a tabela da extração (dead / rage / quick backs)', () => {
    const byPath = Object.fromEntries(CLARITY_CHECKOUT_FRICTION.map((p) => [p.path, [p.deadClicks, p.rageClicks, p.quickBacks]]))
    expect(byPath).toEqual({
      '/checkout/v2/cart': [5910, 226, 288],
      '/checkout/v2/servicos-escolha': [4940, 53, 98],
      '/checkout/v2/delivery/type': [35, 12, 2],
      '/checkout/v2/delivery/send': [927, 12, 30],
      '/checkout/v2/payment': [723, 6, 24],
      '/checkout/v2/confirmation': [314, 1, 42],
    })
  })

  it('os totais fecham com o resumo da extração (12.849 / 310 / 484)', () => {
    const sum = (key: 'deadClicks' | 'rageClicks' | 'quickBacks') => CLARITY_CHECKOUT_FRICTION.reduce((total, p) => total + p[key], 0)
    expect(sum('deadClicks')).toBe(12849)
    expect(sum('rageClicks')).toBe(310)
    expect(sum('quickBacks')).toBe(484)
  })

  it('o Carrinho concentra ~46% dos dead clicks, ~73% dos rage clicks e ~60% dos quick backs', () => {
    const cart = CLARITY_CHECKOUT_FRICTION[0]
    const total = (key: 'deadClicks' | 'rageClicks' | 'quickBacks') => CLARITY_CHECKOUT_FRICTION.reduce((s, p) => s + p[key], 0)
    expect(Math.round((cart.deadClicks / total('deadClicks')) * 100)).toBe(46)
    expect(Math.round((cart.rageClicks / total('rageClicks')) * 100)).toBe(73)
    expect(Math.round((cart.quickBacks / total('quickBacks')) * 100)).toBe(60)
  })

  it('não inventa divisão por dispositivo: cada linha tem só path, label e os 3 contadores', () => {
    for (const page of CLARITY_CHECKOUT_FRICTION) {
      expect(Object.keys(page).sort()).toEqual(['deadClicks', 'label', 'path', 'quickBacks', 'rageClicks'])
    }
  })
})

describe('CLARITY_SESSIONS_BY_DEVICE', () => {
  it('bate com o total real por dispositivo (contexto do site)', () => {
    expect(CLARITY_SESSIONS_BY_DEVICE).toEqual({ mobile: 100094, desktop: 14594, tablet: 596, other: 11, total: 115295 })
  })

  it('a soma dos dispositivos fecha no total', () => {
    const { mobile, desktop, tablet, other, total } = CLARITY_SESSIONS_BY_DEVICE
    expect(mobile + desktop + tablet + other).toBe(total)
  })
})

describe('CLARITY_CHECKOUT_NOTES', () => {
  it('avisa que o período tem sábado, domingo e Finados e que o desktop caiu vs. 27–29/10', () => {
    const note = CLARITY_CHECKOUT_NOTES.find((n) => n.includes('Finados'))
    expect(note).toBeDefined()
    expect(note).toContain('sábado')
    expect(note).toContain('domingo')
    expect(note).toContain('53.490')
    expect(note).toContain('14.594')
    expect(note).toContain('não comparar com dias úteis')
  })

  it('mantém as limitações que já existiam (sem divisão por dispositivo, /delivery/type baixo, janela de 1–3 dias)', () => {
    expect(CLARITY_CHECKOUT_NOTES.some((n) => n.includes('sem segmentação por dispositivo'))).toBe(true)
    expect(CLARITY_CHECKOUT_NOTES.some((n) => n.includes('/checkout/v2/delivery/type') && n.includes('volume muito baixo'))).toBe(true)
    expect(CLARITY_CHECKOUT_NOTES.some((n) => n.includes('1–3 dias fechados'))).toBe(true)
  })
})

describe('deadClickShare / isCriticalPage', () => {
  it('o Carrinho concentra mais de 40% dos dead clicks — fica marcado como crítico', () => {
    const cart = CLARITY_CHECKOUT_FRICTION[0]
    expect(deadClickShare(cart)).toBeGreaterThan(CRITICAL_DEAD_CLICK_SHARE_THRESHOLD)
    expect(isCriticalPage(cart)).toBe(true)
  })

  it('a Escolha de serviços (~38%) fica logo abaixo do limiar e só o Carrinho é crítico', () => {
    const servicos = CLARITY_CHECKOUT_FRICTION.find((p) => p.path === '/checkout/v2/servicos-escolha')!
    expect(deadClickShare(servicos)).toBeLessThan(CRITICAL_DEAD_CLICK_SHARE_THRESHOLD)
    expect(CLARITY_CHECKOUT_FRICTION.filter((p) => isCriticalPage(p)).map((p) => p.label)).toEqual(['Carrinho'])
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
