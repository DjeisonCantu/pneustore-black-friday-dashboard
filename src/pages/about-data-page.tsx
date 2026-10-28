import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/common/section-heading'
import { EmptyState } from '@/components/common/state-views'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { GLOSSARY, INDICATORS, KNOWN_LIMITATIONS } from '@/data/indicators'
import { UNIT_LABELS } from '@/types/common'
import { formatDateTime } from '@/lib/format'
import { MOCK_TODAY } from '@/data/mock/daily-series'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  confirmado: 'success',
  provavel: 'info',
  parcial: 'warning',
  'nao-validado': 'error',
}

const STATUS_LABEL: Record<string, string> = {
  confirmado: 'Confirmado',
  provavel: 'Provável',
  parcial: 'Parcial',
  'nao-validado': 'Não validado',
}

export function AboutDataPage() {
  useRegisterPageExport('Sobre os dados', () => {
    const lines = [
      '# Sobre os dados — PneuStore · Site',
      '',
      `_Gerado em ${formatDateTime(MOCK_TODAY)} a partir da maquete da Missão 02._`,
      '',
      '## Glossário',
      '',
      ...GLOSSARY.map((g) => `- **${g.term}**: ${g.definition}`),
      '',
      '## Indicadores',
      '',
      ...Object.values(INDICATORS).map(
        (ind) =>
          `- **${ind.id} — ${ind.label}** (${STATUS_LABEL[ind.status]}): ${ind.definition}${ind.formula ? ` Fórmula: ${ind.formula}.` : ''}${ind.limitations ? ` Limitação: ${ind.limitations}` : ''}`,
      ),
      '',
      '## Limitações e decisões pendentes',
      '',
      ...KNOWN_LIMITATIONS.map((item) => `- **${item.id}**: ${item.description}`),
    ]
    return lines.join('\n')
  })

  return (
    <div className="space-y-5">
      <SectionHeading title="Sobre os dados" question="Definições, fontes, limitações e histórico de mensuração." />

      <Card>
        <CardHeader>
          <CardTitle>Glossário de unidades</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Termo</TableHead>
                <TableHead>Definição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GLOSSARY.map((entry) => (
                <TableRow key={entry.term}>
                  <TableCell className="font-medium">{entry.term}</TableCell>
                  <TableCell className="whitespace-normal text-[var(--color-muted-foreground)]">{entry.definition}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores — definição, unidade, fonte e status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {Object.values(INDICATORS).map((ind) => (
            <div key={ind.id} className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3.5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-ds-sm text-[var(--color-muted-foreground)]">{ind.id}</span>
                <h3 className="text-ds-base font-semibold">{ind.label}</h3>
                <Badge variant={STATUS_VARIANT[ind.status]}>{STATUS_LABEL[ind.status]}</Badge>
              </div>
              <p className="text-ds-base text-[var(--color-muted-foreground)]">{ind.definition}</p>
              {ind.formula && <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">Fórmula: {ind.formula}</p>}
              <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">
                Unidade: {UNIT_LABELS[ind.unit]}
                {ind.secondaryUnit ? ` · ${UNIT_LABELS[ind.secondaryUnit]}` : ''} · Fonte: {ind.source}
              </p>
              {ind.limitations && (
                <p className="mt-1 text-ds-sm text-[var(--color-warning)]">
                  <Badge variant="warning">limitação</Badge> {ind.limitations}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitações conhecidas e decisões pendentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {KNOWN_LIMITATIONS.map((item) => (
              <li key={item.id} className="flex gap-2 text-ds-base">
                <Badge variant="neutral">{item.id}</Badge>
                <span className="text-[var(--color-muted-foreground)]">{item.description}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-ds-sm text-[var(--color-muted-foreground)]">
            Lista completa de inconsistências, decisões e perguntas em abra:{' '}
            <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5">01-planejamento/07-riscos-pendencias.md</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de mudanças de mensuração</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState message="Nenhum evento registrado ainda. Esta seção será preenchida conforme decisões (D-04, D-05 etc.) forem aprovadas e correções de mensuração entrarem em vigor." />
        </CardContent>
      </Card>
    </div>
  )
}
