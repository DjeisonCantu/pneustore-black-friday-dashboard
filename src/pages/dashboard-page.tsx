// Página única (one-page) — substitui as antigas Visão geral, Jornada de
// compra e Aquisição e produtos (atualização de 30/10/2026, layout
// one-page). "Sobre os dados" virou uma gaveta (Sheet), aberta pelo link no
// rodapé, em vez de uma tela própria.

import { useState } from 'react'
import { AboutDataSheet } from '@/components/dashboard/about-data-sheet'
import { DashboardBlocks } from '@/components/dashboard/dashboard-blocks'
import { UpdateDataSheet } from '@/components/update/update-data-sheet'
import { useRealData } from '@/hooks/use-real-data'
import { useRegisterPageExport } from '@/hooks/use-register-export'
import { buildDashboardMarkdown } from '@/lib/dashboard-markdown'
import { formatDateShort } from '@/lib/format'

function rangeLabel(from: string, to: string): string {
  return `${formatDateShort(new Date(`${from}T00:00:00-03:00`))} a ${formatDateShort(new Date(`${to}T00:00:00-03:00`))}`
}

export function DashboardPage() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const data = useRealData()
  const { overview, clarity, ux } = data

  useRegisterPageExport('PneuStore · Black Friday Health Monitor', () => buildDashboardMarkdown(data))

  const sources = [
    ux.period && `Resumo Executivo Pré-Black (${rangeLabel(ux.period.from, ux.period.to)})`,
    clarity && `Clarity (${rangeLabel(clarity.period.from, clarity.period.to)})`,
    overview?.period && `Looker Studio (${rangeLabel(overview.period.from, overview.period.to)})`,
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <DashboardBlocks />

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 text-ds-sm text-[var(--color-muted-foreground)]">
        <span>Fontes: {sources.length > 0 ? sources.join(' · ') : '—'}</span>
        <span className="no-print flex items-center gap-4">
          <button type="button" onClick={() => setAboutOpen(true)} className="font-medium text-[var(--color-primary)] hover:underline">
            Sobre os dados
          </button>
          {/* Discreto de propósito (sem ícone, cinza, fora do cabeçalho/menu/PDF/Markdown). NÃO é segurança: quem protege a publicação é o token. */}
          <button type="button" onClick={() => setUpdateOpen(true)} className="text-ds-sm text-[var(--color-muted-foreground)] hover:underline">
            Atualizar dados
          </button>
        </span>
      </footer>

      <AboutDataSheet open={aboutOpen} onOpenChange={setAboutOpen} />
      <UpdateDataSheet open={updateOpen} onOpenChange={setUpdateOpen} />
    </div>
  )
}
