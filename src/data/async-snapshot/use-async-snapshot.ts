// Hook React para consumir um SnapshotStore — Missão 04, Etapa C0 (criado) /
// Etapa C2 (generalizado sobre `T`, recebendo um validador) / Etapa C3
// (aceita um `fetcher` injetável, usado pela Jornada de compra para ler as
// fixtures fictícias do Clarity em vez do `fetch` real — ver
// src/data/clarity/use-clarity-journey.ts).
//
// Primeira tela a importar este hook: a Jornada de compra (Etapa C3), só
// para os sinais comportamentais do Clarity — os indicadores comerciais
// continuam vindo do DataProvider síncrono (ver 04-validacao/05-mapeamento-
// frontend.md, seção 11, "decisão arquitetural").

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { createSnapshotStore, type SnapshotStore } from './snapshot-store'
import type { SnapshotFetcher, SnapshotLike, SnapshotLoadState, SnapshotStoreOptions, SnapshotValidator } from './types'

export interface UseAsyncSnapshotResult<T extends SnapshotLike> extends SnapshotLoadState<T> {
  reload: () => void
}

/**
 * `key` identifica a entrada de cache (ex.: `ga4:2026-11-27`,
 * `clarity:2026-11-27`); `url` é de onde buscar; `validator` diz como validar
 * a resposta (ver src/data/providers/schema.ts para GA4 ou
 * src/data/clarity/contract.ts para Clarity). Refazer o load automaticamente
 * quando `key`/`url` mudam é intencional — é exatamente o cenário de "filtro
 * mudou rápido" que snapshot-store.ts protege contra corrida. `fetcher` é
 * opcional e, quando omitido, usa o `fetch` real do navegador (via
 * loadSnapshotFromUrl) — passar um fetcher customizado nunca afeta o cache
 * nem a proteção de corrida, só de onde a resposta vem.
 */
export function useAsyncSnapshot<T extends SnapshotLike>(
  key: string,
  url: string,
  validator: SnapshotValidator<T>,
  storeOptions?: SnapshotStoreOptions,
  fetcher?: SnapshotFetcher,
): UseAsyncSnapshotResult<T> {
  const storeRef = useRef<SnapshotStore<T> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createSnapshotStore(validator, storeOptions)
  }
  const store = storeRef.current

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)

  useEffect(() => {
    const controller = new AbortController()
    store.load(key, url, { signal: controller.signal, fetcher })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, url, fetcher])

  const reload = useCallback(() => {
    store.reload(key, url, { fetcher })
  }, [store, key, url, fetcher])

  return { ...state, reload }
}
