// O baseline lido direto do arquivo (e NÃO do bundle): o bundle passa a incluir
// toda atualização nova publicada em data/updates/, mas os testes que garantem
// "o dashboard só com o baseline = o site de antes" precisam continuar
// verdadeiros depois de qualquer publicação.

import { buildDashboardData } from '@/data/dashboard-data'
import baselineMd from '../../../../data/updates/0000-baseline.md?raw'
import { mergeUpdates } from '../merge-updates'
import { parseUpdateMd } from '../parse-update-md'
import { formatIssue, type ParsedUpdate } from '../types'

const parsedBaseline = parseUpdateMd(baselineMd)
if (!parsedBaseline.ok) throw new Error(`0000-baseline.md inválido:\n${parsedBaseline.issues.map(formatIssue).join('\n')}`)

export const BASELINE_UPDATE: ParsedUpdate = { id: '0000-baseline', ...parsedBaseline.update }
export const BASELINE_MERGED = mergeUpdates([BASELINE_UPDATE])
export const BASELINE_DATA = buildDashboardData(BASELINE_MERGED)
