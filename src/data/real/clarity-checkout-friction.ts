// Sinais de atrito do checkout — Microsoft Clarity, 27 a 29/10/2026 (3 dias
// fechados, janela máxima da API pública de Data Export). Atualização de
// 30/10/2026: módulo estático e simples (mesmo padrão de
// pre-black-executive-report.ts) — sem contrato Zod nem pipeline
// assíncrono. Consulta real via query-analytics-dashboard, agregada
// manualmente em 05-atualizacoes-diarias/2026-10-30/clarity-2026-10-27_a_29.json.
//
// Agregado para TODOS os dispositivos juntos — a consulta real não trouxe
// segmentação por dispositivo para o atrito do checkout (ver notas abaixo).
// Usa só as 6 páginas de checkout já confirmadas por acesso real anterior —
// nunca adicionar nem trocar nenhuma sem nova confirmação.

export const CLARITY_CHECKOUT_PERIOD = { from: '2026-10-27', to: '2026-10-29' }

export interface CheckoutPageFriction {
  path: string
  label: string
  deadClicks: number
  rageClicks: number
  quickBacks: number
}

export const CLARITY_CHECKOUT_FRICTION: CheckoutPageFriction[] = [
  { path: '/checkout/v2/cart', label: 'Carrinho', deadClicks: 10129, rageClicks: 626, quickBacks: 542 },
  { path: '/checkout/v2/servicos-escolha', label: 'Escolha de serviços', deadClicks: 8707, rageClicks: 289, quickBacks: 213 },
  { path: '/checkout/v2/delivery/type', label: 'Tipo de entrega', deadClicks: 40, rageClicks: 0, quickBacks: 2 },
  { path: '/checkout/v2/delivery/send', label: 'Endereço de entrega', deadClicks: 1490, rageClicks: 45, quickBacks: 54 },
  { path: '/checkout/v2/payment', label: 'Pagamento', deadClicks: 1338, rageClicks: 16, quickBacks: 64 },
  { path: '/checkout/v2/confirmation', label: 'Confirmação', deadClicks: 439, rageClicks: 9, quickBacks: 96 },
]

export const CLARITY_SESSIONS_BY_DEVICE = { mobile: 110378, desktop: 53490, tablet: 745, other: 13, total: 164626 }

export const CLARITY_CHECKOUT_NOTES = [
  'Atrito do checkout agregado para todos os dispositivos — sem segmentação por dispositivo nesta extração.',
  '/checkout/v2/delivery/type com volume muito baixo — a URL pode variar com parâmetros, ainda não confirmado.',
  'Janela pública de Data Export do Clarity limitada a 1–3 dias fechados.',
]

export const CLARITY_CHECKOUT_SOURCE = 'Microsoft Clarity (query-analytics-dashboard), agregado manualmente'

/** Limiar acima do qual uma etapa é marcada como crítica (ex.: "Carrinho: atrito alto"). */
export const CRITICAL_DEAD_CLICK_SHARE_THRESHOLD = 40

/** % que uma página representa do total de dead clicks do checkout. */
export function deadClickShare(page: CheckoutPageFriction, allPages: CheckoutPageFriction[] = CLARITY_CHECKOUT_FRICTION): number {
  const total = allPages.reduce((sum, p) => sum + p.deadClicks, 0)
  return total > 0 ? (page.deadClicks / total) * 100 : 0
}

export function isCriticalPage(page: CheckoutPageFriction, allPages: CheckoutPageFriction[] = CLARITY_CHECKOUT_FRICTION): boolean {
  return deadClickShare(page, allPages) > CRITICAL_DEAD_CLICK_SHARE_THRESHOLD
}
