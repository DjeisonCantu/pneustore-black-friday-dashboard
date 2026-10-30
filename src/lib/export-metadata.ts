// Atualização de 30/10/2026: a antiga buildExportHeader (filtros + rótulo
// fixo "DADOS FICTÍCIOS") foi removida — nenhuma página usa mais dados
// fictícios, então um cabeçalho que afirma isso categoricamente deixou de
// ser verdade. buildRealExportHeader é o único cabeçalho de exportação
// agora, usado por todas as páginas (Visão geral, Jornada de compra,
// Aquisição e produtos).
export function buildRealExportHeader(pageTitle: string): string {
  return [
    `# ${pageTitle} — PneuStore · Site`,
    '',
    '> **DADOS REAIS** — extração manual (Looker Studio e/ou Microsoft Clarity), sem automação de navegador nem acesso à API oficial. Ver "Sobre os dados" para fontes, períodos e limitações completas de cada extração.',
    '',
    '---',
    '',
  ].join('\n')
}
