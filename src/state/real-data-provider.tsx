import type { ReactNode } from 'react'
import type { DashboardData } from '@/data/dashboard-data'
import { RealDataContext } from './real-data-context'

/** Faz os blocos do dashboard lerem `data` em vez dos dados do bundle (usado na prévia "Ver como fica"). */
export function RealDataProvider({ data, children }: { data: DashboardData; children: ReactNode }) {
  return <RealDataContext.Provider value={data}>{children}</RealDataContext.Provider>
}
