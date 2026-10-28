import { NavLink, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'

export function MobileTabs() {
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()

  return (
    <nav className="material-chrome no-print scroll-thin flex gap-1.5 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2 lg:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={{ pathname: item.to, search: queryString }}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-1.5 text-ds-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-apple-sm)]'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)]',
            )
          }
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.shortLabel}
        </NavLink>
      ))}
    </nav>
  )
}
