// Painel de comparação anual do Clarity — atualização de 30/10/2026. Mostra
// exatamente o slide 04/05 do "Resumo Executivo Pré-Black"
// (PneuStore_Resumo_Executivo_PreBlack_2026.pdf) — sem recalcular nem
// reinterpretar.

import { BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CLARITY_YOY, PRE_BLACK_REPORT_COMPARISON_PERIOD, PRE_BLACK_REPORT_PERIOD, PRE_BLACK_REPORT_SOURCE, type DeviceYearPair } from '@/data/real/pre-black-executive-report'
import { formatDateShort, formatPercent } from '@/lib/format'

function DeviceYearTable({ label, pair }: { label: string; pair: DeviceYearPair }) {
  return (
    <div>
      <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">{label}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dispositivo</TableHead>
            <TableHead>2025</TableHead>
            <TableHead>2026</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Mobile</TableCell>
            <TableCell>{formatPercent(pair.mobile.y2025, 1)}</TableCell>
            <TableCell>{formatPercent(pair.mobile.y2026, 1)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Desktop</TableCell>
            <TableCell>{formatPercent(pair.desktop.y2025, 1)}</TableCell>
            <TableCell>{formatPercent(pair.desktop.y2026, 1)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export function ClarityYoyPanel() {
  const periodFrom = new Date(`${PRE_BLACK_REPORT_PERIOD.from}T00:00:00-03:00`)
  const periodTo = new Date(`${PRE_BLACK_REPORT_PERIOD.to}T00:00:00-03:00`)
  const comparisonFrom = new Date(`${PRE_BLACK_REPORT_COMPARISON_PERIOD.from}T00:00:00-03:00`)
  const comparisonTo = new Date(`${PRE_BLACK_REPORT_COMPARISON_PERIOD.to}T00:00:00-03:00`)

  return (
    <Card className="print-break-inside-avoid border-[var(--color-success)]/30" data-testid="clarity-yoy-panel">
      <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
        <CardTitle>Clarity — comparação anual</CardTitle>
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          REAL
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-ds-sm text-[var(--color-muted-foreground)]">
          {formatDateShort(periodFrom)} a {formatDateShort(periodTo)} de 2026, comparado com {formatDateShort(comparisonFrom)} a{' '}
          {formatDateShort(comparisonTo)} de 2025.
        </p>

        <DeviceYearTable label="Produto até pedido confirmado" pair={CLARITY_YOY.productToConfirmedOrderPercent} />
        <DeviceYearTable label="Sessões com dead click" pair={CLARITY_YOY.sessionsWithDeadClickPercent} />

        <div className="rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-ds-sm text-[var(--color-warning)]">
          <strong>Cobertura do Clarity:</strong> {formatPercent(CLARITY_YOY.clarityCoverageOfGa4SessionsPercent.y2025, 1)} das sessões do GA4
          em 2025 e {formatPercent(CLARITY_YOY.clarityCoverageOfGa4SessionsPercent.y2026, 1)} em 2026.
        </div>

        <p className="text-[11px] text-[var(--color-muted-foreground)]">{CLARITY_YOY.note}</p>
      </CardContent>
      <CardFooter>
        <span>Fonte: {PRE_BLACK_REPORT_SOURCE}</span>
      </CardFooter>
    </Card>
  )
}
