import { Check, ArrowRight } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { useSpotlight } from '../../lib/useSpotlight'
import { Button } from './Button'

/** CheckItem — item de lista com selo de check. */
function CheckItem({ children, featured }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white',
        )}
      >
        <Check size={12} weight="bold" />
      </span>
      <span className="text-body">{children}</span>
    </li>
  )
}

/**
 * PricingCard — plano de preço em card premium.
 * `featured` destaca o plano com anel esmeralda + leve escala e CTA "shiny".
 */
export function PricingCard({
  name,
  description,
  price,
  period = '/mês',
  currency = 'R$',
  features = [],
  cta = 'Começar Plano',
  ctaHref = '#',
  featured = false,
  badge = 'Mais popular',
  className,
}) {
  const spotlight = useSpotlight()

  return (
    <div
      className={cn(
        'premium-card ds-plan-card flex flex-col justify-between p-8 transition-all duration-300',
        featured
          ? 'pricing-featured z-20 overflow-visible border-2 border-emerald shadow-2xl'
          : 'z-0 md:px-12',
        className,
      )}
      {...spotlight}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}

      <div className="relative z-10">
        <h3 className="text-lg font-medium text-ink">{name}</h3>
        <p className="mt-1 text-sm text-mute">{description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-sm font-medium text-mute">{currency}</span>
          <span className="text-5xl font-semibold tracking-tight text-brand-gradient">{price}</span>
          <span className="text-sm text-mute">{period}</span>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
          {features.map((f) => (
            <CheckItem key={f} featured={featured}>
              {f}
            </CheckItem>
          ))}
        </ul>
      </div>

      <Button
        as="a"
        href={ctaHref}
        variant={featured ? 'shiny' : 'secondary'}
        className="relative z-10 mt-8 w-full"
        icon={<ArrowRight size={16} />}
      >
        {cta}
      </Button>
    </div>
  )
}
