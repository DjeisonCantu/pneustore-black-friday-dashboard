// Guarda os 6 caminhos reais e validados do checkout contra edição acidental
// (Missão 04 — Etapa C2). Se este teste falhar após uma mudança, confirme a
// mudança contra 04-validacao/10-inventario-fontes-reais.md antes de ajustar
// o teste — nunca o contrário.

import { describe, expect, it } from 'vitest'
import { CHECKOUT_PAGES, checkoutPageLabel, findCheckoutPage } from '../checkout-pages'

const VALIDATED_PATHS = [
  '/checkout/v2/cart',
  '/checkout/v2/servicos-escolha',
  '/checkout/v2/delivery/type',
  '/checkout/v2/delivery/send',
  '/checkout/v2/payment',
  '/checkout/v2/confirmation',
]

describe('CHECKOUT_PAGES', () => {
  it('tem exatamente as 6 páginas confirmadas na auditoria real (Etapa C1)', () => {
    expect(CHECKOUT_PAGES.map((p) => p.path)).toEqual(VALIDATED_PATHS)
  })

  it('todas são marcadas como "navegacao" — nenhuma é tratada como evento efetivo do GA4', () => {
    expect(CHECKOUT_PAGES.every((p) => p.kind === 'navegacao')).toBe(true)
  })

  it('todas têm rótulo em português e ordem definida', () => {
    for (const page of CHECKOUT_PAGES) {
      expect(page.label.length).toBeGreaterThan(0)
      expect(page.order).toBeGreaterThan(0)
    }
  })

  it('findCheckoutPage encontra uma página conhecida e não encontra uma desconhecida', () => {
    expect(findCheckoutPage('/checkout/v2/cart')?.label).toBe('Carrinho')
    expect(findCheckoutPage('/rota/inventada')).toBeUndefined()
  })

  it('checkoutPageLabel nunca inventa um nome para um caminho desconhecido — devolve o próprio caminho', () => {
    expect(checkoutPageLabel('/rota/inventada')).toBe('/rota/inventada')
  })
})
