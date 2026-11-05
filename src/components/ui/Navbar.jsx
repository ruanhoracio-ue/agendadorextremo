import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { Logo } from './Logo'

/**
 * Navbar — barra superior fixa (sticky) translúcida com blur.
 *
 * Ao rolar, encolhe um pouco e acende a borda inferior: um fio em gradiente
 * com um halo descendo, na mesma linguagem dos divisores de section.
 *
 * `links`: [{ label, href }]. `logo`: caminho do SVG.
 *
 * ⚠️ O `sticky` depende de nenhum ancestral criar contexto de rolagem — use
 * `overflow-x-clip` (e não `-hidden`) nos wrappers da página.
 */
export function Navbar({ logo = '/logo.svg', brand = 'Conversão Extrema', links = [], className }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll() // estado correto já no primeiro paint (ex.: reload no meio da página)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        // No topo o fundo é quase transparente (só a borda separa); ao rolar
        // fecha em vidro fosco. O blur fica sempre ligado: alternar
        // backdrop-filter causa engasgo na composição.
        'sticky top-0 z-sticky backdrop-blur-md transition-colors duration-300',
        scrolled ? 'bg-surface/80' : 'bg-surface/10',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-container items-center justify-between px-6 transition-all duration-300 lg:px-8',
          scrolled ? 'py-2.5' : 'py-4',
        )}
      >
        <a href="#" className="flex items-center" aria-label={brand}>
          <Logo className="h-6 w-auto" />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-body transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button as="a" href="#" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button as="a" href="#pricing" variant="shiny" size="sm">
            Começar agora
          </Button>
        </div>
      </div>

      {/* Fio da borda: sempre visível — é ele que separa o header do conteúdo
          quando o fundo está quase transparente. Tom esmeralda no escuro. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-hairline to-transparent dark:via-emerald/30"
      />

      {/* Halo que desce do fio — só no escuro, como nos divisores de section */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-full hidden h-20 transition-opacity duration-300 dark:block',
          scrolled ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          background:
            'radial-gradient(ellipse 55% 100% at 50% 0%, rgba(16,185,129,0.09) 0%, rgba(16,185,129,0) 70%)',
        }}
      />
    </header>
  )
}
