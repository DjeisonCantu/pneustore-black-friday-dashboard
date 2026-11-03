// Plugin do Vite: lê data/updates/*.md, valida cada arquivo, faz o merge e
// entrega a lista validada ao app como o módulo virtual `virtual:updates-data`.
// Qualquer arquivo inválido faz o build (e o `npm run dev`) falhar com a
// mensagem do parser — o GitHub Pages nunca publica dado ruim.

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { UpdatesBuildError, loadUpdates, type UpdateFileInput } from './src/data/updates/load-updates.ts'

export const UPDATES_MODULE_ID = 'virtual:updates-data'
const RESOLVED_ID = `\0${UPDATES_MODULE_ID}`

/** Lê todos os arquivos da pasta (menos os ocultos, como .gitkeep) — arquivo fora do padrão falha, não é ignorado. */
export function readUpdateFiles(dir: string): UpdateFileInput[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => ({ name: entry.name, text: readFileSync(path.join(dir, entry.name), 'utf8') }))
}

export function updatesPlugin(options: { dir: string }): Plugin {
  const dir = path.resolve(options.dir)
  return {
    name: 'pneustore-updates',
    resolveId(id) {
      return id === UPDATES_MODULE_ID ? RESOLVED_ID : null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      let updates
      try {
        const files = readUpdateFiles(dir)
        updates = loadUpdates(files)
      } catch (error) {
        if (error instanceof UpdatesBuildError) this.error(error.message)
        throw error
      }
      return `export default ${JSON.stringify(updates)}`
    },
    configureServer(server) {
      server.watcher.add(dir)
      const reload = (file: string) => {
        if (path.dirname(path.resolve(file)) !== dir) return
        const module = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload).on('change', reload).on('unlink', reload)
    },
  }
}
