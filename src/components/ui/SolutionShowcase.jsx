import { ArrowRight, Brain, Lightning, Target, ShieldCheck, Image as ImageIcon } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { Eyebrow } from './primitives'
import { Button } from './Button'

const iconMap = {
  brain: Brain,
  zap: Lightning,
  target: Target,
  shield: ShieldCheck,
}

/**
 * SolutionShowcase — bloco de solução em duas colunas (texto | visual),
 * alternado. Sem card: fica solto sobre o fundo da página.
 */
export function SolutionShowcase({ solution, reverse, className }) {
  const { eyebrow, title, description, icon } = solution
  const Icon = iconMap[icon] ?? ImageIcon

  return (
    <div
      className={cn(
        'flex flex-col gap-10 md:items-center md:gap-16 lg:gap-20',
        reverse ? 'md:flex-row-reverse' : 'md:flex-row',
        className,
      )}
    >
      {/* Texto */}
      <div className="flex flex-1 flex-col items-start gap-8">
        <div className="max-w-xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h3 className="mt-4 text-balance text-heading-lg text-ink sm:text-heading-xl">{title}</h3>
          <p className="mt-5 text-balance text-body-lg leading-relaxed text-mute">{description}</p>
        </div>

        <Button variant="secondary">
          Conhecer em detalhes
        </Button>
      </div>

      {/* Visual — painel de mídia com grade de pontos + selo do ícone */}
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-hairline bg-elevated">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(var(--c-ink) / 0.05) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(120% 90% at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 60%)',
            }}
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-hairline bg-surface fill-brand-gradient shadow-sm">
            <Icon size={28} />
          </div>
        </div>
      </div>
    </div>
  )
}
