// Aquisição e produtos — atualização de 30/10/2026: página convertida de
// maquete fictícia (Missão 02) para dado REAL embutido (mesma fonte do
// painel "Dados reais" da Visão Geral — src/data/real/real-overview.ts).
//
// Sem simulação de carregamento nem cenários de demo (fictício/vazio/fonte
// indisponível): o snapshot real é estático e síncrono, revalidado a cada
// render por loadRealOverview() — mesmo padrão de src/components/real-data/real-data-panel.tsx.
// Não há produtos individuais nem sessões/pedidos/conversão por canal nesta
// extração (o PDF do Looker não traz esse nível de detalhe) — por isso essas
// colunas/seções não aparecem aqui, em vez de mostrar fictício no lugar.

import { useMemo, useState } from 'react'
import { BadgeCheck, Inbox } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/common/section-heading'
import { SourceFooter } from '@/components/common/source-footer'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { ValidationState } from '@/components/common/state-views'
import { ChannelBarChart, type ChannelBarDatum } from '@/components/charts/channel-bar-chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { channelRevenueShare, loadRealOverview } from '@/data/real/real-overview'
import { INDICATORS } from '@/data/indicators'
import { formatCurrencyCompactBRL, formatDateShort, formatDateTime, formatInt, formatPercent } from '@/lib/format'

/**
 * % da receita TOTAL do período (não da soma das linhas exibidas — essa soma
 * costuma ser menor que o total real, ver channelRevenueShare).
 */
function channelsWithShare(
  channels: { channel: string; sourceMedium?: string; revenue: number }[],
  periodTotalRevenue: number | null,
): (ChannelBarDatum & { sourceMedium?: string })[] {
  return [...channels]
    .map((c) => ({ ...c, revenueShare: channelRevenueShare(c.revenue, periodTotalRevenue) ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function AcquisitionPage() {
  const [showAllChannels, setShowAllChannels] = useState(false)
  const view = useMemo(() => loadRealOverview(), [])

  useRegisterPageExport('Aquisição e produtos', () => {
    if (!view) return '# Aquisição e produtos\n\nO snapshot real embutido não passou na validação — nada é exportado.'
    const channels = channelsWithShare(view.channels, view.revenue)
    const lines = [
      '# Aquisição e produtos — dados REAIS (Looker Studio)',
      '',
      `_Período ${formatDateShort(new Date(`${view.period.from}T00:00:00-03:00`))} a ${formatDateShort(new Date(`${view.period.to}T00:00:00-03:00`))} · extraído em ${formatDateTime(new Date(view.extractedAt))}._`,
      '',
      '## Participação na receita por canal',
      '',
      '| Canal | Origem / mídia | Receita | % da receita |',
      '|---|---|---|---|',
      ...channels.map((c) => `| ${c.channel} | ${c.sourceMedium ?? '—'} | ${formatCurrencyCompactBRL(c.revenue)} | ${formatPercent(c.revenueShare)} |`),
      '',
      '## Ranking de marcas',
      '',
      '| Marca | Itens vistos | Itens adicionados* | Itens comprados | Receita do item |',
      '|---|---|---|---|---|',
      ...view.brands.map((b) => `| ${b.brand} | ${formatInt(b.itemsViewed)} | ${formatInt(b.itemsAdded)} | ${formatInt(b.itemsPurchased)} | ${formatCurrencyCompactBRL(b.itemRevenue)} |`),
      '',
      '*Estimado a partir de "%Add to Cart" do Looker — não é uma contagem bruta.',
      '',
      '## Categorias e produtos individuais',
      '',
      '_Sem dados reais disponíveis nesta extração (item_category não confirmado — Q-04; produtos individuais não vieram no PDF do Looker)._',
      '',
      ...(view.limitations.length > 0 ? ['## Limitações desta extração', '', ...view.limitations.map((l) => `- ${l}`)] : []),
    ]
    return lines.join('\n')
  })

  if (!view) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />
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
      </div>
    )
  }

  const periodFrom = new Date(`${view.period.from}T00:00:00-03:00`)
  const periodTo = new Date(`${view.period.to}T00:00:00-03:00`)
  const channels = channelsWithShare(view.channels, view.revenue)
  const visibleChannelRows = showAllChannels ? channels : channels.slice(0, 10)

  return (
    <div className="space-y-5">
      <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />

      <div className="flex items-center gap-2 text-ds-sm text-[var(--color-muted-foreground)]">
        <Badge variant="success">
          <BadgeCheck className="h-3 w-3" />
          REAL
        </Badge>
        <span>
          Extração manual do Looker Studio · {formatDateShort(periodFrom)} a {formatDateShort(periodTo)} — mesma fonte do painel "Dados
          reais" da Visão Geral.
        </span>
      </div>

      {channels.length > 0 && (
        <Card className="print-break-inside-avoid">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <CardTitle>Participação na receita por canal</CardTitle>
            <InfoTooltip meta={INDICATORS['IND-07']} />
          </CardHeader>
          <CardContent>
            <ChannelBarChart data={channels} />
          </CardContent>
          <CardFooter>
            <SourceFooter source="ga4" from={periodFrom} to={periodTo} note="Sessões, pedidos e conversão por canal não disponíveis nesta extração" />
          </CardFooter>
        </Card>
      )}

      {channels.length > 0 && (
        <Card className="print-break-inside-avoid">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Origem / mídia</CardTitle>
            {channels.length > 10 && (
              <Button variant="ghost" size="sm" onClick={() => setShowAllChannels((v) => !v)}>
                {showAllChannels ? 'Ver top 10' : 'Ver todos'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Origem / mídia</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>% da receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleChannelRows.map((row) => (
                  <TableRow key={`${row.channel}-${row.sourceMedium ?? ''}`}>
                    <TableCell className="font-medium">{row.channel}</TableCell>
                    <TableCell>{row.sourceMedium ?? '—'}</TableCell>
                    <TableCell>{formatCurrencyCompactBRL(row.revenue)}</TableCell>
                    <TableCell>{formatPercent(row.revenueShare)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <SourceFooter source="ga4" from={periodFrom} to={periodTo} />
          </CardFooter>
        </Card>
      )}

      {view.brands.length > 0 && (
        <Card className="print-break-inside-avoid">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <CardTitle>Ranking de marcas</CardTitle>
            <InfoTooltip meta={INDICATORS['IND-08']} />
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Itens vistos</TableHead>
                  <TableHead>Itens adicionados*</TableHead>
                  <TableHead>Itens comprados</TableHead>
                  <TableHead>Receita do item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.brands.map((row) => (
                  <TableRow key={row.brand}>
                    <TableCell className="font-medium">{row.brand}</TableCell>
                    <TableCell>{formatInt(row.itemsViewed)} itens</TableCell>
                    <TableCell>{formatInt(row.itemsAdded)} itens</TableCell>
                    <TableCell>{formatInt(row.itemsPurchased)} itens</TableCell>
                    <TableCell>{formatCurrencyCompactBRL(row.itemRevenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <SourceFooter source="ga4" from={periodFrom} to={periodTo} note='*Estimado a partir de "%Add to Cart" do Looker — não é uma contagem bruta' />
          </CardFooter>
        </Card>
      )}

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle>Categorias e produtos individuais</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationState
            title="Sem dados reais disponíveis"
            description='Categorias: preenchimento de item_category ainda não confirmado (Q-04). Produtos individuais: esta extração do Looker Studio não traz um ranking por produto — só por marca. Assim que houver uma fonte real para qualquer um dos dois, esta seção passa a exibir dados.'
          />
        </CardContent>
      </Card>

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
    </div>
  )
}
