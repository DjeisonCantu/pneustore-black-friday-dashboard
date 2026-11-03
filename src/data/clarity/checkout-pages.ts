// As 6 páginas de checkout já confirmadas por acesso real ao Clarity — única
// lista no projeto: o parser de atualizações só aceita estas páginas e a UI
// usa a mesma ordem e os mesmos rótulos. Nunca adicionar nem trocar uma
// página sem nova confirmação.

export interface CheckoutPageDef {
  path: string
  label: string
}

export const CHECKOUT_PAGES: readonly CheckoutPageDef[] = [
  { path: '/checkout/v2/cart', label: 'Carrinho' },
  { path: '/checkout/v2/servicos-escolha', label: 'Escolha de serviços' },
  { path: '/checkout/v2/delivery/type', label: 'Tipo de entrega' },
  { path: '/checkout/v2/delivery/send', label: 'Endereço de entrega' },
  { path: '/checkout/v2/payment', label: 'Pagamento' },
  { path: '/checkout/v2/confirmation', label: 'Confirmação' },
]

export const CHECKOUT_PAGE_PATHS: readonly string[] = CHECKOUT_PAGES.map((page) => page.path)

export function checkoutPageLabel(path: string): string {
  return CHECKOUT_PAGES.find((page) => page.path === path)?.label ?? path
}
