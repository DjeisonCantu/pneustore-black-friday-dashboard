// Login simples — adicionado a pedido direto de Djeison, dono do projeto.
//
// AVISO DE SEGURANÇA, para quem for mexer aqui depois: isto NÃO é
// autenticação real. As credenciais ficam no código-fonte do frontend —
// qualquer pessoa que abra as ferramentas de desenvolvedor do navegador ou
// leia o pacote JavaScript publicado (inclusive depois de minificado) vê a
// senha em texto puro. Serve só para impedir acesso casual de quem não tem
// o link/a senha — nunca para proteger dado sensível de verdade. O login
// corporativo real (SSO) continua pendente (D-02/SEG-01, `01-planejamento/
// 05-requisitos-tecnicos.md`) e isto não o substitui.

import { createContext, useContext, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'pneustore-bf-monitor:auth-username'
const VALID_USERNAME = 'blackcantu'
const VALID_PASSWORD = 'black2026'

interface AuthContextValue {
  isAuthenticated: boolean
  username: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUsername(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(readStoredUsername)

  function login(candidateUsername: string, candidatePassword: string): boolean {
    // Usuário comparado sem diferenciar maiúsculas/minúsculas e com espaços
    // nas pontas ignorados — teclados de celular capitalizam a primeira
    // letra automaticamente, o que travava o login mesmo com a senha certa.
    // A senha continua sensível a maiúsculas/minúsculas, só sem espaços
    // perdidos nas pontas (comuns em autocompletar/colar).
    if (candidateUsername.trim().toLowerCase() !== VALID_USERNAME.toLowerCase() || candidatePassword.trim() !== VALID_PASSWORD) {
      return false
    }
    setUsername(VALID_USERNAME)
    try {
      localStorage.setItem(STORAGE_KEY, VALID_USERNAME)
    } catch {
      // localStorage pode estar indisponível (modo privado, por exemplo) —
      // o login continua válido para esta aba, só não persiste entre sessões.
    }
    return true
  }

  function logout() {
    setUsername(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ver nota acima
    }
  }

  return <AuthContext.Provider value={{ isAuthenticated: username !== null, username, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
