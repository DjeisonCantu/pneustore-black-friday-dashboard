// Publicação pela API do GitHub com fetch simulado: nunca toca a rede nem o repositório de verdade.

import { describe, expect, it, vi } from 'vitest'
import type { GithubConfig } from '@/config/github'
import {
  PublishError,
  buildUpdateId,
  checkDeploy,
  findFreeFileName,
  publishUpdate,
  toBase64Utf8,
  validateToken,
  watchDeploy,
  type GithubContext,
} from '../github-publish'

const CONFIG: GithubConfig = { apiBase: 'https://api.github.com', owner: 'org', repo: 'repo', branch: 'main', updatesDir: 'data/updates' }
const TOKEN = 'github_pat_SEGREDO_DE_TESTE_123'
const REPO_URL = 'https://api.github.com/repos/org/repo'

interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

type Handler = (call: Call) => { status: number; body?: unknown } | undefined

function mockContext(handler: Handler) {
  const calls: Call[] = []
  const fetch = vi.fn(async (input: string, init?: RequestInit) => {
    const call: Call = { url: input, method: init?.method ?? 'GET', headers: (init?.headers ?? {}) as Record<string, string>, body: init?.body as string | undefined }
    calls.push(call)
    const reply = handler(call) ?? { status: 404, body: { message: 'Not Found' } }
    return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status })
  })
  const ctx: GithubContext = { fetch, config: CONFIG }
  return { ctx, calls }
}

const repoOk = (call: Call) => (call.url === REPO_URL ? { status: 200, body: { permissions: { push: true } } } : undefined)
const putOk = (call: Call) => (call.method === 'PUT' ? { status: 201, body: { commit: { sha: 'abc123', html_url: 'https://github.com/org/repo/commit/abc123' } } } : undefined)

describe('validateToken', () => {
  it('aceita um token com permissions.push === true', async () => {
    const { ctx } = mockContext(repoOk)
    await expect(validateToken(TOKEN, ctx)).resolves.toBeUndefined()
  })

  it('recusa token sem permissão de escrita, com mensagem clara (Contents: Read and write)', async () => {
    const { ctx } = mockContext(() => ({ status: 200, body: { permissions: { push: false, pull: true } } }))
    await expect(validateToken(TOKEN, ctx)).rejects.toThrow(/não pode escrever.*Contents: Read and write/)
  })

  it('recusa quando o GitHub não devolve permissions', async () => {
    const { ctx } = mockContext(() => ({ status: 200, body: {} }))
    await expect(validateToken(TOKEN, ctx)).rejects.toBeInstanceOf(PublishError)
  })

  it('401 → token inválido ou expirado; 404 → token não enxerga o repositório; 403 → acesso recusado', async () => {
    await expect(validateToken(TOKEN, mockContext(() => ({ status: 401 })).ctx)).rejects.toThrow(/inválido ou expirado/)
    await expect(validateToken(TOKEN, mockContext(() => ({ status: 404 })).ctx)).rejects.toThrow(/não enxerga o repositório org\/repo/)
    await expect(validateToken(TOKEN, mockContext(() => ({ status: 403 })).ctx)).rejects.toThrow(/recusou o acesso/)
  })

  it('token vazio nem chega à rede', async () => {
    const { ctx, calls } = mockContext(repoOk)
    await expect(validateToken('   ', ctx)).rejects.toThrow(/Cole o token/)
    expect(calls).toHaveLength(0)
  })

  it('falha de rede vira mensagem em português', async () => {
    const ctx: GithubContext = { fetch: async () => Promise.reject(new TypeError('Failed to fetch')), config: CONFIG }
    await expect(validateToken(TOKEN, ctx)).rejects.toThrow(/Sem conexão/)
  })
})

describe('buildUpdateId', () => {
  it('AAAA-MM-DD-HHmm no fuso de São Paulo', () => {
    expect(buildUpdateId(new Date('2026-11-03T17:30:00Z'))).toBe('2026-11-03-1430')
    expect(buildUpdateId(new Date('2026-11-04T02:05:00Z'))).toBe('2026-11-03-2305')
  })
})

describe('toBase64Utf8', () => {
  it('codifica acentos e travessões em UTF-8 (decodifica de volta idêntico)', () => {
    const text = '## Looker — marcas\nperiodo: 2026-10-06..2026-11-02\nmédia ≈ 1,5%'
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(toBase64Utf8(text)), (c) => c.charCodeAt(0)))
    expect(decoded).toBe(text)
  })
})

describe('findFreeFileName — nunca reaproveita um nome existente', () => {
  it('nome livre → «<id>.md»', async () => {
    const { ctx } = mockContext(() => ({ status: 404 }))
    await expect(findFreeFileName('2026-11-03-1430', TOKEN, ctx)).resolves.toBe('2026-11-03-1430.md')
  })

  it('arquivo existente → sufixo -2; -2 também existe → -3', async () => {
    const taken = new Set(['2026-11-03-1430.md', '2026-11-03-1430-2.md'])
    const { ctx } = mockContext((call) => {
      const name = call.url.split('/').pop()!.split('?')[0]
      return { status: taken.has(name) ? 200 : 404 }
    })
    await expect(findFreeFileName('2026-11-03-1430', TOKEN, ctx)).resolves.toBe('2026-11-03-1430-3.md')
  })
})

describe('publishUpdate', () => {
  const input = { token: TOKEN, markdown: '---\ntipo: atualizacao-dashboard\n---\n', periodsSummary: 'Looker 06/10–02/11; Clarity 31/10–02/11', now: new Date('2026-11-03T17:30:00Z') }

  it('sucesso: grava em data/updates/<id>.md na main, com a mensagem do commit, e devolve o link do commit', async () => {
    const { ctx, calls } = mockContext((call) => repoOk(call) ?? putOk(call))
    const result = await publishUpdate(input, ctx)

    expect(result).toEqual({
      fileName: '2026-11-03-1430.md',
      path: 'data/updates/2026-11-03-1430.md',
      commitSha: 'abc123',
      commitUrl: 'https://github.com/org/repo/commit/abc123',
    })
    const put = calls.find((c) => c.method === 'PUT')!
    expect(put.url).toBe(`${REPO_URL}/contents/data/updates/2026-11-03-1430.md`)
    const body = JSON.parse(put.body!)
    expect(body.message).toBe('data: atualização Looker 06/10–02/11; Clarity 31/10–02/11')
    expect(body.branch).toBe('main')
    expect(body.content).toBe(toBase64Utf8(input.markdown))
    expect(body).not.toHaveProperty('sha') // sem `sha`: o GitHub recusa sobrescrever um arquivo existente
  })

  it('arquivo do mesmo minuto já existe → grava com sufixo -2 (e não toca no original)', async () => {
    const { ctx, calls } = mockContext((call) => {
      if (call.method === 'GET' && call.url.includes('/contents/data/updates/2026-11-03-1430.md')) return { status: 200 }
      return repoOk(call) ?? putOk(call)
    })
    const result = await publishUpdate(input, ctx)
    expect(result.fileName).toBe('2026-11-03-1430-2.md')
    const puts = calls.filter((c) => c.method === 'PUT')
    expect(puts).toHaveLength(1)
    expect(puts[0].url).toContain('2026-11-03-1430-2.md')
  })

  it('corrida: o nome foi criado entre a consulta e a gravação (422) → tenta o próximo sufixo', async () => {
    let puts = 0
    const { ctx } = mockContext((call) => {
      if (call.method === 'PUT') {
        puts += 1
        return puts === 1 ? { status: 422, body: { message: '"sha" wasn\'t supplied.' } } : putOk(call)
      }
      return repoOk(call)
    })
    const result = await publishUpdate(input, ctx)
    expect(result.fileName).toBe('2026-11-03-1430-2.md')
  })

  it('token sem permissão de escrita → erro claro e NADA é gravado', async () => {
    const { ctx, calls } = mockContext(() => ({ status: 200, body: { permissions: { push: false } } }))
    await expect(publishUpdate(input, ctx)).rejects.toThrow(/Contents: Read and write/)
    expect(calls.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('o token só vai no cabeçalho Authorization — nunca na URL nem no corpo — e nada vai para o console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => {}))
    const { ctx, calls } = mockContext((call) => repoOk(call) ?? putOk(call))
    await publishUpdate(input, ctx)
    await checkDeploy('abc123', TOKEN, ctx)

    for (const call of calls) {
      expect(call.url).not.toContain(TOKEN)
      expect(call.body ?? '').not.toContain(TOKEN)
      expect(call.headers.Authorization).toBe(`Bearer ${TOKEN}`)
    }
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
    spies.forEach((spy) => spy.mockRestore())
  })

  it('mensagens de erro nunca repetem o token', async () => {
    const { ctx } = mockContext(() => ({ status: 401 }))
    try {
      await publishUpdate(input, ctx)
      throw new Error('deveria falhar')
    } catch (error) {
      expect((error as Error).message).not.toContain(TOKEN)
    }
  })
})

describe('acompanhamento do deploy', () => {
  const run = (over: Record<string, unknown>) => ({ id: 7, status: 'completed', conclusion: 'success', html_url: 'https://github.com/org/repo/actions/runs/7', head_sha: 'abc123', ...over })
  const runsReply = (runs: unknown[]) => ({ status: 200, body: { workflow_runs: runs } })

  it('sem execução ainda → aguardando; em andamento → executando; concluída com sucesso → publicado', async () => {
    expect(await checkDeploy('abc123', TOKEN, mockContext(() => runsReply([])).ctx)).toEqual({ phase: 'aguardando' })
    expect(await checkDeploy('abc123', TOKEN, mockContext(() => runsReply([run({ status: 'in_progress', conclusion: null })])).ctx)).toMatchObject({ phase: 'executando' })
    expect(await checkDeploy('abc123', TOKEN, mockContext(() => runsReply([run({})])).ctx)).toMatchObject({ phase: 'publicado' })
  })

  it('consulta só as execuções DO commit publicado (head_sha), ignorando as de outros commits', async () => {
    const { ctx, calls } = mockContext(() => runsReply([run({ head_sha: 'outro', conclusion: 'success' })]))
    expect(await checkDeploy('abc123', TOKEN, ctx)).toEqual({ phase: 'aguardando' })
    expect(calls[0].url).toContain('head_sha=abc123')
  })

  it('falha: resume o passo que quebrou, dá o link do log e diz que o site não mudou', async () => {
    const { ctx } = mockContext((call) => {
      if (call.url.includes('/actions/runs?')) return runsReply([run({ conclusion: 'failure' })])
      if (call.url.endsWith('/actions/runs/7/jobs')) {
        return { status: 200, body: { jobs: [{ name: 'build', conclusion: 'failure', html_url: 'https://github.com/org/repo/actions/runs/7/job/9', steps: [{ name: 'npm ci', conclusion: 'success' }, { name: 'Run npm run test -- --run', conclusion: 'failure' }] }] } }
      }
      return undefined
    })
    const state = await checkDeploy('abc123', TOKEN, ctx)
    expect(state).toEqual({
      phase: 'falhou',
      runUrl: 'https://github.com/org/repo/actions/runs/7',
      logUrl: 'https://github.com/org/repo/actions/runs/7/job/9',
      reason: 'Falhou em «build», no passo «Run npm run test -- --run».',
    })
  })

  it('token sem «Actions: Read» → sem-acesso (não falha a publicação, só manda conferir no GitHub)', async () => {
    const state = await checkDeploy('abc123', TOKEN, mockContext(() => ({ status: 403 })).ctx)
    expect(state).toEqual({ phase: 'sem-acesso', runsUrl: 'https://github.com/org/repo/actions' })
  })

  it('watchDeploy repete a consulta até publicar', async () => {
    const replies = [runsReply([]), runsReply([run({ status: 'in_progress', conclusion: null })]), runsReply([run({})])]
    const { ctx } = mockContext(() => replies.shift())
    const seen: string[] = []
    const final = await watchDeploy('abc123', TOKEN, { sleep: async () => {}, onState: (s) => seen.push(s.phase) }, ctx)
    expect(final.phase).toBe('publicado')
    expect(seen).toEqual(['aguardando', 'executando', 'publicado'])
  })

  it('watchDeploy desiste depois do tempo limite (tempo-esgotado)', async () => {
    const { ctx } = mockContext(() => runsReply([]))
    const final = await watchDeploy('abc123', TOKEN, { sleep: async () => {}, intervalMs: 1000, timeoutMs: 3000 }, ctx)
    expect(final.phase).toBe('tempo-esgotado')
  })
})
