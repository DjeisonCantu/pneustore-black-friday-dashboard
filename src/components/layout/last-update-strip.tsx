// Atualização de 30/10/2026: mostra a data de cada fonte real em uso —
// o relatório executivo (GA4 + Clarity, usado na Visão geral e na Jornada de
// compra) e o snapshot do Looker Studio (usado só para canal/marca em
// "Aquisição e produtos"). Nunca finge uma conexão ao vivo.

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { loadRealOverview } from '@/data/real/real-overview'

export function LastUpdateStrip() {
  const ga4 = loadRealOverview()

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ds-sm text-[var(--color-muted-foreground)]">
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
        Relatório executivo (GA4 + Clarity): 20/10/2026
      </span>
      {ga4 ? (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
          Looker Studio (canal/marca): {ga4.period.from} a {ga4.period.to}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-error)]">
          <AlertCircle className="h-3.5 w-3.5" />
          Looker Studio: snapshot inválido
        </span>
      )}
    </div>
  )
}
