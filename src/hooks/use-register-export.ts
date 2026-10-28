import { useEffect } from 'react'
import { useExportContext, type MarkdownGenerator } from '@/state/export-context'

export function useRegisterPageExport(pageTitle: string, generator: MarkdownGenerator) {
  const { registerExport } = useExportContext()

  useEffect(() => {
    registerExport(pageTitle, generator)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })
}
