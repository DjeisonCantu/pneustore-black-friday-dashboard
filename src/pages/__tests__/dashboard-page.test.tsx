// Testes da página one-page (atualização de 30/10/2026): substitui a antiga
// Visão geral/Jornada de compra/Aquisição e produtos por uma única tela.
// Cobre os blocos essenciais e as regras da Parte 3 do pedido (sem dado
// fictício, cor nunca é o único indicador, "Sobre os dados" vira gaveta).

import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExportProvider, useExportContext } from '@/state/export-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DashboardPage } from '../dashboard-page'

function ExportProbe({ onMarkdown }: { onMarkdown: (markdown: string) => void }) {
  const { getMarkdown } = useExportContext()
  return (
    <button type="button" onClick={() => onMarkdown(getMarkdown())}>
      probe-export
    </button>
  )
}

function renderDashboard(onMarkdown: (markdown: string) => void = () => {}) {
  return render(
    <TooltipProvider delayDuration={0}>
      <ExportProvider>
        <DashboardPage />
        <ExportProbe onMarkdown={onMarkdown} />
      </ExportProvider>
    </TooltipProvider>,
  )
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
    expect(captured).toContain('Investigar checkout e carrinho')
  })
})
