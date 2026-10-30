import { Outlet } from 'react-router-dom'
import { GlobalHeader } from '@/components/layout/global-header'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileTabs } from '@/components/layout/mobile-tabs'

// Atualização de 30/10/2026: a faixa "DADOS FICTÍCIOS" (FictitiousDataBanner)
// foi removida daqui — desde essa atualização, nenhuma tela mostra dado
// fictício (Visão geral, Jornada de compra e Aquisição e produtos passaram a
// usar só extrações reais do Looker Studio/Clarity; ver "Sobre os dados"
// para fontes, períodos e limitações de cada uma).
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <GlobalHeader />
      <MobileTabs />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <Sidebar />
        <main className="w-full min-w-0 flex-1 px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
      <footer className="no-print border-t border-[var(--color-border)] px-4 py-3 text-center text-ds-sm text-[var(--color-muted-foreground)] lg:px-6">
        PneuStore Black Friday Health Monitor — dados reais extraídos manualmente (Looker Studio/Microsoft Clarity). Ver "Sobre os dados"
        para fontes, períodos e limitações.
      </footer>
    </div>
  )
}
