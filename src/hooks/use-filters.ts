// Filtros globais, persistidos na URL (query string) para permitir
// compartilhar o link de uma visão — conforme 04-arquitetura-informacao.md,
// seção 2: "o estado dos filtros fica na URL".

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  COMPARISON_MODES,
  DEVICE_FILTERS,
  PERIOD_PRESETS,
  type ComparisonMode,
  type DeviceFilter,
  type Filters,
  type PeriodPreset,
} from '@/types/common'

function isPeriodPreset(value: string | null): value is PeriodPreset {
  return !!value && (PERIOD_PRESETS as readonly string[]).includes(value)
}
function isDeviceFilter(value: string | null): value is DeviceFilter {
  return !!value && (DEVICE_FILTERS as readonly string[]).includes(value)
}
function isComparisonMode(value: string | null): value is ComparisonMode {
  return !!value && (COMPARISON_MODES as readonly string[]).includes(value)
}

export function useFilters(): [Filters, {
  setPeriod: (period: PeriodPreset) => void
  setCustomRange: (from: string, to: string) => void
  setDevice: (device: DeviceFilter) => void
  setComparison: (comparison: ComparisonMode) => void
}] {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<Filters>(() => {
    const period = isPeriodPreset(searchParams.get('periodo')) ? (searchParams.get('periodo') as PeriodPreset) : '7dias'
    const device = isDeviceFilter(searchParams.get('dispositivo')) ? (searchParams.get('dispositivo') as DeviceFilter) : 'todos'
    const comparison = isComparisonMode(searchParams.get('comparar'))
      ? (searchParams.get('comparar') as ComparisonMode)
      : 'periodo-anterior'
    const fromStr = searchParams.get('de')
    const toStr = searchParams.get('ate')
    const customRange = fromStr && toStr ? { from: new Date(`${fromStr}T00:00:00-03:00`), to: new Date(`${toStr}T00:00:00-03:00`) } : null

    return { period, customRange, device, comparison }
  }, [searchParams])

  const setPeriod = useCallback(
    (period: PeriodPreset) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('periodo', period)
        if (period !== 'personalizado') {
          next.delete('de')
          next.delete('ate')
        }
        return next
      })
    },
    [setSearchParams],
  )

  const setCustomRange = useCallback(
    (from: string, to: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('periodo', 'personalizado')
        next.set('de', from)
        next.set('ate', to)
        return next
      })
    },
    [setSearchParams],
  )

  const setDevice = useCallback(
    (device: DeviceFilter) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('dispositivo', device)
        return next
      })
    },
    [setSearchParams],
  )

  const setComparison = useCallback(
    (comparison: ComparisonMode) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('comparar', comparison)
        return next
      })
    },
    [setSearchParams],
  )

  return [filters, { setPeriod, setCustomRange, setDevice, setComparison }]
}
