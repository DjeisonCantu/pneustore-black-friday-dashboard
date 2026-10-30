// Dados do "Resumo Executivo Pré-Black" — relatório de UX Research enviado
// ao CX em 20/10/2026, que motivou a criação deste dashboard. Atualização de
// 30/10/2026: a pedido do dono do projeto, os números deste relatório
// passaram a ser os números do dashboard — sem recálculo nem
// reinterpretação, só o que o próprio relatório mostra. Toda métrica aqui
// vem do GA4 ou do Clarity (nunca uma terceira fonte) — conferido slide a
// slide contra o PDF original.
//
// Estrutura deliberadamente simples: módulo estático, sem contrato Zod nem
// pipeline assíncrono (ver src/data/async-snapshot/). É um relatório fechado
// de uma semana específica, não um snapshot que será revalidado a cada
// atualização diária — forçá-lo nos contratos de GA4/Clarity existentes
// (pensados para outra forma de dado) só adicionaria complexidade sem
// necessidade.

export const PRE_BLACK_REPORT_SOURCE = 'PneuStore_Resumo_Executivo_PreBlack_2026.pdf (PneuStore · UX Research)'
export const PRE_BLACK_REPORT_PERIOD = { from: '2026-10-14', to: '2026-10-20' }
export const PRE_BLACK_REPORT_COMPARISON_PERIOD = { from: '2025-10-14', to: '2025-10-20' }

export interface YearPair {
  y2025: number
  y2026: number
}

/** Variação percentual simples (b em relação a a) — a mesma conta que o próprio relatório mostra. */
export function percentDelta({ y2025, y2026 }: YearPair): number {
  return ((y2026 - y2025) / y2025) * 100
}

export const GA4_WEEKLY = {
  sessions: { y2025: 707350, y2026: 404343 } satisfies YearPair,
  conversionRatePercent: { y2025: 1.38, y2026: 1.98 } satisfies YearPair,
  revenueEstimatedBRL: { y2025: 14600000, y2026: 12040000 } satisfies YearPair,
  averageTicketBRL: { y2025: 1491.02, y2026: 1502.0 } satisfies YearPair,
  note: 'Fonte: GA4 transcrito no relatório. Receita calculada por pedidos × ticket médio (estimativa, não é a receita bruta do GA4). Métricas agregadas de todo o site — não isolam o efeito de mudanças na jornada.',
}

export interface DeviceStep {
  label: string
  mobile: number
  desktop: number
}

export const CLARITY_FUNNEL_2026: { steps: DeviceStep[]; note: string } = {
  steps: [
    { label: 'Instalação para carrinho', mobile: 60, desktop: 87 },
    { label: 'Carrinho para frete', mobile: 34, desktop: 39 },
    { label: 'Pagamento para confirmação', mobile: 83, desktop: 75 },
  ],
  note: 'Clarity. Visitas por URL, sem sequência validada. Instalação e pagamento: complemento das taxas de saída do relatório.',
}

export const CLARITY_DEAD_CLICKS_2026: { steps: DeviceStep[]; recordings: string[]; note: string } = {
  steps: [
    { label: 'Instalação', mobile: 0.25, desktop: 0.55 },
    { label: 'Carrinho', mobile: 0.36, desktop: 1.17 },
    { label: 'Frete / entrega', mobile: 0.28, desktop: 0.4 },
    { label: 'Pagamento', mobile: 0.14, desktop: 0.59 },
  ],
  recordings: [
    'Idas e voltas entre checkout e carrinho.',
    'Cards de instalação e opções de frete recebem cliques repetidos.',
    'Cadastro incompleto impede um usuário de avançar no pagamento.',
  ],
  note: 'Clarity. Relatos de 15 sessões mobile selecionadas por cliques, com leitura parcial. Não medem frequência. Desktop ainda não analisado — tratar os valores de desktop acima como preliminares.',
}

export interface DeviceYearPair {
  mobile: YearPair
  desktop: YearPair
}

export const CLARITY_YOY = {
  productToConfirmedOrderPercent: {
    mobile: { y2025: 1.6, y2026: 3.3 },
    desktop: { y2025: 3.7, y2026: 6.7 },
  } satisfies DeviceYearPair,
  sessionsWithDeadClickPercent: {
    mobile: { y2025: 11.2, y2026: 15.2 },
    desktop: { y2025: 18.4, y2026: 27.1 },
  } satisfies DeviceYearPair,
  clarityCoverageOfGa4SessionsPercent: { y2025: 2.5, y2026: 86 } satisfies YearPair,
  note: 'Plataformas e captura diferentes limitam a comparação — a cobertura do Clarity mudou de 2,5% das sessões do GA4 em 2025 para 86% em 2026. Estes dados não comprovam melhora ou piora causada pela nova interface.',
}

export interface PriorityItem {
  title: string
  detail: string
  owner: string
}

export const PRE_BLACK_PRIORITIES: PriorityItem[] = [
  { title: 'Investigar checkout e carrinho', detail: 'Checar redirecionamento/login e analisar 20 gravações desktop.', owner: 'Desenvolvimento + UX' },
  { title: 'Validar a compreensão das telas', detail: 'Teste remoto com 5 a 6 clientes em instalação mobile e carrinho/frete.', owner: 'UX + Produto' },
  { title: 'Revisar a mensuração', detail: 'Recuperar eventos de serviço e verificar cobertura do add_to_cart.', owner: 'Analytics' },
  { title: 'Definir o que cabe antes da Black', detail: 'Confirmar congelamento de código e ajustes possíveis. Repetir a análise na Black.', owner: 'Produto + Desenvolvimento' },
]
