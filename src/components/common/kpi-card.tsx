import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { VariationBadge } from '@/components/common/variation-badge'
import { PartialDayBadge } from '@/components/common/state-views'
import type { IndicatorMeta, Variation } from '@/types/common'

export function KpiCard({
  label,
  value,
  unitLabel,
  meta,
  variation,
  variationFormat,
  isPartial,
  icon,
}: {
  label: string
  value: string
  unitLabel?: string
  meta: IndicatorMeta
  variation?: Variation | null
  variationFormat?: (value: number) => string
  isPartial?: boolean
  icon?: ReactNode
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-2 overflow-hidden p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-ds-sm font-medium text-[var(--color-muted-foreground)]">{label}</span>
        <div className="flex shrink-0 items-center gap-1.5 text-[var(--color-muted-foreground)]">
          {icon}
          <InfoTooltip meta={meta} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-ds-h3 font-semibold tracking-[-0.015em] tabular-nums text-[var(--color-foreground)]" title={value}>
          {value}
        </span>
        {unitLabel && <span className="text-ds-sm text-[var(--color-muted-foreground)]">{unitLabel}</span>}
      </div>
      <div className="flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-1">
        {variation ? <VariationBadge variation={variation} format={variationFormat} /> : (
          <span className="text-ds-sm text-[var(--color-muted-foreground)]">Sem comparação selecionada</span>
        )}
        {isPartial && <PartialDayBadge />}
      </div>
    </Card>
  )
}
