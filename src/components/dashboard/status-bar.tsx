// Bloco A do layout one-page: selo de período/fonte por bloco de dado + até
// 2 alertas curtos derivados automaticamente (ver dashboard-alerts.ts).

import { AlertTriangle, BadgeCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buildDashboardAlerts } from '@/data/real/dashboard-alerts'
import { PRE_BLACK_REPORT_PERIOD } from '@/data/real/pre-black-executive-report'
import { CLARITY_CHECKOUT_PERIOD } from '@/data/real/clarity-checkout-friction'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatDateShort } from '@/lib/format'

function rangeLabel(from: string, to: string): string {
  const f = new Date(`${from}T00:00:00-03:00`)
  const t = new Date(`${to}T00:00:00-03:00`)
  return `${formatDateShort(f)} a ${formatDateShort(t)}`
}

export function StatusBar() {
  const view = loadRealOverview()
  const alerts = buildDashboardAlerts()

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          Relatório UX {rangeLabel(PRE_BLACK_REPORT_PERIOD.from, PRE_BLACK_REPORT_PERIOD.to)}
        </Badge>
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          Clarity {rangeLabel(CLARITY_CHECKOUT_PERIOD.from, CLARITY_CHECKOUT_PERIOD.to)}
        </Badge>
        {view && (
          <Badge variant="success">
            <BadgeCheck className="h-3 w-3" />
            GA4/Looker {rangeLabel(view.period.from, view.period.to)}
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
