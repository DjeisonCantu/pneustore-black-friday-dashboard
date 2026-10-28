import { useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/common/section-heading'
import { SourceFooter } from '@/components/common/source-footer'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { DeviceBarChart, type DeviceBarDatum } from '@/components/charts/device-bar-chart'
import { LoadingCardGrid, UnavailableState, EmptyState, ValidationState } from '@/components/common/state-views'
import { ClarityRealSignalsPanel } from '@/components/journey/clarity-real-signals-panel'
import { useFilters } from '@/hooks/use-filters'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { useDemoScenario } from '@/state/demo-scenario-context'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildExportHeader } from '@/lib/export-metadata'
import { buildJourneyViewModel } from '@/data/view-models/journey'
import { INDICATORS } from '@/data/indicators'
import { formatInt, formatPercent } from '@/lib/format'
import { UNIT_LABELS } from '@/types/common'
import { MOCK_TODAY } from '@/data/mock/daily-series'
import { useClarityJourneySignals } from '@/data/clarity/use-clarity-journey'
import { buildClarityJourneyView, filterClarityJourneyViewByDevice } from '@/data/clarity/adapter'
import { evaluateClarityPeriodCoverage, type ClarityPeriodCoverage } from '@/data/clarity/coverage'

const DEVICE_LABELS: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile' }

export function JourneyPage() {
  const [filters] = useFilters()
  const { scenario } = useDemoScenario()
  const filtersKey = JSON.stringify(filters)
  const isLoading = useSimulatedLoading(filtersKey)

  const vm = useMemo(() => buildJourneyViewModel(filters), [filters])

  // Sinais comportamentais do Clarity — camada assíncrona separada do
  // DataProvider síncrono dos indicadores comerciais acima (decisão
  // arquitetural da Etapa C3, ver 04-validacao/05-mapeamento-frontend.md,
  // seção 11). Só carrega fixtures fictícias; nenhuma chamada real à API.
  const clarity = useClarityJourneySignals()
  const clarityView = useMemo(() => {
    if (!clarity.snapshot) return null
    return filterClarityJourneyViewByDevice(buildClarityJourneyView(clarity.snapshot), filters.device)
  }, [clarity.snapshot, filters.device])
  const clarityPeriodCoverage: ClarityPeriodCoverage = useMemo(
    () => (clarityView ? evaluateClarityPeriodCoverage(vm.range, clarityView.period) : 'full'),
    [clarityView, vm.range],
  )

  useRegisterPageExport('Jornada de compra', () => {
    const header = buildExportHeader('Jornada de compra', filters)
    const clarityLine =
      clarity.status === 'success' || clarity.status === 'stale'
        ? `_Sinais do Clarity: dados fictícios (ambiente de desenvolvimento), extração de ${clarityView?.period.from} a ${clarityView?.period.to}${clarity.status === 'stale' ? ' — desatualizados' : ''}._`
        : '_Sinais do Clarity: fonte ainda não configurada nesta instalação (ver 04-validacao/13-plano-ativacao-clarity.md)._'
    const lines = [
      header,
      '## Conversão por dispositivo',
      '',
      '| Dispositivo | Conversão |',
      '|---|---|',
      ...vm.deviceConversion.map((row) => `| ${DEVICE_LABELS[row.device]} | ${formatPercent(row.conversionRate)} |`),
      '',
      '## Etapas da jornada (volumes, sem taxa de passagem — D-05 não aprovada)',
      '',
      '| Etapa | Volume | Unidade |',
      '|---|---|---|',
      ...vm.stages.map((stage) => `| ${stage.label} | ${formatInt(stage.volume)} | ${UNIT_LABELS[stage.unit]} |`),
      '',
      '## Abandono por etapa',
      '',
      '_Metodologia em validação (D-05) — não calculado nesta versão._',
      '',
      clarityLine,
    ]
    return lines.join('\n')
  })

  if (scenario === 'fonte-indisponivel') {
    return (
      <div className="space-y-4">
        <SectionHeading title="Jornada de compra" question="Onde os usuários estão parando?" />
        <UnavailableState sourceLabel="GA4" since={MOCK_TODAY} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SectionHeading title="Jornada de compra" question="Onde os usuários estão parando?" />
        <LoadingCardGrid count={2} />
        <LoadingCardGrid count={7} />
      </div>
    )
  }

  if (scenario === 'vazio' || !vm.hasAnyData) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Jornada de compra" question="Onde os usuários estão parando?" />
        <EmptyState />
      </div>
    )
  }

  const deviceChartData: DeviceBarDatum[] = vm.deviceConversion.map((row) => ({
    device: DEVICE_LABELS[row.device],
    atual: row.conversionRate,
    comparacao: filters.comparison !== 'nenhum' ? row.comparisonConversionRate : undefined,
  }))

  return (
    <div className="space-y-5">
      <SectionHeading title="Jornada de compra" question="Onde os usuários estão parando?" />

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle>Conversão por dispositivo</CardTitle>
          <InfoTooltip meta={INDICATORS['IND-04']} />
        </CardHeader>
        <CardContent>
          <DeviceBarChart
            data={deviceChartData}
            formatValue={(v) => formatPercent(v)}
            comparisonLabel={filters.comparison === 'mesmo-periodo-2025' ? 'Mesmo período 2025' : 'Período anterior'}
          />
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4+clarity" from={vm.range.from} to={vm.range.to} note="Clarity é apoio, nunca somado ao GA4 (RA-07)" />
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle>Etapas da jornada</CardTitle>
          <InfoTooltip meta={INDICATORS['IND-05']} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {vm.stages.map((stage, index) => (
              <div key={stage.id} className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
                <span className="text-ds-sm font-medium text-[var(--color-muted-foreground)]">
                  {index + 1}. {stage.label}
                </span>
                <span className="text-lg font-semibold tabular-nums">{formatInt(stage.volume)}</span>
                <Badge variant={stage.unit === 'pedido' ? 'warning' : 'neutral'}>{UNIT_LABELS[stage.unit]}</Badge>
                {stage.note && <span className="text-[10px] text-[var(--color-muted-foreground)]">{stage.note}</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-ds-sm text-[var(--color-muted-foreground)]">
            Sem setas percentuais entre etapas — a metodologia de passagem/abandono ainda não foi aprovada (D-05, RA-02, RA-03).
          </p>
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} />
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle>Abandono por etapa</CardTitle>
          <InfoTooltip meta={INDICATORS['IND-06']} />
        </CardHeader>
        <CardContent>
          <ValidationState
            title="Metodologia em validação"
            description="A forma de calcular abandono entre etapas (D-05) ainda não foi aprovada por Analytics/UX. Ver 'Sobre os dados' para detalhes."
          />
        </CardContent>
      </Card>

      <ClarityRealSignalsPanel
        status={clarity.status}
        view={clarityView}
        errors={clarity.errors}
        periodCoverage={clarityPeriodCoverage}
        onReload={clarity.reload}
      />

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle>Notas de investigação</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-4 text-ds-base text-[var(--color-muted-foreground)]">
            <li>
              <Badge variant="warning">hipótese</Badge> Gravações do Clarity sugerem idas e voltas entre carrinho e checkout — ainda sem
              frequência medida (ver 07-riscos-pendencias.md, A-03).
            </li>
            <li>
              <Badge variant="warning">hipótese</Badge> Cliques repetidos em cartões de instalação/frete podem indicar dificuldade de
              entendimento da oferta — não comprovado.
            </li>
            <li>
              <Badge variant="warning">hipótese</Badge> Cadastro incompleto pode estar bloqueando o pagamento em parte das sessões — a
              confirmar com teste de usuários (Fase 5 do roadmap).
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
