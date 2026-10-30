// Visão geral — atualização de 30/10/2026: o painel principal passou a
// mostrar exatamente os números do "Resumo Executivo Pré-Black"
// (PneuStore_Resumo_Executivo_PreBlack_2026.pdf, 14 a 20/10/2026 vs 2025) —
// o relatório que gerou o pedido deste dashboard — em vez do antigo
// agregado de período (02/10 a 29/10, sem comparação). O agregado antigo
// continua existindo só como fonte de canal/marca da página "Aquisição e
// produtos" (src/data/real/real-overview.ts) — mostrar os dois painéis de
// GA4 juntos aqui seria duplicar informação sem necessidade.

import { Ga4WeeklyPanel } from '@/components/real-data/ga4-weekly-panel'
import { SectionHeading } from '@/components/common/section-heading'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { GA4_WEEKLY, PRE_BLACK_REPORT_COMPARISON_PERIOD, PRE_BLACK_REPORT_PERIOD, percentDelta } from '@/data/real/pre-black-executive-report'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatInt, formatPercent } from '@/lib/format'

export function OverviewPage() {
  useRegisterPageExport('Visão geral', () => {
    const header = buildRealExportHeader('Visão geral')
    const lines = [
      header,
      '## GA4 — comparação semanal',
      '',
      `_Semana ${PRE_BLACK_REPORT_PERIOD.from} a ${PRE_BLACK_REPORT_PERIOD.to} (2026) vs ${PRE_BLACK_REPORT_COMPARISON_PERIOD.from} a ${PRE_BLACK_REPORT_COMPARISON_PERIOD.to} (2025)._`,
      '',
      '| Indicador | 2025 | 2026 | Variação |',
      '|---|---|---|---|',
      `| Sessões | ${formatInt(GA4_WEEKLY.sessions.y2025)} | ${formatInt(GA4_WEEKLY.sessions.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.sessions), 1)} |`,
      `| Conversão | ${formatPercent(GA4_WEEKLY.conversionRatePercent.y2025)} | ${formatPercent(GA4_WEEKLY.conversionRatePercent.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.conversionRatePercent), 1)} |`,
      `| Receita estimada | ${formatCurrencyCompactBRL(GA4_WEEKLY.revenueEstimatedBRL.y2025)} | ${formatCurrencyCompactBRL(GA4_WEEKLY.revenueEstimatedBRL.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.revenueEstimatedBRL), 1)} |`,
      `| Ticket médio | ${formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2025)} | ${formatCurrencyBRL(GA4_WEEKLY.averageTicketBRL.y2026)} | ${formatPercent(percentDelta(GA4_WEEKLY.averageTicketBRL), 1)} |`,
      '',
      `_${GA4_WEEKLY.note}_`,
      '',
      'Detalhamento por canal e por marca: ver exportação de "Aquisição e produtos".',
    ]
    return lines.join('\n')
  })

  return (
    <div className="space-y-5">
      <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />
      <Ga4WeeklyPanel />
    </div>
  )
}
