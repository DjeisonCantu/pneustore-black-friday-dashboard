import { describe, expect, it } from 'vitest'
import { UpdatesBuildError, checkUpdateFileName, loadUpdates } from '../load-updates'
import { checkoutSection, mdFile, resumoSection } from './helpers'

const valid = (periodo = '2026-10-06..2026-11-02', sessoes = 1) => mdFile([resumoSection(periodo, sessoes)])

describe('checkUpdateFileName', () => {
  it.each(['0000-baseline.md', '2026-11-03-1530.md', '2026-11-03-1530-2.md', '2026-11-03-1530-12.md'])('aceita %s', (name) => {
    expect(checkUpdateFileName(name)).toBeNull()
  })

  it.each([
    ['README.md', 'fora do padrão'],
    ['2026-11-03.md', 'fora do padrão'],
    ['2026-11-03-1530.txt', 'só arquivos .md'],
    ['2026-02-30-1530.md', 'inválida'],
    ['2026-11-03-2560.md', 'inválida'],
    ['0001-baseline.md', 'fora do padrão'],
  ])('recusa %s', (name, reason) => {
    expect(checkUpdateFileName(name)).toContain(reason)
  })
})

describe('loadUpdates', () => {
  it('lê os arquivos em ordem de nome e define o id sem ".md"', () => {
    const updates = loadUpdates([
      { name: '2026-11-03-1530.md', text: valid() },
      { name: '0000-baseline.md', text: valid('2026-10-02..2026-10-29', 5) },
    ])
    expect(updates.map((u) => u.id)).toEqual(['0000-baseline', '2026-11-03-1530'])
  })

  it('QUALQUER arquivo inválido derruba tudo, com o nome do arquivo, a seção e a linha', () => {
    const bad = mdFile([checkoutSection('2026-10-31..2026-11-02', 5910).replace('5910', '5.910')])
    expect(() => loadUpdates([{ name: '0000-baseline.md', text: valid() }, { name: '2026-11-03-1530.md', text: bad }])).toThrow(UpdatesBuildError)
    try {
      loadUpdates([{ name: '0000-baseline.md', text: valid() }, { name: '2026-11-03-1530.md', text: bad }])
    } catch (error) {
      const message = (error as Error).message
      expect(message).toContain('data/updates/2026-11-03-1530.md')
      expect(message).toContain('Seção «Clarity — checkout»')
      expect(message).toContain('linha')
      expect(message).toContain('dead_clicks')
      expect(message).not.toContain('0000-baseline.md —')
    }
  })

  it('junta os problemas de vários arquivos numa mensagem só', () => {
    try {
      loadUpdates([
        { name: 'README.md', text: '' },
        { name: '2026-11-03-1530.md', text: 'sem cabeçalho' },
      ])
      throw new Error('deveria ter falhado')
    } catch (error) {
      const message = (error as Error).message
      expect(message).toContain('README.md')
      expect(message).toContain('2026-11-03-1530.md')
      expect(message).toContain('o build foi interrompido')
    }
  })

  it('pasta vazia é válida (nenhuma atualização)', () => {
    expect(loadUpdates([])).toEqual([])
  })
})
