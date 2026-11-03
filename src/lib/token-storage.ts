// Guarda do token do GitHub no navegador. O padrão é sessionStorage (some ao
// fechar a aba); «Lembrar neste navegador» usa localStorage. Tudo em try/catch:
// sem storage (janela anônima, bloqueio) o token vive só na memória da aba.
// O token NUNCA vai para código, URL, log ou commit.

export const TOKEN_KEY = 'pneustore.github-token'

type StoreName = 'sessionStorage' | 'localStorage'

let memoryToken: string | null = null

function store(name: StoreName): Storage | null {
  try {
    return globalThis[name] ?? null
  } catch {
    return null
  }
}

function read(name: StoreName): string | null {
  try {
    return store(name)?.getItem(TOKEN_KEY) ?? null
  } catch {
    return null
  }
}

function write(name: StoreName, value: string): boolean {
  try {
    const s = store(name)
    if (!s) return false
    s.setItem(TOKEN_KEY, value)
    return true
  } catch {
    return false
  }
}

function remove(name: StoreName): void {
  try {
    store(name)?.removeItem(TOKEN_KEY)
  } catch {
    // sem storage: nada a limpar
  }
}

export interface StoredToken {
  token: string
  /** `true` quando veio de «Lembrar neste navegador» (localStorage). */
  remembered: boolean
}

export function loadToken(): StoredToken | null {
  const fromSession = read('sessionStorage')
  if (fromSession) return { token: fromSession, remembered: false }
  const fromLocal = read('localStorage')
  if (fromLocal) return { token: fromLocal, remembered: true }
  return memoryToken ? { token: memoryToken, remembered: false } : null
}

/** `remember` = localStorage (qualquer pessoa com acesso a este navegador poderá publicar); senão sessionStorage. */
export function saveToken(token: string, remember: boolean): void {
  const value = token.trim()
  memoryToken = value
  if (remember) {
    remove('sessionStorage')
    if (!write('localStorage', value)) write('sessionStorage', value)
  } else {
    remove('localStorage')
    write('sessionStorage', value)
  }
}

export function forgetToken(): void {
  memoryToken = null
  remove('sessionStorage')
  remove('localStorage')
}
