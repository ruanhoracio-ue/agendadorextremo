import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * FadeIn — revela o conteúdo com fade + deslize quando entra na viewport
 * (IntersectionObserver). `direction`: up | down | left | right. `delay` em ms.
 */
export function FadeIn({ children, delay = 0, className, direction = 'up' }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '50px' },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const translate = {
    up: 'translate-y-12',
    down: '-translate-y-12',
    left: 'translate-x-12',
    right: '-translate-x-12',
  }[direction]

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-1000 ease-out-soft',
        isVisible ? 'translate-x-0 translate-y-0 opacity-100' : `opacity-0 ${translate}`,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
