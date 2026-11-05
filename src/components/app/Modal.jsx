import { useEffect, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { Button } from '../ui'

const larguras = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

/**
 * Modal — diálogo centralizado. A biblioteca ainda não tem um; este segue os
 * tokens dela (superfície, hairline, raio do escopo .ds-app).
 * `rodape` fica fixo embaixo; o corpo rola por dentro.
 */
// Modais abertos, do mais antigo para o mais novo: o Esc fecha só o de cima.
const pilha = []

export function Modal({ aberto, aoFechar, titulo, tamanho = 'md', rodape, children }) {
  const caixa = useRef(null)
  // Em ref para o efeito não refazer (e roubar o foco) a cada render de quem usa.
  const fechar = useRef(aoFechar)
  fechar.current = aoFechar

  useEffect(() => {
    if (!aberto) return
    const eu = {}
    pilha.push(eu)
    const anterior = document.activeElement
    const tecla = (e) => e.key === 'Escape' && pilha[pilha.length - 1] === eu && fechar.current()
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    caixa.current?.focus()
    return () => {
      pilha.splice(pilha.indexOf(eu), 1)
      document.removeEventListener('keydown', tecla)
      if (pilha.length === 0) document.body.style.overflow = ''
      anterior?.focus?.()
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <div className="ds-app fixed inset-0 z-modal flex items-center justify-center bg-black/55 p-4" onMouseDown={aoFechar}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('ag-surgir flex max-h-[90vh] w-full flex-col rounded-lg border border-hairline bg-surface shadow-xl outline-hidden', larguras[tamanho])}
      >
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4">
          <h2 className="text-heading-sm text-ink">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-elevated hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {rodape && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline px-6 py-4">{rodape}</div>}
      </div>
    </div>
  )
}

/** Confirmação de ação que não tem volta. */
export function Confirmar({ aberto, aoFechar, aoConfirmar, titulo, children, acao = 'Excluir', ocupado }) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      tamanho="sm"
      rodape={
        <>
          <Button variant="ghost" size="field" onClick={aoFechar}>Cancelar</Button>
          <Button variant="secondary" size="field" className="text-danger!" disabled={ocupado} onClick={aoConfirmar}>{acao}</Button>
        </>
      }
    >
      <p className="text-body-sm text-body">{children}</p>
    </Modal>
  )
}
