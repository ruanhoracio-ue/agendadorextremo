import { cn } from '../../lib/cn'

/**
 * Badge — rótulo compacto.
 *
 * Tons de marca: `emerald` (sólido), `soft` (esmeralda suave), `neutral`
 * (contornado). Tons de estado: `success`, `warning`, `danger`, `info` —
 * cada um com fundo diluído e texto escuro do próprio matiz. Sem eles, um
 * selo de "pendente" e um de "cancelado" caíam ambos no `neutral` e ficavam
 * indistinguíveis num relance, que é justamente o que um selo de status
 * precisa evitar.
 */
const tones = {
  emerald: 'bg-brand-gradient text-white',
  soft: 'bg-emerald-soft text-emerald-deep',
  neutral: 'border border-hairline bg-surface text-body',
  success: 'bg-success-soft text-success-deep',
  warning: 'bg-warning-soft text-warning-deep',
  danger: 'bg-danger-soft text-danger-deep',
  info: 'bg-info-soft text-info-deep',
}

export function Badge({ tone = 'emerald', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
