import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { updatesPlugin } from './vite-plugin-updates.ts'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve um "project site" em https://<usuário>.github.io/<repo>/
  // — os caminhos de asset precisam desse prefixo só nesse build. Em
  // desenvolvimento local (`npm run dev`) e nos testes, `GITHUB_PAGES` não
  // está definida, então o comportamento continua `/`, como sempre foi.
  base: process.env.GITHUB_PAGES ? '/pneustore-black-friday-dashboard/' : '/',
  plugins: [react(), tailwindcss(), updatesPlugin({ dir: path.resolve(import.meta.dirname, './data/updates') })],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
