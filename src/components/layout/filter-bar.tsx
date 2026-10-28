import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFilters } from '@/hooks/use-filters'
import { DATASET_BOUNDS } from '@/data/selectors'
import type { ComparisonMode, DeviceFilter, PeriodPreset } from '@/types/common'

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: 'semana-black', label: 'Semana da Black' },
  { value: 'personalizado', label: 'Personalizado' },
]

const DEVICE_OPTIONS: { value: DeviceFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os dispositivos' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
]

const COMPARISON_OPTIONS: { value: ComparisonMode; label: string }[] = [
  { value: 'nenhum', label: 'Sem comparação' },
  { value: 'periodo-anterior', label: 'Período anterior' },
  { value: 'mesmo-periodo-2025', label: 'Mesmo período 2025' },
]

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function FilterBar({ layout = 'inline' }: { layout?: 'inline' | 'stacked' }) {
  const [filters, { setPeriod, setCustomRange, setDevice, setComparison }] = useFilters()

  const wrapperClass = layout === 'inline' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-3'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col gap-1">
        {layout === 'stacked' && <label className="text-ds-sm font-medium text-[var(--color-muted-foreground)]">Período</label>}
        <Select value={filters.period} onValueChange={(v) => setPeriod(v as PeriodPreset)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.period === 'personalizado' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            className="h-9 rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-2.5 text-ds-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={toInputDate(DATASET_BOUNDS.from)}
            max={toInputDate(DATASET_BOUNDS.to)}
            value={filters.customRange ? toInputDate(filters.customRange.from) : toInputDate(DATASET_BOUNDS.to)}
            onChange={(e) => setCustomRange(e.target.value, filters.customRange ? toInputDate(filters.customRange.to) : e.target.value)}
          />
          <span className="text-ds-sm text-[var(--color-muted-foreground)]">até</span>
          <input
            type="date"
            className="h-9 rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-2.5 text-ds-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            min={toInputDate(DATASET_BOUNDS.from)}
            max={toInputDate(DATASET_BOUNDS.to)}
            value={filters.customRange ? toInputDate(filters.customRange.to) : toInputDate(DATASET_BOUNDS.to)}
            onChange={(e) => setCustomRange(filters.customRange ? toInputDate(filters.customRange.from) : e.target.value, e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {layout === 'stacked' && <label className="text-ds-sm font-medium text-[var(--color-muted-foreground)]">Dispositivo</label>}
        <Select value={filters.device} onValueChange={(v) => setDevice(v as DeviceFilter)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        {layout === 'stacked' && <label className="text-ds-sm font-medium text-[var(--color-muted-foreground)]">Comparar com</label>}
        <Select value={filters.comparison} onValueChange={(v) => setComparison(v as ComparisonMode)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARISON_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
