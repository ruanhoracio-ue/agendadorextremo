import { cn } from '../../lib/cn'
import { Logo } from './Logo'

/**
 * Footer — rodapé minimalista com logo, copyright e links.
 */
export function Footer({ logo = '/logo.svg', brand = 'Conversão Extrema', links = [], className }) {
  return (
    <footer className={cn('border-t border-hairline bg-surface', className)}>
      <div className="mx-auto flex w-full max-w-container flex-wrap items-center justify-between gap-4 px-6 py-10 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo className="h-5 w-auto" />
          <span className="text-xs text-mute">
            © {new Date().getFullYear()} {brand}. Todos os direitos reservados.
          </span>
        </div>
        <div className="flex gap-6 text-xs">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-mute transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
