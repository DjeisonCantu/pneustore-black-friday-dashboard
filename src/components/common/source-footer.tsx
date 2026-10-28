import { formatDateRangeLabel } from '@/lib/format'

const SOURCE_LABELS: Record<string, string> = {
  ga4: 'GA4',
  clarity: 'Clarity',
  'ga4+clarity': 'GA4 + Clarity',
}

export function SourceFooter({
  source,
  from,
  to,
  note,
}: {
  source: 'ga4' | 'clarity' | 'ga4+clarity'
  from: Date
  to: Date
  note?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>Fonte: {SOURCE_LABELS[source]}</span>
      <span aria-hidden>·</span>
      <span>Período: {formatDateRangeLabel(from, to)}</span>
      {note && (
        <>
          <span aria-hidden>·</span>
          <span>{note}</span>
        </>
      )}
    </div>
  )
}
