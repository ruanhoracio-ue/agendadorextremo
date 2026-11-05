import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Field — rótulo + Input, empilhados.
 *
 * A caixa do rótulo vem de `--ds-label-transform`: versalete na landing,
 * minúscula em contexto de aplicação (`.ds-app`). É o mesmo raciocínio do
 * raio e da tipografia — quem calibra é o contexto, não o componente.
 */
export function Field({ label, className, children }) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span
          className={cn(
            'text-xs font-medium text-mute',
            '[text-transform:var(--ds-label-transform)] [letter-spacing:var(--ds-label-tracking)]',
          )}
        >
          {label}
        </span>
      )}
      {children}
    </label>
  )
}

/**
 * Input — campo de texto.
 *
 * `shape`:
 *  - "auto" (padrão): segue o contexto — pílula na landing, canto discreto
 *    dentro de `.ds-app`.
 *  - "pill" / "soft": força a forma, para os casos em que ela é decisão de
 *    composição e não de densidade (uma busca de topbar, por exemplo, quase
 *    sempre quer a pílula mesmo dentro do app).
 *
 * `icon` — nó renderizado à esquerda, dentro do campo. O padding cresce
 * sozinho para não deixar o texto por baixo dele.
 */
const shapes = {
  auto: 'rounded-[var(--ds-input-radius)]',
  pill: 'rounded-full',
  soft: 'rounded-[var(--radius-md)]',
}

export const Input = forwardRef(function Input({ shape = 'auto', icon, className, ...props }, ref) {
  const field = (
    <input
      ref={ref}
      className={cn(
        /* Altura e padding vêm de variáveis para que `.ds-app` possa trocá-los:
           `rounded-full` compilaria para um literal e o escopo não alcançaria
           a forma. Na landing os valores seguem a pílula de 44px. */
        'w-full border border-hairline bg-surface text-sm text-ink',
        'h-[var(--ds-input-height)] px-[var(--ds-input-px)]',
        shapes[shape] ?? shapes.auto,
        icon && 'pl-10',
        'placeholder:text-faint',
        'transition-colors focus:border-emerald focus:outline-hidden focus:ring-2 focus:ring-emerald-soft',
        className,
      )}
      {...props}
    />
  )

  if (!icon) return field

  return (
    <span className="relative block w-full">
      <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-faint">
        {icon}
      </span>
      {field}
    </span>
  )
})
