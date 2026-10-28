// Metadados dos indicadores — definição, unidade, fonte e limitações.
// Este arquivo reflete 01-planejamento/03-matriz-indicadores.md (conteúdo
// aprovado de planejamento). Os VALORES exibidos no dashboard continuam
// vindo da camada de dados fictícios em src/data/mock — nunca deste arquivo.

import type { IndicatorMeta } from '@/types/common'

export const INDICATORS: Record<string, IndicatorMeta> = {
  'IND-01': {
    id: 'IND-01',
    label: 'Sessões e usuários',
    unit: 'sessao',
    secondaryUnit: 'usuario',
    source: 'ga4',
    definition: 'Sessões: número de sessões iniciadas no site. Usuários: número de usuários distintos no período.',
    limitations: 'Confirmar filtro "somente site" (INC-05). Usuários não somam entre dias.',
    status: 'confirmado',
  },
  'IND-02': {
    id: 'IND-02',
    label: 'Taxa de conversão',
    unit: 'percentual',
    source: 'ga4',
    definition: 'Proporção de sessões que resultaram em pedido.',
    formula: 'Pedidos ÷ Sessões × 100',
    limitations: 'Fórmula oficial a aprovar pela área de Analytics (D-04). Diferenças já identificadas entre esta fórmula e o valor do Looker (INC-03).',
    status: 'confirmado',
  },
  'IND-03': {
    id: 'IND-03',
    label: 'Pedidos, receita e ticket médio',
    unit: 'pedido',
    secondaryUnit: 'brl',
    source: 'ga4',
    definition: 'Pedidos: transações de compra no site. Receita: receita de compras registrada no GA4. Ticket médio: receita ÷ pedidos.',
    limitations: 'Não confundir itens comprados com pedidos (INC-01). Confirmar se a receita inclui frete e serviços (Q-07).',
    status: 'confirmado',
  },
  'IND-04': {
    id: 'IND-04',
    label: 'Conversão por dispositivo',
    unit: 'percentual',
    source: 'ga4+clarity',
    definition: 'Taxa de conversão (IND-02) segmentada por categoria de dispositivo.',
    limitations: 'Tratamento de tablet a definir (D-06). Clarity é apoio, nunca somado ao GA4 (RA-07).',
    status: 'provavel',
  },
  'IND-05': {
    id: 'IND-05',
    label: 'Volume de carrinho e checkout',
    unit: 'evento',
    source: 'ga4',
    definition: 'Volume de eventos de e-commerce (visualização de carrinho, início de checkout etc.).',
    limitations: 'Cobertura do add_to_cart em revisão. view_cart ainda não confirmado no stream web (Q-04).',
    status: 'parcial',
  },
  'IND-06': {
    id: 'IND-06',
    label: 'Abandono por etapa',
    unit: 'percentual',
    source: 'ga4+clarity',
    definition: 'Proporção de sessões que não avançam de uma etapa para a próxima na jornada de compra.',
    formula: 'Proposta (não aprovada): 1 − (sessões na etapa N+1 ÷ sessões na etapa N)',
    limitations: 'Metodologia não validada (D-05). Enquanto isso, o dashboard não calcula nem exibe este indicador — mostra apenas volumes por etapa (RA-02, RA-03).',
    status: 'nao-validado',
  },
  'IND-07': {
    id: 'IND-07',
    label: 'Origem do tráfego',
    unit: 'sessao',
    secondaryUnit: 'brl',
    source: 'ga4',
    definition: 'Sessões, pedidos e receita por canal agrupado e por origem/mídia da sessão.',
    limitations: 'Regra de agrupamento de "Outros" e "CRM" pendente de confirmação (Q-08).',
    status: 'confirmado',
  },
  'IND-08': {
    id: 'IND-08',
    label: 'Produtos e marcas',
    unit: 'item',
    secondaryUnit: 'brl',
    source: 'ga4',
    definition: 'Por marca, categoria e produto: itens vistos, adicionados ao carrinho, comprados e receita do item.',
    limitations: 'Preenchimento de item_category não confirmado (Q-04) — ranking de categorias fica em validação até lá.',
    status: 'parcial',
  },
}

export interface GlossaryEntry {
  term: string
  definition: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'Sessão', definition: 'Visita ao site (GA4 sessions). Uma pessoa pode gerar várias sessões no período.' },
  { term: 'Usuário', definition: 'Usuário identificado pelo GA4 (totalUsers). Não é cumulativo entre dias — não some usuários de dias diferentes.' },
  { term: 'Evento', definition: 'Contagem de disparos de um evento (ex.: view_cart). Um usuário pode gerar vários eventos.' },
  { term: 'Item', definition: 'Contagem de produtos em eventos de e-commerce (ex.: itemsAddedToCart). Um pedido pode conter vários itens.' },
  { term: 'Pedido', definition: 'Transação de compra concluída (purchase / transactions).' },
  { term: 'Receita', definition: 'Valor monetário registrado nas transações de compra no GA4, em reais (R$).' },
  { term: 'Receita estimada', definition: 'Pedidos × ticket médio. Não substitui a receita registrada — deve sempre ser rotulada como estimativa (RA-08).' },
]

export interface OpenItem {
  id: string
  description: string
}

export const KNOWN_LIMITATIONS: OpenItem[] = [
  { id: 'D-04', description: 'Fórmula oficial de conversão e métrica de usuário ainda não aprovada pela área de Analytics.' },
  { id: 'D-05', description: 'Metodologia de funil e abandono por etapa ainda não aprovada — por isso o indicador IND-06 não é calculado nesta versão.' },
  { id: 'D-06', description: 'Tratamento da categoria "tablet" (separada, somada a mobile ou omitida) ainda não decidido.' },
  { id: 'D-08', description: 'Limite de variação relevante usado nesta maquete (±15%) é um valor de exemplo, sujeito à aprovação da Gestão e Analytics.' },
  { id: 'D-09', description: 'Tolerância de reconciliação com o GA4 ainda não aprovada.' },
  { id: 'Q-04', description: 'Cobertura de eventos de e-commerce e do parâmetro item_category no stream web ainda não confirmada — por isso a categoria de produto aparece em validação.' },
  { id: 'Q-10', description: 'Acesso ao token da Data Export API do Clarity ainda não confirmado — os sinais comportamentais exibidos são um espaço reservado ilustrativo.' },
]
