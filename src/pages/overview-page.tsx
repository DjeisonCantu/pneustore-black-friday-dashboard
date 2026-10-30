// Visão geral — atualização de 30/10/2026: os cartões de KPI, o gráfico de
// evolução temporal, "Variações relevantes" e a "Divisão por dispositivo"
// (todos derivados de src/data/mock/) foram removidos a pedido do dono do
// projeto ("preciso que NADA seja fictício, tudo seja real" — uso pela
// equipe CX). Nenhuma dessas seções tinha uma fonte real equivalente com
// granularidade diária/por dispositivo (o PDF do Looker só dá um total
// agregado do período — ver RealDataPanel) — em vez de inventar essa
// granularidade, a seção foi removida, não substituída por outro dado
// fictício. Esta página agora mostra só o que é real.

import { RealDataPanel } from '@/components/real-data/real-data-panel'
import { SectionHeading } from '@/components/common/section-heading'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatCurrencyCompactBRL, formatInt } from '@/lib/format'

export function OverviewPage() {
  useRegisterPageExport('Visão geral', () => {
    const header = buildRealExportHeader('Visão geral')
    const view = loadRealOverview()
    if (!view) {
      return [header, '', '_O snapshot real embutido não passou na validação — nada é exportado._'].join('\n')
    }
    const lines = [
      header,
      '',
      '## Dados reais (Looker Studio) — total do período',
      '',
      `_Período ${view.period.from} a ${view.period.to}._`,
      '',
      '| Indicador | Valor |',
      '|---|---|',
      `| Sessões | ${view.sessions === null ? '—' : formatInt(view.sessions)} |`,
      `| Usuários | ${view.users === null ? '—' : formatInt(view.users)} |`,
      `| Pedidos | ${view.orders === null ? '—' : formatInt(view.orders)} |`,
      `| Receita | ${view.revenue === null ? '—' : formatCurrencyCompactBRL(view.revenue)} |`,
      '',
      'Detalhamento por canal e por marca: ver exportação de "Aquisição e produtos".',
    ]
    return lines.join('\n')
  })

  return (
    <div className="space-y-5">
      <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />
      <RealDataPanel />
    </div>
  )
}
