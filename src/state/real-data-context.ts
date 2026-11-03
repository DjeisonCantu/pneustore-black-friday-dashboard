// Contexto dos dados do dashboard. O padrão são os dados do bundle (os .md de
// data/updates/); a "prévia" do fluxo Atualizar dados troca por dados mesclados
// em memória, sem publicar nada.

import { createContext } from 'react'
import { BUNDLED_DASHBOARD_DATA } from '@/data/bundled-data'
import type { DashboardData } from '@/data/dashboard-data'

export const RealDataContext = createContext<DashboardData>(BUNDLED_DASHBOARD_DATA)
