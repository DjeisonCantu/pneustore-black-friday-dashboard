# PneuStore — Black Friday Health Monitor

Aplicação frontend React + TypeScript que implementa o dashboard PneuStore Black Friday Health
Monitor, conforme `01-planejamento/` (Missão 02, maquete visual) e a Missão 04 (integração real
parcial via extração manual).

**Status desta entrega (atualizado 30/10/2026):** o dashboard virou uma **página única** (layout
one-page — ver [Layout one-page](#layout-one-page)), pensada para responder em poucos segundos "como
está a venda, onde o checkout trava, de onde vem a receita e o que vende". Nenhum dado fictício —
todo número vem do GA4 ou do Microsoft Clarity (nunca uma terceira fonte), extraídos
**manualmente** (sem automação de navegador nem API oficial — ver
[Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos)). A fonte principal é o "Resumo
Executivo Pré-Black" — o relatório de UX Research enviado ao CX que motivou a criação deste
dashboard; o bloco "De onde vem a receita" e "O que vende" usam um snapshot mais amplo do Looker
Studio. "Sobre os dados" não é mais uma tela própria — é uma gaveta (Sheet) aberta pelo rodapé.
Nenhuma autenticação corporativa real (SSO) e nenhuma conexão automática com GA4/Clarity foram
implementadas. O dashboard está publicado no GitHub Pages (repositório público, plano gratuito)
atrás de um login simples e deliberadamente não seguro (ver [Login](#login)) — ver
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
2. **Uma página só** (`src/pages/dashboard-page.tsx`), com "Sobre os dados" como gaveta (Sheet) —
   ver [Layout one-page](#layout-one-page).
3. **Componentes reutilizáveis** em `src/components/` (layout, gráficos, estados, UI base).
4. **Camada de dados demonstrativos isolada** em `src/data/mock/`, sem uso pela UI desde 30/10/2026
   — ver seção dedicada abaixo.
5. **Exportação PDF** (folha de estilo de impressão do navegador, `window.print()`) e
   **Markdown** (gerado no navegador a partir dos dados já carregados, sem serviço externo).
6. Este README, com instruções de execução, dependências/licenças e pendências.

## Layout one-page

A página (`src/pages/dashboard-page.tsx`) é montada em blocos, de cima para baixo:

| Bloco | Componente | Conteúdo |
|---|---|---|
| A. Barra de status | `components/dashboard/status-bar.tsx` | Selo de período/fonte por bloco + até 2 alertas derivados automaticamente dos dados (`data/real/dashboard-alerts.ts`) |
| B. KPIs | `components/dashboard/kpi-grid.tsx` | Sessões, conversão, receita, ticket médio (semana atual vs. mesma semana de 2025) |
| C. Onde o checkout trava | `components/dashboard/checkout-friction-block.tsx` | Dead clicks por página (com a etapa crítica em vermelho), rage clicks/quick backs, comparação mobile × desktop 2025 vs 2026 |
| D. De onde vem a receita | `components/dashboard/revenue-by-channel-block.tsx` | Participação por canal (Looker), com a variação colorida |
| E. O que vende | `components/dashboard/top-sellers-block.tsx` | Receita por marca + mini-funil vistos → adicionados* → comprados |
| F. Próximas ações | `components/dashboard/priorities-checklist.tsx` | As prioridades do Resumo Executivo Pré-Black |
| G. Rodapé + "Sobre os dados" | `components/dashboard/about-data-sheet.tsx` | Fontes/períodos numa linha; a gaveta tem glossário, indicadores e limitações completas |

Avisos, limitações e termos técnicos não aparecem no corpo dos cards — ficam num ícone (i) com
tooltip (`components/common/note-tooltip.tsx`) ou na gaveta "Sobre os dados". Os filtros globais de
período/dispositivo/comparação (`hooks/use-filters.ts`, `components/layout/filter-bar.tsx`)
continuam no código mas não aparecem no cabeçalho — nenhuma fonte real atual é filtrável por eles
(todas são de período fixo).

## Estrutura do projeto

```
src/
  types/common.ts          Tipos centrais (filtros, unidades, indicadores)
  data/
    real/                   Dados REAIS (ver "Dados reais embutidos")
    mock/                   Geradores de dados fictícios — sem uso pela UI desde 30/10/2026
    selectors.ts            Resolve período/comparação (ainda usado por hooks/use-filters.ts)
    indicators.ts           Metadados REAIS dos indicadores (definição/unidade/fonte/limitação)
  components/
    ui/                     Primitivos no padrão shadcn/ui (Radix UI + Tailwind, código próprio)
    dashboard/              Os blocos do layout one-page (ver "Layout one-page")
    layout/                 Cabeçalho global, exportação
    common/                 Tooltip de definição/nota livre, estados de card
    charts/                 Wrappers de Recharts (barras simples, barras agrupadas, série temporal)
  pages/                    dashboard-page.tsx — a única tela do produto
  hooks/, state/, lib/      Hooks de filtro/exportação, utilitários
```

## Dados reais embutidos — fontes e períodos

Nenhum dado fictício em lugar nenhum. Três fontes **reais** ficam embutidas no bundle:

| Fonte | Usada em (bloco) | Arquivo | Período | Como foi extraído |
|---|---|---|---|---|
| Resumo Executivo Pré-Black (PDF, UX Research) | B (KPIs), parte de C (mobile × desktop 2025 vs 2026), F (prioridades) | `src/data/real/pre-black-executive-report.ts` | 14/10 a 20/10/2026, comparado com 14/10 a 20/10/2025 | Transcrição manual do relatório `PneuStore_Resumo_Executivo_PreBlack_2026.pdf` — o próprio relatório que motivou este dashboard. GA4 (sessões, conversão, receita estimada) e Clarity (passagem entre etapas, dead clicks, comparação anual) |
| Microsoft Clarity — atrito do checkout | C (dead/rage clicks e quick backs por página) | `src/data/real/clarity-checkout-friction.ts` | 27/10 a 29/10/2026 (3 dias fechados) | Consulta real via `query-analytics-dashboard` (MCP do Clarity), agregada manualmente em `05-atualizacoes-diarias/2026-10-30/clarity-2026-10-27_a_29.json` |
| GA4 / Looker Studio | D (participação por canal), E (receita e funil por marca) | `src/data/real/ga4-real-snapshot.json` (`src/data/real/real-overview.ts`) | 02/10/2026 a 29/10/2026 | Exportação manual em PDF do Looker Studio, processada por `04-validacao/scripts/looker-pdf-cli.mjs` |

`pre-black-executive-report.ts` e `clarity-checkout-friction.ts` são módulos estáticos simples
(sem contrato Zod nem pipeline assíncrono) — são relatórios fechados de um período específico, não
snapshots revalidados a cada atualização diária. `ga4-real-snapshot.json` continua validado em
runtime (Zod, `src/data/providers/schema.ts`) por ser o único embutido como JSON solto. Ver
limitações de cada métrica nos ícones (i) dos cards ou na gaveta "Sobre os dados".

Nenhuma das três fontes é atualizada automaticamente — a atualização é manual (sem job agendado,
conexão de API nem automação de navegador, proibida explicitamente neste projeto): um novo relatório
executivo ou uma nova consulta ao Clarity exigem editar o respectivo arquivo `.ts` à mão; um novo
export do Looker Studio passa por `looker-pdf-cli.mjs` (ver
`04-validacao/19-plano-integracao-via-looker-export.md`).

### Login

Acesso ao site publicado é protegido por um login simples e **deliberadamente não seguro**
(`src/state/auth-context.tsx`, `src/components/auth/login-gate.tsx`): credencial fixa no código-
fonte público, sem servidor de autenticação, sem hashing, sem expiração de sessão além do
`localStorage` do navegador. Serve apenas como um filtro casual — qualquer pessoa com acesso ao
repositório público (plano gratuito do GitHub Pages) vê a credencial e, de qualquer forma, o site
publicado é sempre alcançável publicamente por quem tiver o link, independentemente do login.

## Camada de mock (Missão 02) — não usada mais pela UI

`src/data/mock/`, `src/data/selectors.ts` e os view-models fictícios continuam no repositório como
legado da Missão 02 (maquete visual original), mas **nenhuma tela usa mais esses dados** desde
30/10/2026 — Visão geral, Jornada de compra e Aquisição e produtos foram todas convertidas para
dado real (ver seção anterior). Essa camada só é referenciada hoje por: `src/data/providers/` (o
contrato de schema do GA4, reaproveitado pelo dado real) e o resolvedor de período
(`resolvePeriodRange`, usado pela barra de filtros do cabeçalho para calcular datas). Pode ser
removida por completo numa limpeza futura, se a equipe decidir que não vale a pena mantê-la.

- **Indicadores sem metodologia aprovada não são calculados:** por decisão D-05 (ainda não
  aprovada), o dashboard **não** calcula abandono por etapa nem taxa de passagem no funil — a
  Jornada de compra mostra um estado "Metodologia em validação" no lugar do cálculo (RF-06, RF-07,
  RA-02, RA-03).
- **Categoria de produto:** como o preenchimento de `item_category` não está confirmado (Q-04), o
  ranking de categorias mostra um estado de validação em vez de números.

## Funcionalidades implementadas

- Página única (ver [Layout one-page](#layout-one-page)), sem navegação entre telas — "Sobre os
  dados" abre como gaveta a partir do rodapé.
- Alertas automáticos (ex.: "Carrinho: atrito alto") derivados de limiares simples sobre os dados
  reais (`src/data/real/dashboard-alerts.ts`), nunca escritos à mão.
- Cor nunca é o único indicador: toda variação/criticidade também aparece como texto (+/-, "crítico",
  "acima de 40%") — testado em `src/pages/__tests__/dashboard-page.test.tsx`.
- Exportação PDF (impressão) e Markdown (download local), cobrindo todos os blocos da página.
- Layout responsivo: grade de 12 colunas no desktop (blocos C e D lado a lado); uma coluna no
  mobile, sem scroll horizontal (testado a partir de 375 px).
- A barra de filtros (período/dispositivo) e a camada de mock continuam no código, mas escondidas/
  sem uso — nenhuma fonte real atual é filtrável por elas (todas são de período fixo).

## O que depende de integração real (não implementado nesta missão)

Lista consolidada a partir de `01-planejamento/05-requisitos-tecnicos.md` e
`01-planejamento/07-riscos-pendencias.md`:

| Pendência | Onde fica hoje nesta maquete |
|---|---|
| Conexão com a GA4 Data API (conta de serviço, projeto sem faturamento) | Sem acesso disponível (confirmado pelo responsável) — números transcritos manualmente do Resumo Executivo Pré-Black e de um PDF do Looker Studio, ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos) |
| Conexão com a Data Export API do Clarity (D-12, Q-10) | Sinais de atrito reais: passagem entre etapas e dead clicks por dispositivo (transcritos do Resumo Executivo Pré-Black) + dead/rage clicks e quick backs por página de checkout (consulta real via query-analytics-dashboard) — ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos) |
| Autenticação corporativa via SSO (D-02, SEG-01) | Login simples e não seguro — ver [Login](#login) |
| Job de coleta/snapshots agendados (D-03, INT-04) | Atualização manual (editar os arquivos reais à mão a cada novo relatório/export) |
| Fórmula oficial de conversão (D-04) | GA4_WEEKLY mostra a conversão do relatório (pedidos ÷ sessões, calculada pelo próprio GA4) — ainda não é uma fórmula oficial aprovada para o dashboard em geral |
| Metodologia de jornada/abandono (D-05) | "Abandono por etapa" mostra um aviso de metodologia pendente; a passagem entre etapas do Clarity é "sem sequência validada" (nota do próprio relatório), não uma taxa de abandono |
| Confirmação dos eventos de e-commerce e de `item_category` no stream web (Q-04) | Ranking de categorias fica em "validação"; não há dado real de produtos individuais nesta extração |
| Limite oficial de variação relevante (D-08) e tolerância de reconciliação (D-09) | Não há mais cálculo de variação além das comparações 2025×2026 já prontas no Resumo Executivo Pré-Black |
| Hospedagem definitiva (D-01) | Publicado no GitHub Pages (repositório público, plano gratuito) via `.github/workflows/deploy.yml` — decisão provisória, não uma hospedagem corporativa definitiva |
| Tratamento de tablet (D-06), janela da Black (D-10), frequência de atualização (D-11) | Sem dado real de tablet nas fontes atuais; janela de 14 a 20/10 é a do relatório mais recente, não a da Black Friday em si |

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
execução — todas operam inteiramente no navegador, sobre os dados reais embutidos localmente.

## Critérios de aceite — status nesta missão

- [x] Página única, responsiva em desktop e mobile (sem navegação entre telas).
- [x] Nenhum indicador sem unidade e fonte (ícone ⓘ em cada indicador + rodapé de fonte/período).
- [x] Nenhum dado fictício em lugar nenhum do dashboard (atualização de 30/10/2026) — todo número
      vem do GA4 ou do Clarity, nunca de `src/data/mock/`.
- [x] Nenhuma chamada a API externa de analytics.
- [x] Nenhuma dependência de serviço pago.
- [x] Deploy realizado no GitHub Pages (atualização de 30/10/2026) — ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos).
