// Hook de consumo do Clarity para a Jornada de compra — Missão 04, Etapa C3.
//
// Reaproveita o hook/store genéricos (useAsyncSnapshot) e o validador do
// Clarity (contract.ts) — nenhuma infraestrutura nova de carregamento/cache
// é criada aqui. Fora de desenvolvimento (import.meta.env.DEV === false)
// nenhuma chamada é feita: não existe ainda uma fonte real ativada (ver
// 04-validacao/13-plano-ativacao-clarity.md) e esta etapa proíbe
// explicitamente qualquer chamada real à API do Clarity — o hook devolve o
// estado inicial ('idle'), nunca tentando buscar nada.
//
// `import.meta.env.DEV` é uma constante de build (nunca muda durante a vida
// da aplicação): o `if` abaixo sempre segue o mesmo ramo em todas as
// renderizações de uma mesma build, por isso não viola a regra de hooks na
// prática (ver nota em src/data/async-snapshot/use-async-snapshot.ts).

import { createInitialLoadState } from '@/data/async-snapshot/types'
import { useAsyncSnapshot, type UseAsyncSnapshotResult } from '@/data/async-snapshot/use-async-snapshot'
import { claritySnapshotValidator, type ClaritySnapshot } from './contract'
import { devClarityFetcher, devClaritySnapshotUrl, type DevClarityScenario } from './dev-fixtures'

const STATIC_IDLE_RESULT: UseAsyncSnapshotResult<ClaritySnapshot> = {
  ...createInitialLoadState<ClaritySnapshot>(),
  reload: () => {},
}

/**
 * `scenario` escolhe qual fixture fictícia carregar — só tem efeito em
 * desenvolvimento ('ok' por padrão). Fora do DEV, devolve sempre o estado
 * inicial 'idle', sem nenhuma tentativa de carregamento.
 */
export function useClarityJourneySignals(scenario: DevClarityScenario = 'ok'): UseAsyncSnapshotResult<ClaritySnapshot> {
  if (!import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- import.meta.env.DEV é fixo por build, nunca muda em runtime
    return STATIC_IDLE_RESULT
  }

  const key = `clarity:dev:${scenario}`
  const url = devClaritySnapshotUrl(scenario)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- mesmo motivo do early return acima
  return useAsyncSnapshot(key, url, claritySnapshotValidator, undefined, devClarityFetcher)
}
