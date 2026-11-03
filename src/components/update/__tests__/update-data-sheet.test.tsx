// Fluxo "Atualizar dados" ponta a ponta no jsdom: colar → validar → prévia →
// publicar, com fetch simulado (nada vai para a rede nem para o repositório).

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { forgetToken } from '@/lib/token-storage'
import baselineMd from '../../../../data/updates/0000-baseline.md?raw'
import example0311 from '@/data/updates/__tests__/fixtures/atualizacao-2026-11-03.md?raw'
import { UpdateDataSheet } from '../update-data-sheet'

const TOKEN = 'github_pat_TESTE_SECRETO'

interface Call {
  url: string
  method: string
  headers: Record<string, string>
}

function stubGithub(options: { push?: boolean; existing?: string[]; deploy?: 'success' | 'failure' } = {}) {
  const { push = true, existing = [], deploy = 'success' } = options
  const calls: Call[] = []
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    calls.push({ url: input, method, headers: (init?.headers ?? {}) as Record<string, string> })
    const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status })
    if (input.endsWith('/repos/DjeisonCantu/pneustore-black-friday-dashboard')) return json(200, { permissions: { push } })
    if (method === 'PUT') return json(201, { commit: { sha: 'sha123', html_url: 'https://github.com/DjeisonCantu/pneustore-black-friday-dashboard/commit/sha123' } })
    if (input.includes('/contents/data/updates/')) return json(existing.some((name) => input.includes(name)) ? 200 : 404)
    if (input.includes('/actions/runs?')) {
      return json(200, { workflow_runs: [{ id: 1, status: 'completed', conclusion: deploy, html_url: 'https://github.com/x/actions/runs/1', head_sha: 'sha123' }] })
    }
    if (input.endsWith('/actions/runs/1/jobs')) {
      return json(200, { jobs: [{ name: 'build', conclusion: 'failure', html_url: 'https://github.com/x/job/1', steps: [{ name: 'tsc', conclusion: 'failure' }] }] })
    }
    return json(404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

function renderSheet() {
  return render(
    <TooltipProvider delayDuration={0}>
      <UpdateDataSheet open onOpenChange={() => {}} />
    </TooltipProvider>,
  )
}

/** Fecha a prévia (a gaveta de cima) pelo botão «Fechar» dela — o outro «Fechar» é o da gaveta de baixo. */
async function closePreview() {
  const buttons = screen.getAllByText('Fechar')
  fireEvent.click(buttons[buttons.length - 1].closest('button')!)
  await waitFor(() => expect(screen.queryByText('Prévia — ainda não publicado')).toBeNull())
}

function paste(text: string) {
  fireEvent.change(screen.getByLabelText('Conteúdo do arquivo .md'), { target: { value: text } })
}

beforeEach(() => {
  forgetToken()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => vi.unstubAllGlobals())

describe('UpdateDataSheet — passo 1: carregar e validar', () => {
  it('abre só com o passo 1 (carregar); passos 2 e 3 só aparecem com um arquivo válido', () => {
    renderSheet()
    expect(screen.getByText('Atualizar dados')).toBeTruthy()
    expect(screen.getByText('Carregar o arquivo')).toBeTruthy()
    expect(screen.queryByText('Conferir o que muda')).toBeNull()
    expect(screen.queryByText('Publicar')).toBeNull()
  })

  it('arquivo inválido: valida na hora e mostra o erro com a seção e a linha', () => {
    renderSheet()
    paste(example0311.replace('| CPC | 42.79 | -11.7 |', '| CPC | 42,79 | -11.7 |'))
    expect(screen.getByText(/problema no arquivo/)).toBeTruthy()
    expect(screen.getByText(/Seção «Looker — canais», linha \d+/)).toBeTruthy()
    expect(screen.queryByText('Conferir o que muda')).toBeNull()
  })

  it('texto sem cabeçalho também falha com mensagem em português', () => {
    renderSheet()
    paste('qualquer coisa')
    expect(screen.getByText(/problema/)).toBeTruthy()
  })

  it('arquivo válido (o exemplo de 03/11) libera o passo 2', () => {
    renderSheet()
    paste(example0311)
    expect(screen.getByText(/Arquivo válido/)).toBeTruthy()
    expect(screen.getByText('Conferir o que muda')).toBeTruthy()
  })

  it('aceita o arquivo escolhido/solto (leitura do .md) e guarda rascunho local', async () => {
    renderSheet()
    const file = new File([example0311], 'atualizacao.md', { type: 'text/markdown' })
    Object.defineProperty(file, 'text', { value: () => Promise.resolve(example0311) })
    fireEvent.change(screen.getByLabelText('Escolher arquivo .md', { selector: 'input' }), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/Arquivo válido/)).toBeTruthy())
    expect(localStorage.getItem('pneustore.update-draft')).toContain('Looker — resumo do site')
  })

  it('recupera o rascunho ao reabrir a gaveta', () => {
    localStorage.setItem('pneustore.update-draft', example0311)
    renderSheet()
    expect((screen.getByLabelText('Conteúdo do arquivo .md') as HTMLTextAreaElement).value).toBe(example0311)
  })
})

describe('UpdateDataSheet — passo 2: prévia', () => {
  it('mostra por bloco: vai atualizar (período antigo → novo, números antes → depois) e o que continua igual/ausente', () => {
    renderSheet()
    paste(example0311)
    expect(screen.getAllByText('Vai atualizar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('27–29/10 → 31/10–02/11').length).toBeGreaterThan(0) // Clarity (checkout e sessões)
    expect(screen.getAllByText('Não veio no arquivo').length).toBeGreaterThan(0) // blocos de UX
    expect(screen.getByText(/Carrinho · dead clicks:/)).toBeTruthy()
  })

  it('«Ver como fica» abre o one-page com os dados novos, sem publicar nada', async () => {
    const { fetchMock } = stubGithub()
    renderSheet()
    paste(example0311)
    fireEvent.click(screen.getByText('Ver como fica'))

    expect(await screen.findByText('Prévia — ainda não publicado')).toBeTruthy()
    expect(screen.getByText(/^Clarity 31\/10 a 02\/11$/)).toBeTruthy()
    expect(screen.getByText(/^GA4\/Looker 06\/10 a 02\/11$/)).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a prévia nunca troca os dados do dashboard de verdade (só a gaveta vê os novos)', async () => {
    renderSheet()
    paste(example0311)
    fireEvent.click(screen.getByText('Ver como fica'))
    await screen.findByText('Prévia — ainda não publicado')
    // o dashboard de fundo não está montado neste teste; o contexto padrão continua o do bundle
    const { BUNDLED_DASHBOARD_DATA } = await import('@/data/bundled-data')
    expect(BUNDLED_DASHBOARD_DATA.clarity?.period).not.toEqual({ from: '2026-10-31', to: '2026-11-02' })
  })
})

describe('UpdateDataSheet — passo 3: publicar', () => {
  async function reachPublish() {
    renderSheet()
    paste(example0311)
    fireEvent.click(screen.getByText('Ver como fica'))
    await screen.findByText('Prévia — ainda não publicado')
    await closePreview()
  }

  it('«Publicar atualização» só habilita depois de «Ver como fica» e com token', async () => {
    renderSheet()
    paste(example0311)
    const publishButton = () => screen.getByRole('button', { name: 'Publicar atualização' }) as HTMLButtonElement
    expect(publishButton().disabled).toBe(true)
    expect(screen.getByText(/Publicar só libera depois de «Ver como fica»/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })
    expect(publishButton().disabled).toBe(true) // token sim, prévia ainda não

    fireEvent.click(screen.getByText('Ver como fica'))
    await screen.findByText('Prévia — ainda não publicado')
    await closePreview()
    expect(publishButton().disabled).toBe(false)
  })

  it('pede confirmação com os períodos e só então grava; mostra o link do commit e acompanha o deploy até publicar', async () => {
    const { calls } = stubGithub()
    await reachPublish()
    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })

    fireEvent.click(screen.getByRole('button', { name: 'Publicar atualização' }))
    expect(screen.getByText(/Publicar atualização de Looker .*Clarity 31\/10–02\/11\?/)).toBeTruthy()
    expect(calls.some((c) => c.method === 'PUT')).toBe(false) // ainda nada foi gravado

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e publicar' }))
    const link = await screen.findByText('ver o commit')
    expect(link.getAttribute('href')).toBe('https://github.com/DjeisonCantu/pneustore-black-friday-dashboard/commit/sha123')
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(1)
    expect(await screen.findByText(/Publicado\. Recarregue a página/)).toBeTruthy()
  })

  it('token sem permissão de escrita: mostra o erro e não grava nada', async () => {
    const { calls } = stubGithub({ push: false })
    await reachPublish()
    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })
    fireEvent.click(screen.getByRole('button', { name: 'Publicar atualização' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e publicar' }))

    expect(await screen.findByText(/não pode escrever nele/)).toBeTruthy()
    expect(calls.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('deploy que falha: mostra o motivo resumido, o link do log e que o site no ar não mudou', async () => {
    stubGithub({ deploy: 'failure' })
    await reachPublish()
    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })
    fireEvent.click(screen.getByRole('button', { name: 'Publicar atualização' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e publicar' }))

    expect(await screen.findByText(/o site no ar NÃO mudou/)).toBeTruthy()
    expect(screen.getByText(/Falhou em «build», no passo «tsc»/)).toBeTruthy()
    expect(screen.getByText('Ver o log').getAttribute('href')).toBe('https://github.com/x/job/1')
  })

  it('o token fica em sessionStorage por padrão; «Lembrar» passa para localStorage com aviso; «Esquecer token» limpa', async () => {
    renderSheet()
    paste(example0311)
    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })
    expect(sessionStorage.getItem('pneustore.github-token')).toBe(TOKEN)
    expect(localStorage.getItem('pneustore.github-token')).toBeNull()

    fireEvent.click(screen.getByLabelText('Lembrar neste navegador'))
    expect(screen.getByText(/qualquer pessoa com acesso a ele poderá publicar/)).toBeTruthy()
    expect(localStorage.getItem('pneustore.github-token')).toBe(TOKEN)

    fireEvent.click(screen.getByRole('button', { name: 'Esquecer token' }))
    expect(localStorage.getItem('pneustore.github-token')).toBeNull()
    expect(sessionStorage.getItem('pneustore.github-token')).toBeNull()
    expect((screen.getByLabelText('Token do GitHub') as HTMLInputElement).value).toBe('')
  })

  it('o campo do token é de senha e a ajuda lista as permissões exatas', () => {
    renderSheet()
    paste(example0311)
    expect((screen.getByLabelText('Token do GitHub') as HTMLInputElement).type).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Como criar o token' }))
    expect(screen.getByText('Contents: Read and write')).toBeTruthy()
    expect(screen.getByText('Actions: Read-only')).toBeTruthy()
    expect(screen.getByText(/só DjeisonCantu\/pneustore-black-friday-dashboard/)).toBeTruthy()
  })

  it('arquivo que não muda nada (o baseline reenviado): avisa e não oferece publicar', () => {
    renderSheet()
    paste(baselineMd)
    expect(screen.getByText(/Este arquivo não muda nada no que está no ar/)).toBeTruthy()
    expect(screen.getAllByText('Continua igual').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Publicar atualização' })).toBeNull()
  })

  it('nenhum texto do token vai para o console', async () => {
    const spies = (['log', 'info', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}))
    stubGithub()
    await reachPublish()
    fireEvent.change(screen.getByLabelText('Token do GitHub'), { target: { value: TOKEN } })
    fireEvent.click(screen.getByRole('button', { name: 'Publicar atualização' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar e publicar' }))
    })
    await screen.findByText('ver o commit')
    for (const spy of spies) {
      for (const call of spy.mock.calls) expect(JSON.stringify(call)).not.toContain(TOKEN)
    }
    spies.forEach((s) => s.mockRestore())
  })
})
