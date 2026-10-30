// Fetcher dos sinais REAIS do Clarity embutidos no bundle de produção —
// atualização de 30/10/2026 (primeira extração real, via
// query-analytics-dashboard, agregada em 05-atualizacoes-diarias/2026-10-30).
//
// Ao contrário de dev-fixtures.ts (gated por `import.meta.env.DEV`, para que
// o tree-shaking remova as fixtures fictícias do bundle de produção), este
// arquivo NUNCA é gated: o dado aqui é real e é exatamente o que deve
// aparecer no site publicado. Segue o mesmo padrão de
// src/data/real/real-overview.ts para o GA4 — JSON embutido, validado de
// novo em runtime pelo consumidor (useClarityJourneySignals), nunca
// confiado cegamente.

import type { SnapshotFetcher } from '@/data/async-snapshot/types'
import realClaritySnapshot from './clarity-real-snapshot.json'

export const REAL_CLARITY_SNAPSHOT_URL = 'real/clarity-real-snapshot.json'

/** Fetcher injetável que nunca sai da aba — resolve direto para o JSON real embutido. */
export const realClarityFetcher: SnapshotFetcher = async (url) => {
  if (url !== REAL_CLARITY_SNAPSHOT_URL) {
    return { ok: false, status: 404, json: async () => ({}) }
  }
  return { ok: true, status: 200, json: async () => realClaritySnapshot }
}
