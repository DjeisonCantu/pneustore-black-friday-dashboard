// Hook de consumo do Clarity para a Jornada de compra — Missão 04, Etapa C3.
//
// Reaproveita o hook/store genéricos (useAsyncSnapshot) e o validador do
// Clarity (contract.ts) — nenhuma infraestrutura nova de carregamento/cache
// é criada aqui.
//
// Atualização de 30/10/2026: fora de desenvolvimento (import.meta.env.DEV
// === false) o hook agora carrega o snapshot REAL embutido
// (src/data/real/clarity-real-snapshot.json, via realClarityFetcher) — mesmo
// padrão já usado pelo GA4 (src/data/real/real-overview.ts). Antes disso
// devolvia sempre 'idle' (nenhuma fonte real ativada ainda — ver
// 04-validacao/13-plano-ativacao-clarity.md); essa restrição seguia válida
// apenas enquanto não havia dado real para mostrar, nunca como regra
// permanente.
//
// `import.meta.env.DEV` é uma constante de build (nunca muda durante a vida
// da aplicação): o `if` abaixo sempre segue o mesmo ramo em todas as
// renderizações de uma mesma build, por isso não viola a regra de hooks na
// prática (ver nota em src/data/async-snapshot/use-async-snapshot.ts).

import { useAsyncSnapshot, type UseAsyncSnapshotResult } from '@/data/async-snapshot/use-async-snapshot'
import { REAL_CLARITY_SNAPSHOT_URL, realClarityFetcher } from '@/data/real/clarity-real-fetcher'
import { claritySnapshotValidator, type ClaritySnapshot } from './contract'
import { devClarityFetcher, devClaritySnapshotUrl, type DevClarityScenario } from './dev-fixtures'

/**
 * `scenario` escolhe qual fixture fictícia carregar — só tem efeito em
 * desenvolvimento ('ok' por padrão). Fora do DEV, ignora `scenario` e carrega
 * sempre o snapshot real embutido.
 */
export function useClarityJourneySignals(scenario: DevClarityScenario = 'ok'): UseAsyncSnapshotResult<ClaritySnapshot> {
  if (!import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- import.meta.env.DEV é fixo por build, nunca muda em runtime
    return useAsyncSnapshot('clarity:real', REAL_CLARITY_SNAPSHOT_URL, claritySnapshotValidator, undefined, realClarityFetcher)
  }

  const key = `clarity:dev:${scenario}`
  const url = devClaritySnapshotUrl(scenario)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- mesmo motivo do early return acima
  return useAsyncSnapshot(key, url, claritySnapshotValidator, undefined, devClarityFetcher)
}
