// Visão do dashboard a partir das atualizações mescladas (data/updates/*.md →
// merge-updates). É a ÚNICA ponte entre o modelo de atualizações e a interface:
// os componentes leem só isto (via useRealData), nunca os .md nem JSON soltos.
//
// Regras:
//  - cada bloco carrega o PRÓPRIO período (o selo de cada bloco vem da seção
//    vigente que o alimenta, não de um período global);
//  - seção que nunca foi enviada vira `null` (o bloco some, nada é inventado);
//  - célula vazia no .md = `null` aqui (ausente, nunca 0);
//  - nenhuma conta nova: itens adicionados é a mesma estimativa de sempre
//    (itens vistos × %Add to Cart), e só existe quando o %Add to Cart veio.

import { checkoutPageLabel } from './clarity/checkout-pages.ts'
import { samePeriod } from './updates/dates.ts'
import type { MergedData } from './updates/merge-updates.ts'
import type { LimitationScope, Period, SectionKey } from './updates/types.ts'

export interface YearPair {
  y2025: number
  y2026: number
}

export interface DeviceYearPair {
  mobile: YearPair | null
  desktop: YearPair | null
}

export interface ChannelRevenueRow {
  channel: string
  sourceMedium: string
  revenue: number
}

export interface ChannelShareRow {
  channel: string
  revenueSharePercent: number
  /** Variação vs. o período anterior, calculada pelo Looker — `null` quando o arquivo não trouxe. */
  comparisonChangePercent: number | null
}

export interface BrandRow {
  brand: string
  itemsViewed: number
  /** Estimado: itens vistos × %Add to Cart do Looker, arredondado. `null` sem o %Add to Cart. */
  itemsAdded: number | null
  itemsPurchased: number
  itemRevenue: number
}

export interface OverviewView {
  /** Período do resumo do Looker (a referência para os selos próprios das outras tabelas). */
  period: Period | null
  /** Data/hora de geração do arquivo que alimenta o resumo. */
  extractedAt: string | null
  sessions: number | null
  users: number | null
  orders: number | null
  revenue: number | null
  channels: ChannelRevenueRow[]
  channelShares: ChannelShareRow[]
  /** Período próprio da tabela de canais — `null` quando é o mesmo do resumo (a UI não mostra selo próprio). */
  channelsPeriod: Period | null
  brands: BrandRow[]
  /** Período próprio da tabela de marcas — `null` quando é o mesmo do resumo. */
  catalogPeriod: Period | null
  limitations: string[]
}

export interface CheckoutPageFriction {
  path: string
  label: string
  deadClicks: number | null
  rageClicks: number | null
  quickBacks: number | null
}

export interface ClarityView {
  period: Period
  friction: CheckoutPageFriction[]
  /** Sessões do SITE inteiro no período — só contexto, nunca sessões por página de checkout. */
  sessionsByDevice: { mobile?: number; desktop?: number; tablet?: number; other?: number; total: number } | null
  notes: string[]
  source: string | null
}

export interface DeviceStep {
  label: string
  mobile: number | null
  desktop: number | null
}

export interface UxView {
  /** Período do relatório (o primeiro dos blocos de UX que existir) — usado no selo da barra de status. */
  period: Period | null
  weekly: {
    period: Period
    comparisonPeriod: Period | null
    sessions: YearPair | null
    conversionRatePercent: YearPair | null
    revenueEstimatedBRL: YearPair | null
    averageTicketBRL: YearPair | null
    note: string | null
  } | null
  funnel: { period: Period; steps: DeviceStep[]; note: string | null } | null
  deadClicks: { period: Period; steps: DeviceStep[]; recordings: string[]; note: string | null } | null
  yoy: {
    period: Period
    comparisonPeriod: Period | null
    productToConfirmedOrderPercent: DeviceYearPair
    sessionsWithDeadClickPercent: DeviceYearPair
    clarityCoverageOfGa4SessionsPercent: YearPair | null
    note: string | null
  } | null
  priorities: { period: Period; items: { title: string; detail: string; owner: string }[] } | null
  source: string | null
}

export interface DashboardAlert {
  label: string
}

export interface DashboardData {
  overview: OverviewView | null
  clarity: ClarityView | null
  ux: UxView
  alerts: DashboardAlert[]
}

// ---------------------------------------------------------------------------

/** Canal cuja receita caiu pelo menos esse tanto vs. o período anterior (ver channelShares). */
export const CHANNEL_DECLINE_ALERT_THRESHOLD = -15

/** Limiar acima do qual uma etapa do checkout é marcada como crítica (ex.: "Carrinho: atrito alto"). */
export const CRITICAL_DEAD_CLICK_SHARE_THRESHOLD = 40

/** Variação percentual simples (b em relação a a) — a mesma conta que o próprio relatório mostra. */
export function percentDelta({ y2025, y2026 }: YearPair): number {
  return ((y2026 - y2025) / y2025) * 100
}

/**
 * % que uma linha de origem/mídia representa da receita TOTAL do período —
 * nunca da soma das linhas exibidas (que costuma ser menor que o total).
 * `null` quando o total é desconhecido, em vez de dividir por algo que não é o total.
 */
export function channelRevenueShare(channelRevenue: number, periodTotalRevenue: number | null): number | null {
  if (periodTotalRevenue === null || periodTotalRevenue <= 0) return null
  return (channelRevenue / periodTotalRevenue) * 100
}

/** % que uma página representa do total de dead clicks do checkout (só páginas com o dado). */
export function deadClickShare(page: CheckoutPageFriction, allPages: readonly CheckoutPageFriction[]): number {
  if (page.deadClicks === null) return 0
  const total = allPages.reduce((sum, p) => sum + (p.deadClicks ?? 0), 0)
  return total > 0 ? (page.deadClicks / total) * 100 : 0
}

export function isCriticalPage(page: CheckoutPageFriction, allPages: readonly CheckoutPageFriction[]): boolean {
  return deadClickShare(page, allPages) > CRITICAL_DEAD_CLICK_SHARE_THRESHOLD
}

// ---------------------------------------------------------------------------

function pair(entry: { y2025: number; y2026: number } | undefined): YearPair | null {
  return entry ? { y2025: entry.y2025, y2026: entry.y2026 } : null
}

function limitationsFor(merged: MergedData, ...scopes: LimitationScope[]): string[] {
  return merged.limitations.filter((l) => scopes.includes(l.scope)).map((l) => l.text)
}

function stepsOf(rows: { etapa: string; mobile?: number; desktop?: number }[]): DeviceStep[] {
  return rows.map((r) => ({ label: r.etapa, mobile: r.mobile ?? null, desktop: r.desktop ?? null }))
}

function ownPeriod(period: Period, reference: Period | null): Period | null {
  return reference && samePeriod(period, reference) ? null : period
}

export function buildDashboardData(merged: MergedData): DashboardData {
  const current = merged.current
  const get = <K extends SectionKey>(key: K) => current[key]

  const resumo = get('looker.resumo')
  const canais = get('looker.canais')
  const origem = get('looker.origem')
  const marcas = get('looker.marcas')
  const referencePeriod = resumo?.section.periodo ?? null

  let overview: OverviewView | null = null
  if (resumo || canais || origem || marcas) {
    const metrics = resumo?.section.data
    overview = {
      period: referencePeriod,
      extractedAt: resumo?.geradoEm ?? null,
      sessions: metrics?.sessoes?.value ?? null,
      users: metrics?.usuarios?.value ?? null,
      orders: metrics?.pedidos?.value ?? null,
      revenue: metrics?.receita?.value ?? null,
      channels: (origem?.section.data ?? []).map((row) => ({
        channel: row.origem.split(' / ')[0]!.trim(),
        sourceMedium: row.origem,
        revenue: row.receita,
      })),
      channelShares: (canais?.section.data ?? []).map((row) => ({
        channel: row.canal,
        revenueSharePercent: row.participacao,
        comparisonChangePercent: row.variacao ?? null,
      })),
      channelsPeriod: canais ? ownPeriod(canais.section.periodo, referencePeriod) : null,
      brands: (marcas?.section.data ?? []).map((row) => ({
        brand: row.marca,
        itemsViewed: row.itensVistos,
        itemsAdded: row.pctAddToCart === undefined ? null : Math.round((row.itensVistos * row.pctAddToCart) / 100),
        itemsPurchased: row.itensComprados,
        itemRevenue: row.receitaItem,
      })),
      catalogPeriod: marcas ? ownPeriod(marcas.section.periodo, referencePeriod) : null,
      limitations: limitationsFor(merged, 'looker', 'geral'),
    }
  }

  const checkout = get('clarity.checkout')
  const sessoes = get('clarity.sessoes')
  let clarity: ClarityView | null = null
  if (checkout) {
    const devices = sessoes?.section.data
    clarity = {
      period: checkout.section.periodo,
      friction: checkout.section.data.map((row) => ({
        path: row.pagina,
        label: checkoutPageLabel(row.pagina),
        deadClicks: row.deadClicks ?? null,
        rageClicks: row.rageClicks ?? null,
        quickBacks: row.quickBacks ?? null,
      })),
      sessionsByDevice: devices ? { ...devices, total: Object.values(devices).reduce((sum, n) => sum + (n ?? 0), 0) } : null,
      notes: limitationsFor(merged, 'clarity', 'geral'),
      source: checkout.section.descricaoFonte ?? null,
    }
  }

  const indicadores = get('ux.indicadores')
  const funil = get('ux.funil')
  const deadclicks = get('ux.deadclicks')
  const gravacoes = get('ux.gravacoes')
  const anoaano = get('ux.anoaano')
  const acoes = get('ux.acoes')

  const yoyRows = anoaano?.section.data ?? []
  const yoyPair = (metrica: string, dispositivo: string): YearPair | null => pair(yoyRows.find((r) => r.metrica === metrica && r.dispositivo === dispositivo))

  const ux: UxView = {
    period: [indicadores, funil, deadclicks, anoaano, acoes, gravacoes].find((v) => v)?.section.periodo ?? null,
    weekly: indicadores
      ? {
          period: indicadores.section.periodo,
          comparisonPeriod: indicadores.section.periodoComparacao ?? null,
          sessions: pair(indicadores.section.data.sessoes),
          conversionRatePercent: pair(indicadores.section.data.taxa_conversao),
          revenueEstimatedBRL: pair(indicadores.section.data.receita_estimada),
          averageTicketBRL: pair(indicadores.section.data.ticket_medio),
          note: indicadores.section.nota ?? null,
        }
      : null,
    funnel: funil ? { period: funil.section.periodo, steps: stepsOf(funil.section.data), note: funil.section.nota ?? null } : null,
    deadClicks: deadclicks
      ? { period: deadclicks.section.periodo, steps: stepsOf(deadclicks.section.data), recordings: gravacoes?.section.data ?? [], note: deadclicks.section.nota ?? null }
      : null,
    yoy: anoaano
      ? {
          period: anoaano.section.periodo,
          comparisonPeriod: anoaano.section.periodoComparacao ?? null,
          productToConfirmedOrderPercent: { mobile: yoyPair('produto_ate_pedido_confirmado_pct', 'mobile'), desktop: yoyPair('produto_ate_pedido_confirmado_pct', 'desktop') },
          sessionsWithDeadClickPercent: { mobile: yoyPair('sessoes_com_dead_click_pct', 'mobile'), desktop: yoyPair('sessoes_com_dead_click_pct', 'desktop') },
          clarityCoverageOfGa4SessionsPercent: yoyPair('cobertura_clarity_sessoes_ga4_pct', 'todos'),
          note: anoaano.section.nota ?? null,
        }
      : null,
    priorities: acoes ? { period: acoes.section.periodo, items: acoes.section.data.map((a) => ({ title: a.titulo, detail: a.detalhe, owner: a.responsavel })) } : null,
    source: indicadores?.section.descricaoFonte ?? null,
  }

  return { overview, clarity, ux, alerts: buildAlerts(overview, clarity) }
}

/** No máximo 2 alertas curtos, sempre derivados do dado atual (nunca texto fixo). */
function buildAlerts(overview: OverviewView | null, clarity: ClarityView | null): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  const criticalPage = clarity?.friction.find((p) => isCriticalPage(p, clarity.friction))
  if (criticalPage) alerts.push({ label: `${criticalPage.label}: atrito alto` })

  let worst: { channel: string; change: number } | undefined
  for (const c of overview?.channelShares ?? []) {
    if (c.comparisonChangePercent === null) continue
    if (!worst || c.comparisonChangePercent < worst.change) worst = { channel: c.channel, change: c.comparisonChangePercent }
  }
  if (worst && worst.change <= CHANNEL_DECLINE_ALERT_THRESHOLD) alerts.push({ label: `${worst.channel}: receita em queda` })

  return alerts.slice(0, 2)
}
