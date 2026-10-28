import { NavLink, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'

export function Sidebar() {
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()

  return (
    <aside className="material-chrome no-print hidden w-60 shrink-0 border-r border-[var(--color-border)] lg:block">
      <nav className="sticky top-24 flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={{ pathname: item.to, search: queryString }}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-[0.7rem] px-3 py-2 text-ds-base font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-apple-sm)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-foreground)]',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
