// Carregamento + validação de um snapshot — Missão 04, Etapa C0 (criada) /
// Etapa C2 (generalizada). Função pura de I/O: busca, valida (com o
// validador injetado por quem chama — GA4, Clarity, ou outra fonte futura) e
// devolve um resultado tipado. Não decide cache, nem lida com corrida entre
// requisições — isso é responsabilidade de snapshot-store.ts. Separar
// "buscar e validar" de "orquestrar" é o que torna cada parte testável
// isoladamente, e separar "validar o quê" (o schema de cada fonte) de "como
// buscar e cachear" é o que permite reaproveitar isto para o Clarity sem
// duplicar a camada (pedido explícito da Etapa C2).

import type { SnapshotFetcher, SnapshotLike, SnapshotValidator } from './types'

export type LoadSnapshotResult<T> =
  | { outcome: 'success'; snapshot: T }
  | { outcome: 'network-error'; message: string }
  | { outcome: 'invalid'; errors: string[] }
  | { outcome: 'incompatible-version'; version: string }
  | { outcome: 'aborted' }

const defaultFetcher: SnapshotFetcher = (url, init) => fetch(url, init)

export async function loadSnapshotFromUrl<T extends SnapshotLike>(
  url: string,
  validator: SnapshotValidator<T>,
  options: { signal?: AbortSignal; fetcher?: SnapshotFetcher } = {},
): Promise<LoadSnapshotResult<T>> {
  const fetcher = options.fetcher ?? defaultFetcher

  let response: Awaited<ReturnType<SnapshotFetcher>>
  try {
    response = await fetcher(url, { signal: options.signal })
  } catch (error) {
    if (options.signal?.aborted) return { outcome: 'aborted' }
    return { outcome: 'network-error', message: error instanceof Error ? error.message : 'Falha de rede desconhecida' }
  }

  if (!response.ok) {
    return { outcome: 'network-error', message: `Resposta HTTP ${response.status} ao buscar ${url}` }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { outcome: 'invalid', errors: ['Resposta não é um JSON válido'] }
  }

  const validation = validator.validate(payload)
  if (!validation.success || !validation.data) {
    return { outcome: 'invalid', errors: validation.errors ?? ['Falha de validação desconhecida'] }
  }

  if (!validator.isCompatibleVersion(validation.data.metadata.schemaVersion)) {
    return { outcome: 'incompatible-version', version: validation.data.metadata.schemaVersion }
  }

  return { outcome: 'success', snapshot: validation.data }
}
