# PneuStore — Black Friday Health Monitor

Aplicação frontend React + TypeScript que implementa o dashboard PneuStore Black Friday Health
Monitor, conforme `01-planejamento/` (Missão 02, maquete visual) e a Missão 04 (integração real
parcial via extração manual).

**Status desta entrega (atualizado 30/10/2026):** o dashboard não mostra mais nenhum dado
fictício — todo número vem do GA4 ou do Microsoft Clarity (nunca uma terceira fonte), extraídos
**manualmente** (sem automação de navegador nem API oficial — ver
[Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos)). A fonte principal da Visão
geral e da Jornada de compra é o "Resumo Executivo Pré-Black" — o relatório de UX Research enviado
ao CX que motivou a criação deste dashboard; "Aquisição e produtos" usa um snapshot mais amplo do
Looker Studio só para canal/marca. Nenhuma autenticação corporativa real (SSO) e nenhuma conexão
automática com GA4/Clarity foram implementadas. O dashboard está publicado no GitHub Pages
(repositório público, plano gratuito) atrás de um login simples e deliberadamente não seguro (ver
[Login](#login)) — ver [Pendências para a integração real](#pendências-para-a-integração-real).

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

## Dados reais embutidos — fontes e períodos

Desde 30/10/2026 o dashboard não mostra mais nenhum dado fictício. Duas fontes **reais** ficam
embutidas no bundle, ambas exibidas com o selo verde "REAL":

| Fonte | Usada em | Arquivo | Período | Como foi extraído |
|---|---|---|---|---|
| Resumo Executivo Pré-Black (PDF, UX Research) | Visão geral, Jornada de compra | `src/data/real/pre-black-executive-report.ts` | 14/10 a 20/10/2026, comparado com 14/10 a 20/10/2025 | Transcrição manual do relatório `PneuStore_Resumo_Executivo_PreBlack_2026.pdf` — o próprio relatório que motivou este dashboard. GA4 (sessões, conversão, receita estimada) e Clarity (passagem entre etapas, dead clicks, comparação anual) |
| GA4 / Looker Studio | Aquisição e produtos (canal/marca) | `src/data/real/ga4-real-snapshot.json` (`src/data/real/real-overview.ts`) | 02/10/2026 a 29/10/2026 | Exportação manual em PDF do Looker Studio, processada por `04-validacao/scripts/looker-pdf-cli.mjs` |

O "Resumo Executivo Pré-Black" é um módulo estático simples (sem contrato Zod nem pipeline
assíncrono) — é um relatório fechado de uma semana específica, não um snapshot revalidado a cada
atualização diária. Ver limitações de cada métrica diretamente nos painéis ou em "Sobre os dados".

Nenhuma das duas fontes é atualizada automaticamente — a atualização é manual (sem job agendado,
conexão de API nem automação de navegador, proibida explicitamente neste projeto): um novo PDF do
relatório executivo exige editar `pre-black-executive-report.ts` à mão; um novo export do Looker
Studio passa por `looker-pdf-cli.mjs` (ver `04-validacao/19-plano-integracao-via-looker-export.md`).

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

- Navegação entre as 4 áreas (Visão geral, Jornada de compra, Aquisição e produtos, Sobre os
  dados). A barra de filtros (período/dispositivo) do cabeçalho ainda existe na interface, mas não
  afeta nenhuma das fontes reais atuais — todas são de período fixo (ver tabela acima). Candidata a
  simplificação futura.
- Tabelas com top 10 + "ver todos" (canais) em Aquisição e produtos.
- Estados de componente: sem dados, fonte indisponível e em validação —
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
| Conexão com a GA4 Data API (conta de serviço, projeto sem faturamento) | Sem acesso disponível (confirmado pelo responsável) — números transcritos manualmente do Resumo Executivo Pré-Black e de um PDF do Looker Studio, ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos) |
| Conexão com a Data Export API do Clarity (D-12, Q-10) | Sinais de atrito reais, transcritos manualmente do Resumo Executivo Pré-Black (passagem entre etapas e dead clicks, por dispositivo) — ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos) |
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
execução — todas operam inteiramente no navegador, sobre os dados fictícios locais.

## Critérios de aceite — status nesta missão

- [x] Interface navegável em desktop e mobile.
- [x] Nenhum indicador sem unidade e fonte (ícone ⓘ em cada indicador + rodapé de fonte/período).
- [x] Nenhum dado fictício em lugar nenhum do dashboard (atualização de 30/10/2026) — todo número
      vem do GA4 ou do Clarity, nunca de `src/data/mock/`.
- [x] Nenhuma chamada a API externa de analytics.
- [x] Nenhuma dependência de serviço pago.
- [x] Deploy realizado no GitHub Pages (atualização de 30/10/2026) — ver [Dados reais embutidos](#dados-reais-embutidos--fontes-e-períodos).
