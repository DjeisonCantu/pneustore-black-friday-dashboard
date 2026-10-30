// Painel de dados REAIS — Missão 04, Etapa C5.2 (criado) / atualização de
// 30/10/2026 (tabelas de canal e marca movidas para a página "Aquisição e
// produtos", que agora também é 100% real — ver acquisition-page.tsx — para
// não duplicar a mesma tabela em duas telas; este painel ficou só com os
// totais do período e um link para o detalhamento).
//
// Deliberadamente isolado de qualquer card/gráfico fictício da página: nunca
// mistura um número real com um número fictício no mesmo elemento visual,
// nunca mostra uma comparação (não há uma segunda extração real ainda para
// comparar), e nunca finge granularidade diária/por dispositivo que a fonte
// não tem — ver src/data/real/real-overview.ts.

import { Link } from 'react-router-dom'
import { BadgeCheck, Inbox } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadRealOverview } from '@/data/real/real-overview'
import { formatCurrencyCompactBRL, formatDateShort, formatDateTime, formatInt } from '@/lib/format'

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-success)]/25 bg-[var(--color-success-soft)]/40 p-3">
      <span className="truncate text-ds-sm font-medium text-[var(--color-muted-foreground)]">{label}</span>
      <span className="truncate text-ds-h4 font-semibold tabular-nums text-[var(--color-foreground)]">{value}</span>
    </div>
  )
}

export function RealDataPanel() {
  const view = loadRealOverview()

  if (!view) {
    return (
      <Card className="print-break-inside-avoid border-[var(--color-error)]/30">
        <CardHeader>
          <CardTitle>Dados reais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-ds-sm text-[var(--color-error)]">
            <Inbox className="h-4 w-4 shrink-0" />
            O snapshot real embutido não passou na validação — nada é exibido aqui para não mostrar dado inválido como se fosse real.
          </div>
        </CardContent>
      </Card>
    )
  }

  const periodFrom = new Date(`${view.period.from}T00:00:00-03:00`)
  const periodTo = new Date(`${view.period.to}T00:00:00-03:00`)

  return (
    <Card className="print-break-inside-avoid border-[var(--color-success)]/30">
      <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
        <CardTitle>Dados reais — primeira extração (Looker Studio)</CardTitle>
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          REAL
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-ds-sm text-[var(--color-muted-foreground)]">
          Total do período <strong className="text-[var(--color-foreground)]">{formatDateShort(periodFrom)} a {formatDateShort(periodTo)}</strong> — extraído
          manualmente de um PDF do Looker Studio em {formatDateTime(new Date(view.extractedAt))}. Nunca segmentado por dia nem por dispositivo
          (ver limitações).
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Sessões" value={view.sessions === null ? '—' : formatInt(view.sessions)} />
          <MiniStat label="Usuários" value={view.users === null ? '—' : formatInt(view.users)} />
          <MiniStat label="Pedidos" value={view.orders === null ? '—' : formatInt(view.orders)} />
          <MiniStat label="Receita" value={view.revenue === null ? '—' : formatCurrencyCompactBRL(view.revenue)} />
        </div>

        {(view.channels.length > 0 || view.brands.length > 0) && (
          <p className="text-ds-sm text-[var(--color-muted-foreground)]">
            Detalhamento por canal de aquisição e por marca (mesmos dados reais) está em{' '}
            <Link to="/aquisicao" className="font-medium text-[var(--color-primary)] hover:underline">
              Aquisição e produtos →
            </Link>
            .
          </p>
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
      </CardContent>
      <CardFooter>
        <span>Fonte: Looker Studio (extração manual) · {view.note}</span>
      </CardFooter>
    </Card>
  )
}
