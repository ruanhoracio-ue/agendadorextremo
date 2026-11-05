import { forwardRef } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Select — `<select>` nativo com a casca do sistema.
 *
 * Nativo de propósito: um menu customizado teria que reimplementar teclado,
 * rolagem, busca por digitação e o comportamento de picker do mobile, e
 * costuma reimplementar tudo isso pior. A seta é nossa (`appearance-none`
 * remove a do navegador) e `pointer-events-none` deixa o clique atravessar
 * para o campo.
 *
 * Altura, raio e padding saem das mesmas variáveis do `Input`, para que os
 * dois fiquem alinhados numa barra de filtros.
 */
export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <span className="relative inline-flex w-full items-center">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none border border-hairline bg-surface text-sm text-ink',
          'h-[var(--ds-input-height)] rounded-[var(--ds-input-radius)]',
          'pl-[var(--ds-input-px)] pr-9',
          'transition-colors focus:border-emerald focus:outline-hidden focus:ring-2 focus:ring-emerald-soft',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDown
        size={13}
        weight="bold"
        className="pointer-events-none absolute right-3.5 text-mute"
        aria-hidden="true"
      />
    </span>
  )
})
