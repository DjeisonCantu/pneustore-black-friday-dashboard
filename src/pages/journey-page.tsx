// Jornada de compra — atualização de 30/10/2026: o painel do Clarity passou
// a mostrar exatamente os números do "Resumo Executivo Pré-Black"
// (PneuStore_Resumo_Executivo_PreBlack_2026.pdf, 14 a 20/10/2026) — o
// relatório que gerou o pedido deste dashboard — em vez do antigo snapshot
// agregado de 6 páginas de checkout. "Abandono por etapa" continua como
// estava: a passagem entre etapas do relatório é "sem sequência validada"
// (ver nota do próprio relatório), então não substitui a metodologia de
// abandono ainda pendente de aprovação (D-05).

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeading } from '@/components/common/section-heading'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { ValidationState } from '@/components/common/state-views'
import { ClarityStageSignalsPanel } from '@/components/journey/clarity-stage-signals-panel'
import { ClarityYoyPanel } from '@/components/journey/clarity-yoy-panel'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildRealExportHeader } from '@/lib/export-metadata'
import { INDICATORS } from '@/data/indicators'
import {
  CLARITY_DEAD_CLICKS_2026,
  CLARITY_FUNNEL_2026,
  CLARITY_YOY,
  PRE_BLACK_PRIORITIES,
  PRE_BLACK_REPORT_PERIOD,
} from '@/data/real/pre-black-executive-report'
import { formatPercent } from '@/lib/format'

export function JourneyPage() {
  useRegisterPageExport('Jornada de compra', () => {
    const header = buildRealExportHeader('Jornada de compra')
    const lines = [
      header,
      '## Abandono por etapa',
      '',
      '_Metodologia em validação (D-05) — não calculado nesta versão._',
      '',
      `## Passagem entre etapas (Clarity, ${PRE_BLACK_REPORT_PERIOD.from} a ${PRE_BLACK_REPORT_PERIOD.to})`,
      '',
      '| Etapa | Mobile | Desktop |',
      '|---|---|---|',
      ...CLARITY_FUNNEL_2026.steps.map((s) => `| ${s.label} | ${formatPercent(s.mobile, 0)} | ${formatPercent(s.desktop, 0)} |`),
      '',
      `_${CLARITY_FUNNEL_2026.note}_`,
      '',
      '## Dead clicks por sessão',
      '',
      '| Etapa | Mobile | Desktop |',
      '|---|---|---|',
      ...CLARITY_DEAD_CLICKS_2026.steps.map((s) => `| ${s.label} | ${s.mobile} | ${s.desktop} |`),
      '',
      `_${CLARITY_DEAD_CLICKS_2026.note}_`,
      '',
      '## Comparação anual (Clarity)',
      '',
      `Cobertura do Clarity: ${formatPercent(CLARITY_YOY.clarityCoverageOfGa4SessionsPercent.y2025, 1)} das sessões do GA4 em 2025 e ${formatPercent(CLARITY_YOY.clarityCoverageOfGa4SessionsPercent.y2026, 1)} em 2026.`,
      '',
      '## Prioridades antes da Black Friday',
      '',
      ...PRE_BLACK_PRIORITIES.map((p) => `- **${p.title}** (${p.owner}): ${p.detail}`),
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
            description="A forma de calcular abandono entre etapas (D-05) ainda não foi aprovada por Analytics/UX. A passagem entre etapas abaixo (Clarity) é 'sem sequência validada', conforme o próprio relatório — não é uma taxa de abandono. Ver 'Sobre os dados' para detalhes."
          />
        </CardContent>
      </Card>

      <ClarityStageSignalsPanel />
      <ClarityYoyPanel />

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle>Prioridades antes da Black Friday</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-ds-base">
            {PRE_BLACK_PRIORITIES.map((item, index) => (
              <li key={item.title} className="flex gap-2.5">
                <span className="font-semibold text-[var(--color-primary)]">{index + 1}.</span>
                <div>
                  <span className="font-medium">{item.title}</span>
                  <span className="text-[var(--color-muted-foreground)]"> — {item.detail}</span>
                  <span className="ml-1.5 text-ds-sm text-[var(--color-primary)]">({item.owner})</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
