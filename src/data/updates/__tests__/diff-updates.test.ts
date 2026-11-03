import { describe, expect, it } from 'vitest'
import { diffUpdate, summarizeUpdatePeriods } from '../diff-updates'
import { mergeUpdates } from '../merge-updates'
import { canaisSection, checkoutSection, parsed, resumoSection } from './helpers'

const baseline = parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1635826), canaisSection('2026-10-02..2026-10-29', 43.45, -11.2), checkoutSection('2026-10-27..2026-10-29', 10129)])
const current = mergeUpdates([baseline])

function blockOf(diff: ReturnType<typeof diffUpdate>, key: string) {
  return diff.blocks.find((block) => block.key === key)!
}

describe('diffUpdate — prévia bloco a bloco', () => {
  it('seção enviada com dado novo: «atualiza», período antigo → novo e números antes → depois', () => {
    const incoming = parsed('(prévia)', [checkoutSection('2026-10-31..2026-11-02', 5910)])
    const block = blockOf(diffUpdate(current, incoming), 'clarity.checkout')
    expect(block.status).toBe('atualiza')
    expect(block.oldPeriod).toEqual({ from: '2026-10-27', to: '2026-10-29' })
    expect(block.newPeriod).toEqual({ from: '2026-10-31', to: '2026-11-02' })
    expect(block.changes).toContainEqual({ label: 'Carrinho · dead clicks', before: '10.129', after: '5.910' })
  })

  it('seção idêntica ao que já está vigente: «continua igual»', () => {
    const incoming = parsed('(prévia)', [resumoSection('2026-10-02..2026-10-29', 1635826)])
    expect(blockOf(diffUpdate(current, incoming), 'looker.resumo').status).toBe('igual')
  })

  it('seção que ainda não existia: «novo»', () => {
    const incoming = parsed('(prévia)', [checkoutSection('2026-10-31..2026-11-02', 5910)])
    const onlyResumo = mergeUpdates([parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1)])])
    expect(blockOf(diffUpdate(onlyResumo, incoming), 'clarity.checkout').status).toBe('novo')
  })

  it('seção que não vem no arquivo: «ausente» (mantém o dado atual, que aparece com o período vigente)', () => {
    const incoming = parsed('(prévia)', [checkoutSection('2026-10-31..2026-11-02', 5910)])
    const block = blockOf(diffUpdate(current, incoming), 'looker.canais')
    expect(block.status).toBe('ausente')
    expect(block.oldPeriod).toEqual({ from: '2026-10-02', to: '2026-10-29' })
  })

  it('lista TODAS as seções do modelo, na ordem do modelo', () => {
    const diff = diffUpdate(current, parsed('(prévia)', [resumoSection('2026-10-06..2026-11-02', 1)]))
    expect(diff.blocks).toHaveLength(13)
    expect(diff.blocks[0].key).toBe('looker.resumo')
  })

  it('avisa quando o período novo é MAIS ANTIGO que o atual', () => {
    const incoming = parsed('(prévia)', [checkoutSection('2026-10-20..2026-10-22', 5000)])
    const block = blockOf(diffUpdate(current, incoming), 'clarity.checkout')
    expect(block.warnings.some((w) => w.level === 'aviso' && w.message.includes('termina antes do atual'))).toBe(true)
    expect(diffUpdate(current, incoming).hasWarnings).toBe(true)
  })

  it('avisa (info) quando os períodos se sobrepõem — sem tratar como erro', () => {
    const incoming = parsed('(prévia)', [resumoSection('2026-10-06..2026-11-02', 1582478)])
    const diff = diffUpdate(current, incoming)
    const block = blockOf(diff, 'looker.resumo')
    expect(block.warnings).toEqual([expect.objectContaining({ level: 'info', message: expect.stringContaining('se sobrepõem') })])
    expect(diff.hasWarnings).toBe(false)
  })

  it('sem sobreposição e período mais novo: nenhum aviso', () => {
    const incoming = parsed('(prévia)', [checkoutSection('2026-10-31..2026-11-02', 5910)])
    expect(blockOf(diffUpdate(current, incoming), 'clarity.checkout').warnings).toEqual([])
  })

  it('mesmo período com números diferentes: info de possível correção', () => {
    const incoming = parsed('(prévia)', [resumoSection('2026-10-02..2026-10-29', 999)])
    expect(blockOf(diffUpdate(current, incoming), 'looker.resumo').warnings[0].message).toContain('Mesmo período')
  })

  it('mesmos números mas texto/limitações diferentes: «atualiza» sem mudanças de número', () => {
    const incoming = parsed('(prévia)', [resumoSection('2026-10-02..2026-10-29', 1635826, 'nota: Nova nota.')])
    const block = blockOf(diffUpdate(current, incoming), 'looker.resumo')
    expect(block.status).toBe('atualiza')
    expect(block.changes).toEqual([])
    expect(block.textChanged).toBe(true)
  })

  it('hasChanges só é verdadeiro quando algum bloco muda', () => {
    expect(diffUpdate(current, parsed('(prévia)', [resumoSection('2026-10-02..2026-10-29', 1635826)])).hasChanges).toBe(false)
    expect(diffUpdate(current, parsed('(prévia)', [resumoSection('2026-10-06..2026-11-02', 1)])).hasChanges).toBe(true)
  })
})

describe('summarizeUpdatePeriods', () => {
  it('agrupa por fonte e junta períodos diferentes da mesma fonte', () => {
    const update = parsed('(prévia)', [
      resumoSection('2026-10-06..2026-11-02', 1),
      ['## Looker — marcas', 'fonte: looker-pdf', 'periodo: 2026-11-01..2026-11-02', '', '| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |', '|---|---|---|---|---|', '| Itaro | 1 | 1 | 1 | 1 |'].join('\n'),
      checkoutSection('2026-10-31..2026-11-02', 1),
    ])
    expect(summarizeUpdatePeriods(update)).toBe('Looker 06/10–02/11 e 01–02/11; Clarity 31/10–02/11')
  })
})
