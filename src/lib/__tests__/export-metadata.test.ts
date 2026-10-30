// Teste de exportação Markdown — atualizado em 30/10/2026: o cabeçalho
// fictício (buildExportHeader) foi removido junto com todo o resto do dado
// fictício do app. buildRealExportHeader é o único cabeçalho de exportação
// agora, usado por todas as páginas.

import { describe, expect, it } from 'vitest'
import { buildRealExportHeader } from '../export-metadata'

describe('buildRealExportHeader', () => {
  const markdown = buildRealExportHeader('Visão geral')

  it('nunca afirma que os dados são fictícios', () => {
    expect(markdown).not.toContain('FICTÍCIO')
  })

  it('identifica os dados como reais e aponta para "Sobre os dados"', () => {
    expect(markdown).toContain('DADOS REAIS')
    expect(markdown).toContain('Sobre os dados')
  })

  it('usa o título da página recebido', () => {
    expect(markdown).toContain('# Visão geral — PneuStore · Site')
  })
})
