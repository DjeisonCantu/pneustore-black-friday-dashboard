// Contratos de snapshot — Missão 04, Etapa B2.
//
// Define o formato que um arquivo de snapshot real (GA4 ou Clarity, ver
// 04-validacao/04-arquitetura-integracao.md, seção 2) precisa ter para ser
// aceito pela aplicação, e valida isso com Zod (MIT — license/necessidade
// confirmadas: licença permissiva igual às demais dependências do projeto;
// necessidade real, já que um snapshot real vem de fora do código e não deve
// ser confiado sem checagem — "impedir que dados inválidos sejam
// apresentados como reais" é requisito explícito da Etapa B2).
//
// Nota sobre "unidade" nos metadados obrigatórios: um snapshot reúne vários
// indicadores ao mesmo tempo (sessões, usuários, pedidos, receita…), cada um
// com sua própria unidade — não faz sentido um único campo "unidade" para o
// arquivo inteiro. A garantia de unidade aqui vem de dois lugares: (1) os
// campos são nomeados e nunca misturados (sessions/users/orders/revenue
// nunca são somados entre si — RA-01), e (2) a definição de cada unidade
// continua centralizada em src/data/indicators.ts, que a UI já usa para
// rotular todo indicador (ícone ⓘ, RF-20). Separar os dois evita duplicar a
// mesma informação em dois lugares que poderiam divergir.

import { z } from 'zod'
import type { SnapshotValidator } from '@/data/async-snapshot/types'

export const SNAPSHOT_SCHEMA_VERSION = '1.4.0'

export const DeviceMetricSetSchema = z.object({
  desktop: z.number().nonnegative(),
  mobile: z.number().nonnegative(),
  tablet: z.number().nonnegative(),
})

/**
 * Métrica agregada de um registro diário — Missão 04, Etapa C5.2.
 *
 * Quase todo o contrato original (Etapa B2) assumia uma fonte completa (GA4
 * Data API), que sempre consegue segmentar por dispositivo. A Etapa C5.2
 * descobriu, tentando de verdade, que uma fonte manual/pré-agregada (ex.: um
 * PDF exportado do Looker Studio) muitas vezes só tem o TOTAL do período,
 * sem segmentação nenhuma — e o contrato não aceitava isso, forçando a
 * inventar uma divisão por dispositivo que a fonte não tem.
 *
 * Esta união resolve isso sem enfraquecer a garantia para quem já segmenta
 * (GA4 Data API continua usando `DeviceMetricSetSchema`, primeiro membro da
 * união, sem nenhuma mudança) — só ACRESCENTA uma segunda forma válida,
 * `{ total }`, para quando a segmentação genuinamente não existe. Nunca somar
 * os dois formatos entre si nem presumir que `total` é a soma de
 * desktop+mobile+tablet de outro registro (RA-01) — um registro com `total`
 * é, por definição, um registro sem visibilidade de dispositivo.
 */
export const AggregateMetricSchema = z.union([DeviceMetricSetSchema, z.object({ total: z.number().nonnegative() })])
export type AggregateMetric = z.infer<typeof AggregateMetricSchema>

/** `true` quando a métrica tem segmentação por dispositivo (nunca um "total" fingindo ser detalhado). */
export function isDeviceSegmented(metric: AggregateMetric): metric is z.infer<typeof DeviceMetricSetSchema> {
  return 'desktop' in metric
}

export const DailyRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data precisa estar no formato AAAA-MM-DD'),
  isFuture: z.boolean(),
  /**
   * `true` quando o dia ainda está em andamento (Etapas B2/C0) **ou** quando
   * qualquer métrica deste registro não tem segmentação por dispositivo /
   * veio de um valor aproximado da fonte (Etapa C5.2) — em ambos os casos, a
   * UI não deve tratar o registro como "dado completo e confiável".
   */
  isPartial: z.boolean(),
  sessions: AggregateMetricSchema,
  users: AggregateMetricSchema,
  orders: AggregateMetricSchema,
  revenue: AggregateMetricSchema,
})

export const SnapshotStatusSchema = z.enum(['ok', 'partial', 'failed'])

export const SnapshotMetadataSchema = z.object({
  /** Fonte. */
  source: z.enum(['ga4', 'clarity']),
  /**
   * Plataforma coberta pelo snapshot. SEMPRE 'site' nesta aplicação
   * (RA-04/INT-02) — um snapshot marcado como 'app' deve falhar a validação,
   * nunca ser aceito "por engano" misturado com dados do site.
   */
  platform: z.literal('site'),
  /** Versão do esquema — permite rejeitar/migrar snapshots de um formato antigo. */
  schemaVersion: z.string(),
  /** Data e hora da extração (ISO 8601, com offset de fuso). */
  extractedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'extractedAt precisa ser uma data ISO válida'),
  /** Período coberto pelo snapshot (datas em AAAA-MM-DD). */
  period: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  /** Dispositivo(s) que este snapshot segmenta. */
  deviceScope: z.array(z.enum(['desktop', 'mobile', 'tablet'])).min(1),
  /** Status de disponibilidade desta extração. */
  status: SnapshotStatusSchema,
  /**
   * Campo opcional (Missão 04 — Etapa C0): nota livre sobre qualidade ou
   * limitação do dado desta extração específica (ex.: "coleta parcial por
   * instabilidade da API às 14h"). Ausente na maioria dos snapshots — exemplo
   * de campo opcional tratado pelo contrato sem exigir valor inventado.
   */
  note: z.string().optional(),
  /**
   * Campo opcional (Etapa C5.2) — lista de limitações conhecidas desta
   * extração específica (ex.: "receita aproximada, arredondada pelo
   * Looker"). Mesmo campo/convenção que `ClaritySnapshotMetadataSchema` já
   * usa desde a Etapa C2 — faltava aqui porque até a Etapa C5.2 nenhuma
   * fonte de GA4 precisava declarar limitações por extração. Sem isso, um
   * `metadata.limitations` enviado era descartado silenciosamente pelo Zod
   * (campo desconhecido) — bug real encontrado ao embutir o primeiro
   * snapshot gerado por `looker-pdf-cli.mjs`.
   */
  limitations: z.array(z.string()).optional(),
}).refine((meta) => meta.period.from <= meta.period.to, {
  message: 'period.from precisa ser menor ou igual a period.to',
  path: ['period'],
})

/**
 * Origem do tráfego (IND-07) — Missão 04, Etapa C4 (estendido na C5.2).
 * Linha CRUA por canal: só contagens (sessões, pedidos, receita), nunca uma
 * taxa pré-calculada (RA-01) — `conversionRate`/`revenueShare`, que a UI já
 * usa (`ChannelRow` em src/data/mock/channels.ts), são sempre derivados
 * depois, nunca armazenados aqui. `channel` é texto livre (não o enum
 * fictício de `mock/channels.ts`): o agrupamento de canal real do GA4 pode
 * não corresponder 1:1 ao da maquete, e a regra de agrupamento de
 * "Outros"/"CRM" ainda não foi confirmada (Q-08).
 *
 * `sessions`/`orders` são opcionais desde a Etapa C5.2: a GA4 Data API
 * forneceria os três campos sempre, mas uma fonte manual/pré-agregada (ex.
 * um relatório do Looker Studio) pode só ter a receita e a participação
 * percentual por canal — faltar sessões/pedidos não deve impedir registrar
 * a receita que a fonte efetivamente tem. `revenue` continua obrigatório
 * porque é o único campo que todas as fontes já vistas conseguem fornecer.
 */
export const AcquisitionChannelRowSchema = z.object({
  channel: z.string().min(1),
  /** Par origem/mídia bruto do GA4 (ex.: "google / cpc"), quando disponível — nunca inventado. */
  sourceMedium: z.string().optional(),
  sessions: z.number().nonnegative().optional(),
  orders: z.number().nonnegative().optional(),
  revenue: z.number().nonnegative(),
})
export type AcquisitionChannelRow = z.infer<typeof AcquisitionChannelRowSchema>

/**
 * Participação por canal agregado do Looker Studio (seção "Participação por
 * canal" do PDF) — Etapa de 30/10/2026. Diferente de `AcquisitionChannelRowSchema`
 * (que é por origem/mídia, ex. "google / cpc", podendo repetir o mesmo canal
 * em várias linhas): aqui cada canal aparece uma única vez, já com a %
 * participação na receita e a variação vs. o período anterior que o próprio
 * Looker calcula — nunca recalculados aqui, só armazenados como a fonte
 * informa. Campo opcional: nem toda extração traz essa seção do PDF.
 */
export const ChannelShareRowSchema = z.object({
  channel: z.string().min(1),
  revenueSharePercent: z.number().min(0).max(100),
  comparisonChangePercent: z.number(),
})
export type ChannelShareRow = z.infer<typeof ChannelShareRowSchema>

/**
 * Produtos e marcas (IND-08) — Missão 04, Etapa C4. Mesma forma crua de
 * `ProductRow`/`BrandRow` (`src/data/mock/products.ts`): contagens de item,
 * nunca uma taxa. `category` é opcional e nunca inventada — o preenchimento
 * de `item_category` no stream real ainda não foi confirmado (Q-04); um
 * snapshot sem essa informação deve omitir o campo, nunca inventar "Outros".
 */
export const CatalogProductRowSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().optional(),
  isService: z.boolean(),
  itemsViewed: z.number().nonnegative(),
  itemsAdded: z.number().nonnegative(),
  itemsPurchased: z.number().nonnegative(),
  itemRevenue: z.number().nonnegative(),
})
export type CatalogProductRow = z.infer<typeof CatalogProductRowSchema>

export const CatalogBrandRowSchema = z.object({
  brand: z.string().min(1),
  itemsViewed: z.number().nonnegative(),
  itemsAdded: z.number().nonnegative(),
  itemsPurchased: z.number().nonnegative(),
  itemRevenue: z.number().nonnegative(),
})
export type CatalogBrandRow = z.infer<typeof CatalogBrandRowSchema>

export const DailySnapshotSchema = z.object({
  metadata: SnapshotMetadataSchema,
  records: z.array(DailyRecordSchema),
  /**
   * Seções opcionais (Etapa C4) para os indicadores de origem de tráfego e
   * catálogo — opcionais porque um snapshot "só `records`" (sessões/
   * usuários/pedidos/receita, Etapas B2/C0) continua válido sozinho; nem
   * toda extração real precisa cobrir os 6 indicadores de uma vez.
   * `categories` fica `null` (nunca `[]`) quando o ranking de categoria
   * ainda não está disponível (Q-04) — distingue "sem essa informação" de
   * "zero categorias", mesma convenção já usada em `CatalogPort.getCategoryRows`
   * (src/data/providers/types.ts).
   */
  acquisition: z
    .object({
      channels: z.array(AcquisitionChannelRowSchema),
      /** Participação por canal agregado (ver ChannelShareRowSchema) — opcional, nem toda extração traz essa seção. */
      channelShares: z.array(ChannelShareRowSchema).optional(),
    })
    .optional(),
  catalog: z
    .object({
      products: z.array(CatalogProductRowSchema),
      brands: z.array(CatalogBrandRowSchema),
      categories: z.array(CatalogProductRowSchema).nullable(),
    })
    .optional(),
})

/**
 * Compatibilidade entre a versão do snapshot e o catálogo de indicadores
 * atual (src/data/indicators.ts): só a versão MAJOR é comparada (semver
 * simplificado) — um snapshot de major diferente do suportado pela aplicação
 * pode ter um formato de registro incompatível com o que os seletores e a UI
 * esperam, então é tratado como incompatível mesmo que a validação Zod
 * estrutural passe (isso cobre o caso de um esquema futuro que reorganize
 * campos sem necessariamente quebrar os tipos individuais).
 */
export function isCompatibleSchemaVersion(version: string): boolean {
  const [major] = version.split('.')
  const [currentMajor] = SNAPSHOT_SCHEMA_VERSION.split('.')
  return major === currentMajor
}

export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>
export type DailySnapshot = z.infer<typeof DailySnapshotSchema>

export interface SnapshotValidationResult {
  success: boolean
  data?: DailySnapshot
  errors?: string[]
}

/**
 * Valida um payload desconhecido (ex.: JSON lido de um arquivo de snapshot)
 * contra o contrato acima. Nunca lança — sempre retorna um resultado, para
 * que o chamador decida o que fazer com dado inválido (nunca apresentá-lo
 * como real).
 */
export function validateDailySnapshot(input: unknown): SnapshotValidationResult {
  const result = DailySnapshotSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`),
  }
}

/**
 * Validador pronto para o carregador genérico de snapshots (Etapa C2 —
 * src/data/async-snapshot/loader.ts), para quando um provedor real de GA4
 * passar a usá-lo. Hoje não é consumido por nenhum provedor ativo.
 */
export const ga4SnapshotValidator: SnapshotValidator<DailySnapshot> = {
  validate: validateDailySnapshot,
  isCompatibleVersion: isCompatibleSchemaVersion,
}
