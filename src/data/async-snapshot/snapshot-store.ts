// Orquestrador de carregamento assíncrono — Missão 04, Etapa C0 (criada) /
// Etapa C2 (generalizada sobre `T`, recebendo um SnapshotValidator — GA4,
// Clarity, ou outra fonte futura — em vez de validar um esquema fixo).
//
// Junta loader.ts (busca + validação) e cache.ts (memória) num pequeno store
// com padrão pub-sub (compatível com React useSyncExternalStore, mas sem
// depender de React — testável em Node puro). Resolve especificamente o
// requisito de "impedir condições de corrida quando filtros forem alterados
// rapidamente": cada chamada a load() recebe um número de sequência: só a
// resposta da chamada MAIS RECENTE é aplicada ao estado — respostas de
// chamadas anteriores que chegam atrasadas são descartadas.

import { getCached, invalidate, isStale, setCached } from './cache'
import { loadSnapshotFromUrl } from './loader'
import { createInitialLoadState } from './types'
import type { LoadSnapshotOptions, SnapshotLike, SnapshotLoadState, SnapshotStoreOptions, SnapshotValidator } from './types'

const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000 // 30 min — teto superior da frequência proposta em D-11

export interface SnapshotStore<T extends SnapshotLike> {
  getState(): SnapshotLoadState<T>
  subscribe(listener: () => void): () => void
  /** Carrega `key`/`url`; usa cache se ainda fresco. Corridas: só a chamada mais recente vence. */
  load(key: string, url: string, options?: LoadSnapshotOptions): Promise<void>
  /** Ignora o cache e busca de novo — "recarregamento controlado". */
  reload(key: string, url: string, options?: LoadSnapshotOptions): Promise<void>
}

export function createSnapshotStore<T extends SnapshotLike>(
  validator: SnapshotValidator<T>,
  storeOptions: SnapshotStoreOptions = {},
): SnapshotStore<T> {
  const maxAgeMs = storeOptions.maxAgeMs ?? DEFAULT_MAX_AGE_MS
  const now = storeOptions.now ?? (() => new Date())

  let rawState: SnapshotLoadState<T> = createInitialLoadState<T>()
  let latestRequestId = 0
  const listeners = new Set<() => void>()

  function setRawState(next: SnapshotLoadState<T>) {
    rawState = next
    listeners.forEach((listener) => listener())
  }

  function getState(): SnapshotLoadState<T> {
    if (rawState.status === 'success' && rawState.loadedAt) {
      const age = now().getTime() - rawState.loadedAt.getTime()
      if (age > maxAgeMs) {
        return { ...rawState, status: 'stale' }
      }
    }
    return rawState
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  async function runLoad(key: string, url: string, options: LoadSnapshotOptions, skipCache: boolean): Promise<void> {
    if (!skipCache) {
      const cached = getCached<T>(key)
      if (cached && !isStale(cached, maxAgeMs, now())) {
        setRawState({
          status: 'success',
          snapshot: cached.snapshot,
          errors: null,
          loadedAt: cached.cachedAt,
          isPartial: cached.snapshot.metadata.status === 'partial',
        })
        return
      }
    }

    const requestId = ++latestRequestId
    setRawState({ ...rawState, status: 'loading' })

    const result = await loadSnapshotFromUrl(url, validator, options)

    // Condição de corrida: uma chamada mais nova a load()/reload() já começou
    // enquanto esta estava em voo — descarta esta resposta silenciosamente.
    if (requestId !== latestRequestId) return
    if (result.outcome === 'aborted') return

    if (result.outcome === 'success') {
      const entry = setCached(key, result.snapshot, now())
      setRawState({
        status: 'success',
        snapshot: result.snapshot,
        errors: null,
        loadedAt: entry.cachedAt,
        isPartial: result.snapshot.metadata.status === 'partial',
      })
      return
    }

    const errors =
      result.outcome === 'network-error'
        ? [result.message]
        : result.outcome === 'invalid'
          ? result.errors
          : [`Versão de esquema incompatível com esta aplicação: ${result.version}`]

    setRawState({ status: 'error', snapshot: null, errors, loadedAt: null, isPartial: false })
  }

  return {
    getState,
    subscribe,
    load: (key, url, options = {}) => runLoad(key, url, options, false),
    reload: (key, url, options = {}) => {
      invalidate(key)
      return runLoad(key, url, options, true)
    },
  }
}
