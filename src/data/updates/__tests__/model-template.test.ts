// O modelo em docs/modelo-atualizacao.md é o que se entrega a quem prepara uma
// atualização: ele não pode ficar para trás do que o parser aceita.

import { describe, expect, it } from 'vitest'
import template from '../../../../docs/modelo-atualizacao.md?raw'
import { SECTION_DEFS, findSectionDef, isLimitationsHeading } from '../model'

const headings = [...template.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim())

describe('docs/modelo-atualizacao.md', () => {
  it('traz TODAS as seções do modelo, na ordem do modelo, mais «Limitações»', () => {
    const sectionHeadings = headings.filter((h) => !isLimitationsHeading(h))
    expect(sectionHeadings).toEqual(SECTION_DEFS.map((def) => def.heading))
    expect(headings.some(isLimitationsHeading)).toBe(true)
  })

  it('cada título do modelo é reconhecido pelo parser', () => {
    for (const heading of headings.filter((h) => !isLimitationsHeading(h))) expect(findSectionDef(heading)).toBeDefined()
  })

  it('cada tabela do modelo usa exatamente as colunas que o parser espera', () => {
    for (const def of SECTION_DEFS.filter((d) => d.kind === 'table')) {
      const start = template.indexOf(`## ${def.heading}`)
      const block = template.slice(start, template.indexOf('\n## ', start + 1) === -1 ? undefined : template.indexOf('\n## ', start + 1))
      const header = block.split('\n').find((line) => line.startsWith('|'))!
      const cells = header.split('|').slice(1, -1).map((cell) => cell.trim())
      expect(cells).toEqual([...def.columns])
    }
  })
})
