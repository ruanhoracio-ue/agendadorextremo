import { rede } from '../../lib/redes'
import { cn } from '../../lib/cn'

/** Ícone da rede social. Sempre na cor do texto: a identidade vem do desenho. */
export function IconeRede({ plataforma, size = 16, className }) {
  const { icone: Icone, nome } = rede(plataforma)
  return <Icone size={size} className={cn('shrink-0', className)} aria-label={nome} />
}

/** Fila de ícones das redes de um post, sem repetir a mesma rede. */
export function RedesDoPost({ destinos = [], size = 14, className }) {
  const unicas = [...new Set(destinos.map(d => d.plataforma))]
  return (
    <span className={cn('inline-flex items-center gap-1 text-mute', className)}>
      {unicas.map(p => <IconeRede key={p} plataforma={p} size={size} />)}
    </span>
  )
}
