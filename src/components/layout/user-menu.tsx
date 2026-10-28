import { LogOut, UserCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/state/auth-context'

// Login simples adicionado a pedido do dono do projeto — não é SSO real.
// Ver src/state/auth-context.tsx para o porquê isso nunca deve ser tratado
// como proteção de verdade (D-02/SEG-01 continuam pendentes).
export function UserMenu() {
  const { username, logout } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-3 text-ds-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-control-hover)]">
        <UserCircle2 className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <span className="hidden sm:inline">{username ?? 'Conta'}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Login simples — SSO corporativo pendente (D-02)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
