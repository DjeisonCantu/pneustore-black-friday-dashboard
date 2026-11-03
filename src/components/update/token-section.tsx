// Token do GitHub para publicar. Campo de senha, sem preenchimento automático;
// o token fica só no navegador (sessionStorage; ou localStorage se a pessoa
// marcar «Lembrar») e nunca vai para código, URL, log ou commit.

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GITHUB_CONFIG, TOKEN_HELP_URL } from '@/config/github'

export function TokenSection({
  token,
  remember,
  onTokenChange,
  onRememberChange,
  onForget,
  disabled,
}: {
  token: string
  remember: boolean
  onTokenChange: (token: string) => void
  onRememberChange: (remember: boolean) => void
  onForget: () => void
  disabled?: boolean
}) {
  const [helpOpen, setHelpOpen] = useState(false)
  const inputId = useId()
  const rememberId = useId()
  const repo = `${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-ds-sm font-medium">
        Token do GitHub
      </label>
      <input
        id={inputId}
        type="password"
        value={token}
        onChange={(event) => onTokenChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        placeholder="github_pat_…"
        className="h-9 w-full rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] px-3 font-mono text-ds-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <label htmlFor={rememberId} className="flex items-center gap-1.5 text-ds-sm">
          <input id={rememberId} type="checkbox" checked={remember} onChange={(event) => onRememberChange(event.target.checked)} disabled={disabled} />
          Lembrar neste navegador
        </label>
        <Button type="button" variant="link" size="sm" onClick={onForget} disabled={disabled || !token}>
          Esquecer token
        </Button>
        <Button type="button" variant="link" size="sm" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen}>
          Como criar o token
        </Button>
      </div>

      {remember && (
        <p className="text-ds-sm text-[var(--color-warning)]" role="note">
          Atenção: com «Lembrar», o token fica salvo neste navegador e qualquer pessoa com acesso a ele poderá publicar atualizações. Use só em computador seu.
        </p>
      )}

      {helpOpen && (
        <div className="space-y-1.5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-ds-sm">
          <p className="font-semibold">Crie o token você mesmo (ele é só seu):</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Abra{' '}
              <a href={TOKEN_HELP_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--color-link)] underline">
                github.com/settings/personal-access-tokens/new
              </a>{' '}
              (token «fine-grained»).
            </li>
            <li>Dê um nome (ex.: «Dashboard — atualizar dados») e uma validade curta.</li>
            <li>
              Em «Repository access», escolha <strong>Only select repositories</strong> e marque <strong>só {repo}</strong>.
            </li>
            <li>
              Em «Repository permissions», marque só: <strong>Contents: Read and write</strong> e <strong>Actions: Read-only</strong> (para acompanhar o
              deploy). Nenhuma outra.
            </li>
            <li>Clique em «Generate token», copie o valor (ele aparece uma única vez) e cole acima.</li>
          </ol>
          <p className="text-[var(--color-muted-foreground)]">Nunca envie o token por chat ou e-mail nem o salve em arquivo do projeto.</p>
        </div>
      )}
    </div>
  )
}
