// Mapeamento validado das páginas reais de checkout — Missão 04, Etapa C2.
//
// Caminhos confirmados por ACESSO REAL ao Clarity do projeto PneuStore em
// 28/10/2026 (ver 04-validacao/10-inventario-fontes-reais.md, seção 3 —
// consulta de dead clicks por URL de checkout). Não foram inventados.
//
// IMPORTANTE — navegação vs. evento efetivo: as seis entradas abaixo são
// PÁGINAS (URLs) do ponto de vista do Clarity, que rastreia por URL
// visitada — não são os eventos de e-commerce nomeados do GA4
// (`view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`,
// `purchase`). Uma correspondência 1:1 entre esta lista de URLs e aqueles
// eventos do GA4 **não foi confirmada** — depende do teste T-GA4-06
// (`04-validacao/08-plano-teste-ga4.md`). Por isso `kind` é sempre
// `'navegacao'` aqui: nunca rotular isso como "evento" sem essa confirmação
// (evita o mesmo tipo de erro de unidade que RA-01/RA-02 já proíbem).

export type CheckoutPageKind = 'navegacao'

export interface CheckoutPageDefinition {
  /** Caminho exato da URL, como visto no Clarity (sem domínio). */
  path: string
  /** Rótulo em português para exibição na UI. */
  label: string
  /** Ordem aproximada no funil de checkout, só para exibição — nunca usada para calcular abandono (D-05). */
  order: number
  kind: CheckoutPageKind
}

export const CHECKOUT_PAGES: readonly CheckoutPageDefinition[] = [
  { path: '/checkout/v2/cart', label: 'Carrinho', order: 1, kind: 'navegacao' },
  { path: '/checkout/v2/servicos-escolha', label: 'Escolha de serviços', order: 2, kind: 'navegacao' },
  { path: '/checkout/v2/delivery/type', label: 'Tipo de entrega', order: 3, kind: 'navegacao' },
  { path: '/checkout/v2/delivery/send', label: 'Endereço de entrega', order: 4, kind: 'navegacao' },
  { path: '/checkout/v2/payment', label: 'Pagamento', order: 5, kind: 'navegacao' },
  { path: '/checkout/v2/confirmation', label: 'Confirmação', order: 6, kind: 'navegacao' },
]

export type CheckoutPagePath = (typeof CHECKOUT_PAGES)[number]['path']

export function findCheckoutPage(path: string): CheckoutPageDefinition | undefined {
  return CHECKOUT_PAGES.find((p) => p.path === path)
}

/** Rótulo amigável; devolve o próprio caminho se não for uma das seis páginas conhecidas (nunca inventa um nome). */
export function checkoutPageLabel(path: string): string {
  return findCheckoutPage(path)?.label ?? path
}
