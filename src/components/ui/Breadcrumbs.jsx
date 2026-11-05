import { CaretRight } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Breadcrumbs — trilha de navegação.
 *
 * `items`: [{ label, href?, onClick? }]. O último é a página atual: sai como
 * texto, não como link, e leva `aria-current`.
 *
 * Fica menor que o título da página de propósito. A trilha é orientação, não
 * conteúdo — quem chegou já sabe onde está e só precisa do caminho de volta
 * ao alcance do olho.
 */
export function Breadcrumbs({ items = [], className }) {
  return (
    <nav aria-label="Trilha de navegação" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-caption">
        {items.map((item, i) => {
          const last = i === items.length - 1
          const clickable = !last && (item.href || item.onClick)
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {clickable ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="text-mute transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              ) : (
                <span className={cn(last ? 'font-medium text-body' : 'text-mute')} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <CaretRight size={11} weight="bold" className="text-faint" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
