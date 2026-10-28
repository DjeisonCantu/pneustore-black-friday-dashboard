// Fixtures fictícias do Clarity para desenvolvimento — Missão 04, Etapa C3.
//
// Único ponto de acesso às fixtures em src/dev-fixtures/clarity/ (nunca
// public/ — ver README lá). `devClarityFetcher` nunca faz uma chamada de
// rede real: ele resolve a "URL" recebida para o módulo JSON correspondente,
// via `import()` dinâmico. Todo acesso a esses `import()` fica atrás de um
// `if (import.meta.env.DEV)` — o Vite substitui essa expressão por `false`
// em builds de produção e, por ser código estaticamente inalcançável a
// partir daí, o tree-shaking remove o bloco inteiro (e os `import()` dentro
// dele) do bundle de produção. Verificado manualmente após `npm run build`
// (ver 04-validacao/05-mapeamento-frontend.md, seção 11).
//
// `devClarityFetcher` é exportado como uma única função (não uma fábrica)
// de propósito: sua identidade precisa ser estável entre renders do React —
// `useAsyncSnapshot` usa `fetcher` como dependência de efeito.

import type { SnapshotFetcher } from '@/data/async-snapshot/types'

export const DEV_CLARITY_FIXTURE_FILES = {
  ok: 'clarity-2026-11-27',
  partial: 'clarity-2026-11-27-partial',
  invalid: 'clarity-invalid-example',
} as const

export type DevClarityScenario = keyof typeof DEV_CLARITY_FIXTURE_FILES

/** "URL" interna — nunca buscada por rede; só serve de chave para `devClarityFetcher`. */
export function devClaritySnapshotUrl(scenario: DevClarityScenario): string {
  return `dev-fixtures/clarity/${DEV_CLARITY_FIXTURE_FILES[scenario]}.json`
}

async function importDevFixture(fileName: string): Promise<unknown> {
  if (!import.meta.env.DEV) return undefined

  switch (fileName) {
    case DEV_CLARITY_FIXTURE_FILES.ok:
      return ((await import('../../dev-fixtures/clarity/clarity-2026-11-27.json')) as { default: unknown }).default
    case DEV_CLARITY_FIXTURE_FILES.partial:
      return ((await import('../../dev-fixtures/clarity/clarity-2026-11-27-partial.json')) as { default: unknown }).default
    case DEV_CLARITY_FIXTURE_FILES.invalid:
      return ((await import('../../dev-fixtures/clarity/clarity-invalid-example.json')) as { default: unknown }).default
    default:
      return undefined
  }
}

/**
 * Fetcher injetável que nunca sai da aba: resolve a "URL" para a fixture
 * fictícia correspondente em vez de chamar `fetch`. Fora de desenvolvimento,
 * devolve sempre "não encontrado" sem tentar importar nada.
 */
export const devClarityFetcher: SnapshotFetcher = async (url) => {
  if (!import.meta.env.DEV) {
    return { ok: false, status: 404, json: async () => ({}) }
  }

  const fileName = url.split('/').pop()?.replace(/\.json$/, '') ?? ''
  const payload = await importDevFixture(fileName)
  if (payload === undefined) {
    return { ok: false, status: 404, json: async () => ({}) }
  }
  return { ok: true, status: 200, json: async () => payload }
}
