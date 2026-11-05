import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * Button — pílula do design system.
 *
 * Variantes: shiny | shiny-brand | secondary | ghost
 * Tamanhos:  sm | md | lg
 */

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium leading-none tracking-tight whitespace-nowrap select-none transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const sizes = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-8 py-4 text-base',
  lg: 'px-10 py-5 text-lg',
  /* Casa com a altura do Input. Botão ao lado — ou logo abaixo — de um campo
     precisa da mesma altura, e acertar isso por padding é chute que quebra
     quando a densidade do contexto muda. */
  field: 'h-[var(--ds-input-height)] px-5 text-sm',
}

const variants = {
  shiny: 'shiny-cta hover:-translate-y-0.5 transform-gpu',
  'shiny-brand': 'shiny-brand hover:-translate-y-0.5 transform-gpu',
  
  secondary:
    'ds-btn-secondary bg-linear-to-b from-white to-neutral-50 text-neutral-900 ring-1 ring-inset ring-black/5 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.02),0_8px_20px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transform-gpu hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(0,0,0,0.16)] dark:bg-none dark:bg-transparent dark:text-ink dark:shadow-none dark:ring-hairline-strong dark:hover:translate-y-0 dark:hover:shadow-none dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:ring-transparent',
  
  ghost: 'bg-transparent text-ink hover:bg-ink/10',
}

export const Button = forwardRef(function Button(
  { as: Tag = 'button', variant = 'shiny', size = 'md', className, children, icon, ...props },
  ref,
) {
  const isShiny = variant === 'shiny' || variant === 'shiny-brand'

  const content = (
    <>
      {children}
      {icon && (
        <span className="ml-1 transition-transform group-hover:translate-x-1">{icon}</span>
      )}
    </>
  )

  return (
    <Tag ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {isShiny ? (
        <>
          <span className="shiny-dots" aria-hidden="true" />
          <span className="shiny-cta-content">{content}</span>
        </>
      ) : (
        content
      )}
    </Tag>
  )
})

/**
 * ButtonIconBadge — Mantido por compatibilidade, repassa para Button.
 */
export function ButtonIconBadge({ as: Tag = 'button', className, children, icon, ...props }) {
  return (
    <Button as={Tag} variant="shiny" className={className} icon={icon} {...props}>
      {children}
    </Button>
  )
}
