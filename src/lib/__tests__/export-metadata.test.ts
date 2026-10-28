// Teste de exportação Markdown (Missão 04 — Etapa B2). A exportação PDF usa
// window.print() do navegador e depende de inspeção visual manual — não é
// automatizável neste conjunto de testes (registrado no relatório da missão).

import { describe, expect, it } from 'vitest'
import { buildExportHeader } from '../export-metadata'
import type { Filters } from '@/types/common'

const filters: Filters = {
  period: '7dias',
  customRange: null,
  device: 'desktop',
  comparison: 'periodo-anterior',
}

describe('buildExportHeader — metadados obrigatórios da exportação (RF-18)', () => {
  const markdown = buildExportHeader('Visão geral', filters)

  it('marca claramente os dados como fictícios', () => {
    expect(markdown).toContain('DADOS FICTÍCIOS')
  })

  it('inclui período, dispositivo, comparação, fonte e data de extração', () => {
    expect(markdown).toMatch(/\*\*Período:\*\*/)
    expect(markdown).toContain('Dispositivo:** Desktop')
    expect(markdown).toMatch(/\*\*Comparação:\*\*/)
    expect(markdown).toMatch(/\*\*Fontes:\*\*.*GA4/)
    expect(markdown).toMatch(/\*\*Data de extração/)
  })

  it('nunca mistura o rótulo de dispositivo "Todos" quando um dispositivo específico foi filtrado', () => {
    expect(markdown).not.toContain('Dispositivo:** Todos')
  })
})
