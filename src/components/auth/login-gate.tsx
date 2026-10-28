// Tela de login simples — ver src/state/auth-context.tsx para o aviso de
// segurança (não é autenticação real, só uma barreira contra acesso casual).

import { useState, type FormEvent, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/auth-context'
import pneustoreIcon from '@/assets/brand/pneustore-icon-white.png'

const inputClassName =
  'h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-3 text-ds-base text-[var(--color-foreground)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'

export function LoginGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (isAuthenticated) return <>{children}</>

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const ok = login(username.trim(), password)
    if (!ok) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-apple-sm)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.75rem] bg-[var(--color-primary)] p-2 shadow-[var(--shadow-apple-sm)]">
            <img src={pneustoreIcon} alt="" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-ds-base font-semibold text-[var(--color-foreground)]">PneuStore · Black Friday Health Monitor</p>
            <p className="text-ds-sm text-[var(--color-muted-foreground)]">Acesso restrito</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="text-ds-sm font-medium text-[var(--color-foreground)]">
              Usuário
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError(false)
              }}
              className={inputClassName}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-ds-sm font-medium text-[var(--color-foreground)]">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(false)
              }}
              className={inputClassName}
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-ds-sm text-[var(--color-error)]">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Usuário ou senha incorretos.
          </p>
        )}

        <Button type="submit" className="w-full">
          Entrar
        </Button>

        <p className="text-center text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          Acesso simples — não é o login corporativo oficial (SSO ainda pendente). Não compartilhe esta senha publicamente.
        </p>
      </form>
    </div>
  )
}
