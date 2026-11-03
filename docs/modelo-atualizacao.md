---
tipo: atualizacao-dashboard
versao_modelo: 1
gerado_em: AAAA-MM-DD
gerado_por: Claude (a partir dos dados brutos enviados por Djeison)
---

<!--
REGRAS DO MODELO
- Números sempre sem separador de milhar e com ponto decimal: 44945346.96, 1582478, 42.79
- Percentuais sem o símbolo %: 42.79 significa 42,79%
- Datas sempre AAAA-MM-DD. Período sempre "AAAA-MM-DD..AAAA-MM-DD"
- Cada seção tem o próprio `periodo:` e `fonte:`. Seções ausentes NÃO apagam nada: o dashboard mantém o último dado dessa seção.
- precisao: exato | aproximado (aproximado = valor arredondado pelo Looker, "mil"/"mi")
- Campo sem dado: deixe a célula vazia. Nunca coloque 0 no lugar de "não sei".
- Só um arquivo NOVO por atualização (nome AAAA-MM-DD-HHmm.md, gerado pela tela "Atualizar dados"). Nunca edite nem apague um arquivo antigo de data/updates/.
- Mande só as seções que mudaram. Cada seção aceita, depois da tabela, `limitacoes:` com itens "- ..." (valem enquanto essa versão da seção for a vigente).
- Na seção "Limitações" do arquivo, etiquete com [Clarity], [Looker] ou [UX] a fonte a que o aviso se refere; sem etiqueta = geral.
- Páginas do checkout: só as 6 acima. Dispositivos: mobile | desktop | tablet | other.
-->

## Looker — resumo do site
fonte: looker-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| metrica | valor | precisao |
|---|---|---|
| sessoes | | exato |
| usuarios | | aproximado |
| pedidos | | exato |
| receita | | exato |
| ticket_medio | | exato |

## Looker — canais
fonte: looker-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| canal | participacao | variacao_vs_anterior |
|---|---|---|
| CPC | | |

## Looker — origem/mídia
fonte: looker-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| origem_midia | receita | precisao |
|---|---|---|
| google / cpc | | aproximado |

## Looker — marcas
fonte: looker-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |
|---|---|---|---|---|
| Itaro | | | | |

## Looker — app
fonte: looker-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| metrica | valor | precisao |
|---|---|---|
| receita_app | | exato |

## Clarity — checkout
fonte: clarity
periodo: AAAA-MM-DD..AAAA-MM-DD

| pagina | dead_clicks | rage_clicks | quick_backs |
|---|---|---|---|
| /checkout/v2/cart | | | |
| /checkout/v2/servicos-escolha | | | |
| /checkout/v2/delivery/type | | | |
| /checkout/v2/delivery/send | | | |
| /checkout/v2/payment | | | |
| /checkout/v2/confirmation | | | |

## Clarity — sessões por dispositivo
fonte: clarity
periodo: AAAA-MM-DD..AAAA-MM-DD

| dispositivo | sessoes |
|---|---|
| mobile | |
| desktop | |
| tablet | |
| other | |

## Relatório UX — indicadores da semana
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD
periodo_comparacao: AAAA-MM-DD..AAAA-MM-DD
descricao_fonte: (nome do relatório)
nota: (opcional)

| metrica | 2025 | 2026 | precisao |
|---|---|---|---|
| sessoes | | | exato |
| taxa_conversao | | | exato |
| receita_estimada | | | aproximado |
| ticket_medio | | | exato |

## Relatório UX — funil Clarity
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| etapa | mobile | desktop |
|---|---|---|
| Instalação para carrinho | | |
| Carrinho para frete | | |
| Pagamento para confirmação | | |

## Relatório UX — dead clicks por etapa
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| etapa | mobile | desktop |
|---|---|---|
| Instalação | | |
| Carrinho | | |
| Frete / entrega | | |
| Pagamento | | |

## Relatório UX — gravações
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

- (um relato por linha)

## Relatório UX — Clarity ano a ano
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD
periodo_comparacao: AAAA-MM-DD..AAAA-MM-DD

| metrica | dispositivo | 2025 | 2026 |
|---|---|---|---|
| produto_ate_pedido_confirmado_pct | mobile | | |
| produto_ate_pedido_confirmado_pct | desktop | | |
| sessoes_com_dead_click_pct | mobile | | |
| sessoes_com_dead_click_pct | desktop | | |
| cobertura_clarity_sessoes_ga4_pct | todos | | |

## Próximas ações
fonte: resumo-executivo-pdf
periodo: AAAA-MM-DD..AAAA-MM-DD

| titulo | detalhe | responsavel |
|---|---|---|
| | | |

## Limitações
- [Clarity] (uma por linha; etiqueta opcional [Clarity] / [Looker] / [UX])
