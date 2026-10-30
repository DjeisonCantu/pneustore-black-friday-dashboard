// Bloco C do layout one-page: "Onde o checkout trava" — dead clicks por
// página (Clarity, 27-29/10), rage clicks/quick backs em mini-barras, e a
// comparação mobile × desktop do relatório UX (2025 vs 2026) em barras
// agrupadas, no lugar das tabelas da versão anterior.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { DeadClickBarChart } from '@/components/charts/dead-click-bar-chart'
import { DeviceBarChart, type DeviceBarDatum } from '@/components/charts/device-bar-chart'
import { CLARITY_CHECKOUT_FRICTION, CLARITY_CHECKOUT_NOTES, deadClickShare, isCriticalPage } from '@/data/real/clarity-checkout-friction'
import { CLARITY_DEAD_CLICKS_2026, CLARITY_YOY } from '@/data/real/pre-black-executive-report'
import { formatInt, formatPercent } from '@/lib/format'

function MiniBarRow({ label, mobile, desktop, max }: { label: string; mobile: number; desktop: number; max: number }) {
  return (
    <div className="flex items-center gap-2 text-ds-sm">
      <span className="w-28 shrink-0 truncate text-[var(--color-muted-foreground)]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${max > 0 ? (mobile / max) * 100 : 0}%` }} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]/50" style={{ width: `${max > 0 ? (desktop / max) * 100 : 0}%` }} />
        </div>
      </div>
      <span className="w-20 shrink-0 text-right tabular-nums text-[var(--color-muted-foreground)]">
        {mobile}/{desktop}
      </span>
    </div>
  )
}

export function CheckoutFrictionBlock() {
  const deadClickData = CLARITY_CHECKOUT_FRICTION.map((p) => ({
    label: p.label,
    value: p.deadClicks,
    isCritical: isCriticalPage(p),
  }))
  const criticalPage = CLARITY_CHECKOUT_FRICTION.find((p) => isCriticalPage(p))
  const maxFriction = Math.max(...CLARITY_CHECKOUT_FRICTION.flatMap((p) => [p.rageClicks, p.quickBacks]))

  const productToOrderData: DeviceBarDatum[] = [
    { device: 'Mobile', atual: CLARITY_YOY.productToConfirmedOrderPercent.mobile.y2026, comparacao: CLARITY_YOY.productToConfirmedOrderPercent.mobile.y2025 },
    { device: 'Desktop', atual: CLARITY_YOY.productToConfirmedOrderPercent.desktop.y2026, comparacao: CLARITY_YOY.productToConfirmedOrderPercent.desktop.y2025 },
  ]
  const deadClickSessionData: DeviceBarDatum[] = [
    { device: 'Mobile', atual: CLARITY_YOY.sessionsWithDeadClickPercent.mobile.y2026, comparacao: CLARITY_YOY.sessionsWithDeadClickPercent.mobile.y2025 },
    { device: 'Desktop', atual: CLARITY_YOY.sessionsWithDeadClickPercent.desktop.y2026, comparacao: CLARITY_YOY.sessionsWithDeadClickPercent.desktop.y2025 },
  ]

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle>Onde o checkout trava</CardTitle>
        <NoteTooltip label="Limitações do Clarity" notes={CLARITY_CHECKOUT_NOTES} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Dead clicks por página (27–29/10)</p>
          <DeadClickBarChart
            data={deadClickData}
            formatValue={formatInt}
            ariaLabel={`Dead clicks por página de checkout. ${criticalPage ? `${criticalPage.label} concentra ${formatPercent(deadClickShare(criticalPage), 1)} do total, acima do limiar de atenção.` : ''}`}
          />
          {criticalPage && (
            <p className="mt-1.5 text-ds-sm font-medium text-[var(--color-error)]">
              {criticalPage.label} concentra {formatPercent(deadClickShare(criticalPage), 1)} dos dead clicks do checkout — acima de 40%.
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 flex items-center gap-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
            Rage clicks / quick backs por página (mobile / desktop)
            <NoteTooltip label="Metodologia rage clicks / quick backs" notes={CLARITY_DEAD_CLICKS_2026.note} />
          </p>
          <div className="space-y-1.5">
            {CLARITY_CHECKOUT_FRICTION.map((p) => (
              <MiniBarRow key={p.path} label={p.label} mobile={p.rageClicks} desktop={p.quickBacks} max={maxFriction} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
              Produto até pedido confirmado (2025 vs 2026)
              <NoteTooltip label="Cobertura do Clarity" notes={CLARITY_YOY.note} />
            </p>
            <DeviceBarChart
              data={productToOrderData}
              formatValue={(v) => formatPercent(v, 1)}
              comparisonLabel="2025"
            />
          </div>
          <div>
            <p className="mb-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Sessões com dead click (2025 vs 2026)</p>
            <DeviceBarChart
              data={deadClickSessionData}
              formatValue={(v) => formatPercent(v, 1)}
              comparisonLabel="2025"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
