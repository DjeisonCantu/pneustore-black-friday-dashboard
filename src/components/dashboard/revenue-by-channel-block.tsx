// Bloco D do layout one-page: "De onde vem a receita" — participação por
// canal (já agregada pelo Looker, um canal por linha — sem rótulo repetido),
// barra horizontal + variação colorida vs. período anterior no rótulo.

import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatPercent } from '@/lib/format'

function ChannelRow({ channel, revenueSharePercent, comparisonChangePercent, max }: { channel: string; revenueSharePercent: number; comparisonChangePercent: number; max: number }) {
  const isUp = comparisonChangePercent >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  return (
    <div className="flex items-center gap-2.5 text-ds-base">
      <span className="w-20 shrink-0 truncate font-medium">{channel}</span>
      <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${max > 0 ? (revenueSharePercent / max) * 100 : 0}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right tabular-nums text-[var(--color-muted-foreground)]">{formatPercent(revenueSharePercent, 1)}</span>
      <span
        className={`flex w-16 shrink-0 items-center justify-end gap-0.5 text-ds-sm font-medium ${isUp ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {isUp ? '+' : ''}
        {formatPercent(comparisonChangePercent, 1)}
      </span>
    </div>
  )
}

export function RevenueByChannelBlock() {
  const view = loadRealOverview()
  if (!view || view.channelShares.length === 0) return null

  const channels = [...view.channelShares].sort((a, b) => b.revenueSharePercent - a.revenueSharePercent)
  const max = Math.max(...channels.map((c) => c.revenueSharePercent))

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle>De onde vem a receita</CardTitle>
        <NoteTooltip
          label="Sobre a participação por canal"
          notes="Participação já agregada pelo Looker Studio (um canal, uma linha). Variação vs. o período anterior, calculada pelo próprio Looker."
        />
      </CardHeader>
      <CardContent
        className="space-y-2"
        role="img"
        aria-label={`Participação na receita por canal: ${channels.map((c) => `${c.channel} ${formatPercent(c.revenueSharePercent, 1)}, variação ${c.comparisonChangePercent >= 0 ? '+' : ''}${formatPercent(c.comparisonChangePercent, 1)}`).join('; ')}`}
      >
        {channels.map((c) => (
          <ChannelRow key={c.channel} channel={c.channel} revenueSharePercent={c.revenueSharePercent} comparisonChangePercent={c.comparisonChangePercent} max={max} />
        ))}
      </CardContent>
    </Card>
  )
}
