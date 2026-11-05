import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * FaqItem — item de acordeão em card (premium SaaS): borda que acende em
 * esmeralda ao abrir e ícone "+" que gira para "×". O destaque do estado
 * aberto vem só da borda e do fundo esmeralda diluído — a página já tem a
 * grade de pontos do DotGrid, e repeti-la dentro do card empastava.
 */
function FaqItem({ question, answer, defaultOpen = false, isFirst, isLast }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className={cn(
        'group relative overflow-hidden border-x border-b transition-all duration-300',
        isFirst && 'rounded-t-xl border-t',
        isLast && 'rounded-b-xl',
        open
          ? 'z-10 border-emerald/30 bg-emerald/5'
          : 'z-0 border-hairline bg-surface hover:border-emerald/20',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="relative z-10 flex w-full items-center justify-between gap-4 p-5 text-left text-base font-medium text-ink transition-colors group-hover:text-emerald-deep"
      >
        {question}
        {/* Esmeralda sólido, não `fill-brand-gradient`: em 16px o gradiente é
            imperceptível e só custa um paint a mais. (Com o lucide havia um
            motivo mais duro — o "+" eram dois traços de bounding box
            degenerada e o gradiente sumia; no Phosphor, que desenha em fill,
            isso deixou de ser um problema.) */}
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300',
            open
              ? 'rotate-45 bg-emerald/10 text-emerald'
              : 'rotate-0 text-mute group-hover:bg-emerald/5 group-hover:text-emerald',
          )}
        >
          <Plus size={16} weight="bold" />
        </span>
      </button>

      <div
        className={cn(
          'relative z-10 grid px-5 transition-all duration-300 ease-out-soft',
          open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden pr-8 text-[15px] leading-relaxed text-body">{answer}</div>
      </div>
    </div>
  )
}

/**
 * Faq — lista de perguntas frequentes (acordeão em cards).
 * `items`: [{ question, answer, defaultOpen? }]
 */
export function Faq({ items = [], className }) {
  return (
    <div className={cn('flex w-full flex-col', className)}>
      {items.map((item, i) => (
        <FaqItem key={i} {...item} isFirst={i === 0} isLast={i === items.length - 1} />
      ))}
    </div>
  )
}
