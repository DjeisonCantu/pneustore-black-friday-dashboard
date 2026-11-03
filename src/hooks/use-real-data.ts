import { useContext } from 'react'
import type { DashboardData } from '@/data/dashboard-data'
import { RealDataContext } from '@/state/real-data-context'

export function useRealData(): DashboardData {
  return useContext(RealDataContext)
}
