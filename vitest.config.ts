import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { updatesPlugin } from './vite-plugin-updates.ts'

// Config separada do vite.config.ts (que carrega o plugin do Tailwind,
// desnecessário para os testes). O plugin do React é necessário aqui porque,
// desde a Missão 04 — Etapa C3, alguns testes (`*.test.tsx`) renderizam
// componentes de verdade (Testing Library), o que exige DOM — por isso o
// ambiente é `jsdom` para todo o projeto (os testes de camada de dados
// `*.test.ts`, puros, continuam passando normalmente nele).
export default defineConfig({
  // O mesmo plugin do app: os testes leem data/updates/ de verdade (módulo virtual).
  plugins: [react(), updatesPlugin({ dir: path.resolve(import.meta.dirname, './data/updates') })],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
