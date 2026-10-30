// Contrato de dados para sinais comportamentais agregados do Clarity —
// Missão 04, Etapa C2.
//
// Segue o mesmo padrão do contrato de snapshot do GA4
// (src/data/providers/schema.ts, Etapa B2): Zod, nunca lança, campos
// nomeados e tipados (RA-01 — nunca misturar Clarity com GA4 em cálculos),
// metadados obrigatórios de proveniência.
//
// Valores absolutos, taxas e denominadores ficam em campos SEPARADOS,
// conforme pedido explicitamente pela Etapa C2 — nunca um único número
// "pronto" sem o que o compõe: `absolute` é a contagem bruta; `sessions` (no
// nível da linha) é o denominador; `perSession`, quando presente, é a taxa
// relatada PELA PRÓPRIA FONTE — o adaptador (adapter.ts) é quem decide se
// recalcula `absolute / sessions` para comparar com `perSession`, nunca este
// contrato.

import { z } from 'zod'
import type { SnapshotValidator } from '@/data/async-snapshot/types'

export const CLARITY_SCHEMA_VERSION = '1.1.0'

/**
 * Dispositivo conforme o Clarity reporta (ver 02-auditoria-clarity.md e o
 * acesso real da Etapa C1 — a consulta real devolveu "PC", "Mobile",
 * "Tablet", "Other"). Mapeado para o vocabulário do app (`desktop` em vez de
 * `PC`) no adaptador, não aqui — este contrato reflete o que a fonte envia.
 *
 * `'all'` (desde 1.1.0, atualização de 30/10/2026) não é um dispositivo real
 * reportado pelo Clarity — é um sentinela para uma linha AGREGADA (todos os
 * dispositivos somados), usado quando a extração só tem o total e não uma
 * divisão por dispositivo. Nunca usar `'all'` para inventar uma divisão;
 * apenas para marcar honestamente "isto não está segmentado".
 */
export const ClarityDeviceSchema = z.enum(['desktop', 'mobile', 'tablet', 'other', 'all'])
export type ClarityDevice = z.infer<typeof ClarityDeviceSchema>

/** Um `ClarityPageSignal` cujo `device` é o sentinela agregado `'all'`. */
export function isAggregatedDevice(device: ClarityDevice): device is 'all' {
  return device === 'all'
}

/** Um valor absoluto, com a taxa por sessão opcionalmente informada pela própria fonte. */
export const ClarityMetricSchema = z.object({
  /** Contagem bruta (ex.: total de dead clicks no período/página/dispositivo). */
  absolute: z.number().nonnegative(),
  /** Taxa por sessão, SE a fonte a fornecer — nunca inventada aqui. */
  perSession: z.number().nonnegative().optional(),
})
export type ClarityMetric = z.infer<typeof ClarityMetricSchema>

export const ClarityPageSignalSchema = z.object({
  /** Caminho da URL — ver src/data/clarity/checkout-pages.ts para os 6 caminhos validados. */
  page: z.string().min(1),
  device: ClarityDeviceSchema,
  /** Denominador — "sessões, quando disponíveis" (pode faltar; nunca inventar). */
  sessions: z.number().nonnegative().optional(),
  deadClicks: ClarityMetricSchema,
  rageClicks: ClarityMetricSchema,
  quickBacks: ClarityMetricSchema,
})
export type ClarityPageSignal = z.infer<typeof ClarityPageSignalSchema>

export const ClaritySnapshotStatusSchema = z.enum(['ok', 'partial', 'failed'])

export const ClaritySnapshotMetadataSchema = z
  .object({
    source: z.literal('clarity'),
    /** Projeto de origem — ex.: "PneuStore (www.pneustore.com.br)". Nunca presumir; vem da auditoria/config real. */
    project: z.string().min(1),
    /** Sempre 'site' nesta aplicação (RA-04/INT-02) — mesma regra do contrato do GA4. */
    platform: z.literal('site'),
    schemaVersion: z.string(),
    /** Data e hora da extração (ISO 8601, com offset de fuso). */
    extractedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'extractedAt precisa ser uma data ISO válida'),
    /** Período efetivamente consultado. */
    period: z.object({
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    deviceScope: z.array(ClarityDeviceSchema).min(1),
    status: ClaritySnapshotStatusSchema,
    /**
     * Limitações da fonte para ESTE snapshot específico — ex.: "janela
     * histórica da Data Export API pública limitada a 1–3 dias"
     * (02-auditoria-clarity.md) ou "cobertura de sessões pode divergir do
     * GA4 (RA-07)". Nunca omitir limitações conhecidas silenciosamente.
     */
    limitations: z.array(z.string()).optional(),
    note: z.string().optional(),
  })
  .refine((meta) => meta.period.from <= meta.period.to, {
    message: 'period.from precisa ser menor ou igual a period.to',
    path: ['period'],
  })
export type ClaritySnapshotMetadata = z.infer<typeof ClaritySnapshotMetadataSchema>

export const ClaritySnapshotSchema = z.object({
  metadata: ClaritySnapshotMetadataSchema,
  pages: z.array(ClarityPageSignalSchema),
})
export type ClaritySnapshot = z.infer<typeof ClaritySnapshotSchema>

export interface ClaritySnapshotValidationResult {
  success: boolean
  data?: ClaritySnapshot
  errors?: string[]
}

/** Nunca lança — mesma convenção do validador do GA4 (providers/schema.ts). */
export function validateClaritySnapshot(input: unknown): ClaritySnapshotValidationResult {
  const result = ClaritySnapshotSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`),
  }
}

/** Mesma política do GA4: só o número MAJOR é comparado (semver simplificado). */
export function isCompatibleClaritySchemaVersion(version: string): boolean {
  const [major] = version.split('.')
  const [currentMajor] = CLARITY_SCHEMA_VERSION.split('.')
  return major === currentMajor
}

/** Pronto para o carregador/store genérico de snapshots (src/data/async-snapshot). */
export const claritySnapshotValidator: SnapshotValidator<ClaritySnapshot> = {
  validate: validateClaritySnapshot,
  isCompatibleVersion: isCompatibleClaritySchemaVersion,
}
