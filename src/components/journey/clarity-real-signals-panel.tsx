// Painel de sinais de atrito do Clarity — Missão 04, Etapa C2 (criado,
// desconectado) / Etapa C3 (conectado à Jornada de compra) / atualização de
// 30/10/2026 (produção passou a mostrar o snapshot REAL embutido, em vez de
// 'idle' — ver src/data/clarity/use-clarity-journey.ts).
//
// Conectado por src/pages/journey-page.tsx via
// src/data/clarity/use-clarity-journey.ts: em desenvolvimento carrega
// fixtures fictícias; fora do DEV (produção) carrega o snapshot real
// embutido (src/data/real/clarity-real-snapshot.json). `isReal` diz qual dos
// dois é — o selo "dados fictícios" NUNCA pode aparecer para o real, e o
// rótulo do real nunca pode sugerir que é fictício. Os indicadores
// comerciais (GA4) continuam vindo do DataProvider síncrono, sem mudança.
//
// Usa exatamente os mesmos componentes de UI que src/pages/journey-page.tsx
// já usa (Card, Table, Badge, EmptyState) — nenhum componente novo de design
// foi criado, conforme pedido ("mantenha o Design System", "não redesenhe").

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, LoadingBlock } from '@/components/common/state-views'
import { SourceFooter } from '@/components/common/source-footer'
import type { ClarityJourneyView } from '@/data/clarity/adapter'
import { clarityCoverageMessage, type ClarityPeriodCoverage } from '@/data/clarity/coverage'
import type { SnapshotLoadStatus } from '@/data/async-snapshot/types'
import { formatDateTime } from '@/lib/format'

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  other: 'Outro',
  all: 'Todos os dispositivos',
}

export interface ClarityRealSignalsPanelProps {
  status: SnapshotLoadStatus
  view: ClarityJourneyView | null
  errors: string[] | null
  /** Cobertura do período selecionado pela janela realmente extraída (ver src/data/clarity/coverage.ts). */
  periodCoverage: ClarityPeriodCoverage
  /** `true` para o snapshot real embutido (produção); `false` para as fixtures fictícias (desenvolvimento). */
  isReal: boolean
  onReload?: () => void
}

function formatPerSession(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

export function ClarityRealSignalsPanel({ status, view, errors, periodCoverage, isReal, onReload }: ClarityRealSignalsPanelProps) {
  const coverageMessage = view ? clarityCoverageMessage(periodCoverage, view.period) : null
  const hideRowsForPeriod = periodCoverage === 'none'
  const hasAggregatedRows = view?.rows.some((row) => row.device === 'all') ?? false

  return (
    <Card className="print-break-inside-avoid" data-testid="clarity-signals-panel">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Sinais de atrito (Clarity)</CardTitle>
        {status === 'stale' && onReload && (
          <button type="button" onClick={onReload} className="text-ds-sm font-medium text-[var(--color-primary)] hover:underline">
            Atualizar
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'loading' && <LoadingBlock rows={4} />}

        {status === 'error' && (
          <div className="rounded-[var(--radius-control)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-3 text-ds-sm text-[var(--color-error)]">
            <p className="font-medium">Não foi possível carregar os sinais do Clarity no momento.</p>
            <p className="text-[var(--color-error)]/80">Tente novamente em instantes; avise o time responsável se o problema continuar.</p>
            {errors && errors.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[var(--color-error)]/80">Detalhes técnicos</summary>
                <ul className="mt-1 list-disc pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {status === 'idle' && !view && (
          <EmptyState message="Fonte real do Clarity ainda não configurada nesta instalação (ver plano de ativação, 04-validacao/13-plano-ativacao-clarity.md)." />
        )}

        {(status === 'success' || status === 'stale') && view && (
          <>
            {status === 'stale' && (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-2 text-ds-sm text-[var(--color-warning)]">
                Dados desatualizados — última extração além do intervalo aceitável (RF-17). Não tratar como atual.
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {isReal && <Badge variant="success">REAL</Badge>}
              {view.isPartial && <Badge variant="warning">Coleta parcial — {view.period.from} a {view.period.to}</Badge>}
            </div>

            {hasAggregatedRows && (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-info)]/30 bg-[var(--color-info-soft)] px-4 py-2 text-ds-sm text-[var(--color-info)]">
                Esta extração é agregada — "Todos os dispositivos" representa mobile + desktop + tablet + outros juntos. O filtro de
                dispositivo não recorta estes números (ver limitações abaixo).
              </div>
            )}

            {periodCoverage === 'partial' && coverageMessage && (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-ds-sm text-[var(--color-warning)]">
                {coverageMessage}
              </div>
            )}

            {view.limitations.length > 0 && (
              <div className="rounded-[var(--radius-control)] border border-[var(--color-info)]/30 bg-[var(--color-info-soft)] px-4 py-3 text-ds-sm text-[var(--color-info)]">
                <p className="font-medium">Limitações desta extração</p>
                <ul className="mt-1 list-disc pl-4">
                  {view.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </div>
            )}

            {!hideRowsForPeriod && view.topDeadClickPages.length > 0 && (
              <div>
                <p className="mb-1.5 text-ds-sm font-medium text-[var(--color-muted-foreground)]">
                  Páginas com maior concentração de dead clicks
                </p>
                <ul className="space-y-1">
                  {view.topDeadClickPages.slice(0, 3).map((page) => (
                    <li key={page.pagePath} className="flex items-center justify-between text-ds-base">
                      <span>{page.pageLabel}</span>
                      <span className="tabular-nums text-[var(--color-muted-foreground)]">{page.totalDeadClicks}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hideRowsForPeriod ? (
              <EmptyState message={coverageMessage ?? 'Sem sinais do Clarity para o período selecionado.'} />
            ) : view.rows.length === 0 ? (
              <EmptyState message="Sem sinais para o período consultado." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Dead clicks (abs. / por sessão)</TableHead>
                    <TableHead>Rage clicks (abs. / por sessão)</TableHead>
                    <TableHead>Quick backs (abs. / por sessão)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.rows.map((row) => (
                    <TableRow key={`${row.pagePath}-${row.device}`}>
                      <TableCell className="font-medium">{row.pageLabel}</TableCell>
                      <TableCell>{DEVICE_LABELS[row.device] ?? row.device}</TableCell>
                      <TableCell>
                        {row.deadClicks.absolute} / {formatPerSession(row.deadClicks.perSession)}
                      </TableCell>
                      <TableCell>
                        {row.rageClicks.absolute} / {formatPerSession(row.rageClicks.perSession)}
                      </TableCell>
                      <TableCell>
                        {row.quickBacks.absolute} / {formatPerSession(row.quickBacks.perSession)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        {view ? (
          <SourceFooter
            source="clarity"
            from={new Date(`${view.period.from}T00:00:00-03:00`)}
            to={new Date(`${view.period.to}T00:00:00-03:00`)}
            note={`${isReal ? 'Dados REAIS (extração manual do Clarity)' : 'Dados fictícios (ambiente de desenvolvimento)'} · Projeto: ${view.project} · Extraído em ${formatDateTime(new Date(view.extractedAt))}`}
          />
        ) : (
          <span>Fonte: Clarity — sem dados carregados nesta instalação.</span>
        )}
      </CardFooter>
    </Card>
  )
}
