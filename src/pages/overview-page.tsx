import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiCard } from '@/components/common/kpi-card'
import { RealDataPanel } from '@/components/real-data/real-data-panel'
import { SectionHeading } from '@/components/common/section-heading'
import { SourceFooter } from '@/components/common/source-footer'
import { TimeSeriesChart } from '@/components/charts/time-series-chart'
import { LoadingBlock, LoadingCardGrid, UnavailableState, EmptyState } from '@/components/common/state-views'
import { VariationBadge } from '@/components/common/variation-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFilters } from '@/hooks/use-filters'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { useDemoScenario } from '@/state/demo-scenario-context'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildExportHeader } from '@/lib/export-metadata'
import { buildOverviewViewModel } from '@/data/view-models/overview'
import { INDICATORS } from '@/data/indicators'
import { formatCurrencyBRL, formatCurrencyCompactBRL, formatInt, formatPercent } from '@/lib/format'
import { MOCK_TODAY } from '@/data/mock/daily-series'

type MetricKey = 'sessions' | 'orders' | 'revenue' | 'conversionRate'

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: 'sessions', label: 'Sessões' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'revenue', label: 'Receita' },
  { value: 'conversionRate', label: 'Conversão' },
]

const DEVICE_LABELS: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' }

export function OverviewPage() {
  const [filters] = useFilters()
  const { scenario } = useDemoScenario()
  const [metric, setMetric] = useState<MetricKey>('sessions')
  const filtersKey = JSON.stringify(filters)
  const isLoading = useSimulatedLoading(filtersKey)

  const vm = useMemo(() => buildOverviewViewModel(filters), [filters])

  useRegisterPageExport('Visão geral', () => {
    const header = buildExportHeader('Visão geral', filters)
    const lines = [
      header,
      '## Indicadores',
      '',
      '| Indicador | Valor | Unidade | Variação |',
      '|---|---|---|---|',
      `| Sessões | ${formatInt(vm.current.sessions)} | Sessões | ${vm.variations.sessions ? formatPercent(vm.variations.sessions.deltaPercent) : '—'} |`,
      `| Usuários | ${formatInt(vm.current.users)} | Usuários | ${vm.variations.users ? formatPercent(vm.variations.users.deltaPercent) : '—'} |`,
      `| Conversão | ${formatPercent(vm.current.conversionRate)} | % | ${vm.variations.conversionRate ? formatPercent(vm.variations.conversionRate.deltaPercent) : '—'} |`,
      `| Pedidos | ${formatInt(vm.current.orders)} | Pedidos | ${vm.variations.orders ? formatPercent(vm.variations.orders.deltaPercent) : '—'} |`,
      `| Receita | ${formatCurrencyBRL(vm.current.revenue)} | R$ | ${vm.variations.revenue ? formatPercent(vm.variations.revenue.deltaPercent) : '—'} |`,
      `| Ticket médio | ${formatCurrencyBRL(vm.current.averageTicket)} | R$ | ${vm.variations.averageTicket ? formatPercent(vm.variations.averageTicket.deltaPercent) : '—'} |`,
      '',
      '## Divisão por dispositivo',
      '',
      '| Dispositivo | Sessões | Pedidos | Conversão |',
      '|---|---|---|---|',
      ...vm.deviceSummary.map(
        (row) => `| ${DEVICE_LABELS[row.device]} | ${formatInt(row.sessions)} | ${formatInt(row.orders)} | ${formatPercent(row.conversionRate)} |`,
      ),
      '',
      '_Notas: receita e ticket médio são métricas financeiras (R$); sessões e pedidos não devem ser somados entre si (RA-01). Variações não implicam causalidade (RA-05)._',
    ]
    return lines.join('\n')
  })

  if (scenario === 'fonte-indisponivel') {
    return (
      <div className="space-y-4">
        <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />
        <UnavailableState sourceLabel="GA4" since={MOCK_TODAY} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />
        <LoadingCardGrid count={6} />
        <Card>
          <CardContent className="pt-4">
            <LoadingBlock rows={6} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (scenario === 'vazio' || !vm.current.hasAnyData) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />
        <EmptyState
          message={
            vm.current.hasFutureDaysOnly
              ? 'O período selecionado ainda não ocorreu — sem dados para exibir.'
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading title="Visão geral" question="O site está vendendo como esperado agora?" />

      <RealDataPanel />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Sessões"
          value={formatInt(vm.current.sessions)}
          unitLabel="sessões"
          meta={INDICATORS['IND-01']}
          variation={vm.variations.sessions}
          isPartial={vm.current.isPartialToday}
        />
        <KpiCard
          label="Usuários"
          value={formatInt(vm.current.users)}
          unitLabel="usuários"
          meta={INDICATORS['IND-01']}
          variation={vm.variations.users}
        />
        <KpiCard
          label="Conversão"
          value={formatPercent(vm.current.conversionRate)}
          unitLabel="por sessão"
          meta={INDICATORS['IND-02']}
          variation={vm.variations.conversionRate}
          variationFormat={(v) => formatPercent(v)}
        />
        <KpiCard
          label="Pedidos"
          value={formatInt(vm.current.orders)}
          unitLabel="pedidos"
          meta={INDICATORS['IND-03']}
          variation={vm.variations.orders}
        />
        <KpiCard
          label="Receita"
          value={formatCurrencyCompactBRL(vm.current.revenue)}
          unitLabel="reais (R$)"
          meta={INDICATORS['IND-03']}
          variation={vm.variations.revenue}
          variationFormat={(v) => formatCurrencyCompactBRL(v)}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrencyBRL(vm.current.averageTicket)}
          unitLabel="por pedido"
          meta={INDICATORS['IND-03']}
          variation={vm.variations.averageTicket}
          variationFormat={(v) => formatCurrencyCompactBRL(v)}
        />
      </div>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Evolução temporal</CardTitle>
            <CardDescriptionInline isHourly={vm.isHourly} />
          </div>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <TabsList>
              {METRIC_OPTIONS.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value}>
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart
            data={vm.timeSeries}
            metric={metric}
            formatValue={metric === 'revenue' ? formatCurrencyBRL : metric === 'conversionRate' ? (v) => formatPercent(v) : formatInt}
            showComparison={filters.comparison !== 'nenhum'}
            comparisonLabel={filters.comparison === 'mesmo-periodo-2025' ? 'Mesmo período 2025' : 'Período anterior'}
          />
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} />
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle>Variações relevantes</CardTitle>
        </CardHeader>
        <CardContent>
          {vm.relevantVariations.length === 0 ? (
            <p className="text-ds-base text-[var(--color-muted-foreground)]">
              Nenhuma métrica ultrapassou o limite de variação relevante (±15%) nesta comparação.
            </p>
          ) : (
            <ul className="space-y-2">
              {vm.relevantVariations.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 text-ds-base">
                  <span>
                    <span className="font-medium">{item.label}</span> — variação acima do esperado, investigar.
                  </span>
                  {item.variation && <VariationBadge variation={item.variation} format={item.format} showRelevanceTag />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter>
          <span>Limite de variação relevante: ±15% (exemplo, pendente de aprovação — D-08).</span>
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Divisão por dispositivo</CardTitle>
          <Link to={{ pathname: '/jornada', search: window.location.search }} className="text-ds-sm font-medium text-[var(--color-primary)] hover:underline">
            Ver jornada por dispositivo →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.deviceSummary.map((row) => (
                <TableRow key={row.device}>
                  <TableCell className="font-medium">{DEVICE_LABELS[row.device]}</TableCell>
                  <TableCell>{formatInt(row.sessions)}</TableCell>
                  <TableCell>{formatInt(row.orders)}</TableCell>
                  <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} />
        </CardFooter>
      </Card>
    </div>
  )
}

function CardDescriptionInline({ isHourly }: { isHourly: boolean }) {
  return (
    <p className="text-ds-sm text-[var(--color-muted-foreground)]">
      {isHourly ? 'Granularidade horária (dia único selecionado)' : 'Granularidade diária'} · período atual vs comparação
    </p>
  )
}
