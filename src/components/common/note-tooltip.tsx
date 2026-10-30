// Ícone (i) com texto livre num tooltip — para limitações/metodologia que,
// no layout one-page, saem do corpo do card e vão para um popover (Parte 3:
// "menos texto... todo aviso... vai para um ícone (i) com tooltip/popover").
// Reaproveita o mesmo primitivo de Tooltip já usado por InfoTooltip
// (@/components/common/info-tooltip), só sem depender de um IndicatorMeta —
// aceita qualquer texto ou lista de textos.

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function NoteTooltip({ label, notes }: { label: string; notes: string | string[] }) {
  const items = Array.isArray(notes) ? notes : [notes]
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
        aria-label={label}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1">
        {items.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}
