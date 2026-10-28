import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { useDemoScenario } from '@/state/demo-scenario-context'
import { MOCK_TODAY } from '@/data/mock/daily-series'

export function LastUpdateStrip() {
  const { scenario } = useDemoScenario()
  const clarityUnavailable = scenario === 'fonte-indisponivel'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ds-sm text-[var(--color-muted-foreground)]">
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
        GA4: {formatDateTime(MOCK_TODAY)}
      </span>
      {clarityUnavailable ? (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--color-error)]">
          <AlertCircle className="h-3.5 w-3.5" />
          Clarity: indisponível desde {formatDateTime(MOCK_TODAY)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
          Clarity: {formatDateTime(MOCK_TODAY)}
        </span>
      )}
    </div>
  )
}
