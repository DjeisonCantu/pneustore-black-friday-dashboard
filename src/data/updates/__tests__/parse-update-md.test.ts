import { describe, expect, it } from 'vitest'
import { formatIssue, type ParseIssue, type ParseResult } from '../types'
import { parseStrictNumber, parseUpdateMd } from '../parse-update-md'
import example0311 from './fixtures/atualizacao-2026-11-03.md?raw'
import modelo from './fixtures/modelo-atualizacao.md?raw'

const FRONT = ['---', 'tipo: atualizacao-dashboard', 'versao_modelo: 1', 'gerado_em: 2026-11-03', '---', ''].join('\n')

function md(...blocks: string[]): string {
  return `${FRONT}\n${blocks.join('\n\n')}\n`
}

const RESUMO = ['## Looker — resumo do site', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| metrica | valor | precisao |', '|---|---|---|', '| sessoes | 1582478 | exato |'].join('\n')

function expectOk(result: ParseResult) {
  if (!result.ok) throw new Error(`esperava sucesso, mas deu erro:\n${result.issues.map(formatIssue).join('\n')}`)
  return result.update
}

function issuesOf(result: ParseResult): ParseIssue[] {
  if (result.ok) throw new Error('esperava erro, mas o arquivo foi aceito')
  return result.issues
}

function messages(result: ParseResult): string[] {
  return issuesOf(result).map(formatIssue)
}

describe('parseStrictNumber', () => {
  it('aceita ponto decimal e inteiros, sem milhar', () => {
    expect(parseStrictNumber('44945346.96')).toEqual({ ok: true, value: 44945346.96 })
    expect(parseStrictNumber('1582478')).toEqual({ ok: true, value: 1582478 })
    expect(parseStrictNumber('-11.7')).toEqual({ ok: true, value: -11.7 })
    expect(parseStrictNumber('0')).toEqual({ ok: true, value: 0 })
  })

  it.each([
    ['42,79', 'vírgula'],
    ['1.582.478', 'separador de milhar'],
    ['42.79%', '%'],
    ['R$ 100', 'R$'],
    ['17,22 mi', 'vírgula'],
    ['920 mil', 'espaço'],
    ['abc', 'letras'],
    ['1e5', 'letras'],
    ['+5', 'não é um número'],
  ])('recusa «%s» (%s) com um motivo — nunca adivinha', (raw, reason) => {
    const result = parseStrictNumber(raw)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain(reason)
  })
})

describe('parseUpdateMd — arquivos válidos', () => {
  it('lê o exemplo real de 03/11 inteiro, com todos os números', () => {
    const update = expectOk(parseUpdateMd(example0311))
    expect(update.meta).toMatchObject({ tipo: 'atualizacao-dashboard', versaoModelo: 1, geradoEm: '2026-11-03' })
    expect(Object.keys(update.sections).sort()).toEqual(['clarity.checkout', 'clarity.sessoes', 'looker.app', 'looker.canais', 'looker.marcas', 'looker.origem', 'looker.resumo'])

    expect(update.sections['looker.resumo']?.periodo).toEqual({ from: '2026-10-06', to: '2026-11-02' })
    expect(update.sections['looker.resumo']?.data).toEqual({
      sessoes: { value: 1582478, precision: 'exato' },
      usuarios: { value: 920300, precision: 'aproximado' },
      pedidos: { value: 29641, precision: 'exato' },
      receita: { value: 44945346.96, precision: 'exato' },
      ticket_medio: { value: 1516.32, precision: 'exato' },
    })
    expect(update.sections['looker.canais']?.data).toHaveLength(6)
    expect(update.sections['looker.canais']?.data[0]).toEqual({ canal: 'CPC', participacao: 42.79, variacao: -11.7 })
    expect(update.sections['looker.origem']?.data).toHaveLength(9)
    expect(update.sections['looker.origem']?.data[8]).toEqual({ origem: 'criteo / display', receita: 170580, precisao: 'aproximado' })
    expect(update.sections['looker.marcas']?.periodo).toEqual({ from: '2026-11-01', to: '2026-11-02' })
    expect(update.sections['looker.marcas']?.data).toHaveLength(10)
    expect(update.sections['looker.marcas']?.data[2]).toEqual({ marca: 'Pirelli', itensVistos: 14194, pctAddToCart: 30.16, itensComprados: 251, receitaItem: 205694.6 })
    expect(update.sections['looker.app']?.data).toEqual({ receita_app: { value: 16858235.37, precision: 'exato' } })
    expect(update.sections['clarity.checkout']?.periodo).toEqual({ from: '2026-10-31', to: '2026-11-02' })
    expect(update.sections['clarity.checkout']?.data).toHaveLength(6)
    expect(update.sections['clarity.checkout']?.data[0]).toEqual({ pagina: '/checkout/v2/cart', deadClicks: 5910, rageClicks: 226, quickBacks: 288 })
    expect(update.sections['clarity.sessoes']?.data).toEqual({ mobile: 100094, desktop: 14594, tablet: 596, other: 11 })
    expect(update.limitations).toHaveLength(7)
    expect(update.limitations.every((item) => item.scope === 'geral')).toBe(true)
  })

  it('aceita um arquivo PARCIAL: só uma seção, sem as outras', () => {
    const update = expectOk(parseUpdateMd(md(RESUMO)))
    expect(Object.keys(update.sections)).toEqual(['looker.resumo'])
  })

  it('aceita CRLF, BOM e comentários HTML sem mudar o resultado', () => {
    const base = md('<!-- comentário\nem duas linhas -->', RESUMO)
    const crlf = `﻿${base.replace(/\n/g, '\r\n')}`
    expect(expectOk(parseUpdateMd(crlf))).toEqual(expectOk(parseUpdateMd(base)))
  })

  it('aceita gerado_em com data e hora', () => {
    const text = md(RESUMO).replace('gerado_em: 2026-11-03', 'gerado_em: 2026-11-03T14:04:32.063Z')
    expect(expectOk(parseUpdateMd(text)).meta.geradoEm).toBe('2026-11-03T14:04:32.063Z')
  })

  it('aceita o traço da seção como —, – ou -, e ignora acento/caixa no título', () => {
    for (const heading of ['## Looker — resumo do site', '## Looker – resumo do site', '## Looker - resumo do site', '## LOOKER — RESUMO DO SITE']) {
      expect(Object.keys(expectOk(parseUpdateMd(md(RESUMO.replace('## Looker — resumo do site', heading)))).sections)).toEqual(['looker.resumo'])
    }
  })

  it('aceita as colunas em outra ordem (mapeia pelo nome)', () => {
    const reordered = ['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| variacao_vs_anterior | canal | participacao |', '|---|---|---|', '| -11.7 | CPC | 42.79 |'].join('\n')
    expect(expectOk(parseUpdateMd(md(reordered))).sections['looker.canais']?.data).toEqual([{ canal: 'CPC', participacao: 42.79, variacao: -11.7 }])
  })

  it('aceita 0 como valor real (ex.: Clarity sem rage clicks na página)', () => {
    const text = md(['## Clarity — checkout', 'fonte: clarity', 'periodo: 2026-10-27..2026-10-29', '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', '| /checkout/v2/delivery/type | 40 | 0 | 2 |'].join('\n'))
    expect(expectOk(parseUpdateMd(text)).sections['clarity.checkout']?.data[0]).toEqual({ pagina: '/checkout/v2/delivery/type', deadClicks: 40, rageClicks: 0, quickBacks: 2 })
  })
})

describe('parseUpdateMd — célula vazia é campo ausente, nunca 0', () => {
  it('métrica sem valor some do resultado', () => {
    const text = md(['## Looker — resumo do site', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| metrica | valor | precisao |', '|---|---|---|', '| sessoes | 1582478 | exato |', '| usuarios | | aproximado |', '| ticket_medio | | |'].join('\n'))
    const data = expectOk(parseUpdateMd(text)).sections['looker.resumo']?.data
    expect(data).toEqual({ sessoes: { value: 1582478, precision: 'exato' } })
    expect(data).not.toHaveProperty('usuarios')
    expect(data).not.toHaveProperty('ticket_medio')
  })

  it('variação vazia fica ausente (não vira 0)', () => {
    const text = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42.79 | |'].join('\n'))
    const row = expectOk(parseUpdateMd(text)).sections['looker.canais']?.data[0]
    expect(row).toEqual({ canal: 'CPC', participacao: 42.79 })
    expect(row).not.toHaveProperty('variacao')
  })

  it('contadores do Clarity vazios ficam ausentes', () => {
    const text = md(['## Clarity — checkout', 'fonte: clarity', 'periodo: 2026-10-31..2026-11-02', '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', '| /checkout/v2/cart | 5910 | | 288 |'].join('\n'))
    const row = expectOk(parseUpdateMd(text)).sections['clarity.checkout']?.data[0]
    expect(row).toEqual({ pagina: '/checkout/v2/cart', deadClicks: 5910, quickBacks: 288 })
    expect(row).not.toHaveProperty('rageClicks')
  })

  it('% Add to Cart vazio fica ausente', () => {
    const text = md(['## Looker — marcas', 'fonte: looker-pdf', 'periodo: 2026-11-01..2026-11-02', '', '| marca | itens_vistos | pct_add_to_cart | itens_comprados | receita_item |', '|---|---|---|---|---|', '| Itaro | 23739 | | 1081 | 399161.99 |'].join('\n'))
    const row = expectOk(parseUpdateMd(text)).sections['looker.marcas']?.data[0]
    expect(row).not.toHaveProperty('pctAddToCart')
  })

  it('seção em que NENHUMA célula de dado foi preenchida é recusada (o modelo em branco não passa)', () => {
    const text = md(['## Clarity — checkout', 'fonte: clarity', 'periodo: 2026-10-31..2026-11-02', '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', '| /checkout/v2/cart | | | |'].join('\n'))
    expect(messages(parseUpdateMd(text)).join('\n')).toContain('nenhum valor preenchido')
  })
})

describe('parseUpdateMd — erros claros, com seção e linha', () => {
  it('número com vírgula: aponta a seção, a linha exata e a coluna', () => {
    const text = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42,79 | -11.7 |'].join('\n'))
    const [issue] = issuesOf(parseUpdateMd(text))
    expect(issue.section).toBe('Looker — canais')
    expect(issue.line).toBe(text.split('\n').findIndex((l) => l.startsWith('| CPC')) + 1)
    expect(formatIssue(issue)).toContain('coluna «participacao»')
    expect(formatIssue(issue)).toContain('vírgula')
  })

  it('página fora das 6 do checkout é recusada', () => {
    const text = md(['## Clarity — checkout', 'fonte: clarity', 'periodo: 2026-10-31..2026-11-02', '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', '| /checkout/v2/nova-pagina | 10 | 1 | 1 |'].join('\n'))
    const all = messages(parseUpdateMd(text)).join('\n')
    expect(all).toContain('/checkout/v2/nova-pagina')
    expect(all).toContain('6 páginas de checkout')
  })

  it.each([
    ['2026-02-30..2026-03-01', 'não existe no calendário'],
    ['2026-13-01..2026-13-02', 'não existe no calendário'],
    ['2026-11-03..2026-11-01', 'vem depois'],
    ['06/10/2026..02/11/2026', 'fora do formato'],
    ['2026-10-06 a 2026-11-02', 'fora do formato'],
    ['AAAA-MM-DD..AAAA-MM-DD', 'fora do formato'],
  ])('período inválido «%s»', (periodo, reason) => {
    const text = md(RESUMO.replace('2026-10-06..2026-11-02', periodo))
    const [issue] = issuesOf(parseUpdateMd(text))
    expect(issue.section).toBe('Looker — resumo do site')
    expect(issue.line).toBe(text.split('\n').findIndex((l) => l.startsWith('periodo:')) + 1)
    expect(issue.message).toContain(reason)
  })

  it('número negativo onde não pode (mas variação pode ser negativa)', () => {
    const negative = md(RESUMO.replace('1582478', '-5'))
    expect(messages(parseUpdateMd(negative)).join('\n')).toContain('não pode ser negativo')
    const variation = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42.79 | -11.7 |'].join('\n'))
    expect(parseUpdateMd(variation).ok).toBe(true)
  })

  it('participação acima de 100 e contador com casa decimal são recusados', () => {
    const share = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 142.79 | |'].join('\n'))
    expect(messages(parseUpdateMd(share)).join('\n')).toContain('não pode passar de 100')
    const decimal = md(['## Clarity — checkout', 'fonte: clarity', 'periodo: 2026-10-31..2026-11-02', '', '| pagina | dead_clicks | rage_clicks | quick_backs |', '|---|---|---|---|', '| /checkout/v2/cart | 59.5 | 1 | 1 |'].join('\n'))
    expect(messages(parseUpdateMd(decimal)).join('\n')).toContain('número inteiro')
  })

  it('precisão inválida, ausente com valor, e fonte errada', () => {
    expect(messages(parseUpdateMd(md(RESUMO.replace('| exato |', '| certo |')))).join('\n')).toContain('use: exato, aproximado')
    expect(messages(parseUpdateMd(md(RESUMO.replace('| exato |', '| |')))).join('\n')).toContain('informe a precisão')
    expect(messages(parseUpdateMd(md(RESUMO.replace('fonte: looker-pdf', 'fonte: clarity')))).join('\n')).toContain('não combina com esta seção')
  })

  it('seção desconhecida lista as válidas', () => {
    const text = md('## Looker — vendas por hora\nfonte: looker-pdf\nperiodo: 2026-10-06..2026-11-02')
    const [issue] = issuesOf(parseUpdateMd(text))
    expect(issue.section).toBe('Looker — vendas por hora')
    expect(issue.message).toContain('Seções válidas')
    expect(issue.message).toContain('Looker — marcas')
  })

  it('cabeçalho da tabela fora do modelo (coluna faltando ou extra)', () => {
    const missing = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao |', '|---|---|', '| CPC | 42.79 |'].join('\n'))
    expect(messages(parseUpdateMd(missing)).join('\n')).toContain('faltam as colunas «variacao_vs_anterior»')
    const extra = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior | extra |', '|---|---|---|---|', '| CPC | 42.79 | 1 | x |'].join('\n'))
    expect(messages(parseUpdateMd(extra)).join('\n')).toContain('colunas desconhecidas «extra»')
  })

  it('linha com número de células diferente do cabeçalho', () => {
    const text = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42.79 |'].join('\n'))
    expect(messages(parseUpdateMd(text)).join('\n')).toContain('a linha tem 2 células, mas o cabeçalho tem 3')
  })

  it('linha repetida (mesmo canal, mesma seção ou mesmo campo) é recusada — nunca escolhe uma', () => {
    const rows = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42.79 | 1 |', '| cpc | 40 | 2 |'].join('\n'))
    expect(messages(parseUpdateMd(rows)).join('\n')).toContain('canal «cpc» repetido')
    expect(messages(parseUpdateMd(md(RESUMO, RESUMO))).join('\n')).toContain('mais de uma vez')
  })

  it('faltam fonte e periodo na seção', () => {
    const text = md(['## Looker — resumo do site', '| metrica | valor | precisao |', '|---|---|---|', '| sessoes | 1 | exato |'].join('\n'))
    const all = messages(parseUpdateMd(text)).join('\n')
    expect(all).toContain('falta «fonte:»')
    expect(all).toContain('falta «periodo:»')
  })

  it('campo desconhecido, linha solta e tabela interrompida', () => {
    expect(messages(parseUpdateMd(md(RESUMO.replace('periodo:', 'observacao: oi\nperiodo:')))).join('\n')).toContain('não existe nesta seção')
    expect(messages(parseUpdateMd(md(`${RESUMO}\ntexto solto`))).join('\n')).toContain('linha não reconhecida')
    expect(messages(parseUpdateMd(md(`${RESUMO}\n\n| sessoes | 2 | exato |`))).join('\n')).toContain('interrompida por uma linha em branco')
  })

  it('cabeçalho do arquivo: tipo errado, versão não suportada, campos faltando, sem «---»', () => {
    expect(messages(parseUpdateMd(md(RESUMO).replace('atualizacao-dashboard', 'outra-coisa'))).join('\n')).toContain('tipo deve ser')
    expect(messages(parseUpdateMd(md(RESUMO).replace('versao_modelo: 1', 'versao_modelo: 2'))).join('\n')).toContain('não é suportada')
    expect(messages(parseUpdateMd(md(RESUMO).replace('versao_modelo: 1\n', ''))).join('\n')).toContain('falta «versao_modelo»')
    expect(messages(parseUpdateMd(md(RESUMO).replace('gerado_em: 2026-11-03', 'gerado_em: 03/11/2026'))).join('\n')).toContain('não é uma data válida')
    expect(messages(parseUpdateMd('## Looker — resumo do site\nfonte: looker-pdf')).join('\n')).toContain('precisa começar com o cabeçalho')
    expect(messages(parseUpdateMd('---\ntipo: atualizacao-dashboard\n')).join('\n')).toContain('não foi fechado')
  })

  it('arquivo sem nenhuma seção de dados', () => {
    expect(messages(parseUpdateMd(FRONT)).join('\n')).toContain('nenhuma seção de dados')
  })

  it('o MODELO em branco (com AAAA-MM-DD) NÃO passa — nada é preenchido por palpite', () => {
    const result = parseUpdateMd(modelo)
    expect(result.ok).toBe(false)
  })

  it('o número da linha continua certo depois de comentários de várias linhas', () => {
    const text = md('<!--\na\nb\n-->', RESUMO.replace('| sessoes | 1582478 | exato |', '| sessoes | 15,8 | exato |'))
    const [issue] = issuesOf(parseUpdateMd(text))
    expect(issue.line).toBe(text.split('\n').findIndex((l) => l.startsWith('| sessoes')) + 1)
  })

  it('junta vários erros de uma vez em vez de parar no primeiro', () => {
    const text = md(['## Looker — canais', 'fonte: looker-pdf', 'periodo: 2026-10-06..2026-11-02', '', '| canal | participacao | variacao_vs_anterior |', '|---|---|---|', '| CPC | 42,79 | 1 |', '| Organic | 28,33 | 2 |'].join('\n'))
    expect(issuesOf(parseUpdateMd(text)).length).toBeGreaterThanOrEqual(2)
  })
})

describe('parseUpdateMd — limitações', () => {
  it('etiquetas [Clarity]/[Looker]/[UX] escopam a limitação; sem etiqueta é geral', () => {
    const text = md(RESUMO, ['## Limitações', '- [Clarity] Só 3 dias.', '- [looker] Usuários aproximados.', '- Vale para tudo.', '- [Outra] não é etiqueta'].join('\n'))
    expect(expectOk(parseUpdateMd(text)).limitations).toEqual([
      { text: 'Só 3 dias.', scope: 'clarity' },
      { text: 'Usuários aproximados.', scope: 'looker' },
      { text: 'Vale para tudo.', scope: 'geral' },
      { text: '[Outra] não é etiqueta', scope: 'geral' },
    ])
  })

  it('limitações por seção (limitacoes:) ficam na própria seção', () => {
    const text = md(`${RESUMO}\n\nlimitacoes:\n- Receita aproximada.\n- Sem ticket médio.`)
    expect(expectOk(parseUpdateMd(text)).sections['looker.resumo']?.limitations).toEqual(['Receita aproximada.', 'Sem ticket médio.'])
  })

  it('linha da seção «Limitações» sem «- » é recusada', () => {
    expect(messages(parseUpdateMd(md(RESUMO, '## Limitações\nsem traço'))).join('\n')).toContain('começando com «- »')
  })
})

describe('parseUpdateMd — seções do Relatório UX', () => {
  const UX = [
    '## Relatório UX — indicadores da semana',
    'fonte: resumo-executivo-pdf',
    'periodo: 2026-10-14..2026-10-20',
    'periodo_comparacao: 2025-10-14..2025-10-20',
    'nota: Receita estimada.',
    '',
    '| metrica | 2025 | 2026 | precisao |',
    '|---|---|---|---|',
    '| sessoes | 707350 | 404343 | exato |',
    '| taxa_conversao | 1.38 | 1.98 | exato |',
  ].join('\n')

  it('lê indicadores, período de comparação e nota', () => {
    const section = expectOk(parseUpdateMd(md(UX))).sections['ux.indicadores']
    expect(section?.periodoComparacao).toEqual({ from: '2025-10-14', to: '2025-10-20' })
    expect(section?.nota).toBe('Receita estimada.')
    expect(section?.data).toEqual({ sessoes: { y2025: 707350, y2026: 404343, precision: 'exato' }, taxa_conversao: { y2025: 1.38, y2026: 1.98, precision: 'exato' } })
  })

  it('«nota:» pode conter dois-pontos sem virar outro campo', () => {
    const section = expectOk(parseUpdateMd(md(UX.replace('nota: Receita estimada.', 'nota: Fonte: GA4 transcrito. Receita = pedidos × ticket.')))).sections['ux.indicadores']
    expect(section?.nota).toBe('Fonte: GA4 transcrito. Receita = pedidos × ticket.')
  })

  it('lista de gravações e próximas ações', () => {
    const text = md(
      ['## Relatório UX — gravações', 'fonte: resumo-executivo-pdf', 'periodo: 2026-10-14..2026-10-20', '- Idas e voltas.', '- Cliques repetidos.'].join('\n'),
      ['## Próximas ações', 'fonte: resumo-executivo-pdf', 'periodo: 2026-10-14..2026-10-20', '', '| titulo | detalhe | responsavel |', '|---|---|---|', '| Investigar | Checar login. | Dev + UX |'].join('\n'),
    )
    const update = expectOk(parseUpdateMd(text))
    expect(update.sections['ux.gravacoes']?.data).toEqual(['Idas e voltas.', 'Cliques repetidos.'])
    expect(update.sections['ux.acoes']?.data).toEqual([{ titulo: 'Investigar', detalhe: 'Checar login.', responsavel: 'Dev + UX' }])
  })
})
