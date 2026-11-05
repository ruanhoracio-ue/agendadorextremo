import { cn } from '../../lib/cn'
import { useSpotlight } from '../../lib/useSpotlight'
import { Eyebrow } from './primitives'

/**
 * Card — superfície do design system.
 *
 * variant:
 *  - "flat" (padrão): borda 1px, cantos 16px, sem elevação. Ideal para UI densa.
 *  - "premium": estética de marketing (cantos 24px, anel sutil e leve elevação
 *    no hover) — a mesma usada na landing (`.premium-card`).
 */
const variants = {
  flat: 'card-glow rounded-lg border border-hairline bg-surface',
  premium: 'premium-card',
}

export function Card({ as: Tag = 'div', variant = 'flat', className, children, ...props }) {
  // As duas superfícies acendem a borda no hover, então ambas precisam das
  // coordenadas do cursor. O brilho interno (spotlight) segue exclusivo do
  // premium — na superfície flat, que é opaca, ele não aparece.
  const spotlight = useSpotlight()

  return (
    <Tag className={cn(variants[variant], 'p-6', className)} {...spotlight} {...props}>
      {children}
    </Tag>
  )
}

/**
 * FeatureIconCard — card de recurso com ícone em selo, eyebrow, título e texto.
 * Aceita `premium` para usar a superfície premium.
 */
export function FeatureIconCard({ icon, eyebrow, title, description, premium, className, children }) {
  return (
    <Card variant={premium ? 'premium' : 'flat'} className={cn('flex flex-col', className)}>
      {/* Fundo esmeralda bem diluído; o ícone usa `ink`, que inverte sozinho
          entre os temas (quase preto no claro, quase branco no escuro). */}
      {icon && (
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald/[0.08] text-ink">
          {icon}
        </div>
      )}
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <h3 className={cn('text-lg font-medium tracking-tight text-ink', eyebrow && 'mt-2')}>{title}</h3>}
      {description && <p className="mt-1.5 text-sm leading-relaxed text-body">{description}</p>}
      {children}
    </Card>
  )
}

/**
 * MediaCard — card com imagem no topo, badge opcional sobreposta e conteúdo.
 * `premium` (padrão) usa a superfície premium; a imagem é recortada nos cantos.
 */
export function MediaCard({
  image,
  imageAlt = '',
  badge,
  eyebrow,
  title,
  description,
  premium = true,
  className,
  children,
}) {
  const spotlight = useSpotlight()

  return (
    <div
      className={cn(
        premium
          ? 'premium-card'
          : 'card-glow overflow-hidden rounded-lg border border-hairline bg-surface',
        'flex flex-col',
        className,
      )}
      {...spotlight}
    >
      <div className="relative">
        <img src={image} alt={imageAlt} className="aspect-[16/10] w-full object-cover" />
        {badge && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-black/5 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-900 shadow-sm backdrop-blur-md">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <h3 className={cn('text-lg font-medium tracking-tight text-ink', eyebrow && 'mt-2')}>{title}</h3>
        )}
        {description && <p className="mt-1.5 text-sm leading-relaxed text-body">{description}</p>}
        {children}
      </div>
    </div>
  )
}
