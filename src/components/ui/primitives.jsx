import { Star } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Container — largura máxima centralizada com padding lateral responsivo.
 *
 * `size`:
 *  - "default" (padrão): 1200px centrados — a medida da landing.
 *  - "wide": 1360px, para grades que precisam de mais respiro.
 *  - "fluid": sem teto. Para shell de aplicação, onde a área útil já foi
 *    definida pela sidebar: centrar de novo deixa faixa vazia nas laterais.
 */
const containerSizes = {
  default: 'max-w-container',
  wide: 'max-w-container-wide',
  fluid: '',
}

export function Container({ size = 'default', className, children, ...props }) {
  return (
    <div className={cn('mx-auto w-full px-6 lg:px-8', containerSizes[size], className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Section — bloco vertical com respiro generoso. Fundo branco por padrão.
 */
export function Section({ className, children, ...props }) {
  return (
    <section className={cn('py-20 lg:py-28', className)} {...props}>
      {children}
    </section>
  )
}

/**
 * Eyebrow — rótulo superior discreto (uppercase, tracking largo).
 */
export function Eyebrow({ className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-eyebrow uppercase text-ink', className)}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * SectionHeader — eyebrow + título + descrição, centralizado por padrão.
 *
 * `measure` — teto de largura para a leitura. O padrão (`"2xl"`, 672px) é a
 * medida editorial da landing: linha curta o suficiente para o olho voltar
 * sem se perder. Em layout de aplicação isso vira defeito — o cabeçalho fica
 * visivelmente mais estreito que a grade logo abaixo. Nesses casos passe
 * `measure={false}` e deixe o contêiner mandar na largura.
 */
const headerMeasures = {
  '2xl': 'max-w-2xl',
  prose: 'max-w-prose',
  false: '',
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  measure = '2xl',
  className,
}) {
  const alignment = align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left'
  return (
    <div className={cn('flex flex-col gap-4', headerMeasures[measure] ?? '', alignment, className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h2 className="text-balance text-heading-lg text-ink sm:text-heading-xl">{title}</h2>}
      {description && <p className="text-balance text-body-lg leading-relaxed text-mute">{description}</p>}
    </div>
  )
}

/**
 * Stars — linha de estrelas preenchidas. Preto (ink) por padrão.
 */
export function Stars({ count = 5, size = 15, className }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={size} weight="fill" className="fill-brand-gradient" />
      ))}
    </div>
  )
}
