import { Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useExportContext } from '@/state/export-context'
import { downloadMarkdown, slugifyFilename, triggerPrint } from '@/lib/export'

export function ExportMenu() {
  const { pageTitle, getMarkdown } = useExportContext()

  function handleMarkdownExport() {
    const content = getMarkdown()
    const filename = `pneustore-${slugifyFilename(pageTitle)}-${new Date().toISOString().slice(0, 10)}.md`
    downloadMarkdown(filename, content)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={triggerPrint}>
          <Printer className="h-3.5 w-3.5" />
          PDF (imprimir)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleMarkdownExport}>
          <FileText className="h-3.5 w-3.5" />
          Markdown (.md)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
