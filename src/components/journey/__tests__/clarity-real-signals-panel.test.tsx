// Testes de renderização do painel Clarity — Missão 04, Etapa C3.
//
// Cobre os estados exigidos pela etapa: carregando, dados disponíveis,
// dados parciais (coleta), dados desatualizados, fonte indisponível
// (idle/não configurado), snapshot inválido (erro) e cobertura de período
// (parcial/indisponível). Cada um é testado diretamente via props — sem
// depender do hook assíncrono — para isolar a responsabilidade do
// componente (puramente de apresentação).

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClarityRealSignalsPanel } from '../clarity-real-signals-panel'
import type { ClarityJourneyView } from '@/data/clarity/adapter'

function buildView(overrides: Partial<ClarityJourneyView> = {}): ClarityJourneyView {
  return {
    project: 'PneuStore (www.pneustore.com.br)',
    period: { from: '2026-11-25', to: '2026-11-27' },
    extractedAt: '2026-11-27T23:10:00-03:00',
    isPartial: false,
    limitations: [],
    rows: [
      {
        pagePath: '/checkout/v2/cart',
        pageLabel: 'Carrinho',
        device: 'desktop',
        deadClicks: { absolute: 200, perSession: 0.5, sessions: 400 },
        rageClicks: { absolute: 4, perSession: 0.01, sessions: 400 },
        quickBacks: { absolute: 40, perSession: 0.1, sessions: 400 },
      },
    ],
    topDeadClickPages: [{ pagePath: '/checkout/v2/cart', pageLabel: 'Carrinho', totalDeadClicks: 200 }],
    ...overrides,
  }
}

describe('ClarityRealSignalsPanel', () => {
  it('estado "carregando": mostra o esqueleto, não a tabela', () => {
    render(<ClarityRealSignalsPanel status="loading" view={null} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText('Sinais de atrito (Clarity)')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('estado "idle" sem view: mostra aviso de fonte não configurada, sem zeros inventados', () => {
    render(<ClarityRealSignalsPanel status="idle" view={null} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText(/ainda não configurada/)).toBeTruthy()
  })

  it('estado "error" (snapshot inválido / fonte indisponível): mensagem compreensível, detalhes técnicos escondidos por padrão', () => {
    render(
      <ClarityRealSignalsPanel
        status="error"
        view={null}
        errors={["metadata.platform: Invalid literal value, expected 'site'"]}
        periodCoverage="full"
        isReal={false}
      />,
    )
    expect(screen.getByText('Não foi possível carregar os sinais do Clarity no momento.')).toBeTruthy()
    // O erro técnico cru existe no DOM, mas dentro de um <details> fechado —
    // não é mostrado de cara ao usuário final; só aparece ao abrir "Detalhes
    // técnicos" explicitamente.
    const details = screen.getByText('Detalhes técnicos').closest('details')
    expect(details?.hasAttribute('open')).toBe(false)
    expect(screen.getByText(/Invalid literal value/).closest('details')).toBe(details)
  })

  it('dados disponíveis (cobertura "full"): mostra tabela com valores absolutos e taxa, sem aviso de cobertura', () => {
    render(<ClarityRealSignalsPanel status="success" view={buildView()} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getAllByText('Carrinho').length).toBeGreaterThan(0)
    expect(screen.getByText(/200 \/ 0\.50/)).toBeTruthy()
    expect(screen.queryByText(/Cobertura parcial/)).toBeNull()
  })

  it('taxa indisponível (sessions desconhecido): mostra "—", nunca "0.00"', () => {
    const view = buildView({
      rows: [
        {
          pagePath: '/checkout/v2/cart',
          pageLabel: 'Carrinho',
          device: 'mobile',
          deadClicks: { absolute: 95, perSession: null, sessions: null },
          rageClicks: { absolute: 4, perSession: null, sessions: null },
          quickBacks: { absolute: 40, perSession: null, sessions: null },
        },
      ],
    })
    render(<ClarityRealSignalsPanel status="success" view={view} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText('95 / —')).toBeTruthy()
  })

  it('dados parciais (coleta): mostra o selo de coleta parcial', () => {
    const view = buildView({ isPartial: true })
    render(<ClarityRealSignalsPanel status="success" view={view} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText(/Coleta parcial/)).toBeTruthy()
  })

  it('dados desatualizados: mostra aviso e botão de atualizar, que aciona onReload', () => {
    const onReload = vi.fn()
    render(<ClarityRealSignalsPanel status="stale" view={buildView()} errors={null} periodCoverage="full" isReal={false} onReload={onReload} />)
    expect(screen.getByText(/Dados desatualizados/)).toBeTruthy()
    screen.getByText('Atualizar').click()
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('cobertura parcial de período: mostra o aviso E continua mostrando a tabela', () => {
    render(<ClarityRealSignalsPanel status="success" view={buildView()} errors={null} periodCoverage="partial" isReal={false} />)
    expect(screen.getByText(/Cobertura parcial/)).toBeTruthy()
    expect(screen.getAllByText('Carrinho').length).toBeGreaterThan(0)
  })

  it('sem cobertura de período: esconde a tabela e o ranking, mostra só o aviso', () => {
    render(<ClarityRealSignalsPanel status="success" view={buildView()} errors={null} periodCoverage="none" isReal={false} />)
    expect(screen.getByText(/Sem sinais do Clarity para o período selecionado/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText('maior concentração de dead clicks', { exact: false })).toBeNull()
  })

  it('limitações da fonte são sempre exibidas quando presentes', () => {
    const view = buildView({ limitations: ['Janela histórica limitada a 1–3 dias.'] })
    render(<ClarityRealSignalsPanel status="success" view={view} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText('Janela histórica limitada a 1–3 dias.')).toBeTruthy()
  })

  it('identifica os dados como fictícios no rodapé quando isReal=false', () => {
    render(<ClarityRealSignalsPanel status="success" view={buildView()} errors={null} periodCoverage="full" isReal={false} />)
    expect(screen.getByText(/Dados fictícios/)).toBeTruthy()
    expect(screen.queryByText('REAL')).toBeNull()
  })

  it('identifica os dados como REAIS quando isReal=true, nunca com o selo de fictício', () => {
    render(<ClarityRealSignalsPanel status="success" view={buildView()} errors={null} periodCoverage="full" isReal={true} />)
    expect(screen.getByText('REAL')).toBeTruthy()
    expect(screen.getByText(/Dados REAIS/)).toBeTruthy()
    expect(screen.queryByText(/Dados fictícios/)).toBeNull()
  })

  it('linha agregada (device "all"): mostra "Todos os dispositivos" e o aviso de que o filtro não recorta', () => {
    const view = buildView({
      rows: [
        {
          pagePath: '/checkout/v2/cart',
          pageLabel: 'Carrinho',
          device: 'all',
          deadClicks: { absolute: 10129, perSession: null, sessions: null },
          rageClicks: { absolute: 626, perSession: null, sessions: null },
          quickBacks: { absolute: 542, perSession: null, sessions: null },
        },
      ],
    })
    render(<ClarityRealSignalsPanel status="success" view={view} errors={null} periodCoverage="full" isReal={true} />)
    expect(screen.getByText('Todos os dispositivos')).toBeTruthy()
    expect(screen.getByText(/filtro de.*dispositivo não recorta/)).toBeTruthy()
  })
})
