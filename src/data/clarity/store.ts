// Store de snapshot do Clarity — Missão 04, Etapa C2.
// Reaproveita o orquestrador genérico de src/data/async-snapshot (cache,
// proteção contra condição de corrida, estado "stale") com o contrato do
// Clarity — mesma mecânica usada (e já testada) para o GA4 na Etapa C0.

import { createSnapshotStore, type SnapshotStore } from '@/data/async-snapshot/snapshot-store'
import type { SnapshotStoreOptions } from '@/data/async-snapshot/types'
import { claritySnapshotValidator, type ClaritySnapshot } from './contract'

export function createClaritySnapshotStore(options?: SnapshotStoreOptions): SnapshotStore<ClaritySnapshot> {
  return createSnapshotStore(claritySnapshotValidator, options)
}
