// Sinais de atrito do checkout — Microsoft Clarity, 31/10 a 02/11/2026 (3 dias
// fechados, janela máxima da API pública de Data Export). Atualização de
// 03/11/2026: módulo estático e simples (mesmo padrão de
// pre-black-executive-report.ts) — sem contrato Zod nem pipeline
// assíncrono. Consulta real via query-analytics-dashboard, agregada
// manualmente em 05-atualizacoes-diarias/2026-11-03/clarity-2026-10-31_a_11-02.json.
// O snapshot anterior (27–29/10) continua arquivado em
// 05-atualizacoes-diarias/2026-10-30/ — não é exibido nem comparado aqui.
//
// Período com sábado, domingo e o feriado de Finados (02/11): dias NÃO
// comparáveis com os dias úteis de 27–29/10 — por isso nenhuma comparação
// automática entre os dois períodos existe nem deve ser criada na interface.
//
// Agregado para TODOS os dispositivos juntos — a consulta real não trouxe
// segmentação por dispositivo para o atrito do checkout (ver notas abaixo).
// Usa só as 6 páginas de checkout já confirmadas por acesso real anterior —
// nunca adicionar nem trocar nenhuma sem nova confirmação.

export const CLARITY_CHECKOUT_PERIOD = { from: '2026-10-31', to: '2026-11-02' }

export interface CheckoutPageFriction {
  path: string
  label: string
  deadClicks: number
  rageClicks: number
  quickBacks: number
}

export const CLARITY_CHECKOUT_FRICTION: CheckoutPageFriction[] = [
  { path: '/checkout/v2/cart', label: 'Carrinho', deadClicks: 5910, rageClicks: 226, quickBacks: 288 },
  { path: '/checkout/v2/servicos-escolha', label: 'Escolha de serviços', deadClicks: 4940, rageClicks: 53, quickBacks: 98 },
  { path: '/checkout/v2/delivery/type', label: 'Tipo de entrega', deadClicks: 35, rageClicks: 12, quickBacks: 2 },
  { path: '/checkout/v2/delivery/send', label: 'Endereço de entrega', deadClicks: 927, rageClicks: 12, quickBacks: 30 },
  { path: '/checkout/v2/payment', label: 'Pagamento', deadClicks: 723, rageClicks: 6, quickBacks: 24 },
  { path: '/checkout/v2/confirmation', label: 'Confirmação', deadClicks: 314, rageClicks: 1, quickBacks: 42 },
]

/** Sessões do SITE inteiro no período — só contexto (metadata), nunca sessões por página de checkout. */
export const CLARITY_SESSIONS_BY_DEVICE = { mobile: 100094, desktop: 14594, tablet: 596, other: 11, total: 115295 }

export const CLARITY_CHECKOUT_NOTES = [
  'Período com sábado (31/10), domingo (01/11) e o feriado de Finados (02/11): o desktop caiu de 53.490 para 14.594 sessões em relação a 27–29/10 — não comparar com dias úteis.',
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
