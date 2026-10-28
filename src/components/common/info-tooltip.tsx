import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { IndicatorMeta } from '@/types/common'
import { UNIT_LABELS } from '@/types/common'

const SOURCE_LABELS: Record<string, string> = {
  ga4: 'Google Analytics 4',
  clarity: 'Microsoft Clarity',
  'ga4+clarity': 'GA4 (principal) + Clarity (apoio)',
}

export function InfoTooltip({ meta }: { meta: IndicatorMeta }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        aria-label={`Definição de ${meta.label}`}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent className="space-y-1.5">
        <p className="font-semibold">{meta.label}</p>
        <p>{meta.definition}</p>
        {meta.formula && <p className="text-white/80">Fórmula: {meta.formula}</p>}
        <p className="text-white/80">
          Unidade: {UNIT_LABELS[meta.unit]}
          {meta.secondaryUnit ? ` · ${UNIT_LABELS[meta.secondaryUnit]}` : ''}
        </p>
        <p className="text-white/80">Fonte: {SOURCE_LABELS[meta.source]}</p>
        {meta.limitations && <p className="text-white/70">Limitação: {meta.limitations}</p>}
      </TooltipContent>
    </Tooltip>
  )
}
