import { FlaskConical } from 'lucide-react'

// Atualizado na Etapa C5.2: a Visão Geral passou a ter uma seção com dados
// reais (painel com selo verde "REAL"). Este aviso precisa continuar
// verdadeiro mesmo assim — por isso não diz mais "nenhum número desta tela"
// (o que deixaria de ser verdade), e sim que o restante é fictício e que o
// real está sempre identificado à parte.
export function FictitiousDataBanner() {
  return (
    <div className="no-print flex items-center gap-2 border-b border-[var(--color-fictitious)]/30 bg-[var(--color-fictitious-soft)] px-4 py-2 text-ds-sm font-medium text-[var(--color-fictitious)]">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span>
        DADOS FICTÍCIOS — maquete da Missão 02 (construção visual), exceto onde marcado com o selo verde
        "REAL" (extração manual do Looker Studio). Nunca misture os dois ao interpretar os números.
      </span>
    </div>
  )
}
