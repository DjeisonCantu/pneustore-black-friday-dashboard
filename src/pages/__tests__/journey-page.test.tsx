// Testes da Jornada de compra — atualizado em 30/10/2026: o painel do
// Clarity passou a mostrar os números estáticos do "Resumo Executivo
// Pré-Black" (src/data/real/pre-black-executive-report.ts) em vez do antigo
// snapshot assíncrono de 6 páginas de checkout — por isso não há mais
// carregamento, filtro de dispositivo nem fixtures fictícias para testar
// aqui; a página renderiza tudo de forma síncrona.

import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ExportProvider, useExportContext } from '@/state/export-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JourneyPage } from '../journey-page'

function ExportProbe({ onMarkdown }: { onMarkdown: (markdown: string) => void }) {
  const { getMarkdown } = useExportContext()
  return (
    <button type="button" onClick={() => onMarkdown(getMarkdown())}>
      probe-export
    </button>
  )
}

function renderJourneyPage(onMarkdown: (markdown: string) => void = () => {}) {
  return render(
    <TooltipProvider delayDuration={0}>
      <ExportProvider>
        <MemoryRouter initialEntries={['/jornada']}>
          <JourneyPage />
          <ExportProbe onMarkdown={onMarkdown} />
        </MemoryRouter>
      </ExportProvider>
    </TooltipProvider>,
  )
}

describe('JourneyPage — dados do Resumo Executivo Pré-Black (atualização de 30/10/2026)', () => {
  it('renderiza "Abandono por etapa" (aviso, não dado) de forma síncrona', () => {
    renderJourneyPage()
    expect(screen.getByText('Abandono por etapa')).toBeTruthy()
    expect(screen.getByText('Metodologia em validação')).toBeTruthy()
  })

  it('mostra o painel de sinais do Clarity por etapa, com o selo REAL', () => {
    renderJourneyPage()
    const panel = screen.getByTestId('clarity-stage-signals-panel')
    expect(panel.textContent).toContain('REAL')
    expect(panel.textContent).toContain('Carrinho para frete')
    expect(panel.textContent).toContain('Instalação')
  })

  it('mostra o painel de comparação anual do Clarity, com a cobertura explícita', () => {
    renderJourneyPage()
    const panel = screen.getByTestId('clarity-yoy-panel')
    expect(panel.textContent).toContain('Cobertura do Clarity')
    expect(panel.textContent).toContain('2,5%')
    expect(panel.textContent).toContain('86')
  })

  it('mostra as prioridades antes da Black Friday do relatório', () => {
    renderJourneyPage()
    expect(screen.getByText('Prioridades antes da Black Friday')).toBeTruthy()
    expect(screen.getByText(/Investigar checkout e carrinho/)).toBeTruthy()
  })

  it('exportação Markdown reflete os dados do relatório, nunca "dados fictícios"', () => {
    let captured = ''
    renderJourneyPage((markdown) => {
      captured = markdown
    })

    act(() => {
      screen.getByText('probe-export').click()
    })

    expect(captured).not.toContain('fictício')
    expect(captured).toContain('Carrinho para frete')
    expect(captured).toContain('Prioridades antes da Black Friday')
  })
})
