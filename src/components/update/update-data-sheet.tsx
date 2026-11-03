// "Atualizar dados" — gaveta escondida no rodapé, em 3 passos:
//   1. Carregar o .md (colar ou soltar/escolher o arquivo) — validado na hora;
//   2. Conferir: bloco a bloco, o que muda (+ «Ver como fica» com o one-page já com os dados novos);
//   3. Publicar: commit em data/updates/ pela API do GitHub, com confirmação.
// O link no rodapé NÃO é segurança — quem protege a publicação é o token (ver README).

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, BadgeCheck, Loader2 } from 'lucide-react'
import { DashboardBlocks } from '@/components/dashboard/dashboard-blocks'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { BUNDLED_MERGED, BUNDLED_UPDATES } from '@/data/bundled-data'
import { buildDashboardData } from '@/data/dashboard-data'
import { diffUpdate, summarizeUpdatePeriods } from '@/data/updates/diff-updates'
import { mergeWithPreview } from '@/data/updates/merge-updates'
import { parseUpdateMd } from '@/data/updates/parse-update-md'
import { SECTION_DEFS } from '@/data/updates/model'
import { formatIssue } from '@/data/updates/types'
import { clearDraft, loadDraft, saveDraft } from '@/lib/draft-storage'
import { PublishError, publishUpdate, runsPageUrl, watchDeploy, type DeployState, type PublishResult } from '@/lib/github-publish'
import { forgetToken, loadToken, saveToken } from '@/lib/token-storage'
import { RealDataProvider } from '@/state/real-data-provider'
import { DeployStatus } from './deploy-status'
import { TokenSection } from './token-section'
import { UpdatePreview } from './update-preview'

const MAX_FILE_BYTES = 512 * 1024
const MAX_SHOWN_ISSUES = 15

type Phase = 'idle' | 'confirming' | 'publishing' | 'published' | 'failed'

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-ds-base font-semibold">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-ds-sm text-[var(--color-primary)]" aria-hidden="true">
        {n}
      </span>
      {children}
    </h3>
  )
}

export function UpdateDataSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState(() => loadDraft())
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewed, setPreviewed] = useState(false)

  const [token, setToken] = useState(() => loadToken()?.token ?? '')
  const [remember, setRemember] = useState(() => loadToken()?.remembered ?? false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublishResult | null>(null)
  const [deploy, setDeploy] = useState<DeployState | null>(null)

  const fileInput = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const parsed = useMemo(() => (text.trim() ? parseUpdateMd(text) : null), [text])
  const update = parsed?.ok ? parsed.update : null
  const diff = useMemo(() => (update ? diffUpdate(BUNDLED_MERGED, update) : null), [update])
  const periods = useMemo(() => (update ? summarizeUpdatePeriods(update) : ''), [update])
  const previewData = useMemo(
    () => (update && previewOpen ? buildDashboardData(mergeWithPreview(BUNDLED_UPDATES, update)) : null),
    [update, previewOpen],
  )

  const busy = phase === 'publishing'
  const canPublish = Boolean(update && diff?.hasChanges && previewed && token.trim() && !busy && phase !== 'published')

  function changeText(next: string) {
    setText(next)
    saveDraft(next)
    setFileError(null)
    setPreviewed(false)
    setPhase('idle')
    setError(null)
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setFileError('O arquivo é grande demais para uma atualização (máx. 512 KB).')
      return
    }
    try {
      changeText(await file.text())
    } catch {
      setFileError('Não consegui ler o arquivo. Tente colar o texto.')
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void readFile(event.dataTransfer.files[0])
  }

  function changeToken(next: string) {
    setToken(next)
    if (next.trim()) saveToken(next, remember)
    else forgetToken()
    setError(null)
  }

  function changeRemember(next: boolean) {
    setRemember(next)
    if (token.trim()) saveToken(token, next)
  }

  function forget() {
    forgetToken()
    setToken('')
    setRemember(false)
  }

  function clear() {
    changeText('')
    clearDraft()
  }

  async function publish() {
    if (!update) return
    setPhase('publishing')
    setError(null)
    setDeploy(null)
    try {
      const published = await publishUpdate({ token, markdown: text, periodsSummary: periods })
      setResult(published)
      setPhase('published')
      clearDraft()
      abort.current?.abort()
      abort.current = new AbortController()
      const { signal } = abort.current
      void watchDeploy(published.commitSha, token, { signal, onState: setDeploy }).catch(() => {
        // O commit já foi feito; só o acompanhamento falhou (rede, permissão): manda conferir no GitHub.
        if (!signal.aborted) setDeploy({ phase: 'tempo-esgotado', runsUrl: runsPageUrl() })
      })
    } catch (reason) {
      setPhase('failed')
      setError(reason instanceof PublishError ? reason.message : 'Não consegui publicar. Tente de novo.')
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="space-y-6" aria-describedby={undefined}>
          <SheetTitle>Atualizar dados</SheetTitle>
          <p className="text-ds-sm text-[var(--color-muted-foreground)]">
            Cada atualização é um arquivo novo em <span className="font-mono">data/updates/</span> — nada do que já foi publicado é apagado ou
            alterado.
          </p>

          {/* 1. Carregar */}
          <section className="space-y-2" aria-labelledby="upd-step-1">
            <div id="upd-step-1">
              <StepTitle n={1}>Carregar o arquivo</StepTitle>
            </div>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`space-y-2 rounded-[var(--radius-control)] border border-dashed p-2 ${dragging ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-control-border)]'}`}
            >
              <label htmlFor="upd-text" className="sr-only">
                Conteúdo do arquivo .md
              </label>
              <textarea
                id="upd-text"
                value={text}
                onChange={(event) => changeText(event.target.value)}
                rows={8}
                spellCheck={false}
                placeholder="Cole aqui o conteúdo do arquivo .md — ou solte o arquivo nesta área."
                className="w-full resize-y rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-control-bg)] p-2 font-mono text-ds-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                  Escolher arquivo .md
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".md,text/markdown,text/plain"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Escolher arquivo .md"
                  onChange={(event) => {
                    void readFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                {text && (
                  <Button type="button" variant="ghost" size="sm" onClick={clear}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            <div aria-live="polite" className="space-y-1 text-ds-sm">
              {fileError && <p className="text-[var(--color-error)]">{fileError}</p>}
              {parsed && !parsed.ok && (
                <div className="space-y-1 text-[var(--color-error)]">
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    {parsed.issues.length === 1 ? '1 problema no arquivo' : `${parsed.issues.length} problemas no arquivo`} — corrija e cole de novo:
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {parsed.issues.slice(0, MAX_SHOWN_ISSUES).map((issue, index) => (
                      <li key={index}>{formatIssue(issue)}</li>
                    ))}
                  </ul>
                  {parsed.issues.length > MAX_SHOWN_ISSUES && <p>…e mais {parsed.issues.length - MAX_SHOWN_ISSUES}.</p>}
                </div>
              )}
              {update && (
                <p className="flex items-center gap-1.5 font-medium text-[var(--color-success)]">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Arquivo válido — {SECTION_DEFS.filter((def) => update.sections[def.key]).length} blocos: {periods || 'sem blocos'}.
                </p>
              )}
            </div>
          </section>

          {/* 2. Conferir */}
          {update && diff && (
            <section className="space-y-2" aria-labelledby="upd-step-2">
              <div id="upd-step-2">
                <StepTitle n={2}>Conferir o que muda</StepTitle>
              </div>
              <UpdatePreview diff={diff} />
              <Button type="button" variant="secondary" size="sm" onClick={() => { setPreviewOpen(true); setPreviewed(true) }}>
                Ver como fica
              </Button>
              {!previewed && <p className="text-ds-sm text-[var(--color-muted-foreground)]">Veja como fica antes de publicar.</p>}
            </section>
          )}

          {/* 3. Publicar */}
          {update && diff?.hasChanges && (
            <section className="space-y-3" aria-labelledby="upd-step-3">
              <div id="upd-step-3">
                <StepTitle n={3}>Publicar</StepTitle>
              </div>
              <TokenSection token={token} remember={remember} onTokenChange={changeToken} onRememberChange={changeRemember} onForget={forget} disabled={busy} />

              {phase !== 'confirming' && phase !== 'published' && (
                <Button type="button" onClick={() => setPhase('confirming')} disabled={!canPublish}>
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" /> Publicando…
                    </>
                  ) : (
                    'Publicar atualização'
                  )}
                </Button>
              )}
              {phase === 'idle' && !previewed && <p className="text-ds-sm text-[var(--color-muted-foreground)]">Publicar só libera depois de «Ver como fica».</p>}

              {phase === 'confirming' && (
                <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] p-3" role="alertdialog" aria-label="Confirmar publicação">
                  <p className="text-ds-sm font-medium">Publicar atualização de {periods}?</p>
                  <p className="text-ds-sm text-[var(--color-muted-foreground)]">Vai criar um arquivo novo em data/updates/ e publicar o site.</p>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => void publish()} disabled={!canPublish}>
                      Confirmar e publicar
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setPhase('idle')}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <p className="flex items-start gap-1.5 text-ds-sm font-medium text-[var(--color-error)]" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
              {result && phase === 'published' && <DeployStatus result={result} deploy={deploy} />}
            </section>
          )}
        </SheetContent>
      </Sheet>

      {/* Prévia: o one-page já com os dados novos, só em memória — nada é publicado. */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          className="max-h-[92vh] space-y-4"
          aria-describedby={undefined}
          // Sem isto o foco cai no 1º ícone (i) do dashboard e abre um tooltip sozinho; foca a própria gaveta.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
          }}
        >
          <SheetTitle>Prévia — ainda não publicado</SheetTitle>
          <p className="text-ds-sm text-[var(--color-muted-foreground)]">
            É assim que o dashboard fica com este arquivo. Nada foi gravado — feche para voltar.
          </p>
          {previewData && (
            <RealDataProvider data={previewData}>
              <DashboardBlocks />
            </RealDataProvider>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
