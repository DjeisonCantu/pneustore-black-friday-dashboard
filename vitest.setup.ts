// Desmonta cada componente renderizado por Testing Library entre testes —
// sem isto, o DOM de um teste fica no documento do próximo (Vitest não
// registra a limpeza automática da Testing Library sozinho, ao contrário do
// Jest). Só usado pelos testes `*.test.tsx` (Missão 04, Etapa C3); os testes
// `*.test.ts` de camada de dados não renderizam nada e não são afetados.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
