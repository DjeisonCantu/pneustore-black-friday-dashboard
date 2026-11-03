// Testes da página one-page (atualização de 30/10/2026): substitui a antiga
// Visão geral/Jornada de compra/Aquisição e produtos por uma única tela.
// Cobre os blocos essenciais e as regras da Parte 3 do pedido (sem dado
// fictício, cor nunca é o único indicador, "Sobre os dados" vira gaveta).

import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExportProvider, useExportContext } from '@/state/export-context'
import { RealDataProvider } from '@/state/real-data-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { BUNDLED_UPDATES } from '@/data/bundled-data'
import { buildDashboardData, type DashboardData } from '@/data/dashboard-data'
import { mergeUpdates } from '@/data/updates/merge-updates'
import { parseUpdateMd } from '@/data/updates/parse-update-md'
import example0311 from '@/data/updates/__tests__/fixtures/atualizacao-2026-11-03.md?raw'
import { DashboardPage } from '../dashboard-page'

// Baseline + a atualização de 03/11 (Looker 06/10–02/11 com marcas de 01–02/nov, Clarity 31/10–02/11).
function dataWith0311(): DashboardData {
  const parsed = parseUpdateMd(example0311)
  if (!parsed.ok) throw new Error('fixture inválida')
  return buildDashboardData(mergeUpdates([...BUNDLED_UPDATES, { id: '2026-11-03-1530', ...parsed.update }]))
}

function ExportProbe({ onMarkdown }: { onMarkdown: (markdown: string) => void }) {
  const { getMarkdown } = useExportContext()
  return (
    <button type="button" onClick={() => onMarkdown(getMarkdown())}>
      probe-export
    </button>
  )
}

/** Sem `data`, a página lê os dados do bundle (o baseline = o que está no ar). */
function renderDashboard(onMarkdown: (markdown: string) => void = () => {}, data?: DashboardData) {
  const page = (
    <ExportProvider>
      <DashboardPage />
      <ExportProbe onMarkdown={onMarkdown} />
    </ExportProvider>
  )
  return render(<TooltipProvider delayDuration={0}>{data ? <RealDataProvider data={data}>{page}</RealDataProvider> : page}</TooltipProvider>)
}

describe('DashboardPage — layout one-page', () => {
  it('mostra os selos de período/fonte e o alerta de atrito do carrinho', () => {
    renderDashboard()
    expect(screen.getByText(/Relatório UX/)).toBeTruthy()
    expect(screen.getByText(/^Clarity/)).toBeTruthy()
    expect(screen.getByText(/GA4\/Looker/)).toBeTruthy()
    expect(screen.getByText('Carrinho: atrito alto')).toBeTruthy()
    expect(screen.getByText('Outros: receita em queda')).toBeTruthy()
  })

  it('mostra os 4 KPIs com variação, nunca cor como único indicador (sinal +/- no texto)', () => {
    renderDashboard()
    expect(screen.getByText('Sessões')).toBeTruthy()
    expect(screen.getByText('Conversão')).toBeTruthy()
    expect(screen.getByText('Receita')).toBeTruthy()
    expect(screen.getByText('Ticket médio')).toBeTruthy()
    // Sessões caiu: o texto da variação carrega o sinal "-", não só a cor.
    expect(screen.getByText('-42,8%')).toBeTruthy()
  })

  it('bloco "Onde o checkout trava" identifica o Carrinho como crítico, com texto explícito', () => {
    renderDashboard()
    expect(screen.getByText('Onde o checkout trava')).toBeTruthy()
    expect(screen.getByText(/Carrinho concentra/)).toBeTruthy()
  })

  it('bloco "Onde o checkout trava" rotula os dead clicks com o período do Clarity vigente (27–29/10 no baseline)', () => {
    renderDashboard()
    expect(screen.getByText('Dead clicks por página (27–29/10)')).toBeTruthy()
  })

  it('selos da barra de status mostram cada fonte com o próprio período (baseline: UX 14/10 a 20/10, Clarity 27/10 a 29/10, GA4/Looker 02/10 a 29/10)', () => {
    renderDashboard()
    expect(screen.getByText(/^Relatório UX 14\/10 a 20\/10$/)).toBeTruthy()
    expect(screen.getByText(/^Clarity 27\/10 a 29\/10$/)).toBeTruthy()
    expect(screen.getByText(/^GA4\/Looker 02\/10 a 29\/10$/)).toBeTruthy()
  })

  it('com a atualização de 03/11 por cima, cada selo muda para o período novo (Clarity 31/10 a 02/11, GA4/Looker 06/10 a 02/11) e o Relatório UX continua o do baseline', () => {
    renderDashboard(undefined, dataWith0311())
    expect(screen.getByText(/^Clarity 31\/10 a 02\/11$/)).toBeTruthy()
    expect(screen.getByText(/^GA4\/Looker 06\/10 a 02\/11$/)).toBeTruthy()
    expect(screen.getByText(/^Relatório UX 14\/10 a 20\/10$/)).toBeTruthy()
    expect(screen.getByText('Dead clicks por página (31/10–02/11)')).toBeTruthy()
    expect(screen.queryByText(/27–29\/10/)).toBeNull()
  })

  it('bloco "De onde vem a receita" não repete nenhum canal (participação agregada do Looker)', () => {
    renderDashboard()
    const heading = screen.getByText('De onde vem a receita')
    const card = heading.closest('div')!.parentElement!
    const googleMatches = within(card).queryAllByText('google')
    expect(googleMatches.length).toBe(0) // "google" é origem/mídia, não canal do Looker (CPC/Organic/...)
    expect(within(card).getByText('CPC')).toBeTruthy()
    expect(within(card).getByText('Organic')).toBeTruthy()
  })

  it('bloco "O que vende" mostra as marcas', () => {
    renderDashboard()
    expect(screen.getByText('O que vende')).toBeTruthy()
    expect(screen.getAllByText('Itaro').length).toBeGreaterThan(0)
  })

  it('bloco "O que vende" não tem selo próprio no baseline (as marcas valem o período do resumo)', () => {
    renderDashboard()
    const heading = screen.getByText('O que vende')
    const card = heading.closest('div')!.parentElement!
    expect(within(card).queryByLabelText(/Período das marcas/)).toBeNull()
  })

  it('com a atualização de 03/11, "O que vende" mostra o próprio selo de período (01–02/nov), nunca o período do snapshot inteiro', () => {
    renderDashboard(undefined, dataWith0311())
    const heading = screen.getByText('O que vende')
    const card = heading.closest('div')!.parentElement!
    expect(within(card).getByText('01–02/nov')).toBeTruthy()
    expect(within(card).queryByText(/06\/10/)).toBeNull()
  })

  it('baseline: mostra as 8 marcas do Looker (Pirelli e Kumho incluídas)', () => {
    renderDashboard()
    for (const brand of ['Itaro', 'Michelin', 'Pirelli', 'Kumho', 'Continental', 'Bridgestone', 'Firestone', 'Barum']) {
      expect(screen.getAllByText(brand).length).toBeGreaterThan(0)
    }
    expect(screen.queryByText('Speedmax')).toBeNull()
  })

  it('com a atualização de 03/11: 10 marcas, incluindo Speedmax e Goodyear', () => {
    renderDashboard(undefined, dataWith0311())
    for (const brand of ['Pirelli', 'Speedmax', 'Kumho', 'Goodyear']) {
      expect(screen.getAllByText(brand).length).toBeGreaterThan(0)
    }
  })

  it('"Sobre os dados" abre como gaveta (Sheet), não como navegação de página', () => {
    renderDashboard()
    expect(screen.queryByText('Fontes de dados reais')).toBeNull()
    act(() => {
      screen.getByText('Sobre os dados').click()
    })
    expect(screen.getByText('Fontes de dados reais')).toBeTruthy()
  })

  it('exportação Markdown nunca contém "fictício" e cobre os principais blocos', () => {
    let captured = ''
    renderDashboard((markdown) => {
      captured = markdown
    })
    act(() => {
      screen.getByText('probe-export').click()
    })
    expect(captured).not.toContain('fictício')
    expect(captured).toContain('Carrinho')
    expect(captured).toContain('CPC')
    expect(captured).toContain('Itaro')
    expect(captured).toContain('## O que vende')
    expect(captured).not.toContain('## O que vende (')
    expect(captured).toContain('Investigar checkout e carrinho')
  })

  it('exportação Markdown com a atualização de 03/11 traz o período próprio das marcas', () => {
    let captured = ''
    renderDashboard((markdown) => {
      captured = markdown
    }, dataWith0311())
    act(() => {
      screen.getByText('probe-export').click()
    })
    expect(captured).toContain('## O que vende (01–02/nov)')
  })
})
