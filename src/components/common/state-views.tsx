// Estados de componente descritos em 04-arquitetura-informacao.md, seção 5.

import { AlertTriangle, Clock3, FlaskConical, Inbox, ShieldAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'

export function LoadingBlock({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={className ?? 'space-y-2.5'}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}

export function LoadingCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({ message = 'Sem dados para o período e filtro selecionados.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] px-6 py-10 text-center text-ds-base text-[var(--color-muted-foreground)]">
      <Inbox className="h-5 w-5" />
      <p>{message}</p>
    </div>
  )
}

export function UnavailableState({ sourceLabel, since }: { sourceLabel: string; since: Date }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-6 py-10 text-center text-ds-base text-[var(--color-error)]">
      <ShieldAlert className="h-5 w-5" />
      <p className="font-medium">
        Dados de {sourceLabel} indisponíveis desde {formatDateTime(since)}
      </p>
      <p className="text-ds-sm text-[var(--color-error)]/80">
        O último valor conhecido não é exibido como se fosse atual (RF-17).
      </p>
    </div>
  )
}

export function ValidationState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-6 py-10 text-center text-ds-base text-[var(--color-warning)]">
      <FlaskConical className="h-5 w-5" />
      <p className="font-medium">{title}</p>
      <p className="text-ds-sm text-[var(--color-warning)]/80">{description}</p>
    </div>
  )
}

export function ReservedSpaceState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-info)]/30 bg-[var(--color-info-soft)] px-4 py-3 text-ds-sm text-[var(--color-info)]">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        <span className="font-semibold">{title}</span> — {description}
      </p>
    </div>
  )
}

export function PartialDayBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-info-soft)] px-2 py-0.5 text-ds-sm font-medium text-[var(--color-info)]">
      <Clock3 className="h-3 w-3" />
      Dia em andamento — dados parciais
    </span>
  )
}
