// Atualização de 30/10/2026: antes mostrava "GA4: {hoje}" / "Clarity: {hoje}"
// sempre em verde, usando MOCK_TODAY — dava a entender uma conexão ao vivo
// sempre atualizada, o que nunca foi verdade e ficou ainda mais enganoso
// depois que o app passou a usar só dados reais (extraídos manualmente, em
// datas fixas no passado). Agora mostra quando cada extração REAL foi feita.

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { loadRealOverview } from '@/data/real/real-overview'
import clarityRealSnapshot from '@/data/real/clarity-real-snapshot.json'

export function LastUpdateStrip() {
  const ga4 = loadRealOverview()
  const clarityExtractedAt = clarityRealSnapshot.metadata.extractedAt

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ds-sm text-[var(--color-muted-foreground)]">
      {ga4 ? (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
          GA4/Looker: extraído em {formatDateTime(new Date(ga4.extractedAt))}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-error)]">
          <AlertCircle className="h-3.5 w-3.5" />
          GA4/Looker: snapshot inválido
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
        Clarity: extraído em {formatDateTime(new Date(clarityExtractedAt))}
      </span>
    </div>
  )
}
