// Resultado da publicação: link do commit e andamento do deploy no GitHub Actions.

import { AlertTriangle, BadgeCheck, Loader2 } from 'lucide-react'
import type { DeployState, PublishResult } from '@/lib/github-publish'

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-link)] underline">
      {children}
    </a>
  )
}

export function DeployStatus({ result, deploy }: { result: PublishResult; deploy: DeployState | null }) {
  return (
    <div className="space-y-1.5 text-ds-sm" role="status" aria-live="polite">
      <p>
        Atualização gravada em <span className="font-mono">{result.path}</span> —{' '}
        <ExternalLink href={result.commitUrl}>ver o commit</ExternalLink>.
      </p>

      {(!deploy || deploy.phase === 'aguardando' || deploy.phase === 'executando') && (
        <p className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Publicando o site… {deploy?.phase === 'executando' && <ExternalLink href={deploy.runUrl}>acompanhar</ExternalLink>}
        </p>
      )}

      {deploy?.phase === 'publicado' && (
        <p className="flex items-center gap-1.5 font-medium text-[var(--color-success)]">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Publicado. Recarregue a página para ver o dashboard atualizado.
        </p>
      )}

      {deploy?.phase === 'falhou' && (
        <div className="space-y-0.5 text-[var(--color-error)]">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />A publicação falhou — o site no ar NÃO mudou.
          </p>
          <p>{deploy.reason}</p>
          <p>
            <ExternalLink href={deploy.logUrl}>Ver o log</ExternalLink>
          </p>
        </div>
      )}

      {deploy?.phase === 'sem-acesso' && (
        <p className="text-[var(--color-muted-foreground)]">
          Não consegui acompanhar o deploy (o token precisa de «Actions: Read»). Confira em <ExternalLink href={deploy.runsUrl}>GitHub Actions</ExternalLink>.
        </p>
      )}

      {deploy?.phase === 'tempo-esgotado' && (
        <p className="text-[var(--color-warning)]">
          O deploy ainda não terminou. Confira em <ExternalLink href={deploy.runsUrl}>GitHub Actions</ExternalLink>.
        </p>
      )}
    </div>
  )
}
