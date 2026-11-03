// Bloco F do layout one-page: próximas ações, lista compacta (checklist
// visual, não interativo — é um snapshot do relatório, não uma tarefa que o
// dashboard gerencia).

import { CircleDashed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealData } from '@/hooks/use-real-data'

export function PrioritiesChecklist() {
  const { priorities } = useRealData().ux
  if (!priorities || priorities.items.length === 0) return null

  return (
    <Card className="print-break-inside-avoid">
      <CardHeader>
        <CardTitle>Próximas ações</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {priorities.items.map((item) => (
            <li key={item.title} className="flex items-start gap-2 text-ds-sm">
              <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden="true" />
              <span>
                <span className="font-medium text-[var(--color-foreground)]">{item.title}</span>
                <span className="text-[var(--color-muted-foreground)]"> — {item.detail} </span>
                <span className="text-[var(--color-primary)]">({item.owner})</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
