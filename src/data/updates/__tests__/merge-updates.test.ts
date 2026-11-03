import { describe, expect, it } from 'vitest'
import { compareUpdateIds, mergeUpdates } from '../merge-updates'
import { canaisSection, checkoutSection, limitations, parsed, resumoSection } from './helpers'

describe('compareUpdateIds', () => {
  it('ordena por nome: baseline primeiro, depois data/hora; o sufixo -2 vem DEPOIS do original', () => {
    const ids = ['2026-11-03-1530-2', '2026-11-03-1530', '0000-baseline', '2026-11-04-0900', '2026-11-03-0800']
    expect([...ids].sort(compareUpdateIds)).toEqual(['0000-baseline', '2026-11-03-0800', '2026-11-03-1530', '2026-11-03-1530-2', '2026-11-04-0900'])
  })

  it('ignora a extensão .md na comparação', () => {
    expect(compareUpdateIds('2026-11-03-1530.md', '2026-11-03-1530-2.md')).toBeLessThan(0)
  })
})

describe('mergeUpdates — a seção mais recente vale', () => {
  it('a atualização mais nova substitui a seção anterior', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1635826)]),
      parsed('2026-11-03-1530', [resumoSection('2026-10-06..2026-11-02', 1582478)]),
    ])
    const current = merged.current['looker.resumo']
    expect(current?.updateId).toBe('2026-11-03-1530')
    expect(current?.section.periodo).toEqual({ from: '2026-10-06', to: '2026-11-02' })
    expect(current?.section.data.sessoes?.value).toBe(1582478)
  })

  it('não depende da ordem em que os arquivos chegam — vale a ordem do NOME', () => {
    const baseline = parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1)])
    const newer = parsed('2026-11-03-1530', [resumoSection('2026-10-06..2026-11-02', 2)])
    expect(mergeUpdates([newer, baseline]).current['looker.resumo']?.section.data.sessoes?.value).toBe(2)
    expect(mergeUpdates([baseline, newer]).current['looker.resumo']?.section.data.sessoes?.value).toBe(2)
  })

  it('o sufixo -2 vale mais que o arquivo original do mesmo minuto', () => {
    const merged = mergeUpdates([
      parsed('2026-11-03-1530-2', [resumoSection('2026-10-06..2026-11-02', 20)]),
      parsed('2026-11-03-1530', [resumoSection('2026-10-06..2026-11-02', 10)]),
    ])
    expect(merged.current['looker.resumo']?.section.data.sessoes?.value).toBe(20)
  })
})

describe('mergeUpdates — arquivo parcial nunca apaga nada', () => {
  const baseline = parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1635826), canaisSection('2026-10-02..2026-10-29', 43.45, -11.2), checkoutSection('2026-10-27..2026-10-29', 10129)])
  const partial = parsed('2026-11-03-1530', [checkoutSection('2026-10-31..2026-11-02', 5910)])

  it('seção ausente mantém a anterior, com o próprio período', () => {
    const merged = mergeUpdates([baseline, partial])
    expect(merged.current['looker.resumo']?.updateId).toBe('0000-baseline')
    expect(merged.current['looker.resumo']?.section.periodo).toEqual({ from: '2026-10-02', to: '2026-10-29' })
    expect(merged.current['looker.canais']?.updateId).toBe('0000-baseline')
  })

  it('só a seção enviada é trocada', () => {
    const merged = mergeUpdates([baseline, partial])
    expect(merged.current['clarity.checkout']?.updateId).toBe('2026-11-03-1530')
    expect(merged.current['clarity.checkout']?.section.periodo).toEqual({ from: '2026-10-31', to: '2026-11-02' })
  })

  it('cada bloco guarda o próprio período — blocos de datas diferentes convivem', () => {
    const merged = mergeUpdates([baseline, partial])
    const periods = new Set(Object.values(merged.current).map((v) => `${v.section.periodo.from}..${v.section.periodo.to}`))
    expect(periods.size).toBe(2)
  })
})

describe('mergeUpdates — histórico completo', () => {
  it('guarda todas as versões de cada seção, da mais antiga para a mais recente', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [checkoutSection('2026-10-27..2026-10-29', 10129)]),
      parsed('2026-11-03-1530', [checkoutSection('2026-10-31..2026-11-02', 5910)]),
      parsed('2026-11-05-0900', [checkoutSection('2026-11-03..2026-11-04', 4000)]),
    ])
    const versions = merged.history['clarity.checkout']!
    expect(versions.map((v) => v.updateId)).toEqual(['0000-baseline', '2026-11-03-1530', '2026-11-05-0900'])
    expect(versions[0].section.data[0].deadClicks).toBe(10129)
    expect(merged.current['clarity.checkout']?.section.data[0].deadClicks).toBe(4000)
  })

  it('lista as atualizações lidas e as seções de cada uma', () => {
    const merged = mergeUpdates([parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1)]), parsed('2026-11-03-1530', [checkoutSection('2026-10-31..2026-11-02', 1)])])
    expect(merged.updates.map((u) => [u.id, u.sectionKeys])).toEqual([
      ['0000-baseline', ['looker.resumo']],
      ['2026-11-03-1530', ['clarity.checkout']],
    ])
  })

  it('rejeita duas atualizações com o mesmo nome', () => {
    expect(() => mergeUpdates([parsed('a', [resumoSection('2026-10-02..2026-10-29', 1)]), parsed('a', [resumoSection('2026-10-02..2026-10-29', 2)])])).toThrow(/mesmo nome/)
  })

  it('sem atualizações, devolve tudo vazio (não quebra)', () => {
    const merged = mergeUpdates([])
    expect(merged.current).toEqual({})
    expect(merged.limitations).toEqual([])
  })
})

describe('mergeUpdates — limitações por seção/atualização', () => {
  it('valem enquanto o arquivo for a fonte de alguma seção vigente', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1), limitations('[Looker] Usuários aproximados.')]),
      parsed('2026-11-03-1530', [checkoutSection('2026-10-31..2026-11-02', 1), limitations('[Clarity] Fim de semana e Finados.')]),
    ])
    expect(merged.limitations.map((l) => [l.scope, l.text, l.updateId])).toEqual([
      ['looker', 'Usuários aproximados.', '0000-baseline'],
      ['clarity', 'Fim de semana e Finados.', '2026-11-03-1530'],
    ])
  })

  it('saem de vigor quando todas as seções do arquivo foram substituídas (e seguem no histórico do arquivo)', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1), limitations('[Looker] Antiga.')]),
      parsed('2026-11-03-1530', [resumoSection('2026-10-06..2026-11-02', 2), limitations('[Looker] Nova.')]),
    ])
    expect(merged.limitations.map((l) => l.text)).toEqual(['Nova.'])
    expect(merged.history['looker.resumo']).toHaveLength(2)
  })

  it('limitações declaradas dentro da seção seguem a versão vigente da seção', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1, 'limitacoes:\n- Da seção antiga.')]),
      parsed('2026-11-03-1530', [canaisSection('2026-10-06..2026-11-02', 42.79, -11.7)]),
    ])
    expect(merged.limitations.map((l) => [l.scope, l.text, l.sectionKey])).toEqual([['looker', 'Da seção antiga.', 'looker.resumo']])
  })

  it('não repete a mesma limitação', () => {
    const merged = mergeUpdates([
      parsed('0000-baseline', [resumoSection('2026-10-02..2026-10-29', 1), limitations('Igual.')]),
      parsed('2026-11-03-1530', [canaisSection('2026-10-06..2026-11-02', 1, 1), limitations('Igual.')]),
    ])
    expect(merged.limitations).toHaveLength(1)
  })
})
