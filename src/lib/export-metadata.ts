import { formatDateRangeLabel, formatDateTime } from './format'
import { comparisonLabel, periodLabel, resolveComparisonRange, resolvePeriodRange } from '@/data/selectors'
import { MOCK_TODAY } from '@/data/mock/daily-series'
import type { Filters } from '@/types/common'

const DEVICE_LABELS: Record<string, string> = {
  todos: 'Todos',
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

export function buildExportHeader(pageTitle: string, filters: Filters): string {
  const range = resolvePeriodRange(filters)
  const comparisonRange = resolveComparisonRange(filters)

  const lines = [
    `# ${pageTitle} — PneuStore · Site`,
    '',
    '> **DADOS FICTÍCIOS** — exportação gerada a partir da maquete da Missão 02. Não representa números reais de GA4, Clarity ou dos relatórios da PneuStore.',
    '',
    '## Metadados da exportação',
    '',
    `- **Período:** ${periodLabel(filters.period)} (${formatDateRangeLabel(range.from, range.to)})`,
    `- **Dispositivo:** ${DEVICE_LABELS[filters.device]}`,
    `- **Comparação:** ${comparisonLabel(filters.comparison)}${comparisonRange ? ` (${formatDateRangeLabel(comparisonRange.from, comparisonRange.to)})` : ''}`,
    `- **Fontes:** GA4 (fictício), Microsoft Clarity (fictício — espaço reservado)`,
    `- **Data de extração (simulada):** ${formatDateTime(MOCK_TODAY)}`,
    '',
    '---',
    '',
  ]

  return lines.join('\n')
}
