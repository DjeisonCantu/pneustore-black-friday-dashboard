import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DRAFT_KEY, clearDraft, loadDraft, saveDraft } from '../draft-storage'
import { TOKEN_KEY, forgetToken, loadToken, saveToken } from '../token-storage'

beforeEach(() => {
  forgetToken()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => vi.restoreAllMocks())

describe('token-storage', () => {
  it('por padrão guarda em sessionStorage (e não em localStorage)', () => {
    saveToken('  github_pat_x  ', false)
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('github_pat_x')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(loadToken()).toEqual({ token: 'github_pat_x', remembered: false })
  })

  it('«Lembrar neste navegador» usa localStorage (e sai do sessionStorage)', () => {
    saveToken('github_pat_x', false)
    saveToken('github_pat_x', true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('github_pat_x')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    sessionStorage.clear()
    expect(loadToken()).toEqual({ token: 'github_pat_x', remembered: true })
  })

  it('«Esquecer token» limpa os dois storages e a memória', () => {
    saveToken('github_pat_x', true)
    forgetToken()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(loadToken()).toBeNull()
  })

  it('sem storage (bloqueado/anônimo) nada quebra: o token vive só na memória da aba', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    expect(() => saveToken('github_pat_x', true)).not.toThrow()
    expect(loadToken()).toEqual({ token: 'github_pat_x', remembered: false })
    expect(() => forgetToken()).not.toThrow()
    expect(loadToken()).toBeNull()
  })
})

describe('draft-storage', () => {
  it('guarda, recarrega e limpa o rascunho do texto', () => {
    saveDraft('## Looker — resumo do site')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('## Looker — resumo do site')
    expect(loadDraft()).toBe('## Looker — resumo do site')
    clearDraft()
    expect(loadDraft()).toBe('')
  })

  it('o rascunho nunca guarda o token (storage de chave própria)', () => {
    saveToken('github_pat_x', true)
    saveDraft('texto')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('texto')
    expect(localStorage.getItem(DRAFT_KEY)).not.toContain('github_pat_x')
  })

  it('sem localStorage não quebra', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    expect(() => saveDraft('x')).not.toThrow()
    expect(loadDraft()).toBe('')
  })
})
