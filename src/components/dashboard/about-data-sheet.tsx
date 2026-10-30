// Bloco G do layout one-page: "Sobre os dados" vira uma gaveta (Sheet) em
// vez de uma tela própria — abre a partir do link no rodapé. Mesmo conteúdo
// de referência que a antiga AboutDataPage, condensado para um painel que
// desliza de baixo.

import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { GLOSSARY, INDICATORS, KNOWN_LIMITATIONS } from '@/data/indicators'
import { UNIT_LABELS } from '@/types/common'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  confirmado: 'success',
  provavel: 'info',
  parcial: 'warning',
  'nao-validado': 'error',
}

const STATUS_LABEL: Record<string, string> = {
  confirmado: 'Confirmado',
  provavel: 'Provável',
  parcial: 'Parcial',
  'nao-validado': 'Não validado',
}

export function AboutDataSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="space-y-5">
        <SheetTitle>Sobre os dados</SheetTitle>

        <section className="space-y-3">
          <h3 className="text-ds-base font-semibold">Fontes de dados reais</h3>
          <p className="text-ds-sm text-[var(--color-muted-foreground)]">
            Todo número vem do GA4 ou do Microsoft Clarity — nunca uma terceira fonte, nunca dado fictício.
          </p>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
            <p className="text-ds-sm font-semibold">Resumo Executivo Pré-Black</p>
            <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">
              PneuStore_Resumo_Executivo_PreBlack_2026.pdf (PneuStore · UX Research) — o relatório que gerou o pedido deste dashboard. Semana
              14/10 a 20/10/2026 vs. mesmo período de 2025. GA4 (sessões, conversão, receita estimada) e Clarity (passagem entre etapas,
              dead clicks, comparação anual).
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
            <p className="text-ds-sm font-semibold">Microsoft Clarity — atrito do checkout</p>
            <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">
              27/10 a 29/10/2026 (3 dias fechados — janela máxima da API pública), consulta via query-analytics-dashboard. Dead/rage
              clicks e quick backs das 6 páginas de checkout, agregados para todos os dispositivos (sem segmentação nesta extração).
            </p>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
            <p className="text-ds-sm font-semibold">GA4 / Looker Studio — canal e marca</p>
            <p className="mt-1 text-ds-sm text-[var(--color-muted-foreground)]">
              02/10 a 29/10/2026, exportação manual em PDF do Looker Studio. Participação por canal já agregada pelo Looker (CPC, Organic,
              Direct, Outros, CRM, Criteo); origem/mídia detalhada por linha; marcas com itens vistos/adicionados*/comprados e receita.
              *Adicionados é estimado a partir de %Add to Cart — não é uma contagem bruta. Sem produtos individuais nem sessões/pedidos por
              canal nesta extração; usuários aproximados.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-ds-base font-semibold">Indicadores</h3>
          {Object.values(INDICATORS).map((ind) => (
            <div key={ind.id} className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-[var(--color-muted-foreground)]">{ind.id}</span>
                <span className="text-ds-sm font-semibold">{ind.label}</span>
                <Badge variant={STATUS_VARIANT[ind.status]}>{STATUS_LABEL[ind.status]}</Badge>
              </div>
              <p className="mt-0.5 text-ds-sm text-[var(--color-muted-foreground)]">{ind.definition}</p>
              {ind.limitations && <p className="mt-0.5 text-[11px] text-[var(--color-warning)]">{ind.limitations}</p>}
              <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">
                Unidade: {UNIT_LABELS[ind.unit]}
                {ind.secondaryUnit ? ` · ${UNIT_LABELS[ind.secondaryUnit]}` : ''}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <h3 className="text-ds-base font-semibold">Glossário</h3>
          <ul className="space-y-1 text-ds-sm text-[var(--color-muted-foreground)]">
            {GLOSSARY.map((g) => (
              <li key={g.term}>
                <span className="font-medium text-[var(--color-foreground)]">{g.term}:</span> {g.definition}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-ds-base font-semibold">Limitações e decisões pendentes</h3>
          <ul className="space-y-1.5">
            {KNOWN_LIMITATIONS.map((item) => (
              <li key={item.id} className="flex gap-2 text-ds-sm">
                <Badge variant="neutral">{item.id}</Badge>
                <span className="text-[var(--color-muted-foreground)]">{item.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </SheetContent>
    </Sheet>
  )
}
