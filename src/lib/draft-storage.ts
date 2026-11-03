// Rascunho local do texto do .md colado em «Atualizar dados», para não perder
// o que foi colado ao fechar a gaveta ou recarregar a página. Só o texto do
// arquivo (que não é segredo) — nunca o token. Sem storage, simplesmente não guarda.

export const DRAFT_KEY = 'pneustore.update-draft'

export function loadDraft(): string {
  try {
    return globalThis.localStorage?.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveDraft(text: string): void {
  try {
    if (text.trim()) globalThis.localStorage?.setItem(DRAFT_KEY, text)
    else globalThis.localStorage?.removeItem(DRAFT_KEY)
  } catch {
    // sem storage: o rascunho só vale enquanto a gaveta está aberta
  }
}

export function clearDraft(): void {
  saveDraft('')
}
