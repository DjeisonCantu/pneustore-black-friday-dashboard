import { Outlet } from 'react-router-dom'
import { GlobalHeader } from '@/components/layout/global-header'

// Atualização de 30/10/2026 (layout one-page): Sidebar/MobileTabs saíram —
// não há mais o que navegar, é uma página só (ver src/pages/dashboard-page.tsx).
// O rodapé de fontes/"Sobre os dados" também saiu daqui — agora é o último
// bloco da própria página (para entrar na exportação PDF/Markdown, que o
// rodapé antigo, marcado `no-print`, nunca cobria).
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <GlobalHeader />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 lg:px-6 lg:py-6">
        <Outlet />
      </main>
    </div>
  )
}
