import { useMemo, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/common/section-heading'
import { SourceFooter } from '@/components/common/source-footer'
import { InfoTooltip } from '@/components/common/info-tooltip'
import { ChannelBarChart } from '@/components/charts/channel-bar-chart'
import { LoadingBlock, LoadingCardGrid, UnavailableState, EmptyState, ValidationState } from '@/components/common/state-views'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFilters } from '@/hooks/use-filters'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { useDemoScenario } from '@/state/demo-scenario-context'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildExportHeader } from '@/lib/export-metadata'
import { buildAcquisitionViewModel } from '@/data/view-models/acquisition'
import { INDICATORS } from '@/data/indicators'
import { formatCurrencyBRL, formatInt, formatPercent } from '@/lib/format'
import { MOCK_TODAY } from '@/data/mock/daily-series'

export function AcquisitionPage() {
  const [filters] = useFilters()
  const { scenario } = useDemoScenario()
  const filtersKey = JSON.stringify(filters)
  const isLoading = useSimulatedLoading(filtersKey)
  const [showAllChannels, setShowAllChannels] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const vm = useMemo(() => buildAcquisitionViewModel(filters), [filters])

  useRegisterPageExport('Aquisição e produtos', () => {
    const header = buildExportHeader('Aquisição e produtos', filters)
    const lines = [
      header,
      '## Participação na receita por canal',
      '',
      '| Canal | Sessões | Pedidos | Receita | % da receita |',
      '|---|---|---|---|---|',
      ...vm.channels.map(
        (c) => `| ${c.channel} | ${formatInt(c.sessions)} | ${formatInt(c.orders)} | ${formatCurrencyBRL(c.revenue)} | ${formatPercent(c.revenueShare)} |`,
      ),
      '',
      '## Ranking de marcas',
      '',
      '| Marca | Itens vistos | Itens adicionados | Itens comprados | Receita do item |',
      '|---|---|---|---|---|',
      ...vm.brands.map(
        (b) => `| ${b.brand} | ${formatInt(b.itemsViewed)} | ${formatInt(b.itemsAdded)} | ${formatInt(b.itemsPurchased)} | ${formatCurrencyBRL(b.itemRevenue)} |`,
      ),
      '',
      '## Categorias',
      '',
      '_Em validação — preenchimento de item_category ainda não confirmado (Q-04)._',
      '',
      '## Top produtos (por receita do item)',
      '',
      '| Produto | Marca | Tipo | Itens vistos | Itens adicionados | Itens comprados | Receita do item |',
      '|---|---|---|---|---|---|---|',
      ...vm.products
        .slice(0, 20)
        .map(
          (p) =>
            `| ${p.name} | ${p.brand} | ${p.isService ? 'Serviço' : 'Produto'} | ${formatInt(p.itemsViewed)} | ${formatInt(p.itemsAdded)} | ${formatInt(p.itemsPurchased)} | ${formatCurrencyBRL(p.itemRevenue)} |`,
        ),
    ]
    return lines.join('\n')
  })

  if (scenario === 'fonte-indisponivel') {
    return (
      <div className="space-y-4">
        <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />
        <UnavailableState sourceLabel="GA4" since={MOCK_TODAY} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />
        <LoadingCardGrid count={3} />
        <Card>
          <CardContent className="pt-4">
            <LoadingBlock rows={8} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (scenario === 'vazio' || !vm.hasAnyData) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />
        <EmptyState />
      </div>
    )
  }

  const visibleChannelRows = showAllChannels ? vm.channels : vm.channels.slice(0, 10)
  const filteredProducts = vm.products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="space-y-5">
      <SectionHeading title="Aquisição e produtos" question="De onde vem a venda e o que está sendo vendido?" />

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CardTitle>Participação na receita por canal</CardTitle>
          <InfoTooltip meta={INDICATORS['IND-07']} />
        </CardHeader>
        <CardContent>
          <ChannelBarChart data={vm.channels} />
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} />
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Origem / mídia</CardTitle>
          {vm.channels.length > 10 && (
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
                <TableHead>Sessões</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Conversão</TableHead>
                <TableHead>% da receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleChannelRows.map((row) => (
                <TableRow key={row.channel}>
                  <TableCell className="font-medium">{row.channel}</TableCell>
                  <TableCell>{formatInt(row.sessions)}</TableCell>
                  <TableCell>{formatInt(row.orders)}</TableCell>
                  <TableCell>{formatCurrencyBRL(row.revenue)}</TableCell>
                  <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                  <TableCell>{formatPercent(row.revenueShare)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} note='Agrupamento "Outros"/"CRM" pendente de confirmação (Q-08)' />
        </CardFooter>
      </Card>

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
                <TableHead>Itens adicionados</TableHead>
                <TableHead>Itens comprados</TableHead>
                <TableHead>Receita do item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.brands.map((row) => (
                <TableRow key={row.brand}>
                  <TableCell className="font-medium">{row.brand}</TableCell>
                  <TableCell>{formatInt(row.itemsViewed)} itens</TableCell>
                  <TableCell>{formatInt(row.itemsAdded)} itens</TableCell>
                  <TableCell>{formatInt(row.itemsPurchased)} itens</TableCell>
                  <TableCell>{formatCurrencyBRL(row.itemRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} />
        </CardFooter>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader>
          <CardTitle>Ranking de categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <ValidationState
            title="Categoria em validação"
            description="O preenchimento do parâmetro item_category no stream web ainda não foi confirmado (Q-04). Assim que validado, este ranking passa a exibir dados."
          />
        </CardContent>
      </Card>

      <Card className="print-break-inside-avoid">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Produtos (top 20 por receita do item)</CardTitle>
          <input
            type="search"
            placeholder="Buscar produto…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="no-print h-8 w-48 rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-2.5 text-ds-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Itens vistos</TableHead>
                <TableHead>Itens adicionados</TableHead>
                <TableHead>Itens comprados</TableHead>
                <TableHead>Receita do item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.slice(0, 20).map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.brand}</TableCell>
                  <TableCell>
                    <Badge variant={row.isService ? 'info' : 'neutral'}>{row.isService ? 'Serviço' : 'Produto'}</Badge>
                  </TableCell>
                  <TableCell>{formatInt(row.itemsViewed)}</TableCell>
                  <TableCell>{formatInt(row.itemsAdded)}</TableCell>
                  <TableCell>{formatInt(row.itemsPurchased)}</TableCell>
                  <TableCell>{formatCurrencyBRL(row.itemRevenue)}</TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState message="Nenhum produto encontrado para esta busca." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <SourceFooter source="ga4" from={vm.range.from} to={vm.range.to} note="Serviços (ex.: montagem) separados dos pneus — critério a confirmar (Q-09)" />
        </CardFooter>
      </Card>
    </div>
  )
}
