// Tipos da camada de carregamento assíncrono de snapshots — Missão 04,
// Etapa C0 (criada) / Etapa C2 (generalizada).
//
// Generalização (Etapa C2): esta camada era específica do snapshot do GA4
// (`DailySnapshot`). Para a Jornada de compra reaproveitar o mesmo
// carregador/cache/store com o contrato do Clarity — em vez de criar "um
// segundo sistema de gerenciamento de dados", proibido pela missão — todo o
// módulo passou a ser genérico sobre `T`, com a validação injetada por quem
// chama (ver src/data/providers/*-loader equivalente para GA4 e
// src/data/clarity/loader.ts para Clarity).
//
// Esta camada continua sendo PREPARAÇÃO: nada aqui é consumido pelas telas
// ainda — getActiveProvider() continua sempre retornando o provedor
// fictício. Ver 04-validacao/05-mapeamento-frontend.md.

/** Forma mínima que qualquer snapshot (GA4, Clarity, ou outra fonte futura) precisa ter. */
export interface SnapshotLike {
  metadata: {
    status: 'ok' | 'partial' | 'failed'
    schemaVersion: string
  }
}

export type SnapshotLoadStatus = 'idle' | 'loading' | 'success' | 'error' | 'stale'

export interface SnapshotLoadState<T extends SnapshotLike> {
  status: SnapshotLoadStatus
  snapshot: T | null
  /** Mensagens de erro de validação/rede — nunca undefined em status 'error'. */
  errors: string[] | null
  /** Quando o snapshot atualmente em `snapshot` foi colocado em cache. */
  loadedAt: Date | null
  /** true quando este snapshot cobre um período de coleta parcial (metadata.status==='partial'). */
  isPartial: boolean
}

export function createInitialLoadState<T extends SnapshotLike>(): SnapshotLoadState<T> {
  return { status: 'idle', snapshot: null, errors: null, loadedAt: null, isPartial: false }
}

/**
 * Função de fetch injetável — por padrão, o `fetch` global do navegador.
 * Permite testar o carregador sem servidor real e, no futuro, trocar por um
 * cliente HTTP com cabeçalhos de autenticação corporativa, sem mudar a forma
 * do carregador.
 */
export type SnapshotFetcher = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<unknown>
}>

export interface LoadSnapshotOptions {
  signal?: AbortSignal
  fetcher?: SnapshotFetcher
}

export interface SnapshotStoreOptions {
  /** Idade máxima (ms) antes de um snapshot em cache ser considerado desatualizado (RF-17). */
  maxAgeMs?: number
  /** Relógio injetável, para testes determinísticos. */
  now?: () => Date
}

export interface SnapshotValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

/** O que cada fonte (GA4, Clarity, ...) precisa fornecer para reaproveitar este módulo. */
export interface SnapshotValidator<T extends SnapshotLike> {
  validate: (input: unknown) => SnapshotValidationResult<T>
  isCompatibleVersion: (schemaVersion: string) => boolean
}
