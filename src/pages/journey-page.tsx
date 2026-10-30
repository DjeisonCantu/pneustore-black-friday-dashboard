// Jornada de compra — atualização de 30/10/2026: "Conversão por dispositivo"
// e "Etapas da jornada" (derivados de src/data/mock/) foram removidos a
// pedido do dono do projeto ("preciso que NADA seja fictício, tudo seja
// real" — uso pela equipe CX). Nenhuma fonte real com granularidade por
// dispositivo ou por etapa do funil está disponível hoje (precisaria da GA4
// Data API, sem acesso, ou de um novo relatório do Looker exportado para
// esse fim) — em vez de inventar essa granularidade, as seções foram
// removidas, não substituídas por outro dado fictício. "Abandono por etapa"
// continua como estava: não é dado fictício, é um aviso honesto de
// metodologia pendente (D-05).

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/common/section-heading'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { ValidationState } from '@/components/common/state-views'
import { ClarityRealSignalsPanel } from '@/components/journey/clarity-real-signals-panel'
import { useFilters } from '@/hooks/use-filters'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { resolvePeriodRange } from '@/data/selectors'
import { INDICATORS } from '@/data/indicators'
import { useClarityJourneySignals } from '@/data/clarity/use-clarity-journey'
import { buildClarityJourneyView, filterClarityJourneyViewByDevice } from '@/data/clarity/adapter'
import { evaluateClarityPeriodCoverage, type ClarityPeriodCoverage } from '@/data/clarity/coverage'

export function JourneyPage() {
  const [filters] = useFilters()

  // Sinais comportamentais do Clarity — camada assíncrona separada do
  // DataProvider síncrono (decisão arquitetural da Etapa C3, ver
  // 04-validacao/05-mapeamento-frontend.md, seção 11). Em desenvolvimento
  // carrega fixtures fictícias; em produção carrega o snapshot real embutido
  // (atualização de 30/10/2026) — ver src/data/clarity/use-clarity-journey.ts.
  const clarity = useClarityJourneySignals()
  const isRealClarityData = !import.meta.env.DEV
  const clarityView = useMemo(() => {
    if (!clarity.snapshot) return null
    return filterClarityJourneyViewByDevice(buildClarityJourneyView(clarity.snapshot), filters.device)
  }, [clarity.snapshot, filters.device])
  const selectedRange = useMemo(() => resolvePeriodRange(filters), [filters])
  const clarityPeriodCoverage: ClarityPeriodCoverage = useMemo(
    () => (clarityView ? evaluateClarityPeriodCoverage(selectedRange, clarityView.period) : 'full'),
    [clarityView, selectedRange],
  )

  useRegisterPageExport('Jornada de compra', () => {
    const header = buildRealExportHeader('Jornada de compra')
    const clarityLine =
      clarity.status === 'success' || clarity.status === 'stale'
        ? `_Sinais do Clarity: ${isRealClarityData ? 'dados REAIS' : 'dados fictícios (ambiente de desenvolvimento)'}, extração de ${clarityView?.period.from} a ${clarityView?.period.to}${clarity.status === 'stale' ? ' — desatualizados' : ''}._`
        : '_Sinais do Clarity: fonte ainda não configurada nesta instalação (ver 04-validacao/13-plano-ativacao-clarity.md)._'
    const lines = [
      header,
      '## Abandono por etapa',
      '',
      '_Metodologia em validação (D-05) — não calculado nesta versão._',
      '',
      clarityLine,
    ]
    return lines.join('\n')
  })

  return (
    <div className="space-y-5">
      <SectionHeading title="Jornada de compra" question="Onde os usuários estão parando?" />

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
        isReal={isRealClarityData}
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
