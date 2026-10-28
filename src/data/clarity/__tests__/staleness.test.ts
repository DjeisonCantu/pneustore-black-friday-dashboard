// Teste de "dados desatualizados" (RF-17) para o Clarity — Missão 04, Etapa
// C3. Usa o relógio injetável do store genérico (já testado para o GA4 na
// Etapa C0) para simular o tempo passando sem precisar de temporizadores
// reais — o mesmo mecanismo, reaproveitado, não duplicado.

import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllForTests } from '@/data/async-snapshot/cache'
import { createClaritySnapshotStore } from '../store'
import { devClarityFetcher, devClaritySnapshotUrl } from '../dev-fixtures'

describe('createClaritySnapshotStore — dados desatualizados (stale)', () => {
  beforeEach(() => clearAllForTests())

  it('vira "stale" quando o snapshot em cache passa da idade máxima configurada', async () => {
    let now = new Date('2026-11-27T12:00:00-03:00')
    const store = createClaritySnapshotStore({ maxAgeMs: 60_000, now: () => now })

    await store.load('clarity:stale-test', devClaritySnapshotUrl('ok'), { fetcher: devClarityFetcher })
    expect(store.getState().status).toBe('success')

    now = new Date(now.getTime() + 61_000)
    expect(store.getState().status).toBe('stale')
    // O snapshot continua disponível para exibição — só o status muda — nunca
    // tratado como "atual" (ver ClarityRealSignalsPanel, aviso de stale).
    expect(store.getState().snapshot).not.toBeNull()
  })

  it('reload() busca de novo e volta a "success" mesmo depois de stale', async () => {
    let now = new Date('2026-11-27T12:00:00-03:00')
    const store = createClaritySnapshotStore({ maxAgeMs: 60_000, now: () => now })

    await store.load('clarity:stale-reload-test', devClaritySnapshotUrl('ok'), { fetcher: devClarityFetcher })
    now = new Date(now.getTime() + 61_000)
    expect(store.getState().status).toBe('stale')

    await store.reload('clarity:stale-reload-test', devClaritySnapshotUrl('ok'), { fetcher: devClarityFetcher })
    expect(store.getState().status).toBe('success')
  })
})
