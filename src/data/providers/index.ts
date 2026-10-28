// Ponto único de seleção do provedor de dados — proposta para a Missão 04.
//
// NINGUÉM importa este arquivo ainda. src/data/selectors.ts e as páginas
// continuam lendo src/data/mock/* diretamente, exatamente como na Missão 02
// aprovada. Ver 04-validacao/05-mapeamento-frontend.md para o plano de
// migração (quando e como `selectors.ts` passaria a chamar
// `getActiveProvider()` em vez de importar os módulos de mock por nome).

import { mockDataProvider } from './mock-provider'
import type { DataProvider } from './types'

export type { DataProvider } from './types'

/**
 * Hoje sempre retorna o provedor fictício. Na Missão 04, a ideia é que isto
 * leia uma variável de ambiente de build (ex. VITE_DATA_PROVIDER) para
 * escolher entre 'mock' e 'ga4-clarity-snapshot' — nunca uma escolha feita
 * no navegador em tempo de execução, e nunca com credenciais no bundle
 * (SEG-04): o provedor real só deve LER snapshots já publicados, nunca
 * chamar GA4/Clarity diretamente do cliente.
 */
export function getActiveProvider(): DataProvider {
  return mockDataProvider
}
