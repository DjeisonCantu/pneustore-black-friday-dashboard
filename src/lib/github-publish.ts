// Publicação de uma atualização pela API REST do GitHub, direto do navegador:
// valida o token, escolhe um nome livre em data/updates/ (sufixo -2, -3 se já
// existir), faz o commit na main e acompanha o deploy até publicar ou falhar.
//
// Regras de segurança deste módulo:
//  - o token só trafega no cabeçalho Authorization — nunca na URL, em log ou
//    em mensagem de erro;
//  - nada aqui escreve no console;
//  - um arquivo existente NUNCA é sobrescrito: a gravação não manda `sha`, então
//    o GitHub recusa (422) se o nome já existir, e o módulo tenta o próximo sufixo.

import { GITHUB_CONFIG, type GithubConfig } from '@/config/github'

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface GithubContext {
  fetch: FetchLike
  config: GithubConfig
}

export function defaultContext(): GithubContext {
  return { fetch: (input, init) => globalThis.fetch(input, init), config: GITHUB_CONFIG }
}

export type PublishErrorKind = 'token' | 'rede' | 'github'

export class PublishError extends Error {
  readonly kind: PublishErrorKind
  constructor(kind: PublishErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

const MAX_SUFFIX = 20

function repoPath(ctx: GithubContext): string {
  return `${ctx.config.apiBase}/repos/${ctx.config.owner}/${ctx.config.repo}`
}

function headers(token: string, withBody = false): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(withBody ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function call(ctx: GithubContext, url: string, init: RequestInit): Promise<Response> {
  try {
    return await ctx.fetch(url, init)
  } catch {
    throw new PublishError('rede', 'Sem conexão com o GitHub. Verifique a internet e tente de novo.')
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await response.json()
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Confere que o token enxerga o repositório e pode ESCREVER nele (GET /repos/{owner}/{repo} → permissions.push). */
export async function validateToken(token: string, ctx: GithubContext = defaultContext()): Promise<void> {
  if (!token.trim()) throw new PublishError('token', 'Cole o token do GitHub para publicar.')

  const response = await call(ctx, repoPath(ctx), { method: 'GET', headers: headers(token.trim()) })
  const { owner, repo } = ctx.config
  if (response.status === 401) {
    throw new PublishError('token', 'O GitHub não aceitou o token (inválido ou expirado). Crie um novo e cole aqui.')
  }
  if (response.status === 404) {
    throw new PublishError('token', `O token não enxerga o repositório ${owner}/${repo}. Ao criá-lo, escolha «Only select repositories» e marque só este.`)
  }
  if (response.status === 403) {
    throw new PublishError('token', 'O GitHub recusou o acesso (permissão ou limite de uso). Confira as permissões do token e tente mais tarde.')
  }
  if (!response.ok) throw new PublishError('github', `O GitHub respondeu com erro ${response.status} ao validar o token.`)

  const body = await readJson(response)
  const permissions = body.permissions as { push?: boolean } | undefined
  if (permissions?.push !== true) {
    throw new PublishError('token', 'O token lê o repositório, mas não pode escrever nele. Falta a permissão «Contents: Read and write».')
  }
}

function zeroPad(n: number | string): string {
  return String(n).padStart(2, '0')
}

/** AAAA-MM-DD-HHmm no fuso de São Paulo (o fuso da equipe), a partir de um instante. */
export function buildUpdateId(now: Date, timeZone = 'America/Sao_Paulo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${zeroPad(get('month'))}-${zeroPad(get('day'))}-${zeroPad(get('hour'))}${zeroPad(get('minute'))}`
}

export function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function contentsUrl(ctx: GithubContext, fileName: string): string {
  return `${repoPath(ctx)}/contents/${ctx.config.updatesDir}/${fileName}`
}

async function fileExists(token: string, fileName: string, ctx: GithubContext): Promise<boolean> {
  const response = await call(ctx, `${contentsUrl(ctx, fileName)}?ref=${encodeURIComponent(ctx.config.branch)}`, { method: 'GET', headers: headers(token) })
  if (response.status === 200) return true
  if (response.status === 404) return false
  if (response.status === 401 || response.status === 403) {
    throw new PublishError('token', 'O GitHub recusou o token ao consultar a pasta data/updates. Confira a permissão «Contents».')
  }
  throw new PublishError('github', `O GitHub respondeu com erro ${response.status} ao conferir se o arquivo já existe.`)
}

/** Primeiro nome livre: «<id>.md»; se existir, «<id>-2.md», «<id>-3.md»… — nunca devolve um nome já usado. */
export async function findFreeFileName(baseId: string, token: string, ctx: GithubContext = defaultContext(), startAt = 1): Promise<string> {
  for (let n = startAt; n <= MAX_SUFFIX; n++) {
    const name = n === 1 ? `${baseId}.md` : `${baseId}-${n}.md`
    if (!(await fileExists(token, name, ctx))) return name
  }
  throw new PublishError('github', `Já existem ${MAX_SUFFIX} atualizações com o mesmo minuto (${baseId}). Espere um instante e tente de novo.`)
}

export interface PublishInput {
  token: string
  markdown: string
  /** Resumo dos períodos para a mensagem do commit (ex.: "Looker 06/10–02/11; Clarity 31/10–02/11"). */
  periodsSummary: string
  now?: Date
}

export interface PublishResult {
  fileName: string
  path: string
  commitSha: string
  commitUrl: string
}

/** Cria o arquivo da atualização na main. Falha (sem escrever nada) se o token não puder escrever. */
export async function publishUpdate(input: PublishInput, ctx: GithubContext = defaultContext()): Promise<PublishResult> {
  const token = input.token.trim()
  await validateToken(token, ctx)

  const baseId = buildUpdateId(input.now ?? new Date())
  const message = `data: atualização ${input.periodsSummary}`
  const content = toBase64Utf8(input.markdown)

  let attempt = 1
  for (;;) {
    const fileName = await findFreeFileName(baseId, token, ctx, attempt)
    const response = await call(ctx, contentsUrl(ctx, fileName), {
      method: 'PUT',
      headers: headers(token, true),
      body: JSON.stringify({ message, content, branch: ctx.config.branch }),
    })

    if (response.status === 201 || response.status === 200) {
      const body = await readJson(response)
      const commit = body.commit as { sha?: string; html_url?: string } | undefined
      if (!commit?.sha) throw new PublishError('github', 'O GitHub criou o arquivo, mas não devolveu o commit. Confira o histórico do repositório.')
      return { fileName, path: `${ctx.config.updatesDir}/${fileName}`, commitSha: commit.sha, commitUrl: commit.html_url ?? `https://github.com/${ctx.config.owner}/${ctx.config.repo}/commit/${commit.sha}` }
    }
    // Alguém criou o mesmo nome entre a consulta e a gravação (o GitHub exige `sha` para sobrescrever): próximo sufixo.
    if (response.status === 422 || response.status === 409) {
      const next = fileName === `${baseId}.md` ? 2 : Number(/-(\d+)\.md$/.exec(fileName)?.[1] ?? attempt) + 1
      if (next > MAX_SUFFIX) throw new PublishError('github', 'Não consegui um nome livre para o arquivo. Tente de novo em instantes.')
      attempt = next
      continue
    }
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new PublishError('token', 'O GitHub recusou a gravação. O token precisa de «Contents: Read and write» neste repositório.')
    }
    throw new PublishError('github', `O GitHub respondeu com erro ${response.status} ao gravar a atualização.`)
  }
}

// ---------------------------------------------------------------------------
// Acompanhamento do deploy (GitHub Actions)

export type DeployState =
  | { phase: 'aguardando' }
  | { phase: 'executando'; runUrl: string }
  | { phase: 'publicado'; runUrl: string }
  | { phase: 'falhou'; runUrl: string; logUrl: string; reason: string }
  | { phase: 'sem-acesso'; runsUrl: string }
  | { phase: 'tempo-esgotado'; runsUrl: string }

interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  html_url: string
  head_sha: string
}

interface WorkflowJob {
  name: string
  html_url?: string
  conclusion: string | null
  steps?: { name: string; conclusion: string | null }[]
}

export function runsPageUrl(config: GithubConfig = GITHUB_CONFIG): string {
  return `https://github.com/${config.owner}/${config.repo}/actions`
}

/** Lê UMA vez o estado do deploy do commit. */
export async function checkDeploy(commitSha: string, token: string, ctx: GithubContext = defaultContext()): Promise<DeployState> {
  const runsResponse = await call(ctx, `${repoPath(ctx)}/actions/runs?head_sha=${encodeURIComponent(commitSha)}&per_page=10`, { method: 'GET', headers: headers(token.trim()) })
  if (runsResponse.status === 401 || runsResponse.status === 403 || runsResponse.status === 404) return { phase: 'sem-acesso', runsUrl: runsPageUrl(ctx.config) }
  if (!runsResponse.ok) throw new PublishError('github', `O GitHub respondeu com erro ${runsResponse.status} ao consultar o deploy.`)

  const runs = ((await readJson(runsResponse)).workflow_runs as WorkflowRun[] | undefined) ?? []
  const run = runs.find((r) => r.head_sha === commitSha)
  if (!run) return { phase: 'aguardando' }
  if (run.status !== 'completed') return { phase: 'executando', runUrl: run.html_url }
  if (run.conclusion === 'success') return { phase: 'publicado', runUrl: run.html_url }

  // Falhou (ou foi cancelado): resume o passo que quebrou e aponta para o log. O site no ar não mudou.
  let reason = run.conclusion === 'cancelled' ? 'O deploy foi cancelado.' : 'O deploy falhou.'
  let logUrl = run.html_url
  const jobsResponse = await call(ctx, `${repoPath(ctx)}/actions/runs/${run.id}/jobs`, { method: 'GET', headers: headers(token.trim()) })
  if (jobsResponse.ok) {
    const jobs = ((await readJson(jobsResponse)).jobs as WorkflowJob[] | undefined) ?? []
    const failedJob = jobs.find((j) => j.conclusion === 'failure')
    const failedStep = failedJob?.steps?.find((s) => s.conclusion === 'failure')
    if (failedJob) {
      reason = failedStep ? `Falhou em «${failedJob.name}», no passo «${failedStep.name}».` : `Falhou em «${failedJob.name}».`
      logUrl = failedJob.html_url ?? run.html_url
    }
  }
  return { phase: 'falhou', runUrl: run.html_url, logUrl, reason }
}

export interface WatchOptions {
  intervalMs?: number
  timeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  signal?: AbortSignal
  onState?: (state: DeployState) => void
}

/** Consulta o deploy de tempos em tempos até publicar, falhar ou esgotar o tempo. Devolve o estado final. */
export async function watchDeploy(commitSha: string, token: string, options: WatchOptions = {}, ctx: GithubContext = defaultContext()): Promise<DeployState> {
  const { intervalMs = 5000, timeoutMs = 15 * 60 * 1000, sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)), signal, onState } = options
  let waited = 0
  for (;;) {
    const state = await checkDeploy(commitSha, token, ctx)
    onState?.(state)
    if (state.phase === 'publicado' || state.phase === 'falhou' || state.phase === 'sem-acesso') return state
    if (signal?.aborted) return state
    if (waited >= timeoutMs) {
      const final: DeployState = { phase: 'tempo-esgotado', runsUrl: runsPageUrl(ctx.config) }
      onState?.(final)
      return final
    }
    await sleep(intervalMs)
    waited += intervalMs
  }
}
