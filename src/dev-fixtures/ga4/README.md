# src/dev-fixtures/ga4 — fixture fictícia do GA4 (seções estendidas, Etapa C4/C5)

**Tudo neste diretório é DADO FICTÍCIO.**

## Por que isto NÃO fica em `public/`

`ga4-2026-11-27-full-indicadores.json` foi criada na Etapa C4 para demonstrar as seções opcionais
`acquisition` (origem do tráfego, IND-07) e `catalog` (produtos/marcas, IND-08) do contrato de
snapshot (`src/data/providers/schema.ts`, `schemaVersion` "1.1.0"). Nenhuma tela real a carrega
ainda — o provedor GA4 continua 100% fictício/não conectado, o que tecnicamente ainda permitiria
mantê-la em `public/dev-snapshots/` (mesmo raciocínio das outras fixtures GA4 que continuam lá).

Ela foi movida para cá, por precaução, na Etapa C5: esta missão passou a ter um cliente de
diagnóstico real da GA4 Data API (`04-validacao/scripts/ga4-diagnostic-client.mjs`) que usa esta
fixture como referência de formato ao preparar a transformação de uma resposta real da API para o
contrato do snapshot. Mantê-la fora de `public/` desde já evita qualquer risco de uma futura etapa
esquecer de movê-la no momento em que uma tela real passar a consumir o provedor GA4 — mesmo
cuidado já aplicado ao Clarity na Etapa C3 (`src/dev-fixtures/clarity/README.md`).

## Arquivo

| Arquivo | Propósito |
|---|---|
| `ga4-2026-11-27-full-indicadores.json` | Snapshot fictício completo: `records` (sessões/usuários/pedidos/receita por dispositivo), `acquisition.channels` (origem do tráfego) e `catalog.products`/`.brands`/`.categories: null` (produtos e marcas) |

## Regra para quando houver um snapshot real

Um snapshot real do GA4 nunca deve ficar neste diretório, nem em `public/`, nem em qualquer caminho
servido sem autenticação — precisa vir de um endpoint protegido pela mesma autenticação corporativa
do dashboard (SEG-03), assim como já vale para o Clarity (`13-plano-ativacao-clarity.md`).
