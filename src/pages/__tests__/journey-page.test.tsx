// Testes de integração da Jornada de compra com o painel Clarity conectado
// — Missão 04, Etapa C3.
//
// Cobre: regressão dos indicadores comerciais (continuam síncronos, não
// afetados pelo carregamento assíncrono do Clarity), filtro de dispositivo
// respeitado pelo painel Clarity, alteração rápida de filtros, e o conteúdo
// da exportação Markdown refletindo o estado real do Clarity (não mais o
// texto fixo "espaço reservado" da Missão 02).

import { act, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAllForTests } from '@/data/async-snapshot/cache'
import { DemoScenarioProvider } from '@/state/demo-scenario-context'
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

/** Navega sem remontar o MemoryRouter — simula o usuário trocando o filtro de dispositivo pela UI real. */
function NavigateTo({ path }: { path: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(path)}>
      navigate-probe
    </button>
  )
}

function renderJourneyPage(initialEntry: string, onMarkdown: (markdown: string) => void = () => {}) {
  return render(
    <TooltipProvider delayDuration={0}>
      <DemoScenarioProvider>
        <ExportProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <JourneyPage />
            <ExportProbe onMarkdown={onMarkdown} />
          </MemoryRouter>
        </ExportProvider>
      </DemoScenarioProvider>
    </TooltipProvider>,
  )
}

describe('JourneyPage — painel Clarity conectado (Etapa C3)', () => {
  beforeEach(() => clearAllForTests())
  afterEach(() => vi.useRealTimers())

  it('"Abandono por etapa" renderiza de forma síncrona, sem esperar o Clarity', async () => {
    renderJourneyPage('/jornada')

    // Atualização de 30/10/2026: "Conversão por dispositivo" e "Etapas da
    // jornada" (fictícios) foram removidos — só "Abandono por etapa"
    // (não é dado, é um aviso de metodologia pendente) continua síncrono.
    await waitFor(() => expect(screen.getByText('Abandono por etapa')).toBeTruthy(), { timeout: 2000 })
  })

  it('painel Clarity aparece e carrega os dados fictícios de forma assíncrona', async () => {
    renderJourneyPage('/jornada')

    await waitFor(() => expect(screen.getByText('Sinais de atrito (Clarity)')).toBeTruthy(), { timeout: 2000 })
    // Logo após aparecer, ainda está carregando (esqueleto) ou já carregou —
    // o teste aguarda o carregamento terminar.
    await waitFor(() => expect(screen.getAllByText('Carrinho').length).toBeGreaterThan(0), { timeout: 2000 })
  })

  it('respeita o filtro global de dispositivo (desktop)', async () => {
    renderJourneyPage('/jornada?dispositivo=desktop')

    await waitFor(() => expect(screen.getAllByText('Carrinho').length).toBeGreaterThan(0), { timeout: 2000 })
    // A fixture "ok" tem linhas desktop e mobile para o Carrinho — só a de
    // desktop deve aparecer na tabela do painel Clarity (escopado pelo
    // testid: "Mobile" também aparece no gráfico de GA4, fora do escopo).
    const panel = within(screen.getByTestId('clarity-signals-panel'))
    expect(panel.queryByText('Mobile')).toBeNull()
    expect(panel.getAllByText('Desktop').length).toBeGreaterThan(0)
  })

  it('filtro de dispositivo sem dados do Clarity mostra o estado vazio, não zeros', async () => {
    renderJourneyPage('/jornada?dispositivo=tablet')

    await waitFor(() => expect(screen.getByText('Sinais de atrito (Clarity)')).toBeTruthy(), { timeout: 2000 })
    await waitFor(() => expect(screen.getByText('Sem sinais para o período consultado.')).toBeTruthy(), { timeout: 2000 })
  })

  it('alteração rápida de filtro de dispositivo não deixa dados do filtro antigo exibidos', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <DemoScenarioProvider>
          <ExportProvider>
            <MemoryRouter initialEntries={['/jornada?dispositivo=desktop']}>
              <JourneyPage />
              <NavigateTo path="/jornada?dispositivo=tablet" />
            </MemoryRouter>
          </ExportProvider>
        </DemoScenarioProvider>
      </TooltipProvider>,
    )

    // Troca para 'tablet' (sem sinais) antes mesmo de aguardar o primeiro carregamento
    // terminar — equivalente ao usuário mudando o filtro rapidamente.
    act(() => {
      screen.getByText('navigate-probe').click()
    })

    await waitFor(() => expect(screen.getByText('Sem sinais para o período consultado.')).toBeTruthy(), { timeout: 2000 })
    // Nada do filtro anterior (desktop) deve "vazar" para o resultado final
    // dentro do painel Clarity (escopado: "Desktop" também aparece no
    // gráfico de GA4, que não depende deste filtro de dispositivo).
    const panel = within(screen.getByTestId('clarity-signals-panel'))
    expect(panel.queryByText('Desktop')).toBeNull()
  })

  it('exportação Markdown reflete o estado real do Clarity, não mais o texto fixo da Missão 02', async () => {
    let captured = ''
    renderJourneyPage('/jornada', (markdown) => {
      captured = markdown
    })

    await waitFor(() => expect(screen.getByText('Página')).toBeTruthy(), { timeout: 2000 })

    act(() => {
      screen.getByText('probe-export').click()
    })

    expect(captured).toContain('dados fictícios (ambiente de desenvolvimento)')
    expect(captured).not.toContain('espaço reservado, pendente de integração')
  })
})
