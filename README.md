# PneuStore — Black Friday Health Monitor (Missão 02 · Maquete visual)

Aplicação frontend React + TypeScript que implementa a **primeira versão visual e navegável** do
dashboard PneuStore Black Friday Health Monitor, conforme `01-planejamento/` e a Missão 02.

**Status desta entrega:** construção visual com dados demonstrativos. Nenhuma integração real
(GA4, Clarity, SSO), nenhuma autenticação em produção e nenhum deploy foram realizados — ver
[Pendências para a integração real](#pendências-para-a-integração-real).

## Como executar localmente

Pré-requisitos: Node.js 20+ e npm.

```bash
cd 03-desenvolvimento/dashboard
npm install
npm run dev
```

Abra o endereço impresso no terminal (por padrão `http://localhost:5173`). A aplicação é 100%
estática no navegador — não há backend, banco de dados ou chamada de rede para serviços externos.

Outros comandos úteis:

```bash
npm run build     # build de produção (tsc + vite build) em dist/
npm run preview   # serve o build de produção localmente, para conferência
npm run lint      # oxlint
npm run test      # vitest — testes da camada de dados (filtros, contratos, falhas do provedor)
```

## Identidade visual aplicada (28/10/2026)

A UI foi revisada para seguir a identidade da PneuStore e um acabamento "estilo Apple"
(superfícies translúcidas, hierarquia tipográfica enxuta, cantos arredondados, transições sutis),
a partir de dois materiais fornecidos em `DS PNEUSTORE/` (logos + `design-system-pneustore.md`):

- **Cor primária (`#4e008e`)** foi **amostrada diretamente** do PNG da logo
  (`PneustorePURPLE.png` / `CantuPURPLE.png`), não estimada visualmente. A escala completa
  (hover/active/soft/borda) e os tons de Success/Warning/Info/Error/Control foram **derivados**
  desse roxo e de convenções comuns de design system, pois o `.md` de referência não trouxe
  valores HEX exatos (ele mesmo marca isso como pendência). Tratar a escala derivada como
  provisória até a equipe de Design validar o arquivo original do Design System.
- **Cor "fictício" (`#0f7c8f`, teal)** é uma adição própria desta implementação, fora da paleta de
  marca, para que o selo "DADOS FICTÍCIOS" nunca seja confundido com a cor primária (agora roxa)
  nem com os estados semânticos.
- **Tipografia:** família e escala de tamanhos (Base 14/22, SM 12/20, LG 16/24, Heading 1–5)
  seguem exatamente o `.md` de referência (`src/index.css`, tokens `--text-ds-*`). A fonte
  **SF Pro Text não é distribuída como arquivo** (ver nota de licenciamento no `.md`) — a pilha
  usa fontes de sistema da Apple (`-apple-system, BlinkMacSystemFont…`), que resolve para San
  Francisco automaticamente em dispositivos Apple, sem baixar nenhum arquivo de fonte.
- **Logo:** o ícone da PneuStore (recortado da logo horizontal fornecida) substitui o selo
  genérico no cabeçalho; os arquivos originais (horizontal, vertical, roxo e branco) ficam em
  `src/assets/brand/` para uso futuro (ex.: página de login real, cabeçalho de PDF).
- **Modo claro/escuro:** adicionado um alternador no cabeçalho (claro/escuro/sistema, persistido
  no navegador) para cobrir a distinção de tema que o `.md` documenta nos grupos Error e Control.
  Isso é uma extensão desta missão, não um pedido explícito do Design System original — pode ser
  removido se a equipe de Design preferir um único tema.

**Pendências herdadas do `design-system-pneustore.md`** (ver sua seção 5): confirmar nomes/HEX
exatos de cada variável junto à equipe de Design, confirmar se as capturas refletem a versão
vigente do Design System, e validar o licenciamento da SF Pro Text antes de qualquer uso além da
pilha de fontes do sistema.

> Use `npm run dev` ou `npm run preview` para navegar entre as telas — ambos servem a aplicação
> como SPA. Abrir `dist/index.html` diretamente pelo sistema de arquivos (`file://`) **não**
> funciona para rotas além da inicial, pois o roteamento do React Router depende de um servidor.

## O que esta missão entrega

1. **Aplicação executável localmente** — `03-desenvolvimento/dashboard/` (este diretório).
2. **Três áreas + "Sobre os dados"**, navegáveis por barra lateral (desktop) ou abas (mobile):
   Visão geral, Jornada de compra, Aquisição e produtos, Sobre os dados.
3. **Componentes reutilizáveis** em `src/components/` (layout, gráficos, estados, UI base).
4. **Camada de dados demonstrativos isolada** em `src/data/mock/` — ver seção dedicada abaixo.
5. **Exportação PDF** (folha de estilo de impressão do navegador, `window.print()`) e
   **Markdown** (gerado no navegador a partir dos dados já carregados, sem serviço externo).
6. Este README, com instruções de execução, dependências/licenças e pendências.

## Estrutura do projeto

```
src/
  types/common.ts          Tipos centrais (filtros, unidades, indicadores)
  data/
    mock/                  Geradores de dados FICTÍCIOS (ver seção "Dados demonstrativos")
    selectors.ts            Resolve período/comparação e agrega os dados fictícios por filtro
    view-models/            Monta o modelo de cada tela a partir dos seletores
    indicators.ts           Metadados REAIS dos indicadores (definição/unidade/fonte/limitação)
  components/
    ui/                     Primitivos no padrão shadcn/ui (Radix UI + Tailwind, código próprio)
    layout/                 Cabeçalho global, navegação, filtros, exportação
    common/                 KPI card, tooltip de definição, badges de estado/variação
    charts/                 Wrappers de Recharts (série temporal, barras, ranking)
  pages/                    As 4 telas do produto
  hooks/, state/, lib/      Hooks de filtro/exportação, contexto de cenário de demo, utilitários
```

## Dados demonstrativos — isolamento e regras seguidas

Toda a camada de dados fica em `src/data/mock/`, claramente separada do restante da aplicação, e
segue as regras obrigatórias do planejamento:

- **RA-06 (não misturar dado real com fictício):** nenhum valor exibido vem dos PDFs em
  `00-referencias/`. Nomes de marca/produto também são inventados (`TrilhaMax`, `ViaPneu` etc.) —
  propositalmente diferentes dos nomes citados no relatório de referência.
- **Marca d'água permanente:** uma faixa fixa "DADOS FICTÍCIOS" aparece no topo de toda tela
  (`src/components/common/fictitious-banner.tsx`) e nos arquivos exportados.
- **Filtros afetam os dados, não só a aparência:** período, dispositivo e comparação são
  resolvidos em `src/data/selectors.ts` e realmente recortam/agregam a série diária gerada —
  troque o período ou o dispositivo e os números mudam de verdade.
- **Geração determinística:** um PRNG com semente (`src/data/mock/seed.ts`) garante que os mesmos
  filtros sempre produzam os mesmos números (útil para conferência e capturas de tela), sem serem
  números fixos "decorativos".
- **Indicadores sem metodologia aprovada não são calculados:** por decisão D-05 (ainda não
  aprovada), o dashboard **não** calcula abandono por etapa nem taxa de passagem no funil — a
  Jornada de compra mostra apenas volumes por etapa, com unidade explícita, e um estado
  "Metodologia em validação" no lugar do cálculo (RF-06, RF-07, RA-02, RA-03).
- **Categoria de produto:** como o preenchimento de `item_category` não está confirmado (Q-04), o
  ranking de categorias mostra um estado de validação em vez de números.
- **Sinais do Clarity:** são um "espaço reservado" (RF-09) com dados ilustrativos, claramente
  identificado como pendente de integração real (D-12/Q-10) — nunca comparado com o GA4 (RA-07).
- **Data de referência da maquete:** o dataset fictício usa 27/11/2026 (a própria Black Friday)
  como "hoje", para permitir demonstrar os presets "Hoje" e "Semana da Black" e as comparações
  anuais sem depender da data real do computador.

## Funcionalidades implementadas

- Navegação entre as 4 áreas, com filtros persistidos na URL (compartilháveis).
- Filtros de período (presets + personalizado), dispositivo e comparação (período anterior /
  mesmo período de 2025, alinhado por dia da semana conforme D-07).
- Gráficos interativos (Recharts): série temporal com seleção de métrica e granularidade
  diária/horária automática, barras por dispositivo, barras horizontais de canal.
- Tabelas ordenadas, com top 10/20 + busca (produtos) e "ver todos" (origem/mídia).
- Estados de componente: carregando (esqueleto), sem dados, fonte indisponível e em validação —
  veja o seletor "Cenário" no cabeçalho (exclusivo desta maquete) para alternar entre eles sem
  esperar um cenário real acontecer.
- Exportação PDF (impressão) e Markdown (download local), ambas com filtros, período, fontes,
  data de extração e notas de limitação, para todas as 4 telas.
- Layout responsivo: barra lateral fixa + grade de 12 colunas no desktop; abas no topo + cartões
  em 2 colunas no mobile (testado a partir de 375 px).

## O que depende de integração real (não implementado nesta missão)

Lista consolidada a partir de `01-planejamento/05-requisitos-tecnicos.md` e
`01-planejamento/07-riscos-pendencias.md`:

| Pendência | Onde fica hoje nesta maquete |
|---|---|
| Conexão com a GA4 Data API (conta de serviço, projeto sem faturamento) | Todos os números vêm de `src/data/mock/` |
| Conexão com a Data Export API do Clarity (D-12, Q-10) | "Sinais de atrito" mostra um espaço reservado com dados ilustrativos |
| Autenticação corporativa via SSO (D-02, SEG-01) | Cabeçalho mostra uma "Conta corporativa (simulada)" sem login real — ver `src/components/layout/user-menu.tsx` |
| Job de coleta/snapshots agendados (D-03, INT-04) | Dados gerados em memória no navegador a cada carregamento |
| Fórmula oficial de conversão (D-04) e metodologia de jornada/abandono (D-05) | Fórmula "pedidos ÷ sessões" usada como exemplo; abandono não é calculado |
| Confirmação dos eventos de e-commerce e de `item_category` no stream web (Q-04) | Ranking de categorias fica em "validação"; volumes de carrinho/checkout são ilustrativos |
| Limite oficial de variação relevante (D-08) e tolerância de reconciliação (D-09) | Usa ±15% como exemplo, sinalizado como pendente de aprovação |
| Hospedagem definitiva (D-01) | Executar apenas localmente (`npm run dev` / `npm run preview`) |
| Tratamento de tablet (D-06), janela da Black (D-10), frequência de atualização (D-11) | Tablet tratado como categoria própria; janela 24/11–01/12 usada como exemplo |

## Dependências e licenças

Apenas bibliotecas open source com licença permissiva, sem serviços pagos ou dependências de
nuvem (CUS-02, CUS-03, CUS-04).

| Pacote | Versão | Licença | Uso |
|---|---|---|---|
| react, react-dom | 19.3.1 | MIT | Biblioteca de UI |
| react-router-dom | 7.18.4 | MIT | Roteamento client-side e estado de filtros na URL |
| typescript | 7.0.2 | Apache-2.0 | Tipagem estática |
| vite, @vitejs/plugin-react | 8.3.5 / 6.1.2 | MIT | Build e dev server |
| tailwindcss, @tailwindcss/vite | 4.3.3 | MIT | Estilos utilitários |
| @radix-ui/react-* (dialog, dropdown-menu, label, select, separator, slot, tabs, tooltip) | ~1.x/2.x | MIT | Primitivos acessíveis sob os componentes de UI (padrão shadcn/ui) |
| class-variance-authority | 0.7.1 | Apache-2.0 | Variantes de estilo dos componentes de UI |
| clsx, tailwind-merge | 2.1.1 / 3.7.0 | MIT | Composição de classes utilitárias |
| lucide-react | 1.62.0 | ISC | Ícones |
| recharts | 3.10.1 | MIT | Gráficos (linha e barras) |
| zod | 4.6.7 | MIT | Validação dos contratos de snapshot (Missão 04 — Etapa B2); não entra no bundle de produção (só usado por `providers/schema.ts`/`test-provider.ts` e pelos testes) |
| oxlint | 1.90.0 | MIT | Lint |
| vitest | 5.0.5 | MIT | Testes automatizados da camada de dados (dependência de desenvolvimento, não entra no bundle) |

Nenhuma dependência faz chamada de rede para analytics ou serviços de terceiros em tempo de
execução — todas operam inteiramente no navegador, sobre os dados fictícios locais.

## Critérios de aceite — status nesta missão

- [x] Interface navegável em desktop e mobile.
- [x] Filtros funcionais (afetam os dados exibidos, não só a aparência).
- [x] Gráficos e tabelas coerentes com os dados demonstrativos (mesma base agregada).
- [x] Nenhum indicador sem unidade e fonte (ícone ⓘ em cada indicador + rodapé de fonte/período).
- [x] Nenhum dado fictício apresentado como real (faixa fixa + rótulo nas exportações).
- [x] Nenhuma chamada a API externa de analytics.
- [x] Nenhuma dependência de serviço pago.
- [x] Nenhum deploy realizado.
