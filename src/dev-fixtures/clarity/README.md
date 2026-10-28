# src/dev-fixtures/clarity — fixtures fictícias do Clarity (Etapa C3)

**Tudo neste diretório é DADO FICTÍCIO.** As seis páginas de checkout usadas nestes exemplos são
reais e validadas (ver `04-validacao/10-inventario-fontes-reais.md`, seção 3) — só os **números**
são fictícios.

## Por que isto NÃO fica em `public/`

Arquivos em `public/` são copiados, como estão, para o build de produção (`dist/`) pelo Vite. Isso
é aceitável para as fixtures do GA4 (`public/dev-snapshots/`), que nenhuma tela carrega ainda — mas
deixou de ser aceitável para o Clarity a partir da Etapa C3, porque o painel
`ClarityRealSignalsPanel` agora é carregado de verdade pela Jornada de compra.

Por isso estes arquivos vivem aqui, fora de `public/`, e só são lidos por
`src/data/clarity/dev-fixtures.ts` — nunca por `fetch` de uma URL pública. Esse módulo só importa
estes JSONs dentro de um bloco `if (import.meta.env.DEV)`: o Vite substitui essa expressão por
`false` em builds de produção e remove o branch inteiro (inclusive os `import()` dinâmicos dentro
dele) antes de gerar o bundle — então nenhum destes arquivos é incluído em `dist/`. Isso foi
verificado manualmente após o build da Etapa C3 (ver `04-validacao/05-mapeamento-frontend.md`,
seção 11).

## Arquivos

| Arquivo | Propósito |
|---|---|
| `clarity-2026-11-27.json` | Snapshot válido, status "ok", período 25–27/11/2026, 3 páginas de checkout × 2–3 dispositivos, com `sessions` informado (testa o cálculo de `perSession`) |
| `clarity-2026-11-27-partial.json` | Status "partial", período só do dia 27/11/2026, e **sem** `sessions` em nenhuma página — testa o caso em que `perSession` não pode ser calculado (fica `null`, nunca inventado) |
| `clarity-invalid-example.json` | Deliberadamente inválido (`platform: "app"`) — testa que o carregador rejeita, nunca aceita dado fora do contrato |

## Regra para quando houver um snapshot real (ver `04-validacao/13-plano-ativacao-clarity.md`)

Um snapshot real do Clarity nunca deve ficar neste diretório, nem em `public/`, nem em qualquer
outro caminho servido sem autenticação. Ele precisa vir de um endpoint protegido pela mesma
autenticação corporativa do dashboard (SEG-03) — a troca é só de URL/fetcher em
`src/data/clarity/use-clarity-journey.ts`, nunca do formato validado por `contract.ts`.
