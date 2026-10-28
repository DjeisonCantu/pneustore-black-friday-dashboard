// Carregador de snapshot do Clarity — Missão 04, Etapa C2.
// Reaproveita o carregador genérico de src/data/async-snapshot (Etapa C0,
// generalizado na Etapa C2) com o contrato do Clarity — nenhuma lógica de
// busca/validação duplicada.

import { loadSnapshotFromUrl, type LoadSnapshotResult } from '@/data/async-snapshot/loader'
import type { LoadSnapshotOptions } from '@/data/async-snapshot/types'
import { claritySnapshotValidator, type ClaritySnapshot } from './contract'

export function loadClaritySnapshot(url: string, options: LoadSnapshotOptions = {}): Promise<LoadSnapshotResult<ClaritySnapshot>> {
  return loadSnapshotFromUrl(url, claritySnapshotValidator, options)
}
