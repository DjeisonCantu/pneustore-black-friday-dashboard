// Contexto exclusivo desta missão (maquete): permite alternar manualmente
// entre os estados de componente descritos em 04-arquitetura-informacao.md
// (carregando, sem dados, fonte indisponível) sem precisar de um backend
// real. Não faz parte do produto final.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DemoScenario } from '@/types/common'

interface DemoScenarioContextValue {
  scenario: DemoScenario
  setScenario: (scenario: DemoScenario) => void
}

const DemoScenarioContext = createContext<DemoScenarioContextValue | null>(null)

export function DemoScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<DemoScenario>('normal')
  const value = useMemo(() => ({ scenario, setScenario }), [scenario])
  return <DemoScenarioContext.Provider value={value}>{children}</DemoScenarioContext.Provider>
}

export function useDemoScenario(): DemoScenarioContextValue {
  const ctx = useContext(DemoScenarioContext)
  if (!ctx) throw new Error('useDemoScenario deve ser usado dentro de DemoScenarioProvider')
  return ctx
}
