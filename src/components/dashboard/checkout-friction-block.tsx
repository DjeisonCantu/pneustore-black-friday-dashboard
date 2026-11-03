// Bloco C do layout one-page: "Onde o checkout trava" — dead clicks por
// página (Clarity, período da seção vigente), rage clicks/quick backs em mini-barras, e a
// comparação mobile × desktop do relatório UX (2025 vs 2026) em barras
// agrupadas, no lugar das tabelas da versão anterior.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { DeadClickBarChart } from '@/components/charts/dead-click-bar-chart'
import { DeviceBarChart, type DeviceBarDatum } from '@/components/charts/device-bar-chart'
import { deadClickShare, isCriticalPage, type DeviceYearPair } from '@/data/dashboard-data'
import { formatPeriodNumeric } from '@/data/updates/dates'
import { useRealData } from '@/hooks/use-real-data'
import { formatInt, formatPercent } from '@/lib/format'

function MiniBarRow({ label, mobile, desktop, max }: { label: string; mobile: number | null; desktop: number | null; max: number }) {
  return (
    <div className="flex items-center gap-2 text-ds-sm">
      <span className="w-28 shrink-0 truncate text-[var(--color-muted-foreground)]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${max > 0 ? ((mobile ?? 0) / max) * 100 : 0}%` }} />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]/50" style={{ width: `${max > 0 ? ((desktop ?? 0) / max) * 100 : 0}%` }} />
        </div>
      </div>
      <span className="w-20 shrink-0 text-right tabular-nums text-[var(--color-muted-foreground)]">
        {mobile ?? '—'}/{desktop ?? '—'}
      </span>
    </div>
  )
}

function deviceBars(pairs: DeviceYearPair | undefined): DeviceBarDatum[] {
  if (!pairs) return []
  const bars: DeviceBarDatum[] = []
  if (pairs.mobile) bars.push({ device: 'Mobile', atual: pairs.mobile.y2026, comparacao: pairs.mobile.y2025 })
  if (pairs.desktop) bars.push({ device: 'Desktop', atual: pairs.desktop.y2026, comparacao: pairs.desktop.y2025 })
  return bars
}

export function CheckoutFrictionBlock() {
  const { clarity, ux } = useRealData()
  if (!clarity && !ux.yoy) return null

  const friction = clarity?.friction ?? []
  const deadClickData = friction
    .filter((p) => p.deadClicks !== null)
    .map((p) => ({ label: p.label, value: p.deadClicks ?? 0, isCritical: isCriticalPage(p, friction) }))
  const criticalPage = friction.find((p) => isCriticalPage(p, friction))
  const maxFriction = Math.max(0, ...friction.flatMap((p) => [p.rageClicks ?? 0, p.quickBacks ?? 0]))

  const productToOrderData = deviceBars(ux.yoy?.productToConfirmedOrderPercent)
  const deadClickSessionData = deviceBars(ux.yoy?.sessionsWithDeadClickPercent)
  const clarityNotes = clarity?.notes ?? []
  const frictionNote = ux.deadClicks?.note

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle>Onde o checkout trava</CardTitle>
        {clarityNotes.length > 0 && <NoteTooltip label="Limitações do Clarity" notes={clarityNotes} />}
      </CardHeader>
      <CardContent className="space-y-5">
        {clarity && deadClickData.length > 0 && (
          <div>
            <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
              Dead clicks por página ({formatPeriodNumeric(clarity.period.from, clarity.period.to)})
            </p>
            <DeadClickBarChart
              data={deadClickData}
              formatValue={formatInt}
              ariaLabel={`Dead clicks por página de checkout. ${criticalPage ? `${criticalPage.label} concentra ${formatPercent(deadClickShare(criticalPage, friction), 1)} do total, acima do limiar de atenção.` : ''}`}
            />
            {criticalPage && (
              <p className="mt-1.5 text-ds-sm font-medium text-[var(--color-error)]">
                {criticalPage.label} concentra {formatPercent(deadClickShare(criticalPage, friction), 1)} dos dead clicks do checkout — acima de 40%.
              </p>
            )}
          </div>
        )}

        {friction.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
              Rage clicks / quick backs por página (mobile / desktop)
              {frictionNote && <NoteTooltip label="Metodologia rage clicks / quick backs" notes={frictionNote} />}
            </p>
            <div className="space-y-1.5">
              {friction.map((p) => (
                <MiniBarRow key={p.path} label={p.label} mobile={p.rageClicks} desktop={p.quickBacks} max={maxFriction} />
              ))}
            </div>
          </div>
        )}

        {(productToOrderData.length > 0 || deadClickSessionData.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 flex items-center gap-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
                Produto até pedido confirmado (2025 vs 2026)
                {ux.yoy?.note && <NoteTooltip label="Cobertura do Clarity" notes={ux.yoy.note} />}
              </p>
              <DeviceBarChart data={productToOrderData} formatValue={(v) => formatPercent(v, 1)} comparisonLabel="2025" />
            </div>
            <div>
              <p className="mb-1 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Sessões com dead click (2025 vs 2026)</p>
              <DeviceBarChart data={deadClickSessionData} formatValue={(v) => formatPercent(v, 1)} comparisonLabel="2025" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
