// Os dados que vão no bundle: data/updates/*.md já validados pelo plugin do
// Vite (qualquer arquivo inválido derruba o build antes de chegar aqui), com o
// merge e a visão do dashboard calculados uma vez.

import bundledUpdates from 'virtual:updates-data'
import { buildDashboardData } from './dashboard-data.ts'
import { mergeUpdates } from './updates/merge-updates.ts'

export const BUNDLED_UPDATES = bundledUpdates
export const BUNDLED_MERGED = mergeUpdates(BUNDLED_UPDATES)
export const BUNDLED_DASHBOARD_DATA = buildDashboardData(BUNDLED_MERGED)
