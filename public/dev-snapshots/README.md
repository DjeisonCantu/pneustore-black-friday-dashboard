# dev-snapshots — exemplos fictícios para desenvolvimento local

**Tudo neste diretório é DADO FICTÍCIO**, criado para exercitar manualmente e em testes
automatizados a camada de carregamento assíncrono (`src/data/async-snapshot/`), introduzida na
Missão 04 — Etapa C0. Nenhum valor aqui vem de GA4, Clarity ou dos relatórios reais da PneuStore.

## Por que estes arquivos ficam em `public/`

Servidos como arquivos estáticos pelo Vite (`fetch('/dev-snapshots/...')`), eles simulam, **só em
ambiente de desenvolvimento**, o formato de resposta que viria de um endpoint real. O carregador
(`loader.ts`) não sabe nem se importa com isso — ele só recebe uma URL e um `fetch` injetável, o
que é exatamente o ponto: trocar esta pasta por um endpoint protegido depois não muda o formato do
carregador, só a URL/autenticação usadas.

## Regra para quando houver snapshots reais (Etapa C1/C2 em diante)

**Snapshots com dados reais nunca devem ficar em `public/` ou em qualquer diretório servido sem
autenticação.** Eles precisam vir de um endpoint protegido pela mesma autenticação corporativa do
dashboard (SEG-03), nunca de um arquivo estático publicamente acessível. Este diretório é uma
exceção deliberada e documentada, válida só porque (a) o conteúdo é 100% fictício, e (b) esta
aplicação nunca é implantada em produção (ver restrições da Missão 02 em diante).

## Arquivos — GA4 (Etapa C0)

| Arquivo | Propósito |
|---|---|
| `ga4-2026-11-27.json` | Snapshot válido, status "ok", 2 dias de registros fictícios (só `records` — schemaVersion "1.0.0") |
| `ga4-2026-11-27-partial.json` | Snapshot válido, mas com `status: "partial"` — para testar o tratamento de coleta parcial |
| `ga4-invalid-example.json` | Deliberadamente inválido (`platform: "app"`) — para testar que o carregador rejeita, nunca aceita dado fora do contrato |

Estes três continuam aqui porque nenhuma tela os carrega ainda (o provedor GA4 continua
inteiramente fictício/não conectado) — mesmo raciocínio da seção acima.

## GA4 — fixture da Etapa C4 movida para `src/dev-fixtures/ga4/` (correção preventiva da Etapa C5)

`ga4-2026-11-27-full-indicadores.json` (seções `acquisition`/`catalog`, schemaVersion "1.1.0") saiu
deste diretório na Etapa C5, por precaução: como esta missão passou a construir um cliente de
diagnóstico real da GA4 Data API (`04-validacao/scripts/`) que usa exatamente este formato de
referência, mantê-la fora de `public/` desde já evita que uma futura conexão da tela real ao
provedor GA4 esqueça de mover fixtures na hora. Ver `src/dev-fixtures/ga4/README.md`.

## Clarity — fixtures movidas para `src/dev-fixtures/clarity/` (Etapa C3)

A partir da Missão 04 — Etapa C3, o painel Clarity (`ClarityRealSignalsPanel`) passou a ser
**conectado de verdade** à página Jornada de compra, carregado de forma assíncrona. Por isso as
fixtures fictícias do Clarity saíram deste diretório: tudo em `public/` é copiado, como está, para
o build de produção (`dist/`) pelo Vite — correto para o GA4 acima (ainda preparação, nunca
carregado por nenhuma tela), mas não é mais aceitável para o Clarity, que agora é exercitado pela
aplicação real.

As fixtures do Clarity agora vivem em `src/dev-fixtures/clarity/` e só são lidas por
`src/data/clarity/dev-fixtures.ts`, atrás de um `if (import.meta.env.DEV)` — o Vite elimina esse
código (e os `import()` dinâmicos dentro dele) de qualquer build de produção, então os arquivos
nunca chegam a `dist/`. Ver `src/dev-fixtures/clarity/README.md` para a lista de arquivos.
