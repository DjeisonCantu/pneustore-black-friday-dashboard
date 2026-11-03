// Passo 2 do "Atualizar dados": bloco a bloco, o que a atualização muda em
// relação ao que está no ar — período antigo → novo e números antes → depois.

import { Badge } from '@/components/ui/badge'
import { formatPeriodNumeric } from '@/data/updates/dates'
import type { BlockDiff, BlockStatus, UpdateDiff } from '@/data/updates/diff-updates'

const STATUS: Record<BlockStatus, { label: string; variant: 'primary' | 'info' | 'neutral' }> = {
  atualiza: { label: 'Vai atualizar', variant: 'primary' },
  novo: { label: 'Novo', variant: 'info' },
  igual: { label: 'Continua igual', variant: 'neutral' },
  ausente: { label: 'Não veio no arquivo', variant: 'neutral' },
}

const MAX_CHANGES = 5

function periodText(block: BlockDiff): string | null {
  const { oldPeriod, newPeriod } = block
  const fmt = (p: { from: string; to: string }) => formatPeriodNumeric(p.from, p.to)
  if (block.status === 'ausente') return oldPeriod ? `continua com ${fmt(oldPeriod)}` : null
  if (block.status === 'novo') return newPeriod ? fmt(newPeriod) : null
  if (!newPeriod) return null
  return oldPeriod && fmt(oldPeriod) !== fmt(newPeriod) ? `${fmt(oldPeriod)} → ${fmt(newPeriod)}` : fmt(newPeriod)
}

function BlockRow({ block }: { block: BlockDiff }) {
  const status = STATUS[block.status]
  const period = periodText(block)
  const muted = block.status === 'ausente' || block.status === 'igual'
  const changes = block.changes.slice(0, MAX_CHANGES)
  const hidden = block.changes.length - changes.length

  return (
    <li className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-ds-sm font-semibold ${muted ? 'text-[var(--color-muted-foreground)]' : ''}`}>{block.label}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
        {period && <span className="text-ds-sm tabular-nums text-[var(--color-muted-foreground)]">{period}</span>}
      </div>

      {changes.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-ds-sm">
          {changes.map((change) => (
            <li key={change.label} className="text-[var(--color-muted-foreground)]">
              <span className="text-[var(--color-foreground)]">{change.label}:</span> {change.before ?? '(novo)'} → {change.after ?? '(sai)'}
            </li>
          ))}
          {hidden > 0 && <li className="text-[var(--color-muted-foreground)]">…e mais {hidden} {hidden === 1 ? 'mudança' : 'mudanças'}</li>}
        </ul>
      )}
      {block.status === 'atualiza' && block.changes.length === 0 && block.textChanged && (
        <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">Os números são os mesmos; mudam só período, nota ou limitações.</p>
      )}

      {block.warnings.map((warning) => (
        <p
          key={warning.message}
          className={`mt-1 text-ds-sm ${warning.level === 'aviso' ? 'font-medium text-[var(--color-warning)]' : 'text-[var(--color-muted-foreground)]'}`}
        >
          {warning.level === 'aviso' ? 'Atenção: ' : ''}
          {warning.message}
        </p>
      ))}
    </li>
  )
}

export function UpdatePreview({ diff }: { diff: UpdateDiff }) {
  return (
    <div className="space-y-2">
      {!diff.hasChanges && (
        <p className="text-ds-sm font-medium text-[var(--color-warning)]">Este arquivo não muda nada no que está no ar — não há o que publicar.</p>
      )}
      <ul className="space-y-1.5">
        {diff.blocks.map((block) => (
          <BlockRow key={block.key} block={block} />
        ))}
      </ul>
    </div>
  )
}
