import { BookOpenCheck, LayoutDashboard, Route, ShoppingBag } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: ComponentType<{ className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Visão geral', shortLabel: 'Geral', icon: LayoutDashboard },
  { to: '/jornada', label: 'Jornada de compra', shortLabel: 'Jornada', icon: Route },
  { to: '/aquisicao', label: 'Aquisição e produtos', shortLabel: 'Aquisição', icon: ShoppingBag },
  { to: '/sobre', label: 'Sobre os dados', shortLabel: 'Sobre', icon: BookOpenCheck },
]
