---
tipo: atualizacao-dashboard
versao_modelo: 1
gerado_em: 2026-10-30T12:17:54.727Z
gerado_por: Migração (baseline) — dados que estavam no ar em 30/10/2026, commit 3216ba6
---

<!--
BASELINE — NÃO EDITAR, NÃO APAGAR (a pasta data/updates/ é append-only).

Migração fiel dos dados reais que estavam no ar antes do fluxo "Atualizar dados":
Looker 02/10–29/10, Clarity 27–29/10, Relatório UX Pré-Black 14–20/10 e próximas ações.
O teste "baseline idêntico ao site no ar" compara este arquivo com a saída congelada
do código de 3216ba6 (src/data/updates/__tests__/fixtures/live-3216ba6-expected.json).

Duas observações de fidelidade:
- pct_add_to_cart das marcas foi reconstruído a partir do itemsAdded que estava no ar:
  para cada marca existe um único valor de 2 casas decimais que reproduz exatamente aquele
  número (o PDF original deste export não está mais disponível).
- "259540.00000000003" (origem/mídia crm / botao_push_saida) é o valor exato que estava no ar,
  com o ruído de ponto flutuante original — mantido de propósito para a migração ser idêntica.
-->

## Looker — resumo do site
fonte: looker-pdf
periodo: 2026-10-02..2026-10-29

| metrica | valor | precisao |
|---|---|---|
| sessoes | 1635826 | exato |
| usuarios | 945100 | aproximado |
| pedidos | 31456 | exato |
| receita | 47460135.62 | exato |

## Looker — canais
fonte: looker-pdf
periodo: 2026-10-02..2026-10-29

| canal | participacao | variacao_vs_anterior |
|---|---|---|
| CPC | 43.45 | -11.2 |
| Organic | 27.52 | 30.8 |
| Direct | 15.07 | 7.5 |
| Outros | 9.75 | -20.1 |
| CRM | 3.82 | 15 |
| Criteo | 0.39 | -15.4 |

## Looker — origem/mídia
fonte: looker-pdf
periodo: 2026-10-02..2026-10-29

| origem_midia | receita | precisao |
|---|---|---|
| google / cpc | 18580000 | aproximado |
| meta / cpc | 882600 | aproximado |
| crmback / whatsapp | 791430 | aproximado |
| crm / email | 748400 | aproximado |
| crm / botao_push_saida | 259540.00000000003 | aproximado |
| google / organic | 12230000 | aproximado |
| actionpay / organic | 510340 | aproximado |
| criteo / display | 184660 | aproximado |
| (direct) / (none) | 7150000 | aproximado |

## Looker — marcas
fonte: looker-pdf
periodo: 2026-10-02..2026-10-29

| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |
|---|---|---|---|---|
| Itaro | 410027 | 43.65 | 25916 | 9463292.56 |
| Michelin | 354108 | 19.04 | 7770 | 7180698.21 |
| Pirelli | 235021 | 22.27 | 6236 | 4909407.72 |
| Kumho | 179878 | 29.79 | 8903 | 4404692.62 |
| Continental | 130455 | 31.29 | 5529 | 2942476.03 |
| Bridgestone | 110551 | 34.83 | 4461 | 3361737.94 |
| Firestone | 79123 | 39.35 | 3172 | 1472876.66 |
| Barum | 69716 | 38.06 | 3052 | 1179814.65 |

## Clarity — checkout
fonte: clarity
periodo: 2026-10-27..2026-10-29
descricao_fonte: Microsoft Clarity (query-analytics-dashboard), agregado manualmente

| pagina | dead_clicks | rage_clicks | quick_backs |
|---|---|---|---|
| /checkout/v2/cart | 10129 | 626 | 542 |
| /checkout/v2/servicos-escolha | 8707 | 289 | 213 |
| /checkout/v2/delivery/type | 40 | 0 | 2 |
| /checkout/v2/delivery/send | 1490 | 45 | 54 |
| /checkout/v2/payment | 1338 | 16 | 64 |
| /checkout/v2/confirmation | 439 | 9 | 96 |

## Clarity — sessões por dispositivo
fonte: clarity
periodo: 2026-10-27..2026-10-29

| dispositivo | sessoes |
|---|---|
| mobile | 110378 |
| desktop | 53490 |
| tablet | 745 |
| other | 13 |

## Relatório UX — indicadores da semana
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20
periodo_comparacao: 2025-10-14..2025-10-20
descricao_fonte: PneuStore_Resumo_Executivo_PreBlack_2026.pdf (PneuStore · UX Research)
nota: Fonte: GA4 transcrito no relatório. Receita calculada por pedidos × ticket médio (estimativa, não é a receita bruta do GA4). Métricas agregadas de todo o site — não isolam o efeito de mudanças na jornada.

| metrica | 2025 | 2026 | precisao |
|---|---|---|---|
| sessoes | 707350 | 404343 | exato |
| taxa_conversao | 1.38 | 1.98 | exato |
| receita_estimada | 14600000 | 12040000 | aproximado |
| ticket_medio | 1491.02 | 1502 | exato |

## Relatório UX — funil Clarity
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20
nota: Clarity. Visitas por URL, sem sequência validada. Instalação e pagamento: complemento das taxas de saída do relatório.

| etapa | mobile | desktop |
|---|---|---|
| Instalação para carrinho | 60 | 87 |
| Carrinho para frete | 34 | 39 |
| Pagamento para confirmação | 83 | 75 |

## Relatório UX — dead clicks por etapa
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20
nota: Clarity. Relatos de 15 sessões mobile selecionadas por cliques, com leitura parcial. Não medem frequência. Desktop ainda não analisado — tratar os valores de desktop acima como preliminares.

| etapa | mobile | desktop |
|---|---|---|
| Instalação | 0.25 | 0.55 |
| Carrinho | 0.36 | 1.17 |
| Frete / entrega | 0.28 | 0.4 |
| Pagamento | 0.14 | 0.59 |

## Relatório UX — gravações
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20

- Idas e voltas entre checkout e carrinho.
- Cards de instalação e opções de frete recebem cliques repetidos.
- Cadastro incompleto impede um usuário de avançar no pagamento.

## Relatório UX — Clarity ano a ano
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20
periodo_comparacao: 2025-10-14..2025-10-20
nota: Plataformas e captura diferentes limitam a comparação — a cobertura do Clarity mudou de 2,5% das sessões do GA4 em 2025 para 86% em 2026. Estes dados não comprovam melhora ou piora causada pela nova interface.

| metrica | dispositivo | 2025 | 2026 |
|---|---|---|---|
| produto_ate_pedido_confirmado_pct | mobile | 1.6 | 3.3 |
| produto_ate_pedido_confirmado_pct | desktop | 3.7 | 6.7 |
| sessoes_com_dead_click_pct | mobile | 11.2 | 15.2 |
| sessoes_com_dead_click_pct | desktop | 18.4 | 27.1 |
| cobertura_clarity_sessoes_ga4_pct | todos | 2.5 | 86 |

## Próximas ações
fonte: resumo-executivo-pdf
periodo: 2026-10-14..2026-10-20

| titulo | detalhe | responsavel |
|---|---|---|
| Investigar checkout e carrinho | Checar redirecionamento/login e analisar 20 gravações desktop. | Desenvolvimento + UX |
| Validar a compreensão das telas | Teste remoto com 5 a 6 clientes em instalação mobile e carrinho/frete. | UX + Produto |
| Revisar a mensuração | Recuperar eventos de serviço e verificar cobertura do add_to_cart. | Analytics |
| Definir o que cabe antes da Black | Confirmar congelamento de código e ajustes possíveis. Repetir a análise na Black. | Produto + Desenvolvimento |

## Limitações
- [Looker] Período exibido no relatório no momento da exportação: 2 de out. de 2026 - 29 de out. de 2026 — rolante, confirmar se ainda vale ao reutilizar este snapshot.
- [Looker] records[] representa o TOTAL do período inteiro exibido, sem segmentação por dia nem por dispositivo (ver AggregateMetricSchema, src/data/providers/schema.ts) — nunca comparar diretamente com um snapshot segmentado por dispositivo.
- [Looker] users veio arredondado pelo Looker (formato "mil") — valor aproximado, não oficial.
- [Looker] revenue.total é o valor EXATO do período, lido da seção "Participação por canal" do PDF (R$ 47.460.135,62) — não o valor aproximado ("~R$ 47,46 mi") do card de resumo do GA4.
- [Looker] acquisition.channels[] não tem sessões nem pedidos — este relatório só fornece receita por origem/mídia.
- [Looker] Parte da receita por canal em acquisition.channels[] também é aproximada (mesmo motivo do card de resumo).
- [Looker] catalog.brands[].itemsAdded é estimado a partir de %Add to Cart do Looker, não uma contagem bruta (ver 19-plano-integracao-via-looker-export.md).
- [Looker] Separação site/app não comprovada estruturalmente (sem streamId) — depende de revisão manual de qual seção do PDF foi usada (ver 07-validacao-stream-ga4.md).
- [Looker] Taxa de conversão não incluída — fórmula oficial pendente de aprovação da Analytics (D-04).
- [Looker] acquisition.channelShares[] vem da seção "Participação por canal" do PDF — já agregado pelo próprio Looker (um canal, uma linha); comparisonChangePercent é a variação vs. o período anterior que o Looker calcula, não recalculada aqui.
- [Clarity] Atrito do checkout agregado para todos os dispositivos — sem segmentação por dispositivo nesta extração.
- [Clarity] /checkout/v2/delivery/type com volume muito baixo — a URL pode variar com parâmetros, ainda não confirmado.
- [Clarity] Janela pública de Data Export do Clarity limitada a 1–3 dias fechados.
