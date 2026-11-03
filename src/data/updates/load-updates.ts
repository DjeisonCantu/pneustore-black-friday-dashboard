// Do conteúdo dos arquivos de data/updates/ para a lista de atualizações
// validadas. Puro: quem lê o disco (plugin do Vite) só entrega {nome, texto}.
// Qualquer arquivo inválido faz TUDO falhar, com a mensagem do parser — o
// build não publica um site com dado ruim.

import { isRealIsoDate } from './dates.ts'
import { parseUpdateMd } from './parse-update-md.ts'
import { compareUpdateIds } from './merge-updates.ts'
import { formatIssue, type ParsedUpdate } from './types.ts'

export interface UpdateFileInput {
  /** Nome do arquivo, com ".md". */
  name: string
  text: string
}

export const BASELINE_FILE_ID = '0000-baseline'
const TIMESTAMP_NAME_RE = /^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})(?:-(\d+))?$/

export class UpdatesBuildError extends Error {}

/** `null` se o nome é válido; senão o motivo. Nomes: 0000-baseline.md ou AAAA-MM-DD-HHmm[-N].md. */
export function checkUpdateFileName(name: string): string | null {
  if (!name.toLowerCase().endsWith('.md')) return 'só arquivos .md são aceitos nesta pasta'
  const id = name.slice(0, -3)
  if (id === BASELINE_FILE_ID) return null
  const match = TIMESTAMP_NAME_RE.exec(id)
  if (!match) return 'nome fora do padrão AAAA-MM-DD-HHmm.md (ou 0000-baseline.md)'
  const [, date, hours, minutes] = match
  if (!isRealIsoDate(date) || Number(hours) > 23 || Number(minutes) > 59) return `data/hora «${id}» inválida`
  return null
}

export function loadUpdates(files: readonly UpdateFileInput[]): ParsedUpdate[] {
  const problems: string[] = []
  const updates: ParsedUpdate[] = []

  for (const file of [...files].sort((a, b) => compareUpdateIds(a.name, b.name))) {
    const nameProblem = checkUpdateFileName(file.name)
    if (nameProblem) {
      problems.push(`data/updates/${file.name}: ${nameProblem}`)
      continue
    }
    const result = parseUpdateMd(file.text)
    if (!result.ok) {
      problems.push(...result.issues.map((issue) => `data/updates/${file.name} — ${formatIssue(issue)}`))
      continue
    }
    updates.push({ id: file.name.slice(0, -3), ...result.update })
  }

  if (problems.length > 0) {
    throw new UpdatesBuildError(`Atualização inválida em data/updates/ — o build foi interrompido para não publicar dado ruim:\n${problems.map((p) => `  • ${p}`).join('\n')}`)
  }
  return updates
}
