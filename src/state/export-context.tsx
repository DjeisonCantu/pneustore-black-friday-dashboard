// Permite que cada tela registre como gerar seu próprio Markdown de
// exportação (RF-18). O cabeçalho global lê este registro para montar o
// menu "Exportar", mantendo o botão em um único lugar (04-arquitetura-
// informacao.md, seção 3) mas o conteúdo específico da tela atual.

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type MarkdownGenerator = () => string

interface ExportContextValue {
  pageTitle: string
  registerExport: (pageTitle: string, generator: MarkdownGenerator) => void
  getMarkdown: () => string
}

const ExportContext = createContext<ExportContextValue | null>(null)

export function ExportProvider({ children }: { children: ReactNode }) {
  const generatorRef = useRef<MarkdownGenerator>(() => '# Exportação\n\nNenhum conteúdo registrado.')
  const [pageTitle, setPageTitle] = useState('PneuStore · Site')

  const registerExport = useCallback((title: string, generator: MarkdownGenerator) => {
    generatorRef.current = generator
    setPageTitle(title)
  }, [])

  const getMarkdown = useCallback(() => generatorRef.current(), [])

  return <ExportContext.Provider value={{ pageTitle, registerExport, getMarkdown }}>{children}</ExportContext.Provider>
}

export function useExportContext(): ExportContextValue {
  const ctx = useContext(ExportContext)
  if (!ctx) throw new Error('useExportContext deve ser usado dentro de ExportProvider')
  return ctx
}
