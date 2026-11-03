// Construtores de arquivos .md e de ParsedUpdate para os testes.

import { formatIssue, type ParsedUpdate } from '../types'
import { parseUpdateMd } from '../parse-update-md'

export function front(geradoEm = '2026-11-03'): string {
  return ['---', 'tipo: atualizacao-dashboard', 'versao_modelo: 1', `gerado_em: ${geradoEm}`, '---', ''].join('\n')
}

export function resumoSection(periodo: string, sessoes: number, extra = ''): string {
  const lines = ['## Looker — resumo do site', 'fonte: looker-pdf', `periodo: ${periodo}`, '', '| metrica | valor | precisao |', '|---|---|---|', `| sessoes | ${sessoes} | exato |`]
  return (extra ? [...lines, '', extra] : lines).join('\n')
}

export function canaisSection(periodo: string, cpc: number, variacao: number): string {
  return ['## Looker — canais', 'fonte: looker-pdf', `periodo: ${periodo}`, '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', `| CPC | ${cpc} | ${variacao} |`].join('\n')
}

export function checkoutSection(periodo: string, deadClicks: number, extra = ''): string {
  const lines = ['## Clarity — checkout', 'fonte: clarity', `periodo: ${periodo}`, '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', `| /checkout/v2/cart | ${deadClicks} | 10 | 5 |`]
  return (extra ? [...lines, '', extra] : lines).join('\n')
}

export function limitations(...bullets: string[]): string {
  return ['## Limitações', ...bullets.map((b) => `- ${b}`)].join('\n')
}

export function mdFile(blocks: string[], geradoEm?: string): string {
  return `${front(geradoEm)}\n${blocks.join('\n\n')}\n`
}

export function parsed(id: string, blocks: string[], geradoEm?: string): ParsedUpdate {
  const result = parseUpdateMd(mdFile(blocks, geradoEm))
  if (!result.ok) throw new Error(`fixture inválida (${id}):\n${result.issues.map(formatIssue).join('\n')}`)
  return { id, ...result.update }
}
