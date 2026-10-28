import { Outlet } from 'react-router-dom'
import { FictitiousDataBanner } from '@/components/common/fictitious-banner'
import { GlobalHeader } from '@/components/layout/global-header'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileTabs } from '@/components/layout/mobile-tabs'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <FictitiousDataBanner />
      <GlobalHeader />
      <MobileTabs />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <Sidebar />
        <main className="w-full min-w-0 flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
      <footer className="no-print border-t border-[var(--color-border)] px-4 py-3 text-center text-ds-sm text-[var(--color-muted-foreground)] lg:px-6">
        PneuStore Black Friday Health Monitor — maquete de produto (Missão 02). Dados fictícios. Sem integrações reais.
      </footer>
    </div>
  )
}
