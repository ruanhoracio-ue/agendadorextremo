import { useCallback, useEffect, useRef } from 'react'

/**
 * useSpotlight — luz que acompanha o cursor sobre uma superfície.
 *
 * Publica a posição do ponteiro (relativa ao elemento) nas CSS variables
 * `--spot-x` / `--spot-y`; o brilho em si é desenhado no CSS por
 * `.premium-card::after`. Espalhe o retorno no elemento:
 *
 *   const spotlight = useSpotlight()
 *   <div className="premium-card" {...spotlight} />
 *
 * A escrita é agendada em requestAnimationFrame para no máximo uma atualização
 * de estilo por frame, mesmo com o ponteiro disparando dezenas de eventos.
 */
export function useSpotlight() {
  const ref = useRef(null)
  const frame = useRef(0)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerMove = useCallback((event) => {
    // Lê as coordenadas agora: o evento não sobrevive até o próximo frame.
    const { clientX, clientY } = event
    if (frame.current) return

    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${clientX - rect.left}px`)
      el.style.setProperty('--spot-y', `${clientY - rect.top}px`)
    })
  }, [])

  return { ref, onPointerMove }
}
