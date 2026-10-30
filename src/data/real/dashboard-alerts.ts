// Alertas derivados automaticamente dos dados reais — bloco "barra de
// status" do layout one-page ("no máximo 2 alertas curtos derivados dos
// dados"). Cada alerta é uma regra simples sobre um limiar já documentado
// nos módulos de dados — nunca um texto fixo escrito à mão, sempre
// recalculado a partir do dado atual.

import { CLARITY_CHECKOUT_FRICTION, isCriticalPage } from './clarity-checkout-friction'
import { loadRealOverview } from './real-overview'

/** Canal cuja receita caiu pelo menos esse tanto vs. o período anterior (ver acquisition.channelShares). */
export const CHANNEL_DECLINE_ALERT_THRESHOLD = -15

export interface DashboardAlert {
  label: string
}

export function buildDashboardAlerts(): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  const criticalPage = CLARITY_CHECKOUT_FRICTION.find((p) => isCriticalPage(p))
  if (criticalPage) {
    alerts.push({ label: `${criticalPage.label}: atrito alto` })
  }

  const view = loadRealOverview()
  const worstChannel = view?.channelShares.reduce<(typeof view.channelShares)[number] | undefined>(
    (worst, c) => (!worst || c.comparisonChangePercent < worst.comparisonChangePercent ? c : worst),
    undefined,
  )
  if (worstChannel && worstChannel.comparisonChangePercent <= CHANNEL_DECLINE_ALERT_THRESHOLD) {
    alerts.push({ label: `${worstChannel.channel}: receita em queda` })
  }

  return alerts.slice(0, 2)
}
