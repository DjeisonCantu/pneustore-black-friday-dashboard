// Bloco E do layout one-page: "O que vende" — receita por marca em barras +
// mini-funil por marca (vistos → adicionados* → comprados).

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteTooltip } from '@/components/common/note-tooltip'
import { DeadClickBarChart } from '@/components/charts/dead-click-bar-chart'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatCurrencyCompactBRL, formatInt } from '@/lib/format'

function BrandFunnelRow({ brand, itemsViewed, itemsAdded, itemsPurchased }: { brand: string; itemsViewed: number; itemsAdded: number; itemsPurchased: number }) {
  const max = itemsViewed || 1
  return (
    <div className="flex items-center gap-2.5 text-ds-sm">
      <span className="w-24 shrink-0 truncate font-medium">{brand}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: '100%' }} />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]/70" style={{ width: `${(itemsAdded / max) * 100}%` }} />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]/40" style={{ width: `${(itemsPurchased / max) * 100}%` }} />
        </div>
      </div>
      <span className="w-32 shrink-0 text-right tabular-nums text-[var(--color-muted-foreground)]">
        {formatInt(itemsViewed)} / {formatInt(itemsAdded)} / {formatInt(itemsPurchased)}
      </span>
    </div>
  )
}

export function TopSellersBlock() {
  const view = loadRealOverview()
  if (!view || view.brands.length === 0) return null

  const brands = [...view.brands].sort((a, b) => b.itemRevenue - a.itemRevenue)
  const revenueData = brands.map((b) => ({ label: b.brand, value: b.itemRevenue }))

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CardTitle>O que vende</CardTitle>
        <NoteTooltip label="Sobre itens adicionados" notes='"Adicionados" é estimado a partir de %Add to Cart do Looker — não é uma contagem bruta.' />
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Receita por marca</p>
          <DeadClickBarChart
            data={revenueData}
            formatValue={formatCurrencyCompactBRL}
            ariaLabel={`Receita por marca: ${brands.map((b) => `${b.brand} ${formatCurrencyCompactBRL(b.itemRevenue)}`).join('; ')}`}
          />
        </div>

        <div>
          <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Vistos → adicionados* → comprados</p>
          <div className="space-y-2">
            {brands.map((b) => (
              <BrandFunnelRow key={b.brand} brand={b.brand} itemsViewed={b.itemsViewed} itemsAdded={b.itemsAdded} itemsPurchased={b.itemsPurchased} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
