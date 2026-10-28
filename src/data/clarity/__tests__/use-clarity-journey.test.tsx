// Testes do hook de consumo do Clarity — Missão 04, Etapa C3.
//
// Exercita o hook de verdade (React + o store genérico de async-snapshot),
// não só o fetcher isolado — prova que a ligação Clarity -> hook genérico
// funciona de ponta a ponta com as fixtures fictícias.

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests } from '@/data/async-snapshot/cache'
import { useClarityJourneySignals } from '../use-clarity-journey'
import type { DevClarityScenario } from '../dev-fixtures'

describe('useClarityJourneySignals', () => {
  beforeEach(() => clearAllForTests())

  it('carrega o cenário "ok" por padrão: loading -> success', async () => {
    const { result } = renderHook(() => useClarityJourneySignals())
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.snapshot?.metadata.status).toBe('ok')
    expect(result.current.isPartial).toBe(false)
  })

  it('carrega o cenário "partial": success com isPartial true', async () => {
    const { result } = renderHook(() => useClarityJourneySignals('partial'))
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.snapshot?.metadata.status).toBe('partial')
    expect(result.current.isPartial).toBe(true)
  })

  it('carrega o cenário "invalid": status vira "error", nunca "success"', async () => {
    const { result } = renderHook(() => useClarityJourneySignals('invalid'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.snapshot).toBeNull()
    expect(result.current.errors).not.toBeNull()
  })

  it('alteração rápida de cenário não deixa o estado antigo "vazar" para o novo (proteção de corrida)', async () => {
    const { result, rerender } = renderHook(({ scenario }: { scenario: DevClarityScenario }) => useClarityJourneySignals(scenario), {
      initialProps: { scenario: 'ok' },
    })
    // Troca de cenário antes do primeiro carregamento terminar — equivalente a
    // trocar o filtro de dispositivo rapidamente na Jornada de compra.
    rerender({ scenario: 'invalid' })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.snapshot).toBeNull()
  })

  it('reload() força um novo carregamento', async () => {
    const { result } = renderHook(() => useClarityJourneySignals())
    await waitFor(() => expect(result.current.status).toBe('success'))

    act(() => {
      result.current.reload()
    })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
  })
})
