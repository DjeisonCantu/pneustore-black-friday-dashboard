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

## Limitações
- (uma por linha; aparecem na gaveta "Sobre os dados")
