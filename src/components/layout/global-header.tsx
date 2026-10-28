import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterBar } from '@/components/layout/filter-bar'
import { LastUpdateStrip } from '@/components/layout/last-update-strip'
import { ExportMenu } from '@/components/layout/export-menu'
import { DemoScenarioSwitcher } from '@/components/layout/demo-scenario-switcher'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import { useFilters } from '@/hooks/use-filters'
import { comparisonLabel, resolveComparisonRange, resolvePeriodRange } from '@/data/selectors'
import { formatDateRangeLabel } from '@/lib/format'
import pneustoreIcon from '@/assets/brand/pneustore-icon-white.png'

export function GlobalHeader() {
  const [filters] = useFilters()
  const period = resolvePeriodRange(filters)
  const comparisonRange = resolveComparisonRange(filters)

  return (
    <header className="material-chrome no-print sticky top-0 z-30 border-b border-[var(--color-border)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.65rem] bg-[var(--color-primary)] p-1.5 shadow-[var(--shadow-apple-sm)]">
            <img src={pneustoreIcon} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-ds-base font-semibold tracking-[-0.01em] text-[var(--color-foreground)]">PneuStore · Site</p>
            <p className="text-ds-sm text-[var(--color-muted-foreground)]">Black Friday Health Monitor — não inclui o app</p>
          </div>
        </div>

        <div className="hidden lg:block">
          <FilterBar />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Filtros</SheetTitle>
            <div className="mt-4">
              <FilterBar layout="stacked" />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="hidden xl:block">
            <DemoScenarioSwitcher />
          </div>
          <ThemeToggle />
          <ExportMenu />
          <UserMenu />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-1.5 lg:px-6">
        <LastUpdateStrip />
        {filters.comparison !== 'nenhum' && comparisonRange && (
          <p className="text-ds-sm text-[var(--color-muted-foreground)]">
            Comparando <span className="font-medium text-[var(--color-foreground)]">{formatDateRangeLabel(period.from, period.to)}</span> vs{' '}
            <span className="font-medium text-[var(--color-foreground)]">{formatDateRangeLabel(comparisonRange.from, comparisonRange.to)}</span>{' '}
            ({comparisonLabel(filters.comparison)})
          </p>
        )}
      </div>

      <div className="block px-4 pb-2 xl:hidden">
        <DemoScenarioSwitcher />
      </div>
    </header>
  )
}
