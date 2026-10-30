// Atualização de 30/10/2026 (layout one-page): FilterBar e a linha
// "Comparando X vs Y" saíram daqui — os filtros de período/dispositivo não
// afetam nenhuma fonte real atual (todas são de período fixo), então
// mostrá-los seria exibir um controle sem efeito (Parte 3 do pedido:
// "esconda-os enquanto não houver dado real filtrável"). O código de
// filtro/FilterBar continua no projeto (src/hooks/use-filters.ts,
// src/components/layout/filter-bar.tsx), só não é mais renderizado aqui. O
// resumo de "última atualização" também saiu — virou a barra de status no
// topo da própria página (src/components/dashboard/status-bar.tsx), com
// período e fonte por bloco, mais específico que a linha única anterior.

import { ExportMenu } from '@/components/layout/export-menu'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'
import pneustoreIcon from '@/assets/brand/pneustore-icon-white.png'

export function GlobalHeader() {
  return (
    <header className="material-chrome no-print sticky top-0 z-30 border-b border-[var(--color-border)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.65rem] bg-[var(--color-primary)] p-1.5 shadow-[var(--shadow-apple-sm)]">
            <img src={pneustoreIcon} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-ds-base font-semibold tracking-[-0.01em] text-[var(--color-foreground)]">PneuStore · Site</p>
            <p className="text-ds-sm text-[var(--color-muted-foreground)]">Black Friday Health Monitor — não inclui o app</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ExportMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
