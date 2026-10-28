// HashRouter (não BrowserRouter) porque o GitHub Pages é hospedagem
// estática pura — não existe servidor para redirecionar uma rota como
// "/jornada" de volta para index.html quando alguém acessa o link direto ou
// dá F5. Com hash ("/#/jornada"), o navegador nunca pede essa rota ao
// servidor; tudo roda do lado do cliente. Único efeito visível: a URL passa
// a ter um "#" antes do caminho.
import { HashRouter, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/app-shell'
import { LoginGate } from '@/components/auth/login-gate'
import { OverviewPage } from '@/pages/overview-page'
import { JourneyPage } from '@/pages/journey-page'
import { AcquisitionPage } from '@/pages/acquisition-page'
import { AboutDataPage } from '@/pages/about-data-page'
import { AuthProvider } from '@/state/auth-context'
import { DemoScenarioProvider } from '@/state/demo-scenario-context'
import { ExportProvider } from '@/state/export-context'
import { ThemeProvider } from '@/state/theme-context'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoginGate>
          <TooltipProvider delayDuration={200}>
            <DemoScenarioProvider>
              <ExportProvider>
                <HashRouter>
                  <Routes>
                    <Route element={<AppShell />}>
                      <Route index element={<OverviewPage />} />
                      <Route path="jornada" element={<JourneyPage />} />
                      <Route path="aquisicao" element={<AcquisitionPage />} />
                      <Route path="sobre" element={<AboutDataPage />} />
                    </Route>
                  </Routes>
                </HashRouter>
              </ExportProvider>
            </DemoScenarioProvider>
          </TooltipProvider>
        </LoginGate>
      </AuthProvider>
    </ThemeProvider>
  )
}
