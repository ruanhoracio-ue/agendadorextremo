import { cn } from '../../lib/cn'

/**
 * Primitivos de tipografia — encapsulam a escala nomeada do design system.
 * Use-os em vez de classes soltas para manter a hierarquia consistente.
 */

const displaySizes = {
  '2xl': 'text-display-2xl',
  xl: 'text-display-xl',
  lg: 'text-display-lg',
}

/** Display — títulos de hero de alto impacto. */
export function Display({ as: Tag = 'h1', size = 'xl', className, children, ...props }) {
  return (
    <Tag className={cn(displaySizes[size], 'text-ink', className)} {...props}>
      {children}
    </Tag>
  )
}

const headingLevels = {
  1: { tag: 'h1', cls: 'text-heading-xl' },
  2: { tag: 'h2', cls: 'text-heading-lg' },
  3: { tag: 'h3', cls: 'text-heading-md' },
  4: { tag: 'h4', cls: 'text-heading-sm' },
}

/** Heading — títulos h1–h4 (nível define tamanho e tag). */
export function Heading({ level = 2, as, className, children, ...props }) {
  const { tag, cls } = headingLevels[level] ?? headingLevels[2]
  const Tag = as ?? tag
  return (
    <Tag className={cn(cls, 'text-ink', className)} {...props}>
      {children}
    </Tag>
  )
}

const textSizes = {
  xl: 'text-body-xl',
  lg: 'text-body-lg',
  md: 'text-body-md',
  sm: 'text-body-sm',
}

const textTones = {
  ink: 'text-ink',
  body: 'text-body',
  mute: 'text-mute',
  faint: 'text-faint',
}

/** Text — parágrafos e texto de corpo. */
export function Text({ as: Tag = 'p', size = 'md', tone = 'body', className, children, ...props }) {
  return (
    <Tag className={cn(textSizes[size], textTones[tone], className)} {...props}>
      {children}
    </Tag>
  )
}

/** Code — trecho de código inline. */
export function Code({ className, children, ...props }) {
  return (
    <code
      className={cn(
        'rounded-sm border border-hairline bg-elevated px-1.5 py-0.5 font-mono text-code text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  )
}

/** Kbd — tecla do teclado. */
export function Kbd({ className, children, ...props }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[1.5rem] items-center justify-center rounded-sm border border-hairline-strong bg-elevated px-1.5 py-0.5 font-mono text-caption text-body shadow-xs',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

/** Link — âncora estilizada com sublinhado sutil. */
export function Link({ className, children, ...props }) {
  return (
    <a
      className={cn(
        'font-medium text-emerald-deep underline decoration-emerald/30 underline-offset-2 transition-colors hover:decoration-emerald',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}
