import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, type ThemePreference } from '@/state/theme-context'

const OPTIONS: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Tema claro' },
  { value: 'dark', icon: Moon, label: 'Tema escuro' },
  { value: 'system', icon: Monitor, label: 'Tema do sistema' },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] p-0.5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isActive = preference === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={isActive}
            onClick={() => setPreference(opt.value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[var(--radius-pill)] transition-all duration-150',
              isActive
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-apple-sm)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
