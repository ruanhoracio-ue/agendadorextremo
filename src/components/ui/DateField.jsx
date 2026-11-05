import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

/**
 * DateInput / DateRangeField — entrada de data.
 *
 * Nativo, pela mesma razão do `Select`: um calendário próprio teria que
 * reimplementar teclado, navegação por mês, digitação direta, formato de
 * locale e o picker do mobile — e costuma reimplementar tudo isso pior. O
 * navegador já entrega tudo, no idioma do usuário, e `color-scheme` (definido
 * em `:root`/`.dark`) faz o calendário abrir no tema certo.
 *
 * Altura, raio e padding saem das mesmas variáveis do `Input`, para que os
 * três se alinhem numa barra de filtros.
 *
 * O FORMATO EXIBIDO É DO NAVEGADOR, não da página: o Chrome usa o locale da
 * interface dele, então `lang="pt-BR"` no HTML não muda `06/27/2026` para
 * `27/06/2026`. Isso é a contrapartida do nativo, e é a contrapartida certa —
 * quem lê a tela vê a data na convenção que usa todo dia. O valor trafega
 * sempre em ISO, então nada disso vaza para o resto do sistema.
 */
export const DateInput = forwardRef(function DateInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="date"
      className={cn(
        'border border-hairline bg-surface text-sm text-ink',
        'h-[var(--ds-input-height)] rounded-[var(--ds-input-radius)]',
        'px-[var(--ds-input-px)]',
        'transition-colors focus:border-emerald focus:outline-hidden focus:ring-2 focus:ring-emerald-soft',
        /* O ícone de calendário do navegador é clicável mas não anuncia isso.
           `cursor-pointer` é a correção de um segundo. */
        '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
        className,
      )}
      {...props}
    />
  )
})

/**
 * Par de datas com as pontas travadas uma na outra: o `max` da inicial é a
 * final e o `min` da final é a inicial.
 *
 * Isso é validação por construção — o calendário simplesmente não deixa
 * escolher um fim antes do começo. Melhor que aceitar o intervalo inválido e
 * depois explicar numa mensagem de erro o que já dava para impedir.
 *
 * `value`: { inicio, fim } em ISO (`YYYY-MM-DD`), que é o formato do input
 * nativo — a formatação de exibição fica com o navegador, no locale de quem
 * está lendo.
 */
export function DateRangeField({
  value,
  onChange,
  min,
  max,
  ariaLabel = 'Intervalo de datas',
  className,
}) {
  const { inicio = '', fim = '' } = value ?? {}

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <DateInput
        value={inicio}
        min={min}
        max={fim || max}
        onChange={(e) => onChange?.({ inicio: e.target.value, fim })}
        aria-label="Data inicial"
      />
      <span className="text-caption text-mute" aria-hidden="true">
        até
      </span>
      <DateInput
        value={fim}
        min={inicio || min}
        max={max}
        onChange={(e) => onChange?.({ inicio, fim: e.target.value })}
        aria-label="Data final"
      />
    </div>
  )
}
