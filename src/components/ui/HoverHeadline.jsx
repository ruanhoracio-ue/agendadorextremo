import React from 'react'
import { cn } from '../../lib/cn'

/**
 * HoverHeadline — palavra(s) com efeito de "flip" letra a letra no hover:
 * a versão em cor de destaque sobe deslizando. Use dentro de um <h1>.
 */
export function HoverHeadline({ text, highlightClass = 'hover-text-shine' }) {
  return (
    <span className={cn('inline-block font-semibold', highlightClass)}>
      {text}
    </span>
  )
}
