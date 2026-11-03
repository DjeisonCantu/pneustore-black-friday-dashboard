// Os blocos do one-page (sem rodapé), lendo os dados do contexto — a prévia do
// "Atualizar dados" reaproveita isto com dados em memória.

import { StatusBar } from '@/components/dashboard/status-bar'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import { CheckoutFrictionBlock } from '@/components/dashboard/checkout-friction-block'
import { RevenueByChannelBlock } from '@/components/dashboard/revenue-by-channel-block'
import { TopSellersBlock } from '@/components/dashboard/top-sellers-block'
import { PrioritiesChecklist } from '@/components/dashboard/priorities-checklist'

export function DashboardBlocks() {
  return (
    <div className="space-y-5">
      <StatusBar />
      <KpiGrid />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CheckoutFrictionBlock />
        </div>
        <div className="lg:col-span-5">
          <RevenueByChannelBlock />
        </div>
      </div>

      <TopSellersBlock />
      <PrioritiesChecklist />
    </div>
  )
}
