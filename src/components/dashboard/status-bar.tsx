// Bloco A do layout one-page: selo de período/fonte por bloco de dado + até
// 2 alertas curtos derivados automaticamente (ver buildDashboardData).

import { AlertTriangle, BadgeCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRealData } from '@/hooks/use-real-data'
import { formatDateShort } from '@/lib/format'

function rangeLabel(from: string, to: string): string {
  const f = new Date(`${from}T00:00:00-03:00`)
  const t = new Date(`${to}T00:00:00-03:00`)
  return `${formatDateShort(f)} a ${formatDateShort(t)}`
}

export function StatusBar() {
  const { overview, clarity, ux, alerts } = useRealData()

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {ux.period && (
          <Badge variant="success">
            <BadgeCheck className="h-3 w-3" />
            Relatório UX {rangeLabel(ux.period.from, ux.period.to)}
          </Badge>
        )}
        {clarity && (
          <Badge variant="success">
            <BadgeCheck className="h-3 w-3" />
            Clarity {rangeLabel(clarity.period.from, clarity.period.to)}
          </Badge>
        )}
        {overview?.period && (
          <Badge variant="success">
            <BadgeCheck className="h-3 w-3" />
            GA4/Looker {rangeLabel(overview.period.from, overview.period.to)}
          </Badge>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {alerts.map((alert) => (
            <Badge key={alert.label} variant="error">
              <AlertTriangle className="h-3 w-3" />
              {alert.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
