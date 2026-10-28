import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDecimal } from '@/lib/format'
import type { Variation } from '@/types/common'

export function VariationBadge({
  variation,
  format,
  showRelevanceTag = false,
}: {
  variation: Variation
  format?: (value: number) => string
  /** Mostra o rótulo "investigar" ao lado — reservado para contextos com mais espaço horizontal. */
  showRelevanceTag?: boolean
}) {
  const Icon = variation.direction === 'alta' ? ArrowUp : variation.direction === 'baixa' ? ArrowDown : ArrowRight
  const toneClass = variation.isRelevant
    ? variation.direction === 'baixa'
      ? 'text-[var(--color-error)]'
      : 'text-[var(--color-success)]'
    : 'text-[var(--color-muted-foreground)]'

  const formattedAbs = format ? format(Math.abs(variation.deltaAbsolute)) : formatDecimal(Math.abs(variation.deltaAbsolute), 0)

  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1 text-ds-sm font-medium', toneClass)} title="Variação — não implica causa">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="shrink-0">{formatDecimal(Math.abs(variation.deltaPercent), 1)}%</span>
      <span className="truncate text-[var(--color-muted-foreground)] font-normal">({formattedAbs})</span>
      {showRelevanceTag && variation.isRelevant && (
        <span className="ml-0.5 shrink-0 rounded-full bg-[var(--color-warning-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-warning)]">
          investigar
        </span>
      )}
    </span>
  )
}
