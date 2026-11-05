import React from 'react'
import { cn } from '../../lib/cn'

/**
 * Marquee — carrossel automático horizontal em loop contínuo (sem JS de scroll).
 * O conteúdo é duplicado para o loop ser perfeito; pausa quando o mouse entra.
 * `duration` em segundos (quanto maior, mais lento). `gapClass` controla o
 * espaçamento entre itens (margem à direita).
 */
export function Marquee({
  children,
  duration = 30,
  gapClass = 'mr-10',
  repeat = 1,
  fade = true,
  className,
}) {
  const items = React.Children.toArray(children)
  // Um "set" = itens repetidos `repeat` vezes (garante que preencha a largura,
  // evitando vãos no loop quando há poucos itens). O set é duplicado para o loop.
  const row = (dup) =>
    Array.from({ length: repeat }).flatMap((_, r) =>
      items.map((child, i) => (
        <div
          key={`${dup}-${r}-${i}`}
          className={cn('shrink-0', gapClass)}
          aria-hidden={dup === 'b' ? 'true' : undefined}
        >
          {child}
        </div>
      )),
    )

  return (
    <div 
      className={cn('group relative w-full overflow-hidden', className)}
      style={
        fade 
          ? { 
              maskImage: 'linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 4rem, black calc(100% - 4rem), transparent)'
            } 
          : undefined
      }
    >
      <div
        className="flex w-max animate-marquee items-stretch group-hover:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s` }}
      >
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
