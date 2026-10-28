// Simula uma pequena latência de carregamento ao trocar filtros, para que o
// estado de "carregando" (esqueleto) seja demonstrável nesta maquete, assim
// como aconteceria ao buscar um snapshot real (ver 05-requisitos-tecnicos.md).

import { useEffect, useRef, useState } from 'react'

export function useSimulatedLoading(dependencyKey: string, delayMs = 450): boolean {
  const [isLoading, setIsLoading] = useState(false)
  const isFirstRun = useRef(true)

  useEffect(() => {
    setIsLoading(true)
    const timeout = window.setTimeout(
      () => setIsLoading(false),
      isFirstRun.current ? delayMs + 200 : delayMs,
    )
    isFirstRun.current = false
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencyKey])

  return isLoading
}
