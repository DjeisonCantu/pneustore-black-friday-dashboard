// Painel de sinais do Clarity por etapa — atualização de 30/10/2026. Mostra
// exatamente os slides 01/05 e 02/05 do "Resumo Executivo Pré-Black"
// (PneuStore_Resumo_Executivo_PreBlack_2026.pdf): passagem entre etapas e
// dead clicks por sessão, por dispositivo — sem recalcular nem reinterpretar.

import { BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CLARITY_DEAD_CLICKS_2026, CLARITY_FUNNEL_2026, PRE_BLACK_REPORT_PERIOD, PRE_BLACK_REPORT_SOURCE, type DeviceStep } from '@/data/real/pre-black-executive-report'
import { formatDateShort, formatPercent } from '@/lib/format'

function DeviceStepTable({ steps, valueFormat }: { steps: DeviceStep[]; valueFormat: (value: number) => string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Etapa</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Desktop</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {steps.map((step) => (
          <TableRow key={step.label}>
            <TableCell className="font-medium">{step.label}</TableCell>
            <TableCell>{valueFormat(step.mobile)}</TableCell>
            <TableCell>{valueFormat(step.desktop)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ClarityStageSignalsPanel() {
  const periodFrom = new Date(`${PRE_BLACK_REPORT_PERIOD.from}T00:00:00-03:00`)
  const periodTo = new Date(`${PRE_BLACK_REPORT_PERIOD.to}T00:00:00-03:00`)

  return (
    <Card className="print-break-inside-avoid border-[var(--color-success)]/30" data-testid="clarity-stage-signals-panel">
      <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
        <CardTitle>Sinais de atrito (Clarity) — por etapa</CardTitle>
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          REAL
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-ds-sm text-[var(--color-muted-foreground)]">
          Semana {formatDateShort(periodFrom)} a {formatDateShort(periodTo)} de 2026.
        </p>

        <div>
          <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Passagem entre etapas (visitas por URL)</p>
          <DeviceStepTable steps={CLARITY_FUNNEL_2026.steps} valueFormat={(v) => formatPercent(v, 0)} />
          <p className="mt-1.5 text-[11px] text-[var(--color-muted-foreground)]">{CLARITY_FUNNEL_2026.note}</p>
        </div>

        <div>
          <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">Dead clicks por sessão</p>
          <DeviceStepTable steps={CLARITY_DEAD_CLICKS_2026.steps} valueFormat={(v) => v.toString().replace('.', ',')} />
          <p className="mt-1.5 text-[11px] text-[var(--color-muted-foreground)]">{CLARITY_DEAD_CLICKS_2026.note}</p>
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--color-info)]/30 bg-[var(--color-info-soft)] px-4 py-3 text-ds-sm text-[var(--color-info)]">
          <p className="font-medium">O que aparece nas gravações</p>
          <ul className="mt-1 list-disc pl-4">
            {CLARITY_DEAD_CLICKS_2026.recordings.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <span>Fonte: {PRE_BLACK_REPORT_SOURCE}</span>
      </CardFooter>
    </Card>
  )
}
