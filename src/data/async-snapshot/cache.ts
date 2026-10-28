// Cache em memória de snapshots já validados — Missão 04, Etapa C0
// (criada) / Etapa C2 (generalizada para qualquer tipo de snapshot).
// Nunca persiste em disco/localStorage: um snapshot real pode conter dados
// agregados sensíveis à janela de coleta, e persistir fora da sessão da aba
// fugiria do que foi aprovado (SEG-03 — proteger os arquivos de dados).

import type { SnapshotLike } from './types'

export interface CacheEntry<T extends SnapshotLike> {
  snapshot: T
  cachedAt: Date
}

// Uma única tabela para todas as fontes (GA4, Clarity, ...) — as chaves já
// incluem a fonte (ex. "ga4:2026-11-27", "clarity:2026-11-27") para nunca
// colidir. `unknown` aqui é seguro porque cada função abaixo é genérica e
// tipa a entrada/saída no limite da própria chamada.
const cache = new Map<string, CacheEntry<SnapshotLike>>()

export function getCached<T extends SnapshotLike>(key: string): CacheEntry<T> | null {
  return (cache.get(key) as CacheEntry<T> | undefined) ?? null
}

export function setCached<T extends SnapshotLike>(key: string, snapshot: T, cachedAt: Date): CacheEntry<T> {
  const entry: CacheEntry<T> = { snapshot, cachedAt }
  cache.set(key, entry)
  return entry
}

export function invalidate(key: string): void {
  cache.delete(key)
}

/** Usado só pelos testes, para isolar cada caso sem interferência entre eles. */
export function clearAllForTests(): void {
  cache.clear()
}

export function isStale<T extends SnapshotLike>(entry: CacheEntry<T>, maxAgeMs: number, now: Date): boolean {
  return now.getTime() - entry.cachedAt.getTime() > maxAgeMs
}
