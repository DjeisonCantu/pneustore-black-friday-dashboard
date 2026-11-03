---
tipo: atualizacao-dashboard
versao_modelo: 1
gerado_em: 2026-11-03
gerado_por: Claude (a partir do PDF do Looker de 03/11 e de consultas agregadas ao Clarity)
---

## Looker — resumo do site
fonte: looker-pdf
periodo: 2026-10-06..2026-11-02

| metrica | valor | precisao |
|---|---|---|
| sessoes | 1582478 | exato |
| usuarios | 920300 | aproximado |
| pedidos | 29641 | exato |
| receita | 44945346.96 | exato |
| ticket_medio | 1516.32 | exato |

## Looker — canais
fonte: looker-pdf
periodo: 2026-10-06..2026-11-02

| canal | participacao | variacao_vs_anterior |
|---|---|---|
| CPC | 42.79 | -11.7 |
| Organic | 28.33 | 29.1 |
| Direct | 15.37 | 7.4 |
| Outros | 9.34 | -17.8 |
| CRM | 3.79 | 8.2 |
| Criteo | 0.38 | -12.2 |

## Looker — origem/mídia
fonte: looker-pdf
periodo: 2026-10-06..2026-11-02

| origem_midia | receita | precisao |
|---|---|---|
| google / cpc | 17220000 | aproximado |
| google / organic | 11900000 | aproximado |
| (direct) / (none) | 6910000 | aproximado |
| meta / cpc | 891750 | aproximado |
| crmback / whatsapp | 735230 | aproximado |
| crm / email | 716090 | aproximado |
| actionpay / organic | 523880 | aproximado |
| crm / botao_push_saida | 241470 | aproximado |
| criteo / display | 170580 | aproximado |

## Looker — marcas
fonte: looker-pdf
periodo: 2026-11-01..2026-11-02

| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |
|---|---|---|---|---|
| Itaro | 23739 | 56.19 | 1081 | 399161.99 |
| Michelin | 22833 | 20.76 | 308 | 298040.72 |
| Pirelli | 14194 | 30.16 | 251 | 205694.6 |
| Speedmax | 11882 | 26.77 | 323 | 192291.2 |
| Kumho | 11208 | 33.66 | 354 | 158541.3 |
| Goodyear | 8457 | 29.25 | 124 | 77500.3 |
| Continental | 8202 | 36.2 | 218 | 109567.05 |
| Bridgestone | 7826 | 46.08 | 197 | 144604.75 |
| Firestone | 5490 | 51.07 | 156 | 72644.66 |
| Barum | 3969 | 46.03 | 126 | 49635.84 |

## Looker — app
fonte: looker-pdf
periodo: 2026-10-06..2026-11-02

| metrica | valor | precisao |
|---|---|---|
| receita_app | 16858235.37 | exato |

## Clarity — checkout
fonte: clarity
periodo: 2026-10-31..2026-11-02

| pagina | dead_clicks | rage_clicks | quick_backs |
|---|---|---|---|
| /checkout/v2/cart | 5910 | 226 | 288 |
| /checkout/v2/servicos-escolha | 4940 | 53 | 98 |
| /checkout/v2/delivery/type | 35 | 12 | 2 |
| /checkout/v2/delivery/send | 927 | 12 | 30 |
| /checkout/v2/payment | 723 | 6 | 24 |
| /checkout/v2/confirmation | 314 | 1 | 42 |

## Clarity — sessões por dispositivo
fonte: clarity
periodo: 2026-10-31..2026-11-02

| dispositivo | sessoes |
|---|---|
| mobile | 100094 |
| desktop | 14594 |
| tablet | 596 |
| other | 11 |

## Limitações
- Clarity 31/10–02/11 inclui sábado, domingo e o feriado de Finados; desktop caiu de 53.490 para 14.594 sessões vs 27–29/out. Não comparar com dias úteis.
- Atrito do checkout do Clarity é agregado (todos os dispositivos), sem divisão por dispositivo.
- /checkout/v2/delivery/type com volume muito baixo — URL pode variar com parâmetros (não confirmado).
- Marcas: a página do Looker estava filtrada para 01–02/11, não para o período inteiro.
- Usuários e receita por origem/mídia são aproximados (arredondados pelo Looker).
- Taxa de conversão não incluída — fórmula oficial pendente (D-04).
- PDF de 03/11 com as páginas App, Speedmax/Região e Leads em branco; nada dessas páginas foi usado.
