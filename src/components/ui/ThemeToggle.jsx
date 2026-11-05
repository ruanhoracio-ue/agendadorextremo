import { useSyncExternalStore } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Storefront de tema com fonte única de verdade: a classe `dark` em <html>.
 * Todas as instâncias de useTheme leem/escrevem o mesmo estado, então
 * múltiplos toggles (navbar, switcher…) ficam sempre sincronizados.
 * O estado inicial é definido pelo script anti-flash em index.html.
 */
const listeners = new Set()

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function setTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch (e) {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light')
  return {
    theme,
    setTheme,
    toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  }
}

/**
 * ThemeToggle — botão circular que alterna entre claro e escuro.
 */
export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-body transition-colors duration-fast hover:text-ink',
        className,
      )}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
