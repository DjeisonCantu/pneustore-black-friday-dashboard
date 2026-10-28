// Controle exclusivo desta missão: permite ao revisor alternar manualmente
// entre os estados de componente (normal, sem dados, fonte indisponível)
// para avaliar os critérios de aceite sem precisar esperar um cenário real.

import { TestTube2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDemoScenario } from '@/state/demo-scenario-context'
import type { DemoScenario } from '@/types/common'

const OPTIONS: { value: DemoScenario; label: string }[] = [
  { value: 'normal', label: 'Cenário: normal' },
  { value: 'vazio', label: 'Cenário: sem dados' },
  { value: 'fonte-indisponivel', label: 'Cenário: fonte indisponível' },
]

export function DemoScenarioSwitcher() {
  const { scenario, setScenario } = useDemoScenario()

  return (
    <div className="flex items-center gap-1.5" title="Apenas para esta missão de maquete — não existe em produção">
      <TestTube2 className="h-3.5 w-3.5 text-[var(--color-fictitious)]" />
      <Select value={scenario} onValueChange={(v) => setScenario(v as DemoScenario)}>
        <SelectTrigger className="h-8 w-[198px] text-ds-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
