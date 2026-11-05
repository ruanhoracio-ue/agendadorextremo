import { cn } from '../../lib/cn'

/**
 * SegmentedControl — escolha única entre poucas opções, todas visíveis.
 *
 * Para 2–4 opções curtas e mutuamente exclusivas (períodos, modos de exibição),
 * onde ver as alternativas vale mais que economizar espaço. Passando disso, ou
 * com rótulos longos, use `Select`.
 *
 * `options`: [{ value, label }] · `value` · `onChange`
 */
export function SegmentedControl({ options = [], value, onChange, ariaLabel, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-hairline bg-elevated p-0.5',
        className,
      )}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(o.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'bg-surface text-ink shadow-xs'
                : 'text-mute hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
